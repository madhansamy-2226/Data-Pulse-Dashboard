import os
import csv
import logging
import re
from datetime import datetime, date, timedelta
from decimal import Decimal, InvalidOperation
from celery import shared_task
from django.db import transaction
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import ImportJob, Dataset, SalesRecord, ReportJob
from .utils import (
    invalidate_user_analytics_cache,
    set_job_progress,
)
from .pdf_generator import SalesPulsePDFReport

logger = logging.getLogger(__name__)

BATCH_SIZE = 1000
MAX_ERROR_LOGS_SAVED = 500

def parse_date_safely(date_str: str) -> date:
    """Parses date string with support for 4-digit years, ISO formats, and standard regional date patterns."""
    if not date_str:
        return timezone.now().date()
    
    clean_str = str(date_str).strip()
    
    # 4-digit year like 2025 or 2024
    if clean_str.isdigit() and len(clean_str) == 4:
        try:
            return date(int(clean_str), 1, 1)
        except ValueError:
            pass

    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %b %Y",
        "%d %B %Y",
        "%Y%m%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(clean_str, fmt).date()
        except ValueError:
            continue
            
    # If explicitly invalid date string provided
    raise ValueError(f"Unrecognized date format: '{date_str}'")

def parse_decimal_safely(val, default=Decimal('0.00')) -> Decimal:
    """Parses decimal value safely, removing currencies, commas, and handling non-numeric strings."""
    if val is None:
        return default
    clean = str(val).replace('$', '').replace('₹', '').replace('€', '').replace('£', '').replace(',', '').replace('%', '').strip()
    if not clean or clean.lower() in ['c', 'null', 'none', 'na', 'n/a', '-', '.']:
        return default
    try:
        return Decimal(str(round(float(clean), 2)))
    except (ValueError, InvalidOperation):
        return default

def parse_int_safely(val, default=1) -> int:
    """Parses integer value safely with default fallback."""
    if val is None:
        return default
    clean = str(val).replace(',', '').strip()
    try:
        num = int(float(clean))
        return num if num > 0 else default
    except (ValueError, TypeError):
        return default

