from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import (
    UserRegistrationSerializer,
    UserDetailSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdminRole

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint that returns Access & Refresh JWT tokens along with role and user info.
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    """
    Register a new user account with role assignment.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        responses={201: UserDetailSerializer},
        description="Register a new user account (Admin, Analyst, or Viewer)"
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "User registered successfully",
                "user": UserDetailSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )

class MeView(APIView):
    """
    Get current logged-in user profile and permissions.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserDetailSerializer})
    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

class UserListView(generics.ListAPIView):
    """
    Admin-only endpoint to inspect all registered platform users.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdminRole]
