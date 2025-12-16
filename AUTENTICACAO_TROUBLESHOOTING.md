# 🔧 Troubleshooting e FAQ - Sistema de Autenticação

---

## 🚨 Problemas Comuns

### ❌ Problema 1: "Bad Request 400" ao fazer login

#### Sintomas
```
POST /api/login/ HTTP/1.1" 400 73
```

#### Causas Possíveis

1. **Campos incorretos**
   - Enviando `username` em vez de `email`
   - Enviando `password` em vez de `senha`

   **Solução:**
   ```javascript
   // ❌ ERRADO
   fetch('/api/login/', {
       body: JSON.stringify({ username: "user", password: "123" })
   });
   
   // ✅ CORRETO
   fetch('/api/login/', {
       body: JSON.stringify({ email: "user@example.com", senha: "123" })
   });
   ```

2. **Usuário não existe**
   - Email digitado incorretamente
   - Usuário foi deletado

   **Solução:**
   ```bash
   # Verificar usuários no banco
   python manage.py shell
   from core.models import Usuario
   Usuario.objects.all().values('email')
   ```

3. **Usuário inativo (is_active=False)**

   **Solução:**
   ```bash
   python manage.py shell
   from core.models import Usuario
   user = Usuario.objects.get(email='user@example.com')
   user.is_active = True
   user.save()
   ```

4. **Validação de senha falha**

   **Solução:**
   ```bash
   python manage.py shell
   from core.models import Usuario
   user = Usuario.objects.get(email='user@example.com')
   user.set_password('novasenha123')
   user.save()
   ```

---

### ❌ Problema 2: "401 Unauthorized" ao acessar rota protegida

#### Sintomas
```
GET /dashboard/ → Redireciona para /login/
GET /api/perfil/ → {"detail": "Credenciais inválidas..."}
```

#### Causas

1. **Token não está sendo enviado**

   **Debug:**
   ```javascript
   // Verificar token no localStorage
   console.log('Token:', localStorage.getItem('access_token'));
   
   // Verificar token no cookie
   console.log('Cookies:', document.cookie);
   ```

2. **Token expirado**

   **Solução:**
   ```javascript
   // Fazer login novamente
   // Ou implementar refresh automático
   ```

3. **Token corrompido**

   **Solução:**
   ```javascript
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');
   window.location.href = '/login/';
   ```

4. **Middleware não está ativo**

   **Verificar em settings.py:**
   ```python
   MIDDLEWARE = [
       # ... outras middlewares
       'core.middleware.JWTAuthenticationMiddleware',  # ⭐ DEVE ESTAR AQUI
   ]
   ```

---

### ❌ Problema 3: Redireciona para /login/ mesmo depois de fazer login

#### Sintomas
```
1. Login com sucesso ✅
2. Vê mensagem "Redirecionando..."
3. Redireciona para /login/ de novo ❌
```

#### Causas

1. **auth.js não está carregado**

   **Debug:**
   ```javascript
   console.log('Verificar se auth.js carregou:');
   console.log(window.AuthAPI);  // Deve existir
   console.log(window.fetch);    // Deve ser função customizada
   ```

   **Solução:**
   ```html
   <!-- Verifique em base.html -->
   <script src="{% static 'core/js/auth.js' %}"></script>
   ```

2. **Token não está sendo salvo**

   ```javascript
   // Após login, execute no console
   localStorage.getItem('access_token');  // Deve retornar token
   ```

3. **Middleware não consegue ler o cookie**

   **Solução em settings.py:**
   ```python
   SESSION_COOKIE_HTTPONLY = False  # Permitir ler via JS
   CSRF_COOKIE_HTTPONLY = False
   ```

4. **Rota de dashboard está em rotas públicas**

   **Verificar em middleware.py:**
   ```python
   public_paths = [
       '/login/',      # ✅ Correto
       '/dashboard/',  # ❌ ERRO - dashboard deve ser protegido!
   ]
   ```

---

### ❌ Problema 4: CORS Error

#### Sintoma
```
Access to fetch at 'http://localhost:8000/api/login/' 
from origin 'http://127.0.0.1:8000' has been blocked by CORS policy
```

#### Solução

