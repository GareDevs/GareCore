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
        auth_error = None
        
        # 1. Tenta pelo header Authorization (para AJAX e navegação normal)
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    validated_token = self.jwt_authentication.get_validated_token(token)
                    user = self.jwt_authentication.get_user(validated_token)
                    if user and user.is_authenticated:
                        request.user = user
                        is_authenticated = True
                except (InvalidToken, TokenError) as e:
                    auth_error = f"Token inválido ou expirado no header: {str(e)}"
        except Exception as e:
            auth_error = f"Erro ao processar header Authorization: {str(e)}"
        
        # 2. Se não autenticado, tenta pelo cookie (para navegação normal)
        if not is_authenticated:
            try:
                token = request.COOKIES.get('access_token')
                if token:
                    try:
                        validated_token = self.jwt_authentication.get_validated_token(token)
                        user = self.jwt_authentication.get_user(validated_token)
                        if user and user.is_authenticated:
                            request.user = user
                            is_authenticated = True
                    except (InvalidToken, TokenError) as e:
                        auth_error = f"Token inválido ou expirado no cookie: {str(e)}"
            except Exception as e:
                auth_error = f"Erro ao processar cookie: {str(e)}"
        
        # Se não autenticado, redireciona
        if not is_authenticated:
            if request.path.startswith('/api/'):
                # API endpoints retornam 401 JSON
                return JsonResponse({
                    'detail': auth_error or 'Credenciais inválidas ou expiradas. Token não fornecido.'
                }, status=401)
            else:
                # Páginas HTML redirecionam para login
                from django.shortcuts import redirect
                print(f"[MIDDLEWARE] Redirecionando para login. Caminho: {request.path}, Erro: {auth_error}")
                return redirect('/login/')
        
        return self.get_response(request)