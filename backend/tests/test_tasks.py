import os
import pytest
from apps.analytics.models import ImportJob, SalesRecord, ReportJob, Dataset
from apps.analytics.tasks import import_csv_task, generate_pdf_report_task

@pytest.mark.django_db
def test_import_csv_task_execution(test_user, tmp_path):
    csv_content = """order_id,date,customer_name,customer_email,product_name,category,region,quantity,unit_price,discount_percent,total_revenue,status
ORD-101,2026-02-01,John Doe,john@example.com,Dell XPS 15,Electronics,North America,2,1500.00,0.0,3000.00,Completed
ORD-102,2026-02-02,Jane Smith,jane@example.com,Ergonomic Chair,Furniture,Europe,1,350.00,10.0,315.00,Completed
ORD-ERR,INVALID_DATE,Bad Row,bad@example.com,Broken Item,Electronics,Global,-1,0,0,0,Completed
"""
    file_path = tmp_path / "test_import.csv"
    file_path.write_text(csv_content)

    job = ImportJob.objects.create(
        user=test_user,
        file_name="test_import.csv",
        file_path=str(file_path),
        status=ImportJob.JobStatus.PENDING
    )

    # Run Celery task directly
    import_csv_task(str(job.id))

    job.refresh_from_db()
    assert job.status == ImportJob.JobStatus.COMPLETED
    assert job.processed_rows == 3
    assert job.failed_rows == 1
    assert len(job.error_logs) == 1
    assert "Unrecognized date format" in job.error_logs[0]['error']

    # Verify database insertion
    records = SalesRecord.objects.filter(user=test_user)
    assert records.count() == 2

@pytest.mark.django_db
def test_generate_pdf_report_task(test_user, sample_dataset):
    report_job = ReportJob.objects.create(
        user=test_user,
        dataset=sample_dataset,
        report_type=ReportJob.ReportType.SUMMARY_PDF,
        status=ReportJob.Status.PENDING
    )

    generate_pdf_report_task(str(report_job.id))

    report_job.refresh_from_db()
    assert report_job.status == ReportJob.Status.COMPLETED
    assert os.path.exists(report_job.file_path)
    assert report_job.file_path.endswith('.pdf')
