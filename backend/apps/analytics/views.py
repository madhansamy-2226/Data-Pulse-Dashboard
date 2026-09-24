import os
from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, TruncMonth
from django.http import FileResponse, Http404
from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.authentication.permissions import IsAnalystOrAdmin, IsViewerOrAbove
from .models import Dataset, SalesRecord, ImportJob, ReportJob
from .serializers import (
    DatasetSerializer,
    SalesRecordSerializer,
    ImportJobSerializer,
    ReportJobSerializer,
    CSVUploadSerializer,
    AnalyticsSummarySerializer,
    RevenueTrendItemSerializer,
    CategoryDistributionItemSerializer,
    TopProductItemSerializer,
)
from .tasks import import_csv_task, generate_pdf_report_task
from .utils import (
    generate_cache_key,
    invalidate_user_analytics_cache,
    get_job_progress,
    CACHE_TTL,
)

def filter_queryset_by_params(qs, params):
    dataset_id = params.get('dataset_id')
    category = params.get('category')
    region = params.get('region')
    start_date = params.get('start_date')
    end_date = params.get('end_date')
    status_val = params.get('status')

    if dataset_id:
        qs = qs.filter(dataset_id=dataset_id)
    if category and category.lower() != 'all':
        qs = qs.filter(category=category)
    if region and region.lower() != 'all':
        qs = qs.filter(region=region)
    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lte=end_date)
    if status_val:
        qs = qs.filter(status=status_val)
    return qs

