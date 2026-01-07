# core/views.py — VERSÃO FINAL OFICIAL (API-ONLY + JWT)

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .serializers import (
    RegistroSerializer, LoginSerializer, UsuarioSerializer,
    EnderecoSerializer, ContatoEmpresaSerializer, SocioEmpresaSerializer,
    RelacionamentoSerializer, FotoSerializer
)
from .models import (
    Usuario, Endereco,
    ContatoEmpresa, SocioEmpresa, Relacionamento, Foto
)

# ------------------------
# PÁGINAS ESTÁTICAS PROTEGIDAS POR LOGIN
# Nota: Proteção é feita pelo middleware JWTAuthenticationMiddleware
# Não é necessário decorador @jwt_required nas views template
# ------------------------


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

def pagina_login(request):
    return render(request, 'login.html')

def pagina_registro(request):
    return render(request, 'registro.html')


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
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyTokenView(APIView):
    """Verifica se um token JWT é válido"""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({
                'detail': 'Token não fornecido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            
            if user and user.is_authenticated:
                return Response({
                    'valid': True,
                    'user': UsuarioSerializer(user).data
                }, status=status.HTTP_200_OK)
        except (InvalidToken, TokenError, Exception):
            pass
        
        return Response({
            'valid': False,
            'detail': 'Token inválido ou expirado'
        }, status=status.HTTP_401_UNAUTHORIZED)

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


# ========================
# VIEWSETS PARA OUTROS DADOS
# Nota: ViewSets de Pessoa estão em core/api/views/pessoa.py
# ========================


class EnderecoViewSet(viewsets.ModelViewSet):
    """CRUD completo para Endereço"""
    queryset = Endereco.objects.all()
    serializer_class = EnderecoSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class ContatoEmpresaViewSet(viewsets.ModelViewSet):
    """CRUD completo para Contato Empresa"""
    queryset = ContatoEmpresa.objects.all()
    serializer_class = ContatoEmpresaSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class SocioEmpresaViewSet(viewsets.ModelViewSet):
    """CRUD completo para Sócio Empresa"""
    queryset = SocioEmpresa.objects.all()
    serializer_class = SocioEmpresaSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class RelacionamentoViewSet(viewsets.ModelViewSet):
    """CRUD completo para Relacionamento"""
    queryset = Relacionamento.objects.all()
    serializer_class = RelacionamentoSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class FotoViewSet(viewsets.ModelViewSet):
    """CRUD completo para Foto"""
    queryset = Foto.objects.all()
    serializer_class = FotoSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


# Debug view
def debug_api(request):
    """Página de debug para testar a API"""
    return render(request, 'debug_api.html')