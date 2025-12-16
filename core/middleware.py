# core/middleware.py
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authentication = JWTAuthentication()
    
    def __call__(self, request):
        # Lista de rotas que não requerem autenticação
        public_paths = [
            '/login/',
            '/cadastro/', 
            '/registro/',
            '/api/token/',
            '/api/login/',
            '/api/registro/',
            '/api/verify-token/',
            '/admin/',
            '/static/',
            '/media/'
        ]
        
        # Se for uma rota pública, não faz a verificação
        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)
        
        # Tenta autenticar com o token JWT
        is_authenticated = False
        
        # 1. Tenta pelo header Authorization (para AJAX)
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
        
        # 2. Se não autenticado, tenta pelo cookie (para navegação normal)
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
        
        # Se não autenticado, redireciona
        if not is_authenticated:
            if request.path.startswith('/api/'):
                # API endpoints retornam 401 JSON
                return JsonResponse({
                    'detail': 'Credenciais inválidas ou expiradas. Token não fornecido.'
                }, status=401)
            else:
                # Páginas HTML redirecionam para login
                from django.shortcuts import redirect
                return redirect('/login/')
        
        return self.get_response(request)