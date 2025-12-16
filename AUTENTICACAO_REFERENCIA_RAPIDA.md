# 📚 Referência Rápida - Autenticação JWT Django

---

## ⚡ Quick Start

### 1. Instalar
```bash
pip install djangorestframework djangorestframework-simplejwt django-cors-headers
```

### 2. Configurar settings.py
```python
INSTALLED_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    # ... outras
    'corsheaders.middleware.CorsMiddleware',
    'core.middleware.JWTAuthenticationMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

### 3. Criar Views
```python
class LoginView(APIView):
    def post(self, request):
        # Validar credenciais
        # Gerar tokens
        return Response({'access': token, 'refresh': refresh})
```

### 4. Criar Middleware
```python
class JWTAuthenticationMiddleware:
    # Validar token em cada requisição
```

### 5. Criar auth.js
```javascript
// Adicionar token a requisições automaticamente
```

---

## 📝 Snippets

### Gerar Token para Usuário
```python
from rest_framework_simplejwt.tokens import RefreshToken

user = Usuario.objects.get(email='user@example.com')
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
refresh_token = str(refresh)
```

### Validar Token
```python
from rest_framework_simplejwt.authentication import JWTAuthentication

jwt_auth = JWTAuthentication()
validated_token = jwt_auth.get_validated_token(token)
user = jwt_auth.get_user(validated_token)
```

### Proteger View
```python
@permission_classes([IsAuthenticated])
def minha_view(request):
    user = request.user
    return Response({'usuario': user.nome})
```

### Login Frontend
```javascript
const res = await fetch('/api/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
});
const data = await res.json();
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

### Requisição Autenticada
```javascript
// Com auth.js, automático:
fetch('/api/dados/').then(r => r.json());

// Sem auth.js:
fetch('/api/dados/', {
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
}).then(r => r.json());
```

### Logout
```javascript
await fetch('/api/logout/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh })
});
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
```

---

## 🔑 Endpoints Padrão

| Método | URL | Descrição |
|--------|-----|-----------|
| POST | `/api/login/` | Fazer login |
| POST | `/api/registro/` | Registrar |
| POST | `/api/logout/` | Fazer logout |
| POST | `/api/token/refresh/` | Renovar token |
| POST | `/api/verify-token/` | Verificar token |
| GET | `/api/perfil/` | Perfil do usuário |

---

## 🗂️ Estrutura de Arquivos Mínima

```
projeto/
├── core/
│   ├── middleware.py        # JWTAuthenticationMiddleware
│   ├── models.py            # Usuario model
│   ├── serializers.py       # Serializers
│   ├── views.py             # APIs
│   ├── urls.py              # Rotas
│   ├── static/
│   │   └── js/auth.js       # Interceptor
│   └── templates/
│       ├── login.html       # Página de login
│       └── base.html        # Carrega auth.js
├── projeto/
│   └── settings.py          # Configurações
└── manage.py
```

---

## 🔐 Headers HTTP

### Requisição com Token
```
GET /api/perfil/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Resposta de Login
```
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJh...; Path=/; SameSite=Lax
Content-Type: application/json

{
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
}
```

---

## 🧪 Testes com cURL

### Login
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","senha":"123456"}'
```

### Usar Token
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/perfil/
```

### Refresh Token
```bash
REFRESH="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d "{\"refresh\":\"$REFRESH\"}"
```

---

## 📊 Fluxo Simplificado

```
LOGIN
  ↓
POST /api/login/ com credenciais
  ↓
Recebe access_token + refresh_token
  ↓
Salva em localStorage + cookie
  ↓
Redireciona para /dashboard/
  ↓
Middleware valida token
  ↓
Dashboard carrega ✅
  ↓
Requisições AJAX incluem token automaticamente
  ↓
LOGOUT
  ↓
POST /api/logout/
  ↓
Remove tokens
  ↓
Redireciona para /login/
```

---

## 🔧 Variáveis de Ambiente (.env)

```bash
# .env
SECRET_KEY=sua_secret_key_aqui
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_SECRET=sua_jwt_secret_aqui
ACCESS_TOKEN_LIFETIME=3600  # segundos
REFRESH_TOKEN_LIFETIME=604800  # 7 dias

# Database
DB_NAME=seu_banco
DB_USER=usuario
DB_PASSWORD=senha
DB_HOST=localhost
DB_PORT=5432
```

---

## 🐛 Debug

```python
# Em views.py
import logging
logger = logging.getLogger(__name__)

logger.debug(f"User: {request.user}")
logger.error(f"Error: {str(e)}")
```

```javascript
// Em console do navegador
console.log('Token:', localStorage.getItem('access_token'));
console.log('Cookies:', document.cookie);
console.log('Auth API:', window.AuthAPI);
```

---

## 📱 Ciclo de Vida do Token

```
00:00 ────────────── Login
      token criado (válido por 1h)
      |
01:00 ────────────── Token expira
      |
      POST /api/token/refresh/
      novo token gerado
      |
02:00 ────────────── Novo token expira
      |
      POST /api/token/refresh/
      ...

OBS: Refresh token dura 7 dias
Após 7 dias → fazer login novamente
```

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências
- [ ] Adicionar INSTALLED_APPS
- [ ] Adicionar MIDDLEWARE
- [ ] Configurar REST_FRAMEWORK
- [ ] Configurar SIMPLE_JWT
- [ ] Criar Usuario model
- [ ] Criar serializers
- [ ] Criar views (LoginView, etc)
- [ ] Criar middleware JWT
- [ ] Criar auth.js
- [ ] Criar login.html
- [ ] Adicionar auth.js em base.html
- [ ] Testar login
- [ ] Testar acesso a rotas protegidas
- [ ] Testar logout
- [ ] Testar refresh token
- [ ] Documentar (este manual!)

---

## 🎓 Conceitos Chave

### JWT (JSON Web Token)
Formato: `header.payload.signature`
- **Header:** tipo de token e algoritmo
- **Payload:** dados do usuário
- **Signature:** validação

### Access Token
- Curta duração (1 hora)
- Usado em requisições autenticadas
- Validado pelo servidor

### Refresh Token
- Longa duração (7 dias)
- Usado para renovar access token
- Não é usado em requisições normais

### Middleware
Intercepta TODAS as requisições
Antes de chegar na view
Valida autenticação

### Interceptor (fetch)
Modifica requisições do cliente
Adiciona token automaticamente
Poupa código repetitivo

---

## 🌐 Fluxo de Produção

```
CLIENTE (Navegador)
    ↓
LOGIN FORM
    ↓
fetch POST /api/login/
    ↓
SERVIDOR (Django)
    ↓
LoginView
    ↓
Valida credenciais
    ↓
Gera JWT tokens
    ↓
Retorna tokens
    ↓
CLIENTE salva tokens
    ↓
Requisições posteriores
    ↓
Middleware valida
    ↓
Views processam
    ↓
Resposta ao cliente
```

---

## 📞 Recursos

- [Django Rest Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Docs](https://docs.djangoproject.com/)
- [JWT.io](https://jwt.io/)
- [MDN Web Docs - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## 💾 Arquivos Essenciais

```
1. settings.py - Configurações
2. urls.py - Rotas
3. views.py - Lógica de negócio
4. serializers.py - Validação de dados
5. models.py - Banco de dados
6. middleware.py - Interceptação de requisições
7. auth.js - Frontend
8. login.html - Página de login
9. base.html - Template base
```

---

**Mantenha este documento à mão durante desenvolvimento! 📖**

Última atualização: Dezembro 2025
