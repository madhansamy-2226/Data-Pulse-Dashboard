import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_user_registration(api_client):
    url = reverse('auth-register')
    payload = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'StrongPassword123!',
        'confirm_password': 'StrongPassword123!',
        'role': 'ANALYST',
        'company_name': 'Beta Tech'
    }
    response = api_client.post(url, payload)
    assert response.status_code == 201
    assert response.data['user']['email'] == 'newuser@example.com'
    assert User.objects.filter(email='newuser@example.com').exists()

@pytest.mark.django_db
def test_user_login_jwt(api_client, test_user):
    url = reverse('auth-login')
    payload = {
        'email': test_user.email,
        'password': 'Password123!'
    }
    response = api_client.post(url, payload)
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['user']['role'] == 'ANALYST'

@pytest.mark.django_db
def test_me_endpoint(auth_client, test_user):
    url = reverse('auth-me')
    response = auth_client.get(url)
    assert response.status_code == 200
    assert response.data['email'] == test_user.email
