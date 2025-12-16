# 🎯 Guia Prático - Casos de Uso e Exemplos

---

## 📌 Casos de Uso Comuns

### 1️⃣ Usuário faz Login e acessa Dashboard

```
┌─────────────────────────────────────────┐
│ 1. Usuário acessa http://localhost:8000/login/
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 2. Vê formulário de login               │
│    - Email input                        │
│    - Senha input                        │
│    - Botão "Entrar"                     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 3. Clica no botão "Entrar"              │
│    JavaScript faz:                      │
│    POST /api/login/                     │
│    { "email": "...", "senha": "..." }   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 4. Servidor retorna:                    │
│    {                                    │
│      "access": "eyJ...",               │
│      "refresh": "eyJ...",              │
│      "user": { ... }                   │
│    }                                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 5. JavaScript salva tokens:             │
│    - localStorage.access_token          │
│    - localStorage.refresh_token         │
│    - Cookie: access_token               │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 6. Redireciona para /dashboard/         │
│    window.location.href = '/dashboard/' │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 7. Middleware intercepta requisição:    │
│    - Lê cookie: access_token            │
│    - Valida token JWT                   │
│    - Define request.user                │
│    - Passa adiante ✅                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 8. View dashboard renderiza template    │
│    Dashboard carregado com sucesso! 🎉   │
└─────────────────────────────────────────┘
```

---

### 2️⃣ Fazer Requisição AJAX Autenticada

**Antes (sem auth.js):**
```javascript
// ❌ Não funciona - sem token
fetch('/api/usuarios/')
    .then(r => r.json())
    .then(data => console.log(data));
// Resultado: 401 Unauthorized
```

**Depois (com auth.js):**
```javascript
// ✅ Funciona - token adicionado automaticamente
fetch('/api/usuarios/')
    .then(r => r.json())
    .then(data => console.log(data));

// auth.js adiciona automaticamente:
// Authorization: Bearer <token>
// Resultado: 200 OK
```

---

### 3️⃣ Fazer Logout

```javascript
// Opção 1: Usar a função global
AuthAPI.logout();
// Remove tokens, cookies e redireciona para /login/

// Opção 2: Manualmente
async function fazerLogout() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Notifica servidor
    await fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ refresh: refreshToken })
    });
    
    // Limpa cliente
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Redireciona
    window.location.href = '/login/';
}
```

---

### 4️⃣ Verificar se está Autenticado (Frontend)

```javascript
// Verificar se tem token
if (AuthAPI.isAuthenticated()) {
    console.log('✅ Usuário autenticado');
    const token = AuthAPI.getAuthToken();
    console.log('Token:', token);
} else {
    console.log('❌ Não autenticado');
    window.location.href = '/login/';
}
```

---

### 5️⃣ Proteger Rota no Backend

```python
# views.py
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dados_sensivel(request):
    """Apenas usuários autenticados podem acessar"""
    return Response({
        'mensagem': f'Olá, {request.user.nome}!',
        'dados': ['dado1', 'dado2']
    })
```

**Uso:**
```bash
# Sem token - 401
curl http://localhost:8000/api/dados-sensivel/

# Com token - 200
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/dados-sensivel/
```

---

## 💻 Exemplos de Código

### Exemplo 1: Página de Perfil Dinâmica

**HTML (template):**
```html
{% extends 'core/base.html' %}

{% block content %}
<div class="container mt-5">
    <h2>👤 Meu Perfil</h2>
    
    <div id="profile-container">
        <p class="text-muted">Carregando...</p>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/perfil/');
        if (!response.ok) throw new Error('Falha ao carregar perfil');
        
        const user = await response.json();
        
        document.getElementById('profile-container').innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5>Nome: ${user.nome}</h5>
                    <p>Email: ${user.email}</p>
                    <p>Role: ${user.role}</p>
                    <p>Membro desde: ${new Date(user.criado_em).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        document.getElementById('profile-container').innerHTML = 
            '<p class="text-danger">Erro ao carregar perfil</p>';
    }
});
</script>
{% endblock %}
```

---

### Exemplo 2: Formulário com Validação Frontend + Backend

**HTML (template):**
```html
<form id="cadastroForm">
    <div class="mb-3">
        <label class="form-label">Nome Completo</label>
        <input type="text" id="nome" class="form-control" required>
        <small id="nome-error" class="text-danger"></small>
    </div>
    
    <div class="mb-3">
        <label class="form-label">E-mail</label>
        <input type="email" id="email" class="form-control" required>
        <small id="email-error" class="text-danger"></small>
    </div>
    
    <div class="mb-3">
        <label class="form-label">Senha</label>
        <input type="password" id="senha" class="form-control" required>
        <small id="senha-error" class="text-danger"></small>
    </div>
    
    <button type="submit" class="btn btn-primary">Cadastrar</button>
</form>

<script>
document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Limpa erros anteriores
    document.querySelectorAll('[id$="-error"]').forEach(el => el.textContent = '');
    
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value
    };
    
    try {
        const response = await fetch('/api/registro/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            // Exibe erros de validação
            Object.keys(result).forEach(field => {
                const errorEl = document.getElementById(`${field}-error`);
                if (errorEl) {
                    errorEl.textContent = result[field][0] || result[field];
                }
            });
        } else {
            alert('✅ Cadastro realizado com sucesso!');
            // Salva tokens
            localStorage.setItem('access_token', result.access);
            localStorage.setItem('refresh_token', result.refresh);
            
            // Redireciona
            window.location.href = '/dashboard/';
        }
    } catch (error) {
        console.error(error);
        alert('❌ Erro ao cadastrar');
    }
});
</script>
```

