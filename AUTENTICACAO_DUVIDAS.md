# ❓ Dúvidas Frequentes - Autenticação JWT Django

**Versão:** 1.0  
**Data:** Dezembro 2025  
**Objetivo:** Esclarecer dúvidas comuns sobre o sistema de autenticação JWT

---

## 📖 Índice

1. [Como o Middleware é Chamado](#como-o-middleware-é-chamado)
2. [Função do Middleware JWT](#função-do-middleware-jwt)
3. [Função do auth.js](#função-do-authjs)
4. [Função do LoginView](#função-do-loginview)
5. [Como os Três Trabalham Juntos](#como-os-três-trabalham-juntos)
6. [Fluxos Detalhados](#fluxos-detalhados)
7. [Perguntas Específicas](#perguntas-específicas)

---

## Como o Middleware é Chamado

### Registro no `settings.py`

O middleware é registrado na lista `MIDDLEWARE` em `settings.py`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # ⭐ NOSSO MIDDLEWARE
    'core.middleware.JWTAuthenticationMiddleware',
]
```

### Inicialização

Quando Django inicia (startup):

```
Django lê MIDDLEWARE
    ↓
Importa 'core.middleware.JWTAuthenticationMiddleware'
    ↓
Cria instância: JWTAuthenticationMiddleware(get_response)
    ↓
__init__ é chamado UMA VEZ
    ↓
Salva self.get_response e JWTAuthentication()
```

### Execução

Para **cada requisição HTTP**:

```
Requisição chega ao Django
    ↓
Passa pela cadeia de middlewares (de cima para baixo)
    ↓
Chega no JWTAuthenticationMiddleware.__call__(request)
    ↓
Valida token
    ↓
Chama self.get_response(request)  ← passa para próximo middleware
    ↓
Eventualmente chega na view
    ↓
View retorna resposta
    ↓
Resposta volta pela cadeia (de baixo para cima)
```

### Estrutura em "Cebola"

```
┌─────────────────────────────────────────┐
│  Requisição HTTP                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  SecurityMiddleware                     │
└────────────┬────────────────────────────┘
             │ self.get_response()
             ▼
┌─────────────────────────────────────────┐
│  SessionMiddleware                      │
└────────────┬────────────────────────────┘
             │ self.get_response()
             ▼
┌─────────────────────────────────────────┐
│  CsrfMiddleware                         │
└────────────┬────────────────────────────┘
             │ self.get_response()
             ▼
┌─────────────────────────────────────────┐
│  JWTAuthenticationMiddleware ⭐          │
│  ✅ Valida token                        │
│  ✅ Define request.user                 │
└────────────┬────────────────────────────┘
             │ self.get_response()
             ▼
┌─────────────────────────────────────────┐
│  View (dashboard, API, etc)             │
└────────────┬────────────────────────────┘
             │ Resposta
             ▼
┌─────────────────────────────────────────┐
│  Resposta volta pela cadeia (de baixo)  │
└─────────────────────────────────────────┘
```

---

## Função do Middleware JWT

### Responsabilidades

```python
class JWTAuthenticationMiddleware:
    """
    ✅ RESPONSÁVEL POR:
    1. Interceptar TODA requisição HTTP
    2. Verificar se é rota pública ou protegida
    3. Extrair token JWT (header ou cookie)
    4. Validar token com JWTAuthentication
    5. Definir request.user se válido
    6. Redirecionar para /login/ se inválido
    
    ❌ NÃO RESPONSÁVEL POR:
    1. Validar credenciais (LoginView faz)
    2. Gerar tokens (LoginView faz)
    3. Armazenar tokens (JavaScript faz)
    4. Decidir lógica de negócio
    """
```

### Código Anotado

```python
def __call__(self, request):
    # 1. DEFINE ROTAS PÚBLICAS (não precisam autenticação)
    public_paths = [
        '/login/',              # Página de login
        '/api/login/',          # API de login
        '/api/registro/',       # API de registro
        '/static/',             # Arquivos estáticos
        '/media/'               # Mídia (uploads)
    ]
    
    # 2. SE FOR ROTA PÚBLICA, PASSA DIRETO
    if any(request.path.startswith(path) for path in public_paths):
        # ✅ Rota pública → não valida token
        return self.get_response(request)
    
    # 3. ROTA PROTEGIDA → precisa validar token
    is_authenticated = False
    
    # 4. TENTA VIA HEADER Authorization
    # Usado por requisições AJAX (fetch com auth.js)
    try:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        # Exemplo: "Bearer eyJ0eXAiOiJKV1QiLC..."
        
        if auth_header.startswith('Bearer '):
            # Remove "Bearer " e pega o token
            token = auth_header.split(' ')[1]
            
            # Valida token JWT
            validated_token = self.jwt_authentication.get_validated_token(token)
            
            # Extrai usuário do token
            user = self.jwt_authentication.get_user(validated_token)
            
            # Se usuário válido e ativo
            if user and user.is_authenticated:
                # ⭐ Define request.user para a view
                request.user = user
                is_authenticated = True
    except (InvalidToken, TokenError, Exception):
        pass  # Token inválido, tenta próximo método
    
    # 5. TENTA VIA COOKIE
    # Usado por navegação normal (GET /dashboard/)
    # Browsers enviam cookies automaticamente
    if not is_authenticated:
        try:
            # Extrai token do cookie
            token = request.COOKIES.get('access_token')
            
            if token:
                # Valida token JWT
                validated_token = self.jwt_authentication.get_validated_token(token)
                
                # Extrai usuário
                user = self.jwt_authentication.get_user(validated_token)
                
                # Se válido
                if user and user.is_authenticated:
                    # ⭐ Define request.user
                    request.user = user
                    is_authenticated = True
        except (InvalidToken, TokenError, Exception):
            pass
    
    # 6. SE NÃO CONSEGUIU AUTENTICAR
    if not is_authenticated:
        if request.path.startswith('/api/'):
            # API: retorna JSON 401
            return JsonResponse({
                'detail': 'Token inválido ou não fornecido'
            }, status=401)
        else:
            # Página HTML: redireciona para login
            return redirect('/login/')
    
    # 7. AUTENTICAÇÃO OK → passa para próxima camada
    return self.get_response(request)
```

### Exemplos de Execução

**Exemplo 1: GET /dashboard/ com cookie válido**

```
Requisição: GET /dashboard/
Cookies: access_token=eyJ0eXAiOi...

Middleware:
├─ /dashboard/ é pública? NÃO
├─ Header Authorization? NÃO
├─ Cookie access_token? SIM!
├─ Token válido? SIM!
├─ request.user = usuário autenticado ✅
└─ return self.get_response(request)

Resultado: Dashboard carrega
```

**Exemplo 2: POST /api/dados/ com header válido**

```
Requisição: POST /api/dados/
Header: Authorization: Bearer eyJ0eXAiOi...

Middleware:
├─ /api/dados/ é pública? NÃO
├─ Header Authorization? SIM!
├─ Token válido? SIM!
├─ request.user = usuário autenticado ✅
└─ return self.get_response(request)

Resultado: API retorna dados
```

**Exemplo 3: GET /dashboard/ SEM token**

```
Requisição: GET /dashboard/
Headers: (nenhum token)

Middleware:
├─ /dashboard/ é pública? NÃO
├─ Header Authorization? NÃO
├─ Cookie access_token? NÃO
├─ is_authenticated = False
├─ request.path.startswith('/api/')? NÃO
└─ return redirect('/login/')

Resultado: Redireciona para login
```

---

## Função do `auth.js`

### Responsabilidades

```javascript
/**
 * ✅ RESPONSÁVEL POR:
 * 1. Interceptar requisições fetch()
 * 2. Adicionar token ao header Authorization
 * 3. Verificar autenticação ao carregar página
 * 4. Fazer logout e remover tokens
 * 5. Redirecionar se não autenticado
 *
 * ❌ NÃO RESPONSÁVEL POR:
 * 1. Validar credenciais (LoginView faz)
 * 2. Bloquear acesso a rotas (Middleware faz)
 * 3. Gerar tokens (LoginView faz)
 * 4. Armazenar em banco de dados
 */
```

### Código Anotado

```javascript
// 1. SALVA A FUNÇÃO fetch ORIGINAL DO BROWSER
const originalFetch = window.fetch;

// 2. SOBRESCREVE fetch PARA INTERCEPTAR
window.fetch = function(...args) {
    const [resource, config] = args;
    const resourceStr = typeof resource === 'string' ? resource : resource.url;
    
    // 3. LISTA DE ROTAS PÚBLICAS (não precisam token)
    const publicRoutes = [
        '/login/',
        '/api/login/',
        '/api/registro/'
    ];
    
    // 4. VERIFICA SE É ROTA PÚBLICA
    const isPublicRoute = publicRoutes.some(route => 
        resourceStr.includes(route)
    );
    
    // 5. SE NÃO FOR ROTA PÚBLICA
    if (!isPublicRoute) {
        // 6. LÊ TOKEN DE localStorage
        const token = localStorage.getItem('access_token');
        
        // 7. SE TEM TOKEN
        if (token) {
            // 8. CRIA CONFIG COM HEADER Authorization
            const newConfig = {
                ...config,
                headers: {
                    ...(config?.headers || {}),
                    'Authorization': `Bearer ${token}`  // ⭐ ADICIONA TOKEN
                }
            };
            // 9. FAZ REQUISIÇÃO COM TOKEN
            return originalFetch(resource, newConfig);
        }
    }
    
    // 10. PARA ROTAS PÚBLICAS, FAZ SEM MODIFICAÇÃO
    return originalFetch(...args);
};

// 11. VERIFICAÇÃO AO CARREGAR PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login/';
    
    // Se não está em /login/
    if (!isLoginPage) {
        const token = localStorage.getItem('access_token');
        
        // E não tem token
        if (!token) {
            // Redireciona para login (lado do cliente)
            window.location.href = '/login/';
        }
    }
});

// 12. FUNÇÃO DE LOGOUT
async function logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
        if (refreshToken) {
            // Notifica servidor
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
        console.error('Erro ao fazer logout:', error);
    }
    
    // Remove tokens do cliente
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'access_token=; path=/; max-age=0;';
    
    // Redireciona para login
    window.location.href = '/login/';
}
```

### Exemplos de Interceptação

**Exemplo 1: Requisição AJAX com auth.js**

```javascript
// Sem auth.js (❌ não funciona):
fetch('/api/dados/')  // Token não enviado

// Com auth.js (✅ funciona):
fetch('/api/dados/')  // auth.js adiciona header automaticamente
// Transforma em:
fetch('/api/dados/', {
    headers: {
        'Authorization': 'Bearer eyJ0eXAiOi...'
    }
})
```

**Exemplo 2: Logout**

```javascript
// Usuário clica botão "Sair"
logout()
    ├─ POST /api/logout/ (notifica servidor)
    ├─ localStorage.removeItem('access_token')
    ├─ localStorage.removeItem('refresh_token')
    ├─ document.cookie = ... (remove cookie)
    └─ window.location.href = '/login/'

Resultado: Usuário redireciona para login
```

---

## Função do `LoginView`

### Responsabilidades

```python
class LoginView(APIView):
    """
    ✅ RESPONSÁVEL POR:
    1. Receber email + senha do cliente
    2. Validar credenciais no banco de dados
    3. Verificar se usuário está ativo
    4. Gerar tokens JWT
    5. Retornar tokens ao cliente
    
    ❌ NÃO RESPONSÁVEL POR:
    1. Validar token (Middleware faz)
    2. Verificar autorização em rotas (Middleware faz)
    3. Armazenar token (JavaScript faz)
    4. Fazer logout (LogoutView faz)
    """
```

### Código Anotado

```python
class LoginView(APIView):
    # 1. NÃO REQUER AUTENTICAÇÃO (rota pública)
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 2. RECEBE DADOS DO CLIENTE
        # Espera: { "email": "...", "senha": "..." }
        
        # 3. SERIALIZER VALIDA OS DADOS
        serializer = LoginSerializer(data=request.data)
        
        # 4. SE DADOS SÃO VÁLIDOS
        if serializer.is_valid():
            # 5. serializer.validated_data retorna usuário
            # (LoginSerializer já verificou email + senha no banco)
            user = serializer.validated_data
            
            # 6. GERA TOKENS JWT PARA ESTE USUÁRIO
            refresh = RefreshToken.for_user(user)
            
            # 7. RETORNA TOKENS EM JSON
            return Response({
                'user': UsuarioSerializer(user).data,
                'refresh': str(refresh),              # Token 7 dias
                'access': str(refresh.access_token),  # Token 1 hora
            }, status=status.HTTP_200_OK)
        
        # 8. SE DADOS INVÁLIDOS, RETORNA ERRO
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### Fluxo Interno

```
POST /api/login/
Body: { "email": "user@ex.com", "senha": "123456" }
    │
    ▼
LoginView.post(request)
    │
    ├─ LoginSerializer(data=request.data)
    │   │
    │   ├─ Valida: email é um email válido?
    │   ├─ Busca: usuário existe no banco?
    │   ├─ Verifica: senha bate com hash?
    │   ├─ Verifica: usuário está ativo?
    │   │
    │   └─ Se tudo OK → serializer.validated_data = usuário
    │
    ├─ RefreshToken.for_user(user)
    │   └─ Gera dois tokens JWT:
    │       ├─ access_token (validade: 1 hora)
    │       └─ refresh_token (validade: 7 dias)
    │
    └─ Response com tokens

HTTP 200 OK
{
    "user": {
        "id": 1,
        "email": "user@ex.com",
        "nome": "Usuário",
        "role": "user"
    },
    "access": "eyJ0eXAiOiJKV1QiLC...",
    "refresh": "eyJ0eXAiOiJKV1QiLC..."
}
```

---

## Como os Três Trabalham Juntos

### Cenário Completo: Login e Acesso ao Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUÁRIO ACESSA login.html                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. PREENCHE FORMULÁRIO E CLICA "ENTRAR"                 │
│    Email: user@example.com                              │
│    Senha: 123456                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. LOGIN.HTML - JAVASCRIPT FAZ POST                     │
│    fetch('/api/login/', {                               │
│        method: 'POST',                                  │
│        body: { email, senha }                          │
│    })                                                   │
│                                                         │
│    Note: auth.js NÃO intercepta                         │
│    (porque /api/login/ é rota pública)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. MIDDLEWARE JWT VERIFICA                              │
│    ├─ /api/login/ é pública? SIM                        │
│    ├─ Deixa passar (não valida token)                   │
│    └─ Passa para próxima camada                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. LOGINVIEW VALIDA CREDENCIAIS                         │
│    ├─ LoginSerializer valida dados                      │
│    ├─ Busca usuário no banco                            │
│    ├─ Verifica senha                                    │
│    ├─ Gera tokens JWT                                   │
│    └─ Retorna JSON com tokens                           │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP 200 com tokens
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. LOGIN.HTML - RECEBE RESPOSTA                         │
│    data = {                                             │
│        "access": "eyJ0eXAiOi...",                      │
│        "refresh": "eyJ0eXAiOi..."                      │
│    }                                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 7. LOGIN.HTML - ARMAZENA TOKENS                         │
│    localStorage.setItem('access_token', data.access)   │
│    localStorage.setItem('refresh_token', data.refresh) │
│    document.cookie = `access_token=${data.access}`     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 8. LOGIN.HTML - REDIRECIONA                             │
│    window.location.href = '/dashboard/'                │
└────────────────┬────────────────────────────────────────┘
                 │ GET /dashboard/
                 │ (navegação normal do browser)
                 │ Browser envia cookie automaticamente
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 9. MIDDLEWARE JWT VALIDA                                │
│    ├─ /dashboard/ é pública? NÃO                        │
│    ├─ Header Authorization? NÃO                         │
│    ├─ Cookie access_token? SIM!                         │
│    ├─ Token válido? SIM!                                │
│    ├─ request.user = usuário ✅                         │
│    └─ return self.get_response(request)                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 10. DASHBOARD VIEW EXECUTA                              │
│     def dashboard(request):  # request.user já existe!  │
│         return render(request, 'dashboard.html')        │
└────────────────┬────────────────────────────────────────┘
                 │ Retorna HTML
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 11. NAVEGADOR RENDERIZA DASHBOARD ✅                     │
│     Página carrega com sucesso!                         │
│                                                         │
│     <script src="auth.js"></script> ⭐                  │
│     (auth.js está ativo nesta página)                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 12. USUÁRIO CLICA EM BOTÃO "CARREGAR DADOS"            │
│     fetch('/api/dados/')                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 13. AUTH.JS INTERCEPTA                                  │
│     ├─ /api/dados/ é pública? NÃO                       │
│     ├─ Lê token de localStorage ✅                      │
│     ├─ Adiciona ao header: Authorization: Bearer...     │
│     └─ fetch('/api/dados/', { headers: ... })          │
└────────────────┬────────────────────────────────────────┘
                 │ fetch com header Authorization
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 14. MIDDLEWARE JWT VALIDA                               │
│     ├─ Header Authorization? SIM!                       │
│     ├─ Token válido? SIM!                               │
│     ├─ request.user = usuário ✅                        │
│     └─ return self.get_response(request)               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 15. API VIEW RETORNA DADOS                              │
│     def dados(request):  # request.user = autenticado   │
│         return Response({'dados': '...'})  ✅            │
└────────────────┬────────────────────────────────────────┘
                 │ JSON com dados
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 16. JAVASCRIPT NO DASHBOARD RECEBE DADOS ✅              │
│     .then(response => response.json())                  │
│     .then(data => console.log(data))                    │
└─────────────────────────────────────────────────────────┘
```

---

## Fluxos Detalhados

### Fluxo 1: Navegação Normal GET (com Cookie)

```
Navegador GET /dashboard/
├─ Cookies: access_token=eyJ0eXAiOi...

Middleware:
├─ Verifica header Authorization
│  └─ ❌ NÃO TEM (GET normal não envia headers)
│
└─ Verifica cookie
   └─ ✅ SIM! access_token=eyJ0eXAiOi...
      └─ Valida token
         └─ ✅ Válido
            └─ request.user = usuário

Resultado: Página carrega
```

### Fluxo 2: Requisição AJAX POST (com auth.js)

```
JavaScript:
fetch('/api/dados/', {
    method: 'POST',
    body: JSON.stringify({...})
})

auth.js intercepta:
├─ /api/dados/ é pública? NÃO
├─ Lê token de localStorage
└─ Adiciona header: Authorization: Bearer eyJ0eXAiOi...

Requisição enviada com header

Middleware:
├─ Verifica header Authorization
│  └─ ✅ SIM! "Bearer eyJ0eXAiOi..."
│     └─ Valida token
│        └─ ✅ Válido
│           └─ request.user = usuário

Resultado: API retorna dados
```

### Fluxo 3: Login (Rota Pública)

```
JavaScript:
fetch('/api/login/', {
    method: 'POST',
    body: { email, senha }
})

auth.js intercepta?
├─ /api/login/ é pública? SIM
└─ NÃO adiciona header (não precisa token)

Requisição enviada sem header

Middleware:
├─ /api/login/ é pública? SIM
└─ PASSA DIRETO (não valida token)

LoginView:
├─ Valida email + senha
├─ Gera tokens
└─ Retorna JSON com tokens

Resultado: Cliente recebe tokens
```

---

## Perguntas Específicas

### P: Por que o middleware precisa de dois métodos (`__init__` e `__call__`)?

**R:** Padrão do Django:

```python
class ExemploMiddleware:
    # __init__: Chamado UMA VEZ ao iniciar
    def __init__(self, get_response):
        self.get_response = get_response
        # Usar para inicializações caras (conexões, configurações)
    
    # __call__: Chamado PARA CADA REQUISIÇÃO
    def __call__(self, request):
        # Lógica que precisa rodar em cada requisição
        return self.get_response(request)
```

**Analogia:**
- `__init__` = Treinar segurança da portaria (1x ao dia)
- `__call__` = Segurança verificar pessoa (centenas de vezes)

---

### P: E se o token expirar durante o uso?

**R:** Dois cenários:

**Navegação normal:**
```
Usuário está no dashboard
Token expira (após 1 hora)
Usuário tenta acessar /perfil/

Middleware:
├─ Lê cookie com token expirado
├─ Tenta validar
└─ ❌ Token expirado → InvalidToken exception
└─ Redireciona para /login/

Resultado: Usuário faz login novamente
```

**AJAX (requisição fetch):**
```
Usuário faz fetch('/api/dados/')
auth.js adiciona token expirado

Middleware:
├─ ❌ Token expirado
└─ Retorna HTTP 401

JavaScript:
├─ Detecta 401
├─ Remove tokens
└─ Redireciona para /login/

Resultado: Usuário faz login novamente
```

---

### P: Auth.js adiciona token a requisições para `/login/`?

**R:** NÃO! Porque `/login/` está na lista de rotas públicas:

```javascript
const publicRoutes = [
    '/login/',          // ← aqui
    '/api/login/',
    '/api/registro/'
];

const isPublicRoute = publicRoutes.some(route => 
    resourceStr.includes(route)
);

if (!isPublicRoute) {  // Se NÃO é pública
    // Adiciona token
}

// Para /api/login/ → É pública → NÃO adiciona token
```

---

### P: Por que usar tanto localStorage quanto cookie?

**R:** Dois métodos diferentes:

**localStorage:**
- Acessível por JavaScript
- Usado por auth.js em requisições AJAX
- Pode ser roubado por XSS
- Persiste entre abas/sessions

**Cookie:**
- Enviado automaticamente pelo browser
- Usado por middleware em navegação normal
- Pode ter flags HttpOnly (seguro contra XSS)
- Persiste conforme configuração

**Combinação:**
- localStorage para AJAX
- Cookie para navegação normal
- Mais robusto e flexível

---

### P: Posso remover o cookie e usar apenas localStorage?

**R:** Não recomendado. Problema:

```
Usuário acessa /dashboard/

Middleware tenta:
├─ Header Authorization? NÃO
├─ Cookie? NÃO (você removeu)
└─ request.user = AnonymousUser
└─ Redireciona para /login/

Resultado: Usuário perde sessão a cada página!
```

Mantenha ambos.

---

### P: O middleware passa para a próxima camada automaticamente?

**R:** Só se você chamar `self.get_response(request)`:

```python
class MeuMiddleware:
    def __call__(self, request):
        # ... sua lógica ...
        
        # ⭐ SEM ISTO, proxima camada não é chamada!
        return self.get_response(request)  
```

Se esquecer, requisição fica pendurada.

---

### P: Posso ter lógica diferente antes e depois da view?

**R:** Sim! O middleware envolve a view:

```python
class MeuMiddleware:
    def __call__(self, request):
        # ===== ANTES DA VIEW =====
        print("Antes da view")
        
        # Chama próxima camada (eventualmente a view)
        response = self.get_response(request)
        
        # ===== DEPOIS DA VIEW =====
        print("Depois da view")
        
        return response
```

Útil para logging, modificar resposta, etc.

---

### P: Auth.js funciona com XMLHttpRequest ou apenas fetch?

**R:** Apenas com `fetch()`. Para XMLHttpRequest:

```javascript
// ❌ Não interceptado por auth.js
var xhr = new XMLHttpRequest();
xhr.open('GET', '/api/dados/');
xhr.send();

// ✅ Interceptado
fetch('/api/dados/');
```

Se precisa XMLHttpRequest:
```javascript
// Manualmente adicionar header
var xhr = new XMLHttpRequest();
xhr.open('GET', '/api/dados/');
xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken()}`);
xhr.send();
```

Melhor: use fetch() (moderno, mais simples com auth.js).

---

### P: Qual a ordem de execução dos middlewares?

**R:** Conforme ordem em `MIDDLEWARE`:

```python
MIDDLEWARE = [
    'Django1Middleware',      # Executa 1º
    'Django2Middleware',      # Executa 2º
    'Django3Middleware',      # Executa 3º
    'JWTAuthenticationMiddleware',  # Executa 4º ⭐
]
```

Requisição passa de 1 → 2 → 3 → 4 → View

Resposta volta de View → 4 → 3 → 2 → 1

---

### P: Posso ter múltiplos middlewares customizados?

**R:** Sim:

```python
MIDDLEWARE = [
    # ... Django middlewares ...
    'core.middleware.JWTAuthenticationMiddleware',
    'core.middleware.LoggingMiddleware',
    'core.middleware.RateLimitMiddleware',
]
```

Cada um passa para o próximo via `self.get_response()`.

---

**Última atualização:** Dezembro 2025

Esta documentação complementa os outros manuais de autenticação. Consulte conforme necessário!
