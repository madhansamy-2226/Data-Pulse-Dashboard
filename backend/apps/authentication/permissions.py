from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin_role
        )

class IsAnalystOrAdmin(BasePermission):
    """Allows access to Analyst or Admin users (e.g., uploading CSVs, generating reports)."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_analyst_role
        )

class IsViewerOrAbove(BasePermission):
    """Allows access to any authenticated user (Viewer, Analyst, Admin)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
