import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.analytics.models import Dataset, SalesRecord
from decimal import Decimal
from datetime import date

User = get_user_model()

@pytest.fixture(autouse=True)
def configure_test_cache(settings):
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'salespulse-test-cache',
        }
    }
    settings.CELERY_TASK_ALWAYS_EAGER = True

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user(db):
    user = User.objects.create_user(
        username='testanalyst',
        email='analyst@salespulse.dev',
        password='Password123!',
        role=User.Role.ANALYST,
        company_name='Acme Corp'
    )
    return user

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='adminuser',
        email='admin@salespulse.dev',
        password='Password123!',
        role=User.Role.ADMIN,
        company_name='SalesPulse Admin Corp'
    )
    return user

@pytest.fixture
def auth_client(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    return api_client

@pytest.fixture
def sample_dataset(db, test_user):
    dataset = Dataset.objects.create(
        user=test_user,
        name='Q1 Sales 2026',
        original_filename='q1_sales.csv',
        file_size_bytes=10240,
        total_rows=5,
        total_revenue=Decimal('1500.00')
    )
    
    SalesRecord.objects.create(
        dataset=dataset,
        user=test_user,
        order_id='ORD-001',
        date=date(2026, 1, 15),
        product_name='MacBook Pro 16',
        category='Electronics',
        region='North America',
        quantity=1,
        unit_price=Decimal('1200.00'),
        discount_percent=Decimal('0.00'),
        total_revenue=Decimal('1200.00'),
        status=SalesRecord.Status.COMPLETED
    )
    SalesRecord.objects.create(
        dataset=dataset,
        user=test_user,
        order_id='ORD-002',
        date=date(2026, 1, 20),
        product_name='Ergonomic Chair',
        category='Furniture',
        region='Europe',
        quantity=1,
        unit_price=Decimal('300.00'),
        discount_percent=Decimal('0.00'),
        total_revenue=Decimal('300.00'),
        status=SalesRecord.Status.COMPLETED
    )
    return dataset