Em **settings.py**:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True  # ⭐ Importante para cookies
```

Ou mais permissivo (apenas desenvolvimento):
```python
CORS_ALLOW_ALL_ORIGINS = True
```

---

### ❌ Problema 5: Token JWT inválido

#### Sintoma
```
rest_framework_simplejwt.exceptions.InvalidToken: Token is invalid or expired
```

#### Causas

1. **Token corrompido ou mal formatado**
   - Token incompleto
   - Token com caracteres inválidos

2. **Token expirado**
   ```python
   # settings.py - aumentar tempo de vida
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # ⬆️ Aumentado
   }
   ```

3. **Secret key mudou**
   ```python
   # ❌ NUNCA mude SECRET_KEY em produção!
   # Todos os tokens antigos ficarão inválidos
   ```

---

### ❌ Problema 6: "AttributeError: 'AnonymousUser' object has no attribute 'is_authenticated'"

#### Causa
Middleware não está carregando corretamente

#### Solução
```python
# Adicionar None check no middleware
if user and user.is_authenticated:
    request.user = user
    is_authenticated = True
```

---

### ❌ Problema 7: Cookie não é enviado em requisições

#### Sintoma
```
Set-Cookie: access_token=... (visto na resposta)
Mas no próximo GET, o cookie não aparece no header
```

#### Causas

1. **Cookie configurado com path incorreto**

   **Login.html:**
   ```javascript
   // ❌ ERRADO
   document.cookie = `access_token=${token}`;
   
   // ✅ CORRETO
   document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
   ```

2. **Cookies desativados no navegador**
   - Verificar em Configurações → Privacidade

3. **Domínio incorreto**
   - Se localhost, não usar domínio explícito

---

### ❌ Problema 8: "IntegrityError: duplicate key value violates unique constraint"

#### Sintoma
```
IntegrityError: duplicate key value violates unique constraint "core_usuario_email_key"
```

#### Causa
Tentou registrar com email que já existe

#### Solução
```bash
# Verificar emails duplicados
python manage.py shell
from core.models import Usuario
Usuario.objects.values('email').annotate(count=Count('id')).filter(count__gt=1)

# Deletar duplicados (com cuidado!)
Usuario.objects.filter(email='duplicate@example.com').delete()
```

---

### ❌ Problema 9: Token não funciona em diferentes navegadores/abas

#### Sintoma
```
Login em aba 1 ✅
Abrir aba 2 → Redireciona para login ❌
```

#### Causa
localStorage é por domínio, mas não é compartilhado entre abas
(Cookies SÃO compartilhados)

#### Solução
1. Usar cookie (mais confiável)
   ```javascript
   document.cookie = `access_token=${token}; path=/`;
   ```

2. Ou sincronizar localStorage entre abas
   ```javascript
   window.addEventListener('storage', (e) => {
       if (e.key === 'access_token') {
           console.log('Token atualizado em outra aba');
       }
   });
   ```

---

### ❌ Problema 10: "POST /api/logout/ 401"

#### Causa
Token expirou

#### Solução
```python
# View LogoutView
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            # Mesmo com erro, limpa cliente
            return Response(status=status.HTTP_205_RESET_CONTENT)
```

---

## ❓ FAQ

### P1: Posso armazenar token em sessionStorage em vez de localStorage?

**R:** Sim, mas é menos confiável:
- sessionStorage é limpo ao fechar o navegador
- localStorage persiste entre sessões
- Cookies são mais seguros (HttpOnly, Secure flags)

**Recomendação:**
```javascript
// localStorage + Cookie (melhor)
localStorage.setItem('access_token', token);
document.cookie = `access_token=${token}; path=/; HttpOnly; Secure`;
```

---

### P2: Quanto tempo o token deve durar?

**R:** Depende do seu caso:
- **15 minutos:** Muito seguro, mas usuário fica refazendo login
- **1 hora:** Bom balanço (recomendado)
- **24 horas:** Mais conveniente, menos seguro
- **7 dias:** Apenas para refresh token

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),      # Curto prazo
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # Longo prazo
}
```

---

### P3: Preciso armazenar token em banco de dados?

**R:** Não necessariamente. O JWT é self-contained:
- Token contém informações do usuário
- Servidor valida assinatura
- Não precisa armazenar

Mas para invalidação:
```python
# Se precisar fazer logout efetivo:
# - Use blacklist de tokens
# - Ou incremente versão do usuário
```

