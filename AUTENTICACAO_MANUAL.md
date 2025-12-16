# 📖 Manual Completo - Sistema de Autenticação JWT com Django

**Versão:** 1.0  
**Data:** Dezembro 2025  
**Objetivo:** Implementação reprodutível de autenticação JWT com Django REST Framework

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação](#instalação)
5. [Configuração do Projeto](#configuração-do-projeto)
6. [Implementação Passo a Passo](#implementação-passo-a-passo)
7. [Estrutura de Arquivos](#estrutura-de-arquivos)
8. [Testes](#testes)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este manual descreve a implementação de um sistema robusto de autenticação JWT para uma aplicação Django com:

- ✅ Autenticação via JWT (JSON Web Tokens)
- ✅ Validação de token em middleware
- ✅ Suporte a token via header `Authorization` e cookie
- ✅ Sistema de refresh token
- ✅ Interceptor automático de requisições AJAX
- ✅ Proteção de rotas públicas e privadas
- ✅ Redirecionamento automático para login

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/JS)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ login.html  → Coleta credenciais e faz login    │   │
│  │ auth.js     → Interceptor de requisições        │   │
│  │ dashboard   → Páginas protegidas                │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬────────────────────────────────┘
                           │
                    POST /api/login/
                    GET /dashboard/ (com cookie/header)
                           │
┌──────────────────────────▼────────────────────────────────┐
│                  MIDDLEWARE JWT                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. Verifica se rota é pública                    │   │
│  │ 2. Extrai token (header Authorization)           │   │
│  │ 3. Extrai token (cookie)                         │   │
│  │ 4. Valida token com JWTAuthentication            │   │
│  │ 5. Define request.user se válido                 │   │
│  │ 6. Redireciona para /login/ se inválido          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬────────────────────────────────┘
                           │
                    Middleware
                 Verificação OK
                           │
┌──────────────────────────▼────────────────────────────────┐
│              VIEWS & SERIALIZERS                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ LoginView → Valida credenciais                   │   │
│  │ RegistroView → Cria novo usuário                 │   │
│  │ VerifyTokenView → Verifica token                 │   │
│  │ Dashboard, Cadastro, etc → Páginas protegidas    │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬────────────────────────────────┘
                           │
                    Token Valid
                           │
                    Renderizar página
```

---

## ✅ Pré-requisitos

### Sistema
- Python 3.8+
- pip (gerenciador de pacotes Python)
- Virtualenv (recomendado)

### Conhecimentos
- Django básico
- REST API
- JWT (conceitos)
- JavaScript (fetch API)

---

## 📦 Instalação

### 1. Criar Ambiente Virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar Dependências

```bash
pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install python-dotenv
```

### 3. requirements.txt

Crie arquivo `requirements.txt`:

```
Django==5.2.8
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.2
django-cors-headers==4.3.1
python-dotenv==1.0.0
psycopg2-binary==2.9.9
```

---

## ⚙️ Configuração do Projeto

### 1. settings.py - INSTALLED_APPS

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders',
    'core',  # seu app
]
```

### 2. settings.py - MIDDLEWARE

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'core.middleware.JWTAuthenticationMiddleware',  # ⭐ ADICIONE AQUI
]
```

### 3. settings.py - REST_FRAMEWORK

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 4. settings.py - SIMPLE_JWT

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### 5. settings.py - CORS

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

### 6. settings.py - AUTENTICAÇÃO

```python
AUTH_USER_MODEL = 'core.Usuario'  # Se usar modelo customizado
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/login/'
```

---

## 🚀 Implementação Passo a Passo

### PASSO 1: Criar Modelo de Usuário

**Arquivo:** `core/models.py`

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    """Modelo customizado de usuário"""
    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=[('admin', 'Admin'), ('user', 'Usuário')],
        default='user'
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nome']
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
    
    def __str__(self):
        return f"{self.nome} ({self.email})"
```

### PASSO 2: Criar Serializers

**Arquivo:** `core/serializers.py`

```python
from rest_framework import serializers
from .models import Usuario

class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuários"""
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        email = data.get('email')
        senha = data.get('senha')
        
        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError(
                "Credenciais inválidas ou usuário não encontrado."
            )
        
        if not user.check_password(senha):
            raise serializers.ValidationError("Credenciais inválidas.")
        
        if not user.is_active:
            raise serializers.ValidationError(
                "Sua conta está inativa. Aguarde aprovação."
            )
        
        return user

class RegistroSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários"""
    senha = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome', 'senha', 'role']

    def create(self, validated_data):
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            nome=validated_data['nome'],
            password=validated_data['senha'],
            role=validated_data.get('role', 'user')
        )
        user.is_active = False  # Requer aprovação
        user.save()
        return user

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para dados do usuário"""
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome', 'role', 'criado_em']
        read_only_fields = ['id', 'criado_em']
```

### PASSO 3: Criar Views de Autenticação

**Arquivo:** `core/views.py`

```python
from django.shortcuts import render, redirect
from django.http import JsonResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .serializers import (
    LoginSerializer, 
    RegistroSerializer, 
    UsuarioSerializer
)
from .models import Usuario

# ==========================================
# VIEWS DE PÁGINAS PROTEGIDAS
# ==========================================

def dashboard(request):
    """Dashboard - protegido pelo middleware"""
    return render(request, 'dashboard.html')

def cadastro_pf(request):
    """Cadastro de Pessoa Física"""
    return render(request, 'cadastro_pf.html')

def cadastro_pj(request):
    """Cadastro de Pessoa Jurídica"""
    return render(request, 'cadastro_pj.html')

def listar_pf(request):
    """Listagem de Pessoas Físicas"""
    return render(request, 'listar_pf.html')

def listar_pj(request):
    """Listagem de Pessoas Jurídicas"""
    return render(request, 'listar_pj.html')

def pagina_login(request):
    """Página de login"""
    return render(request, 'login.html')

def pagina_registro(request):
    """Página de registro"""
    return render(request, 'registro.html')

# ==========================================
# VIEWS DE API - AUTENTICAÇÃO
# ==========================================

class LoginView(APIView):
    """API endpoint para login"""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            
            # Gera tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UsuarioSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegistroView(APIView):
    """API endpoint para registro"""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UsuarioSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """API endpoint para logout"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class VerifyTokenView(APIView):
    """API endpoint para verificar validade do token"""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'detail': 'Token não fornecido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        
        return Response(
            {'valid': False, 'detail': 'Token inválido ou expirado'},
            status=status.HTTP_401_UNAUTHORIZED
        )

class PerfilView(APIView):
    """API endpoint para obter perfil do usuário autenticado"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)
```

### PASSO 4: Criar Middleware JWT

**Arquivo:** `core/middleware.py`

```python
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class JWTAuthenticationMiddleware:
    """
    Middleware para validação de JWT em requisições HTTP.
    Suporta token via:
    1. Header Authorization: Bearer <token>
    2. Cookie: access_token=<token>
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authentication = JWTAuthentication()
    
    def __call__(self, request):
        # Rotas que NÃO requerem autenticação
        public_paths = [
            '/login/',
            '/cadastro/',
            '/registro/',
            '/api/login/',
            '/api/registro/',
            '/api/verify-token/',
            '/admin/',
            '/static/',
            '/media/'
        ]
        
        # Se for rota pública, passa direto
        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)
        
        # Tenta autenticar o usuário
        is_authenticated = False
        
        # 1. Verifica header Authorization (AJAX)
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                validated_token = self.jwt_authentication.get_validated_token(token)
                user = self.jwt_authentication.get_user(validated_token)
                
                if user and user.is_authenticated:
                    request.user = user
                    is_authenticated = True
        except (InvalidToken, TokenError, Exception):
            pass
        
        # 2. Verifica cookie (navegação normal)
        if not is_authenticated:
            try:
                token = request.COOKIES.get('access_token')
                if token:
                    validated_token = self.jwt_authentication.get_validated_token(token)
                    user = self.jwt_authentication.get_user(validated_token)
                    
                    if user and user.is_authenticated:
                        request.user = user
                        is_authenticated = True
            except (InvalidToken, TokenError, Exception):
                pass
        
        # Se não autenticado
        if not is_authenticated:
            if request.path.startswith('/api/'):
                # API retorna JSON 401
                return JsonResponse({
                    'detail': 'Credenciais inválidas ou expiradas. Token não fornecido.'
                }, status=401)
            else:
                # Páginas HTML redirecionam
                return redirect('/login/')
        
        return self.get_response(request)
```

### PASSO 5: Criar URLs

**Arquivo:** `core/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    # Páginas
    path('login/', views.pagina_login, name='login'),
    path('registro/', views.pagina_registro, name='registro'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('cadastro-pf/', views.cadastro_pf, name='cadastro_pf'),
    path('cadastro-pj/', views.cadastro_pj, name='cadastro_pj'),
    path('listar-pf/', views.listar_pf, name='listar_pf'),
    path('listar-pj/', views.listar_pj, name='listar_pj'),

    # API - Autenticação
    path('api/login/', views.LoginView.as_view(), name='api_login'),
    path('api/registro/', views.RegistroView.as_view(), name='api_registro'),
    path('api/logout/', views.LogoutView.as_view(), name='api_logout'),
    path('api/verify-token/', views.VerifyTokenView.as_view(), name='verify_token'),
    path('api/perfil/', views.PerfilView.as_view(), name='api_perfil'),
    
    # ViewSets
    path('api/', include(router.urls)),
]
```

### PASSO 6: Criar JavaScript de Interceptor

**Arquivo:** `core/static/core/js/auth.js`

```javascript
/**
 * auth.js - Gerenciamento de autenticação JWT
 * Intercepta requisições fetch e adiciona token JWT automaticamente
 */

// Armazena função fetch original
const originalFetch = window.fetch;

// Sobrescreve fetch com wrapper
window.fetch = function(...args) {
    const [resource, config] = args;
    const resourceStr = typeof resource === 'string' ? resource : resource.url;
    
    // Rotas que não precisam de token
    const publicRoutes = ['/login/', '/registro/', '/api/login/', '/api/registro/'];
    const isPublicRoute = publicRoutes.some(route => resourceStr.includes(route));
    
    if (!isPublicRoute) {
        const token = localStorage.getItem('access_token');
        if (token) {
            const newConfig = {
                ...config,
                headers: {
                    ...(config?.headers || {}),
                    'Authorization': `Bearer ${token}`
                }
            };
            return originalFetch(resource, newConfig);
        }
    }
    
    return originalFetch(...args);
};

/**
 * Faz logout
 */
async function logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
        if (refreshToken) {
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ refresh: refreshToken })
            });
        }
    } catch (error) {
        console.error('Erro ao fazer logout na API:', error);
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
    
    window.location.href = '/login/';
}

/**
 * Verifica se está autenticado
 */
function isAuthenticated() {
    return !!localStorage.getItem('access_token');
}

/**
 * Retorna token JWT atual
 */
function getAuthToken() {
    return localStorage.getItem('access_token');
}

/**
 * Faz requisição autenticada
 */
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('access_token');
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const response = await fetch(url, config);
    
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login/';
        return null;
    }
    
    return response;
}

// Verifica autenticação ao carregar
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login/' || currentPath === '/login';
    
    if (!isLoginPage && !currentPath.startsWith('/static/')) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/login/';
        }
    }
});

// Expõe globalmente
window.AuthAPI = {
    logout,
    isAuthenticated,
    getAuthToken,
    authenticatedFetch
};

console.log('✅ Sistema de autenticação JWT carregado');
```

### PASSO 7: Criar Template de Login

**Arquivo:** `core/templates/login.html`

```html
{% extends 'core/base.html' %}

{% block title %}Login - Sistema{% endblock %}

{% block content %}
<div class="login-container" style="max-width: 460px; margin: 5rem auto;">
    <h2 class="text-center mb-4">🔐 Login Seguro</h2>
    
    <div id="alert-container" class="mb-3"></div>
    
    <form id="loginForm">
        <div class="mb-3">
            <label class="form-label">E-mail</label>
            <input 
                type="email" 
                id="email" 
                class="form-control" 
                placeholder="seu@email.com" 
                required
            >
        </div>

        <div class="mb-3">
            <label class="form-label">Senha</label>
            <input 
                type="password" 
                id="senha" 
                class="form-control" 
                placeholder="••••••••" 
                required
            >
        </div>

        <button type="submit" class="btn btn-primary w-100">
            Entrar
        </button>
    </form>

    <p class="text-center mt-3">
        Não tem conta? 
        <a href="/registro/">Cadastre-se</a>
    </p>
</div>

<script>
function showAlert(msg, type = 'danger') {
    document.getElementById('alert-container').innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${msg}
        </div>
    `;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    
    try {
        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Salva tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // Salva em cookie
            document.cookie = `access_token=${data.access}; path=/; max-age=${60*60}; SameSite=Lax`;
            
            showAlert('✅ Login realizado! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard/';
            }, 1500);
        } else {
            showAlert(data.detail || 'Credenciais inválidas', 'danger');
        }
    } catch (error) {
        console.error(error);
        showAlert('Erro de conexão', 'danger');
    }
});
</script>
{% endblock %}
```

### PASSO 8: Atualizar Template Base

**Arquivo:** `core/templates/core/base.html`

Adicione o script `auth.js` antes de outros scripts:

```html
<!-- Autenticação JWT -->
<script src="{% static 'core/js/auth.js' %}"></script>