---

### Exemplo 3: Interceptor Customizado

```javascript
/**
 * Cria um wrapper customizado do fetch com tratamento de erro
 */
class APIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }
    
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
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
        
        // 401 - Token expirado ou inválido
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login/';
            return null;
        }
        
        // 403 - Não autorizado
        if (response.status === 403) {
            throw new Error('Você não tem permissão para acessar este recurso');
        }
        
        // 500 - Erro do servidor
        if (response.status >= 500) {
            throw new Error('Erro no servidor. Tente novamente mais tarde.');
        }
        
        return response;
    }
    
    async get(endpoint) {
        const response = await this.request(endpoint);
        return response?.json();
    }
    
    async post(endpoint, data) {
        const response = await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response?.json();
    }
    
    async put(endpoint, data) {
        const response = await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response?.json();
    }
    
    async delete(endpoint) {
        const response = await this.request(endpoint, {
            method: 'DELETE'
        });
        return response?.json();
    }
}

// Uso
const api = new APIClient('/api');

// GET
const usuarios = await api.get('/usuarios/');

// POST
const novoUsuario = await api.post('/usuarios/', {
    nome: 'João',
    email: 'joao@example.com'
});

// PUT
const atualizado = await api.put('/usuarios/1/', {
    nome: 'João Silva'
});

// DELETE
await api.delete('/usuarios/1/');
```

---

### Exemplo 4: Proteção de Rota com Redirecionamento

```javascript
/**
 * Decorator para proteger rotas
 */
function requireAuth(route, handler) {
    return async (req, res) => {
        if (!AuthAPI.isAuthenticated()) {
            window.location.href = '/login/';
            return;
        }
        
        return handler(req, res);
    };
}

// Ou no template
{% if request.user.is_authenticated %}
    <!-- Conteúdo protegido -->
{% else %}
    <!-- Redirecionar -->
    <script>window.location.href = '/login/';</script>
{% endif %}
```

---

### Exemplo 5: Refresh Token Automático

```javascript
/**
 * Atualiza access token quando expirado
 */
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
        window.location.href = '/login/';
        return null;
    }
    
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            document.cookie = `access_token=${data.access}; path=/`;
            return data.access;
        } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login/';
            return null;
        }
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        window.location.href = '/login/';
        return null;
    }
}

// Usar quando receber 401
fetch('/api/dados/').then(async response => {
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            // Tenta novamente com novo token
            return fetch('/api/dados/', {
                headers: { 'Authorization': `Bearer ${newToken}` }
            });
        }
    }
    return response;
});
```

---

## 🧪 Testes com cURL

### Login
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "senha": "senha123456"
  }'
```

### Acessar Recurso Protegido
```bash
# Armazene o token em variável
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Use o token
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/perfil/
```

### Verificar Token
```bash
curl -X POST http://localhost:8000/api/verify-token/ \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJ0eXAi..."}'
```

### Logout
```bash
curl -X POST http://localhost:8000/api/logout/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJ0eXAi..."}'
```

---

## 📊 Fluxo de Token

```
┌────────────────────────────────────────────┐
│ 1. LOGIN - Obter tokens                    │
│    POST /api/login/                        │
│    ↓                                        │
│    Retorna: access_token, refresh_token    │
└────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│ 2. USAR - Access token válido por 1 hora   │
│    GET /api/perfil/                        │
│    Header: Authorization: Bearer <access>  │
│    ↓                                        │
│    Retorna: 200 OK                         │
└────────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ▼ (após 1 hora)                 ▼ (usuário fez logout)
┌────────────────┐            ┌─────────────┐
│ 3a. RENOVAR    │            │ 3b. LOGOUT  │
│ POST /refresh/ │            │ POST /api/  │
│ Com refresh    │            │ logout/     │
│ ↓              │            │ ↓           │
│ Novo access    │            │ Invalida   │
└────────────────┘            │ refresh    │
                             └─────────────┘
```

---

## 🔐 Checklist de Segurança

- [ ] Tokens armazenados em localStorage (frontend)
- [ ] Cookie com SameSite=Lax (proteção CSRF)
- [ ] Middleware valida token em CADA requisição
- [ ] Senhas com hash (Django faz automaticamente)
- [ ] HTTPS em produção
- [ ] Token com expiração (1 hora é bom padrão)
- [ ] Refresh token com expiração maior (7 dias)
- [ ] Endpoints privados com `@permission_classes([IsAuthenticated])`
- [ ] Rate limiting em endpoints de login
- [ ] Logs de tentativas de acesso não autorizado

---

**Última atualização:** Dezembro 2025
