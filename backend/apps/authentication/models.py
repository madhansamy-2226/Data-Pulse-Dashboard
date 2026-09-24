from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        ANALYST = 'ANALYST', 'Analyst'
        VIEWER = 'VIEWER', 'Viewer'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ANALYST,
        help_text="Role-based access level for the dashboard"
    )
    company_name = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_analyst_role(self):
        return self.role in [self.Role.ADMIN, self.Role.ANALYST] or self.is_superuser