---

### P4: Como proteger contra XSS (roubo de token)?

**R:** Várias camadas:

1. **HttpOnly Cookie** (melhor)
   ```javascript
   // Servidor envia
   Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
   // JavaScript NÃO consegue acessar
   ```

2. **CSP (Content Security Policy)**
   ```python
   SECURE_CONTENT_SECURITY_POLICY = {
       "default-src": ("'self'",),
       "script-src": ("'self'",),
   }
   ```

3. **Sanitizar inputs**
   ```python
   from django.utils.html import escape
   ```

---

### P5: Como fazer refresh automático de token?

**R:** Dois métodos:

**Método 1: Ao receber 401**
```javascript
async function fazerRequisicaoComRefresh(url) {
    let response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    if (response.status === 401) {
        await renovarToken();
        response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
    }
    
    return response;
}
```

**Método 2: Em intervalo de tempo**
```javascript
// Renovar token a cada 50 minutos (antes de expirar em 60)
setInterval(renovarToken, 50 * 60 * 1000);

async function renovarToken() {
    const refresh = localStorage.getItem('refresh_token');
    const res = await fetch('/api/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh })
    });
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
}
```

---

### P6: Posso usar JWT com banco de dados?

**R:** Sim! Hybrid approach:

```python
# Usuário tem tabela no banco
class Usuario(models.Model):
    email = models.EmailField(unique=True)
    version = models.IntegerField(default=1)  # Para invalidar tokens

# Token contém user_id + version
# Ao validar, verifica se version no token == version no banco
# Para logout, incrementar version invalida todos os tokens
```

---

### P7: Como proteger contra CSRF?

**R:** Django faz automaticamente com tokens CSRF:

```html
<!-- Em formulários -->
{% csrf_token %}

<!-- Para AJAX -->
<script>
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/api/login/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(...)
    });
</script>
```

---

### P8: Posso fazer login com múltiplos provedores (Google, GitHub)?

**R:** Sim! Use bibliotecas:
```bash
pip install dj-rest-auth[with_social]
```

```python
# settings.py
INSTALLED_APPS = [
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]
```

---

### P9: Token é seguro em produção?

**R:** Sim, com as práticas corretas:

✅ **Faça:**
- Use HTTPS
- Token em HttpOnly Cookie
- CSP headers
- Rate limiting
- Logging de tentativas

❌ **Não faça:**
- localStorage (vulnerável a XSS)
- HTTP simples
- Token com muitos dados sensíveis
- Ignorar expiração

---

### P10: Como debugar problemas de autenticação?

**R:** Ferramentas úteis:

```bash
# 1. Console do navegador (F12)
localStorage.getItem('access_token')
document.cookie

# 2. Network tab - ver requisições
# Verificar headers Authorization

# 3. Shell do Django
python manage.py shell
from core.models import Usuario
from rest_framework_simplejwt.tokens import AccessToken
token = AccessToken.for_user(usuario)
print(token)  # Ver conteúdo

# 4. Logs do servidor
tail -f logs/django.log

# 5. JWT decoder online
# https://jwt.io (apenas desenvolvimento!)
```

---

## 📋 Checklist de Deploy

- [ ] `DEBUG = False` em settings
- [ ] `SECURE_SSL_REDIRECT = True`
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] SECRET_KEY gerado randomicamente
- [ ] ALLOWED_HOSTS configurado
- [ ] CORS apenas para domínios conhecidos
- [ ] Rate limiting em endpoints de login
- [ ] Logging configurado
- [ ] Backup do banco de dados
- [ ] Testes automatizados rodando
- [ ] Monitoramento de erros (Sentry)

---

## 🆘 Reportar Problema

Se encontrar um problema:

1. **Colete informações:**
   ```
   - Python version
   - Django version
   - DRF version
   - Error traceback completo
   - Steps para reproduzir
   ```

2. **Limpe cache:**
   ```bash
   python manage.py clear_cache
   rm -rf core/__pycache__
   ```

3. **Reinstale dependências:**
   ```bash
   pip install --upgrade djangorestframework-simplejwt
   ```

4. **Verifique versões:**
   ```bash
   pip list | grep django
   ```

---

**Última atualização:** Dezembro 2025
