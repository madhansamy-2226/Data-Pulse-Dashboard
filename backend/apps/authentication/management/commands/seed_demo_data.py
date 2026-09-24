from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os
from decimal import Decimal
from apps.analytics.models import Dataset, ImportJob, SalesRecord
from apps.analytics.tasks import import_csv_task

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds demo users and initial sales dataset for immediate testing'

    def handle(self, *args, **options):
        self.stdout.write("Provisioning demo users...")

        users_data = [
            {
                'username': 'adminuser',
                'email': 'admin@salespulse.dev',
                'password': 'Password123!',
                'role': User.Role.ADMIN,
                'company_name': 'SalesPulse Global Corp',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': 'testanalyst',
                'email': 'analyst@salespulse.dev',
                'password': 'Password123!',
                'role': User.Role.ANALYST,
                'company_name': 'Acme Analytics Ltd',
            },
            {
                'username': 'viewerdemo',
                'email': 'viewer@salespulse.dev',
                'password': 'Password123!',
                'role': User.Role.VIEWER,
                'company_name': 'Retail Insights Partner',
            },
        ]

        created_users = {}
        for u in users_data:
            user, created = User.objects.get_or_create(
                email=u['email'],
                defaults={
                    'username': u['username'],
                    'role': u['role'],
                    'company_name': u['company_name'],
                    'is_staff': u.get('is_staff', False),
                    'is_superuser': u.get('is_superuser', False),
                }
            )
            if created or not user.has_usable_password():
                user.set_password(u['password'])
                user.save()
            created_users[u['role']] = user
            self.stdout.write(self.style.SUCCESS(f"User {u['email']} ready ({u['role']})."))

        # Ingest initial sample data for analyst if none exists
        analyst = created_users[User.Role.ANALYST]
        if not SalesRecord.objects.filter(user=analyst).exists():
            sample_csv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'sample_data', 'sample_sales_10k.csv')
            sample_csv_path = os.path.abspath(sample_csv_path)

            if os.path.exists(sample_csv_path):
                self.stdout.write("Ingesting 10,000 rows sample sales dataset for Analyst...")
                job = ImportJob.objects.create(
                    user=analyst,
                    file_name='sample_sales_10k.csv',
                    file_path=sample_csv_path,
                    status=ImportJob.JobStatus.PENDING,
                )
                import_csv_task(str(job.id))
                self.stdout.write(self.style.SUCCESS("Sample sales dataset ingested successfully!"))

        self.stdout.write(self.style.SUCCESS("Seed complete. You can log in with demo credentials immediately!"))