@shared_task(max_retries=3, default_retry_delay=10)
def import_csv_task(job_id: str):
    """
    Universal CSV ETL Pipeline:
    - Parses sales, orders, surveys, financial, and generic tabular CSV datasets
    - Intelligently maps columns with flexible fallbacks
    - Bulk inserts rows in 1000-row chunks
    - Reports live progress percentage
    - Invalidates user analytics cache
    """
    try:
        job = ImportJob.objects.select_related('user').get(id=job_id)
    except ImportJob.DoesNotExist:
        logger.error(f"ImportJob {job_id} does not exist.")
        return

    job.status = ImportJob.JobStatus.PROCESSING
    job.started_at = timezone.now()
    job.progress_percentage = 10
    job.save(update_fields=['status', 'started_at', 'progress_percentage'])
    set_job_progress(job_id, 10, 'PROCESSING', 0, 0, 0)

    file_path = job.file_path
    if not os.path.exists(file_path):
        job.status = ImportJob.JobStatus.FAILED
        job.error_message = f"CSV file not found at path {file_path}"
        job.save()
        return

    # Count total rows first for progress calculation
    try:
        with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as f:
            total_lines = sum(1 for _ in f) - 1 # exclude header
            total_lines = max(total_lines, 1)
    except Exception as e:
        total_lines = 1000

    job.total_rows = total_lines
    job.save(update_fields=['total_rows'])

    # Create Dataset record if not already linked
    if not job.dataset:
        dataset_name = os.path.splitext(os.path.basename(job.file_name))[0].replace('_', ' ').replace('-', ' ').title()
        dataset = Dataset.objects.create(
            user=job.user,
            name=dataset_name,
            original_filename=job.file_name,
            file_size_bytes=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            total_rows=0,
            total_revenue=Decimal('0.00'),
        )
        job.dataset = dataset
        job.save(update_fields=['dataset'])
    else:
        dataset = job.dataset

    records_to_insert = []
    error_logs = []
    processed_count = 0
    failed_count = 0
    total_accumulated_revenue = Decimal('0.00')

    try:
        with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as csvfile:
            reader = csv.DictReader(csvfile)
            
            if not reader.fieldnames:
                raise ValueError("CSV header is empty or missing.")
            
            # Map normalized column keys
            header_map = {name.strip().lower().replace(' ', '_').replace('-', '_'): name for name in reader.fieldnames}

            # Find matching column helper
            def find_col_val(row_dict, candidate_keys, default=''):
                for key in candidate_keys:
                    normalized = key.lower().replace(' ', '_').replace('-', '_')
                    if normalized in header_map:
                        raw_col = header_map[normalized]
                        if raw_col in row_dict and row_dict[raw_col] is not None:
                            val = str(row_dict[raw_col]).strip()
                            if val:
                                return val
                return default

            for row_idx, row in enumerate(reader, start=2): # line 2 is first data row
                processed_count += 1

                try:
                    # 1. Date column matching
                    raw_date = find_col_val(row, [
                        'date', 'order_date', 'transaction_date', 'year', 'period', 'time',
                        'timestamp', 'created_at', 'month', 'dt'
                    ])
                    parsed_date = parse_date_safely(raw_date) if raw_date else timezone.now().date()

                    # 2. Identifier matching
                    order_id = find_col_val(row, [
                        'order_id', 'id', 'order_number', 'code', 'variable_code',
                        'industry_code_nzsioc', 'industry_code', 'reference', 'index'
                    ], default=f"REC-{row_idx:06d}")

                    # 3. Product / Metric / Title matching
                    product_name = find_col_val(row, [
                        'product_name', 'product', 'item', 'variable_name', 'industry_name_nzsioc',
                        'industry_name', 'name', 'title', 'description', 'metric', 'label'
                    ])
                    if not product_name:
                        first_non_empty = next((str(v).strip() for v in row.values() if v and str(v).strip()), None)
                        product_name = first_non_empty or f"Item {row_idx}"

                    # 4. Category / Sector matching
                    category = find_col_val(row, [
                        'category', 'product_category', 'variable_category', 'industry_aggregation_nzsioc',
                        'industry', 'type', 'group', 'department', 'sector', 'class'
                    ], default='General')

                    # 5. Region / Location matching
                    region = find_col_val(row, [
                        'region', 'country', 'location', 'state', 'city', 'market',
                        'area', 'zone', 'territory'
                    ], default='Global')

                    # 6. Quantity matching
                    raw_qty = find_col_val(row, ['quantity', 'qty', 'units', 'count', 'volume', 'amount_units'], default='1')
                    qty = parse_int_safely(raw_qty, default=1)

                    # 7. Price / Revenue / Value matching
                    raw_price = find_col_val(row, ['unit_price', 'price', 'rate', 'cost'])
                    raw_rev = find_col_val(row, ['total_revenue', 'revenue', 'value', 'amount', 'total', 'sales', 'val'])
                    raw_discount = find_col_val(row, ['discount_percent', 'discount'], default='0')

                    discount = parse_decimal_safely(raw_discount, default=Decimal('0.00'))

                    if raw_rev:
                        rev = parse_decimal_safely(raw_rev, default=Decimal('0.00'))
                        price = parse_decimal_safely(raw_price, default=rev / Decimal(qty) if qty > 0 else rev)
                    elif raw_price:
                        price = parse_decimal_safely(raw_price, default=Decimal('10.00'))
                        rev = price * Decimal(qty) * (Decimal('1.00') - (discount / Decimal('100.00')))
                        rev = round(rev, 2)
                    else:
                        price = Decimal('10.00')
                        rev = price * Decimal(qty)

                    cust_name = find_col_val(row, ['customer_name', 'customer', 'client', 'buyer'], default='')
                    cust_email = find_col_val(row, ['customer_email', 'email', 'contact'], default='')
                    status_val = find_col_val(row, ['status', 'order_status', 'state'], default='Completed')

                    valid_statuses = [s.value for s in SalesRecord.Status]
                    matching_status = next((s for s in valid_statuses if s.lower() == status_val.lower()), SalesRecord.Status.COMPLETED)

                    record = SalesRecord(
                        dataset=dataset,
                        user=job.user,
                        order_id=order_id[:100],
                        date=parsed_date,
                        customer_name=cust_name[:200],
                        customer_email=cust_email[:254],
                        product_name=product_name[:255],
                        category=category[:100],
                        region=region[:100],
                        quantity=qty,
                        unit_price=price,
                        discount_percent=discount,
                        total_revenue=rev,
                        status=matching_status,
                    )
                    records_to_insert.append(record)
                    total_accumulated_revenue += rev

                except Exception as row_err:
                    failed_count += 1
                    if len(error_logs) < MAX_ERROR_LOGS_SAVED:
                        error_logs.append({
                            "row": row_idx,
                            "raw_data": {k: str(v)[:60] for k, v in list(row.items())[:6]},
                            "error": str(row_err)
                        })

                # Batch insertion & progress notification
                if len(records_to_insert) >= BATCH_SIZE:
                    SalesRecord.objects.bulk_create(records_to_insert, batch_size=BATCH_SIZE)
                    records_to_insert = []
                    
                    pct = min(int((processed_count / total_lines) * 90) + 10, 95)
                    job.progress_percentage = pct
                    job.processed_rows = processed_count
                    job.failed_rows = failed_count
                    job.save(update_fields=['progress_percentage', 'processed_rows', 'failed_rows'])
                    set_job_progress(job_id, pct, 'PROCESSING', processed_count, total_lines, failed_count)

            # Flush remaining records
            if records_to_insert:
                SalesRecord.objects.bulk_create(records_to_insert, batch_size=BATCH_SIZE)
                records_to_insert = []

        # Finalize dataset & job status
        dataset.total_rows = dataset.records.count()
        agg_rev = dataset.records.aggregate(total=Sum('total_revenue'))['total'] or Decimal('0.00')
        dataset.total_revenue = agg_rev
        dataset.save(update_fields=['total_rows', 'total_revenue', 'updated_at'])

        job.status = ImportJob.JobStatus.COMPLETED
        job.progress_percentage = 100
        job.processed_rows = processed_count
        job.failed_rows = failed_count
        job.error_logs = error_logs
        job.completed_at = timezone.now()
        job.save()

        set_job_progress(job_id, 100, 'COMPLETED', processed_count, total_lines, failed_count)
        invalidate_user_analytics_cache(job.user.id)
        logger.info(f"Successfully processed CSV ImportJob {job_id} ({processed_count} rows, {failed_count} failed).")

    except Exception as e:
        logger.exception(f"Fatal error processing ImportJob {job_id}: {e}")
        job.status = ImportJob.JobStatus.FAILED
        job.error_message = str(e)
        job.error_logs = error_logs
        job.completed_at = timezone.now()
        job.save()
        set_job_progress(job_id, job.progress_percentage, 'FAILED', processed_count, total_lines, failed_count)