<!-- Outros scripts -->
<script src="{% static 'core/js/main.js' %}"></script>
```

### PASSO 9: Migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

### PASSO 10: Criar Superusuário

```bash
python manage.py createsuperuser
# Siga as instruções
```

---

## 📁 Estrutura de Arquivos

```
projeto/
├── core/
│   ├── migrations/
│   ├── static/
│   │   └── core/
│   │       └── js/
│   │           └── auth.js          ⭐ Interceptor JWT
│   ├── templates/
│   │   ├── core/
│   │   │   └── base.html            ⭐ Carrega auth.js
│   │   ├── login.html               ⭐ Página de login
│   │   ├── registro.html
│   │   ├── dashboard.html
│   │   ├── cadastro_pf.html
│   │   └── ... (outros templates)
│   ├── admin.py
│   ├── apps.py
│   ├── middleware.py                ⭐ JWTAuthenticationMiddleware
│   ├── models.py                    ⭐ Usuario model
│   ├── serializers.py               ⭐ Serializers
│   ├── urls.py                      ⭐ Rotas API
│   ├── views.py                     ⭐ Views e APIs
│   └── tests.py
├── gare_core/
│   ├── settings.py                  ⭐ Configurações
│   ├── urls.py                      (include core.urls)
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
├── requirements.txt
└── AUTENTICACAO_MANUAL.md
```

---

## ✅ Testes

### Teste 1: Criar Usuário

```bash
python manage.py shell
```

```python
from core.models import Usuario

