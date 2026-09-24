from rest_framework import serializers
from .models import Dataset, SalesRecord, ImportJob, ReportJob

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = [
            'id', 'name', 'description', 'original_filename',
            'file_size_bytes', 'total_rows', 'total_revenue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_rows', 'total_revenue', 'created_at', 'updated_at']

class SalesRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesRecord
        fields = [
            'id', 'dataset', 'order_id', 'date', 'customer_name',
            'product_name', 'category', 'region', 'quantity',
            'unit_price', 'discount_percent', 'total_revenue',
            'status', 'created_at'
        ]

class ImportJobSerializer(serializers.ModelSerializer):
    dataset_name = serializers.CharField(source='dataset.name', read_only=True, default='')

    class Meta:
        model = ImportJob
        fields = [
            'id', 'file_name', 'status', 'progress_percentage',
            'total_rows', 'processed_rows', 'failed_rows',
            'error_logs', 'error_message', 'started_at',
            'completed_at', 'created_at', 'dataset', 'dataset_name'
        ]
        read_only_fields = ['id', 'status', 'progress_percentage', 'created_at', 'completed_at']

class ReportJobSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ReportJob
        fields = [
            'id', 'report_type', 'status', 'file_name',
            'filters_applied', 'error_message', 'created_at',
            'completed_at', 'download_url'
        ]
        read_only_fields = ['id', 'status', 'file_name', 'created_at', 'completed_at', 'download_url']

    def get_download_url(self, obj):
        if obj.status == ReportJob.Status.COMPLETED and obj.file_name:
            return f"/api/analytics/reports/{obj.id}/download/"
        return None

class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    dataset_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_file(self, value):
        if not value.name.lower().endswith('.csv'):
            raise serializers.ValidationError("Only .csv files are supported.")
        # 100MB limit check
        if value.size > 100 * 1024 * 1024:
            raise serializers.ValidationError("File size exceeds 100MB maximum limit.")
        return value

class AnalyticsSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_orders = serializers.IntegerField()
    average_order_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_units_sold = serializers.IntegerField()
    top_category = serializers.CharField()
    top_region = serializers.CharField()
    from_cache = serializers.BooleanField(default=False)

class RevenueTrendItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders = serializers.IntegerField()

class CategoryDistributionItemSerializer(serializers.Serializer):
    category = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_quantity = serializers.IntegerField()
    percentage = serializers.FloatField()

class TopProductItemSerializer(serializers.Serializer):
    product_name = serializers.CharField()
    category = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_quantity = serializers.IntegerField()
    avg_price = serializers.DecimalField(max_digits=10, decimal_places=2)