@shared_task
def generate_pdf_report_task(report_job_id: str):
    """
    Compiles sales analytics aggregates into a downloadable PDF report using ReportLab.
    """
    try:
        report_job = ReportJob.objects.select_related('user', 'dataset').get(id=report_job_id)
    except ReportJob.DoesNotExist:
        logger.error(f"ReportJob {report_job_id} not found.")
        return

    report_job.status = ReportJob.Status.PROCESSING
    report_job.started_at = timezone.now()
    report_job.save(update_fields=['status', 'started_at'])

    try:
        user = report_job.user
        qs = SalesRecord.objects.filter(user=user)
        
        if report_job.dataset:
            qs = qs.filter(dataset=report_job.dataset)

        filters = report_job.filters_applied or {}
        if filters.get('category'):
            qs = qs.filter(category=filters['category'])
        if filters.get('start_date'):
            qs = qs.filter(date__gte=filters['start_date'])
        if filters.get('end_date'):
            qs = qs.filter(date__lte=filters['end_date'])

        # Aggregate Summary Data
        total_rev = qs.aggregate(rev=Sum('total_revenue'))['rev'] or Decimal('0.00')
        total_orders = qs.count()
        aov = (total_rev / total_orders) if total_orders > 0 else Decimal('0.00')

        cat_agg = qs.values('category').annotate(
            total_revenue=Sum('total_revenue'),
            total_quantity=Sum('quantity')
        ).order_by('-total_revenue')

        top_category_name = cat_agg[0]['category'] if cat_agg.exists() else 'N/A'

        summary_data = {
            'total_revenue': total_rev,
            'total_orders': total_orders,
            'average_order_value': aov,
            'top_category': top_category_name,
        }

        # Top 10 Products
        top_products = list(qs.values('product_name', 'category').annotate(
            total_revenue=Sum('total_revenue'),
            total_quantity=Sum('quantity')
        ).order_by('-total_revenue')[:10])

        # Category Breakdown list
        category_data = list(cat_agg[:10])

        # Monthly Trends
        trends_data = list(qs.values('date').annotate(
            daily_revenue=Sum('total_revenue'),
            daily_orders=Count('id')
        ).order_by('date')[:30])

        # Generate PDF with ReportLab
        generator = SalesPulsePDFReport(filename_prefix=f"SalesPulse_Report_{user.id}")
        file_path, file_name = generator.generate(
            user=user,
            summary_data=summary_data,
            top_products=top_products,
            category_data=category_data,
            trends_data=trends_data,
            filters=filters
        )

        report_job.file_path = file_path
        report_job.file_name = file_name
        report_job.status = ReportJob.Status.COMPLETED
        report_job.completed_at = timezone.now()
        report_job.save()
        logger.info(f"PDF Report generated successfully for ReportJob {report_job_id}: {file_name}")

    except Exception as e:
        logger.exception(f"Failed to generate PDF Report for ReportJob {report_job_id}: {e}")
        report_job.status = ReportJob.Status.FAILED
        report_job.error_message = str(e)
        report_job.completed_at = timezone.now()
        report_job.save()

