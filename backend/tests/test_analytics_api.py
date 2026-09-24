import pytest
from django.urls import reverse
from django.core.cache import cache

@pytest.mark.django_db
def test_analytics_summary_kpi(auth_client, sample_dataset):
    url = reverse('analytics-summary')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert float(response.data['total_revenue']) == 1500.00
    assert response.data['total_orders'] == 2
    assert response.data['top_category'] == 'Electronics'

@pytest.mark.django_db
def test_analytics_summary_caching(auth_client, sample_dataset):
    url = reverse('analytics-summary')
    cache.clear()
    
    # First request: Cache Miss
    res1 = auth_client.get(url)
    assert res1.status_code == 200
    assert res1.data['from_cache'] is False

    # Second request: Cache Hit
    res2 = auth_client.get(url)
    assert res2.status_code == 200
    assert res2.data['from_cache'] is True

@pytest.mark.django_db
def test_category_breakdown(auth_client, sample_dataset):
    url = reverse('analytics-categories')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 2
    assert response.data[0]['category'] == 'Electronics'
    assert response.data[0]['total_revenue'] == 1200.00

@pytest.mark.django_db
def test_top_products(auth_client, sample_dataset):
    url = reverse('analytics-top-products')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 2
    assert response.data[0]['product_name'] == 'MacBook Pro 16'
