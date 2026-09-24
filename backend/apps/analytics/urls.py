from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CSVUploadView,
    JobStatusView,
    JobHistoryListView,
    DatasetViewSet,
    AnalyticsSummaryView,
    RevenueTrendsView,
    CategoryBreakdownView,
    TopProductsView,
    FilterOptionsView,
    ExportPDFView,
    ReportStatusView,
    ReportDownloadView,
    ClearCacheView,
)

router = DefaultRouter()
router.register(r'datasets', DatasetViewSet, basename='dataset')

urlpatterns = [
    path('', include(router.urls)),
    
    # CSV Ingestion & Jobs
    path('upload/', CSVUploadView.as_view(), name='analytics-upload'),
    path('jobs/<uuid:job_id>/', JobStatusView.as_view(), name='analytics-job-status'),
    path('jobs/', JobHistoryListView.as_view(), name='analytics-job-history'),
    
    # Aggregated Analytics (Redis Cached)
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('trends/', RevenueTrendsView.as_view(), name='analytics-trends'),
    path('categories/', CategoryBreakdownView.as_view(), name='analytics-categories'),
    path('top-products/', TopProductsView.as_view(), name='analytics-top-products'),
    path('filters/', FilterOptionsView.as_view(), name='analytics-filter-options'),
    path('clear-cache/', ClearCacheView.as_view(), name='analytics-clear-cache'),
    
    # PDF Export Pipeline
    path('export-pdf/', ExportPDFView.as_view(), name='analytics-export-pdf'),
    path('reports/<uuid:report_id>/status/', ReportStatusView.as_view(), name='analytics-report-status'),
    path('reports/<uuid:report_id>/download/', ReportDownloadView.as_view(), name='analytics-report-download'),
]