user = Usuario.objects.create_user(
    email='teste@example.com',
    username='teste',
    nome='Teste User',
    password='senha123456'
)
user.is_active = True
user.save()
```

### Teste 2: Login via API

```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@example.com", "senha": "senha123456"}'
```

**Resposta esperada:**
```json
{
    "user": {
        "id": 1,
        "email": "teste@example.com",
        "nome": "Teste User",
        "role": "user",
        "criado_em": "2025-12-16T10:00:00Z"
    },
    "refresh": "eyJ...",
    "access": "eyJ..."
}
```

### Teste 3: Acessar Dashboard

1. Abra `http://localhost:8000/login/`
2. Faça login com credenciais
3. Deve redirecionar para `/dashboard/`
4. Dashboard deve carregar normalmente

### Teste 4: Testar Proteção

```bash
# Sem token - deve redirecionar
curl http://localhost:8000/dashboard/

# Com token no header
curl -H "Authorization: Bearer <token>" http://localhost:8000/dashboard/
```

### Teste 5: Verificar Token

```bash
curl -X POST http://localhost:8000/api/verify-token/ \
  -H "Content-Type: application/json" \
  -d '{"token": "<seu_token>"}'
```

---

## 🔧 Troubleshooting

### Problema 1: Erro 401 no Login

