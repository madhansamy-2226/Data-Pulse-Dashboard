import uuid
from django.db import models
from django.conf import settings

class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='datasets')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    original_filename = models.CharField(max_length=255)
    file_size_bytes = models.BigIntegerField(default=0)
    total_rows = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.total_rows} rows)"

class SalesRecord(models.Model):
    class Status(models.TextChoices):
        COMPLETED = 'Completed', 'Completed'
        PENDING = 'Pending', 'Pending'
        CANCELLED = 'Cancelled', 'Cancelled'
        REFUNDED = 'Refunded', 'Refunded'

    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='records')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sales_records')
    
    order_id = models.CharField(max_length=100, db_index=True)
    date = models.DateField(db_index=True)
    customer_name = models.CharField(max_length=200, blank=True, default='')
    customer_email = models.EmailField(blank=True, default='')
    product_name = models.CharField(max_length=255, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    region = models.CharField(max_length=100, db_index=True, blank=True, default='Global')
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['dataset', 'category']),
            models.Index(fields=['user', 'region']),
            models.Index(fields=['user', 'date', 'category']),
        ]

    def __str__(self):
        return f"{self.order_id} - {self.product_name} (${self.total_revenue})"

class ImportJob(models.Model):
    class JobStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='import_jobs')
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True, related_name='import_jobs')
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.PENDING)
    progress_percentage = models.IntegerField(default=0)
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    error_logs = models.JSONField(default=list, blank=True)
    error_message = models.TextField(blank=True, default='')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ImportJob {self.id} - {self.status} ({self.progress_percentage}%)"

class ReportJob(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    class ReportType(models.TextChoices):
        SUMMARY_PDF = 'SUMMARY_PDF', 'Summary PDF Report'
        WEEKLY_DIGEST = 'WEEKLY_DIGEST', 'Weekly Digest'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_jobs')
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True)
    report_type = models.CharField(max_length=30, choices=ReportType.choices, default=ReportType.SUMMARY_PDF)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    file_path = models.CharField(max_length=500, blank=True, default='')
    file_name = models.CharField(max_length=255, blank=True, default='')
    error_message = models.TextField(blank=True, default='')
    filters_applied = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ReportJob {self.id} - {self.report_type} ({self.status})"