class CSVUploadView(APIView):
    """
    Uploads a sales CSV file and queues background ingestion worker task.
    Returns job_id immediately without blocking the client.
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CSVUploadSerializer,
        responses={202: ImportJobSerializer},
        description="Upload CSV and queue background ingestion task"
    )
    def post(self, request):
        serializer = CSVUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        dataset_name = serializer.validated_data.get('dataset_name') or uploaded_file.name.replace('.csv', '').replace('_', ' ').title()
        description = serializer.validated_data.get('description', '')

        # Ensure upload dir exists
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', str(request.user.id))
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, uploaded_file.name)

        # Save file to disk
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Create Dataset instance
        dataset = Dataset.objects.create(
            user=request.user,
            name=dataset_name,
            description=description,
            original_filename=uploaded_file.name,
            file_size_bytes=uploaded_file.size,
        )

        # Create ImportJob instance
        job = ImportJob.objects.create(
            user=request.user,
            dataset=dataset,
            file_name=uploaded_file.name,
            file_path=file_path,
            status=ImportJob.JobStatus.PENDING,
            progress_percentage=0,
        )

        # Trigger Celery async task with immediate fallback if broker is offline
        try:
            import_csv_task.delay(str(job.id))
        except Exception:
            import_csv_task(str(job.id))
            job.refresh_from_db()

        return Response(
            {
                "message": "CSV file uploaded successfully. Ingestion job initiated.",
                "job": ImportJobSerializer(job).data
            },
            status=status.HTTP_202_ACCEPTED
        )

class JobStatusView(APIView):
    """
    Polls the real-time processing progress of a background CSV import job.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ImportJobSerializer})
    def get(self, request, job_id):
        try:
            job = ImportJob.objects.get(id=job_id, user=request.user)
        except ImportJob.DoesNotExist:
            return Response({"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check Redis cache for ultra-fast progress updates
        cached_progress = get_job_progress(str(job_id))
        job_data = ImportJobSerializer(job).data

        if cached_progress and job.status == ImportJob.JobStatus.PROCESSING:
            job_data['progress_percentage'] = cached_progress.get('progress', job.progress_percentage)
            job_data['processed_rows'] = cached_progress.get('processed', job.processed_rows)
            job_data['failed_rows'] = cached_progress.get('failed', job.failed_rows)

        return Response(job_data)

class JobHistoryListView(generics.ListAPIView):
    """
    List all previous import jobs for the authenticated user.
    """
    serializer_class = ImportJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ImportJob.objects.filter(user=self.request.user).order_by('-created_at')

class DatasetViewSet(viewsets.ModelViewSet):
    """
    Manage user datasets (List, Retrieve, Delete).
    """
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_destroy(self, instance):
        user_id = instance.user_id
        instance.delete()
        invalidate_user_analytics_cache(user_id)

class AnalyticsSummaryView(APIView):
    """
    Returns aggregate Key Performance Indicators (Total Revenue, Orders, AOV, Top Category).
    Leverages Redis caching for fast response times.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter('dataset_id', str, description='Filter by dataset UUID'),
            OpenApiParameter('category', str, description='Filter by category'),
            OpenApiParameter('region', str, description='Filter by region'),
            OpenApiParameter('start_date', str, description='Start date YYYY-MM-DD'),
            OpenApiParameter('end_date', str, description='End date YYYY-MM-DD'),
        ],
        responses={200: AnalyticsSummarySerializer}
    )
    def get(self, request):
        params = request.query_params.dict()
        cache_key = generate_cache_key('summary', request.user.id, params)
        cached_data = cache.get(cache_key)

        if cached_data:
            cached_data['from_cache'] = True
            return Response(cached_data)

        qs = SalesRecord.objects.filter(user=request.user)
        qs = filter_queryset_by_params(qs, params)

        aggregates = qs.aggregate(
            sum_revenue=Sum('total_revenue'),
            total_orders=Count('id'),
            total_units_sold=Sum('quantity'),
            avg_order_value=Avg('total_revenue')
        )

        total_rev = aggregates['sum_revenue'] or Decimal('0.00')
        total_orders = aggregates['total_orders'] or 0
        total_units = aggregates['total_units_sold'] or 0
        aov = aggregates['avg_order_value'] or Decimal('0.00')

        # Top category & region
        top_cat_obj = qs.values('category').annotate(rev=Sum('total_revenue')).order_by('-rev').first()
        top_category = top_cat_obj['category'] if top_cat_obj else 'N/A'

        top_region_obj = qs.values('region').annotate(rev=Sum('total_revenue')).order_by('-rev').first()
        top_region = top_region_obj['region'] if top_region_obj else 'N/A'

        data = {
            'total_revenue': str(total_rev),
            'total_orders': total_orders,
            'average_order_value': str(round(aov, 2)),
            'total_units_sold': total_units,
            'top_category': top_category,
            'top_region': top_region,
            'from_cache': False
        }

        # Cache in Redis for 5 minutes
        cache.set(cache_key, data, timeout=CACHE_TTL)
        return Response(data)

class RevenueTrendsView(APIView):
    """
    Returns time-series revenue and order counts for Recharts Line/Area charts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = request.query_params.dict()
        cache_key = generate_cache_key('trends', request.user.id, params)
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        qs = SalesRecord.objects.filter(user=request.user)
        qs = filter_queryset_by_params(qs, params)

        # Group by Date
        trends = qs.values('date').annotate(
            revenue=Sum('total_revenue'),
            orders=Count('id')
        ).order_by('date')[:90] # Capped at 90 data points for UI responsiveness

        result = [
            {
                'date': item['date'].strftime('%Y-%m-%d'),
                'revenue': float(item['revenue'] or 0),
                'orders': item['orders']
            }
            for item in trends
        ]

        cache.set(cache_key, result, timeout=CACHE_TTL)
        return Response(result)

class CategoryBreakdownView(APIView):
    """
    Returns category revenue breakdown and share percentage for Bar/Pie charts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = request.query_params.dict()
        cache_key = generate_cache_key('categories', request.user.id, params)
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        qs = SalesRecord.objects.filter(user=request.user)
        qs = filter_queryset_by_params(qs, params)

        cat_data = qs.values('category').annotate(
            total_revenue=Sum('total_revenue'),
            total_quantity=Sum('quantity')
        ).order_by('-total_revenue')

        total_rev = qs.aggregate(total=Sum('total_revenue'))['total'] or Decimal('1.00')
        total_rev_float = float(total_rev) if total_rev > 0 else 1.0

        result = [
            {
                'category': item['category'],
                'total_revenue': float(item['total_revenue'] or 0),
                'total_quantity': item['total_quantity'] or 0,
                'percentage': round((float(item['total_revenue'] or 0) / total_rev_float) * 100, 2)
            }
            for item in cat_data
        ]

        cache.set(cache_key, result, timeout=CACHE_TTL)
        return Response(result)

class TopProductsView(APIView):
    """
    Returns top 10 best-selling products by total revenue.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = request.query_params.dict()
        cache_key = generate_cache_key('top_products', request.user.id, params)
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

        qs = SalesRecord.objects.filter(user=request.user)
        qs = filter_queryset_by_params(qs, params)

        products = qs.values('product_name', 'category').annotate(
            total_revenue=Sum('total_revenue'),
            total_quantity=Sum('quantity'),
            avg_price=Avg('unit_price')
        ).order_by('-total_revenue')[:10]

        result = [
            {
                'product_name': item['product_name'],
                'category': item['category'],
                'total_revenue': float(item['total_revenue'] or 0),
                'total_quantity': item['total_quantity'] or 0,
                'avg_price': round(float(item['avg_price'] or 0), 2),
            }
            for item in products
        ]

        cache.set(cache_key, result, timeout=CACHE_TTL)
        return Response(result)

class FilterOptionsView(APIView):
    """
    Returns distinct categories and regions for dropdown filter menus.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SalesRecord.objects.filter(user=request.user)
        categories = list(qs.values_list('category', flat=True).distinct().order_by('category'))
        regions = list(qs.values_list('region', flat=True).distinct().order_by('region'))
        
        return Response({
            'categories': categories,
            'regions': regions
        })

class ExportPDFView(APIView):
    """
    Initiates asynchronous PDF report compilation via Celery worker.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        dataset_id = request.data.get('dataset_id')
        filters = request.data.get('filters', {})

        dataset = None
        if dataset_id:
            try:
                dataset = Dataset.objects.get(id=dataset_id, user=request.user)
            except Dataset.DoesNotExist:
                return Response({"detail": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)

        report_job = ReportJob.objects.create(
            user=request.user,
            dataset=dataset,
            report_type=ReportJob.ReportType.SUMMARY_PDF,
            filters_applied=filters,
            status=ReportJob.Status.PENDING,
        )

        try:
            generate_pdf_report_task.delay(str(report_job.id))
        except Exception:
            generate_pdf_report_task(str(report_job.id))
            report_job.refresh_from_db()

        return Response(
            {
                "message": "PDF Report generation initiated.",
                "report": ReportJobSerializer(report_job).data
            },
            status=status.HTTP_202_ACCEPTED
        )

class ReportStatusView(APIView):
    """
    Polls status of PDF report generation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            report_job = ReportJob.objects.get(id=report_id, user=request.user)
        except ReportJob.DoesNotExist:
            return Response({"detail": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(ReportJobSerializer(report_job).data)

class ReportDownloadView(APIView):
    """
    Streams and downloads the generated PDF file.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            report_job = ReportJob.objects.get(id=report_id, user=request.user)
        except ReportJob.DoesNotExist:
            raise Http404("Report not found")

        if report_job.status != ReportJob.Status.COMPLETED or not os.path.exists(report_job.file_path):
            return Response({"detail": "Report is not ready or file does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        response = FileResponse(open(report_job.file_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{report_job.file_name}"'
        return response

class ClearCacheView(APIView):
    """
    Manually invalidates Redis cache for testing/benchmarking purposes.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        invalidate_user_analytics_cache(request.user.id)
        return Response({"message": "User analytics cache purged successfully."})
