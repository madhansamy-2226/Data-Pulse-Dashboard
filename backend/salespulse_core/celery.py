import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'salespulse_core.settings')

app = Celery('salespulse')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Periodic Tasks configuration
app.conf.beat_schedule = {
    'send-weekly-analytics-digest-monday-morning': {
        'task': 'apps.analytics.tasks.send_weekly_summary_email_task',
        'schedule': crontab(hour=8, minute=0, day_of_week=1), # Every Monday at 8:00 AM
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