**Sintoma:** `Bad Request: /api/login/` com erro 400

**Solução:**
- Verifique se os campos enviados são `email` e `senha` (não `username`/`password`)
- Confirme que o modelo Usuario existe no banco
- Verifique se o usuario está ativo: `is_active = True`

### Problema 2: Redirecionamento não funciona

**Sintoma:** Após login, página não muda

**Solução:**
- Verifique se `auth.js` está carregado (abra console do navegador)
- Confirme que o token foi salvo em localStorage
- Verifique se o middleware está em `MIDDLEWARE`
- Limpe cache do navegador

### Problema 3: Token Expirado

**Sintoma:** Usuário precisa fazer login novamente

**Solução:**
- Aumente `ACCESS_TOKEN_LIFETIME` em `settings.py`
- Implemente refresh de token automático
- Verifique se o token não foi corrompido

### Problema 4: CORS Error

**Sintoma:** Erro de CORS na console do navegador

**Solução:**
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
```

### Problema 5: Cookie não é enviado

**Sintoma:** Middleware não consegue ler o cookie

**Solução:**
```python
# settings.py
SESSION_COOKIE_SECURE = False  # True em produção
SESSION_COOKIE_HTTPONLY = False  # True em produção
CSRF_COOKIE_SECURE = False  # True em produção
```

---

## 🔒 Segurança - Recomendações para Produção

### 1. Habilitar HTTPS

```python
# settings.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 2. Proteger Secret Key

```python
# settings.py
from decouple import config
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
```

### 3. Token Signing

```python
# settings.py
SIMPLE_JWT = {
    'SIGNING_KEY': config('JWT_SIGNING_KEY', default=SECRET_KEY),
}
```

### 4. Rate Limiting

```bash
pip install django-ratelimit
```

### 5. Validação de Senha

```python
# Exigir senhas fortes
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
]
```

---

## 📚 Endpoints da API

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/login/` | Fazer login | ❌ Não |
| POST | `/api/registro/` | Registrar novo usuário | ❌ Não |
| POST | `/api/logout/` | Fazer logout | ✅ Sim |
| POST | `/api/verify-token/` | Verificar token | ❌ Não |
| GET | `/api/perfil/` | Obter perfil do usuário | ✅ Sim |

---

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- [Django Documentation](https://docs.djangoproject.com/)
- [DRF JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django REST Framework](https://www.django-rest-framework.org/)

---

**Versão:** 1.0 | **Última atualização:** Dezembro 2025
