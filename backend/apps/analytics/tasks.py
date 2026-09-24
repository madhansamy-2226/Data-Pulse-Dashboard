import os
import csv
import logging
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

BATCH_SIZE = 2000
MAX_ERROR_LOGS_SAVED = 500

def parse_date_safely(date_str: str) -> date:
    """Parses date string with support for ISO (YYYY-MM-DD), MM/DD/YYYY, and DD-MM-YYYY."""
    if not date_str:
        raise ValueError("Date field is empty")
    
    clean_str = date_str.strip()
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(clean_str, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: '{date_str}'")

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def import_csv_task(self, job_id: str):
    """
    Asynchronously processes a CSV upload:
    - Validates columns and data types per row
    - Logs row-level errors
    - Bulk inserts valid rows in chunks
    - Reports real-time progress
    - Invalidates user analytics cache
    """
    try:
        job = ImportJob.objects.select_related('user').get(id=job_id)
    except ImportJob.DoesNotExist:
        logger.error(f"ImportJob {job_id} does not exist.")
        return

    job.status = ImportJob.JobStatus.PROCESSING
    job.started_at = timezone.now()
    job.progress_percentage = 5
    job.save(update_fields=['status', 'started_at', 'progress_percentage'])
    set_job_progress(job_id, 5, 'PROCESSING', 0, 0, 0)

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
        dataset_name = os.path.splitext(os.path.basename(job.file_name))[0].replace('_', ' ').title()
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
            
            # Normalize fieldnames to lowercase stripped
            if not reader.fieldnames:
                raise ValueError("CSV header is empty or missing.")
            
            header_map = {name.strip().lower().replace(' ', '_'): name for name in reader.fieldnames}
            
            for row_idx, row in enumerate(reader, start=2): # line 2 is first data row
                processed_count += 1
                
                # Helper to fetch by normalized key
                def get_val(key, default=''):
                    raw_key = header_map.get(key)
                    if raw_key and raw_key in row:
                        return row[raw_key].strip()
                    return default

                try:
                    order_id = get_val('order_id') or get_val('id') or f"ORD-{row_idx}"
                    raw_date = get_val('date') or get_val('order_date') or get_val('transaction_date')
                    product_name = get_val('product_name') or get_val('product') or get_val('item')
                    category = get_val('category') or get_val('product_category') or 'General'
                    region = get_val('region') or get_val('country') or get_val('location') or 'Global'
                    raw_qty = get_val('quantity') or get_val('qty') or '1'
                    raw_price = get_val('unit_price') or get_val('price') or get_val('amount')
                    raw_discount = get_val('discount_percent') or get_val('discount') or '0'
                    raw_rev = get_val('total_revenue') or get_val('revenue') or get_val('total')
                    cust_name = get_val('customer_name') or get_val('customer') or ''
                    cust_email = get_val('customer_email') or get_val('email') or ''
                    status_val = get_val('status') or 'Completed'

                    if not raw_date:
                        raise ValueError("Missing 'date' column or value")
                    if not product_name:
                        raise ValueError("Missing 'product_name' value")
                    if not raw_price:
                        raise ValueError("Missing 'unit_price' value")

                    parsed_date = parse_date_safely(raw_date)
                    qty = int(float(raw_qty))
                    if qty <= 0:
                        raise ValueError(f"Quantity must be positive (got {qty})")
                    
                    price = Decimal(str(round(float(raw_price.replace('$', '').replace(',', '')), 2)))
                    discount = Decimal(str(round(float(raw_discount.replace('%', '')), 2))) if raw_discount else Decimal('0.00')

                    if raw_rev:
                        rev = Decimal(str(round(float(raw_rev.replace('$', '').replace(',', '')), 2)))
                    else:
                        rev = price * Decimal(qty) * (Decimal('1.00') - (discount / Decimal('100.00')))
                        rev = round(rev, 2)

                    # Validate status choice
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

                # Batch insertion
                if len(records_to_insert) >= BATCH_SIZE:
                    SalesRecord.objects.bulk_create(records_to_insert, batch_size=BATCH_SIZE)
                    records_to_insert = []
                    
                    # Update progress
                    pct = min(int((processed_count / total_lines) * 90) + 5, 95)
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

        # Invalidate Redis cached queries for this user
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

@shared_task(bind=True)
def generate_pdf_report_task(self, report_job_id: str):
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