@shared_task
def send_weekly_summary_email_task():
    """
    Celery Beat periodic task: Runs every Monday to email weekly digest summaries.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    seven_days_ago = timezone.now().date() - timedelta(days=7)
    logger.info("Executing scheduled weekly sales summary email digest...")

    active_users = User.objects.filter(is_active=True)
    emails_sent = 0

    for user in active_users:
        records_7d = SalesRecord.objects.filter(user=user, date__gte=seven_days_ago)
        count = records_7d.count()
        if count == 0:
            continue
            
        rev = records_7d.aggregate(total=Sum('total_revenue'))['total'] or Decimal('0.00')
        top_product = records_7d.values('product_name').annotate(
            rev=Sum('total_revenue')
        ).order_by('-rev').first()
        
        top_name = top_product['product_name'] if top_product else 'N/A'

        subject = f"📊 Your SalesPulse Weekly Digest ({seven_days_ago.strftime('%b %d')} - {timezone.now().date().strftime('%b %d')})"
        body = (
            f"Hello {user.username},\n\n"
            f"Here is your SalesPulse performance summary for the past 7 days:\n\n"
            f"• Total Orders: {count:,}\n"
            f"• Total Revenue: ${rev:,.2f}\n"
            f"• Top Performing Product: {top_name}\n\n"
            f"View your interactive charts and export custom PDF reports at: http://localhost:5173\n\n"
            f"— The SalesPulse Team"
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            emails_sent += 1
        except Exception as e:
            logger.error(f"Failed to email weekly digest to {user.email}: {e}")

    logger.info(f"Weekly digest completed. {emails_sent} emails dispatched.")
