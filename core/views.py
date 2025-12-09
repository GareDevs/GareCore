# core/views.py — VERSÃO FINAL OFICIAL (API-ONLY + JWT)

from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import RegistroSerializer, LoginSerializer, UsuarioSerializer
from .models import Usuario

# ------------------------
# PÁGINAS ESTÁTICAS (sem @login_required!)
# ------------------------
# Seu frontend vai proteger essas rotas com JS verificando o token

def dashboard(request):
    return render(request, 'dashboard.html')

def cadastro_pf(request):
    return render(request, 'cadastro_pf.html')

def cadastro_pj(request):
    return render(request, 'cadastro_pj.html')

def listar_pf(request):
    return render(request, 'listar_pf.html')

def listar_pj(request):
    return render(request, 'listar_pj.html')

def fotos(request):
    return render(request, 'fotos.html')

def arvore(request):
    return render(request, 'arvore.html')

# Página inicial (login)
def index(request):
    return render(request, 'login.html')  # você vai criar essa página


# ------------------------
# API DE AUTENTICAÇÃO
# ------------------------

class RegistroView(APIView):
    authentication_classes = []  # permite acesso sem token
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UsuarioSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UsuarioSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class PerfilView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


# ------------------------
# CRUD de Usuários (só admin)
# ------------------------

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_admin', False)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]  # permite registro
        return [permissions.IsAuthenticated(), IsAdminUser()]