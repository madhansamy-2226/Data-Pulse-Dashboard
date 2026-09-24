import hashlib
from django.core.cache import cache
from django.conf import settings

CACHE_TTL = 300 # 5 minutes

def generate_cache_key(prefix: str, user_id: int, params: dict) -> str:
    """
    Generates a deterministic Redis cache key based on user and request query parameters.
    Example: salespulse:summary:1:a8f9c1b3
    """
    sorted_params = sorted(params.items())
    param_str = "_".join(f"{k}={v}" for k, v in sorted_params if v is not None)
    hash_digest = hashlib.md5(param_str.encode('utf-8')).hexdigest()[:10]
    return f"salespulse:{prefix}:{user_id}:{hash_digest}"

def invalidate_user_analytics_cache(user_id: int):
    """
    Invalidates all cached analytics queries for a given user.
    Uses pattern deletion if Redis is available, or deletes registered keys.
    """
    try:
        if hasattr(cache, 'delete_pattern'):
            # django-redis support
            cache.delete_pattern(f"*salespulse:*:{user_id}:*")
            cache.delete_pattern(f"*salespulse:*_{user_id}_*")
        else:
            # Standard cache fallback
            cache.clear()
    except Exception as e:
        # Cache clearing failure shouldn't crash transactions
        print(f"Warning: Failed to invalidate cache for user {user_id}: {e}")

def get_job_progress_cache_key(job_id: str) -> str:
    return f"import_job_{job_id}_progress"

def set_job_progress(job_id: str, progress: int, status: str, processed: int, total: int, failed: int):
    key = get_job_progress_cache_key(job_id)
    cache.set(key, {
        "job_id": job_id,
        "progress": progress,
        "status": status,
        "processed": processed,
        "total": total,
        "failed": failed
    }, timeout=3600)

def get_job_progress(job_id: str):
    key = get_job_progress_cache_key(job_id)
    return cache.get(key)
