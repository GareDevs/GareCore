# 📊 ANÁLISE ARQUITETURAL: database.js → Django API

Resumo executivo com diagramas e decisões arquiteturais.

---

## 🎯 VISÃO GERAL DA TRANSFORMAÇÃO

### Arquitetura Atual (Frontend-Heavy)

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  HTML/CSS ───► JavaScript (logic) ───► localStorage (data)   │
│                                                               │
│  ├─ forms.js ────────┐                                       │
│  ├─ fotos.js         ├──► database.js ──► LocalStorage       │
│  ├─ main.js          │                    (5MB max)           │
│  ├─ arvore.js        │                                       │
│  ├─ backup.js ───────┘                                       │
│                                                               │
│  ❌ Problemas:                                               │
│  • Sem persistência real                                    │
│  • Sem sincronização entre abas                             │
│  • Sem controle de acesso                                   │
│  • Sem auditoria                                            │
│  • Sem integração com backend                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Arquitetura Alvo (Backend-Centric)

```
┌──────────────────────────────────────┐          ┌──────────────────┐
│          NAVEGADOR (Frontend)        │          │  Django Backend  │
├──────────────────────────────────────┤          ├──────────────────┤
│                                      │          │                  │
│  HTML/CSS ──► JavaScript (thin)      │◄────────►│ ViewSets (API)   │
│               api-client.js          │  REST    │ Serializers      │
│               (apenas consumo)       │ /JSON    │ Models (ORM)     │
│                                      │          │                  │
│  ├─ forms.js ─────────┐             │          │ Banco de Dados   │
│  ├─ fotos.js          ├──► apiCall()│          │ (PostgreSQL)     │
│  ├─ main.js           │             │          │                  │
│  ├─ arvore.js ────────┘             │          │ Persistência 100%│
│                                      │          │ Sincronização    │
│  ✅ Vantagens:                        │          │ Controle acesso  │
│  • Persistência real                │          │ Auditoria        │
│  • Multi-abas sincronizadas         │          │ Segurança        │
│  • Controle de acesso (JWT)         │          │                  │
│  • Auditoria de mudanças            │          │                  │
│  • Escalabilidade                   │          │                  │
│                                      │          │                  │
└──────────────────────────────────────┘          └──────────────────┘
```

---

## 📋 MAPEAMENTO DE FUNÇÕES

### Categoria 1: CRUD GENÉRICO (5 funções)

```
database.js          Django ViewSet           HTTP Method   Status
────────────────────────────────────────────────────────────────
insert()        →   create()            →    POST         ✅
getAll()        →   list()              →    GET          ✅
getById()       →   retrieve()          →    GET {id}     ✅
update()        →   update()            →    PATCH {id}   ✅
delete()        →   destroy()           →    DELETE {id}  ✅
```

**Exemplo Fluxo:**
```javascript
// Frontend
const pessoa = {
    nome: 'João Silva',
    cpf: '12345678900'
};
const result = await api.post('/pessoas-fisicas/', pessoa);

// Django (automático via DRF)
class PessoaFisicaViewSet(ModelViewSet):
    queryset = PessoaFisica.objects.all()
    serializer_class = PessoaFisicaSerializer
    
    # create() é herdado de ModelViewSet
```

---

### Categoria 2: CONSULTAS E VALIDAÇÕES (7 funções)

```
database.js           API Endpoint                          Status
──────────────────────────────────────────────────────────────
search()          →   GET /?search=termo                  ✅
count()           →   GET /count/                         ✅
searchByGOA()     →   GET /search-by-goa/?goa=...        ✅
searchByGOAPrefix() → GET /search-by-goa-prefix/?pre=... ✅
goaExists()       →   GET /validate-goa/?goa=...        ✅
nameExists()      →   GET /validate-name/?nome=...      ✅
validateGOAFormat()→  GET /validacao/formato-goa/       ✅
```

**Exemplo:**
```javascript
// Frontend - antes
const existe = db.goaExists('GOAINV001', 123, 'pessoa_fisica');

// Frontend - depois
const response = await api.get(
    '/pessoas-fisicas/validate-goa/?goa=GOAINV001&exclude_id=123'
);
const existe = response.existe;

// Django
class PessoaFisicaViewSet(ModelViewSet):
    @action(detail=False, methods=['get'])
    def validate_goa(self, request):
        goa = request.query_params.get('goa')
        exclude_id = request.query_params.get('exclude_id')
        
        pessoa = Pessoa.objects.filter(goa=goa)
        if exclude_id:
            pessoa = pessoa.exclude(id=exclude_id)
        
        return Response({'existe': pessoa.exists()})
```

---

### Categoria 3: RELACIONAMENTOS E FOTOS (4 funções)

```
database.js              API Endpoint                    Status
─────────────────────────────────────────────────────────────
getRelacionamentos() →  GET /pessoas/{id}/relacionamentos/ ✅
getFotosPessoa()    →  GET /pessoas/{id}/fotos/           ✅
(CRUD fotos)        →  /fotos/ (POST/GET/DELETE)          ✅
```

---

### Categoria 4: PROCESSAMENTOS AUTOMÁTICOS (2 funções)

```
database.js                              API Endpoint              Status
────────────────────────────────────────────────────────────────────────
findAutoRelationships()      →  POST /pessoas/{id}/analisar/    ✅
analyzeAllDataAndCreate...() →  POST /analise/processar-todos/  ✅
                                (assíncrono com Celery)
```

**Decisão Arquitetural:**

- ❌ **NÃO fazer** análise síncrona (bloqueia servidor)
- ✅ **FAZER** análise assíncrona com Celery

```python
# Django tasks.py
@shared_task(bind=True)
def analisar_todos_relacionamentos(self):
    """Tarefa assíncrona - não bloqueia"""
    for pessoa in Pessoa.objects.all():
        # Análise
        self.update_state(
            state='PROGRESS',
            meta={'current': idx, 'total': total}
        )
    
    return {'status': 'completo', 'total': 250}

# Frontend
const taskId = await api.post('/analise/processar-todos/', {});
monitorarProgresso(taskId); // WebSocket ou polling
```

---

### Categoria 5: ADMINISTRAÇÃO (4 funções)

```
database.js              API Endpoint                      Status
────────────────────────────────────────────────────────────────
exportData()       →   GET /exportacao/backup/            ✅
importData()       →   POST /exportacao/restaurar/        ✅
clear()            →   DELETE /pessoas-fisicas/limpar/   ✅
resetDatabase()    →   POST /administracao/reset/        ✅
```

---

## 🔍 ANÁLISE DE COMPLEXIDADE

### Funções Simples (Migração direta)
```
CRUD genérico (5) + Validação simples (4) = 9 funções
Esforço: 2-3 horas cada
Risco: BAIXO
```

### Funções Moderadas (Migração com adaptação)
```
Relacionamentos (2) + Fotos (2) + Busca avançada (3) = 7 funções
Esforço: 4-6 horas cada
Risco: MÉDIO
```

### Funções Complexas (Redesenho necessário)
```
Análise automática (2) = 2 funções
Esforço: 8-12 horas cada
Risco: ALTO
Solução: Celery para assincronismo
```

---

## 🗄️ ESTRUTURA DO BANCO (relevante)

### Relacionamento entre tabelas

```sql
pessoa (id, tipo, goa)
├── pessoa_fisica (id→pessoa, nome, cpf, ...)
└── pessoa_juridica (id→pessoa, razao_social, cnpj, ...)

endereco (id, pessoa_id→pessoa, ...)
foto (id, pessoa_id→pessoa, ...)
relacionamento (id, pessoa_origem_id, pessoa_destino_id, tipo, ...)
```

### View vw_rede_pessoa (importante)

```sql
-- Retorna rede de relacionamentos de uma pessoa
SELECT
    p.id AS pessoa_central_id,
    p2.id AS pessoa_relacionada_id,
    r.tipo_relacionamento,
    COALESCE(pf.nome, pj.razao_social) AS nome_central,
    COALESCE(pf2.nome, pj2.razao_social) AS nome_relacionado
FROM pessoa p
LEFT JOIN relacionamento r ON ...
LEFT JOIN pessoa p2 ON ...
```

**Uso em API:**
```python
# Endpoint /api/rede/grafo/
# Retorna dados para visualização D3.js/vis.js
{
    'nodes': [
        {'id': 1, 'label': 'João Silva', 'type': 'F'},
        {'id': 2, 'label': 'Empresa XYZ', 'type': 'J'}
    ],
    'edges': [
        {'from': 1, 'to': 2, 'label': 'socio', 'confianca': 95}
    ]
}
```

---

## 🎨 DIAGRAMA DE FLUXO: Criar Pessoa

### Atual (localStorage)

```
┌──────────────────────┐
│ Usuário clica "Novo" │
└──────────┬───────────┘
           │
           ▼
   ┌───────────────┐
   │  Valida HTML5 │
   └───────┬───────┘
           │
           ▼
   ┌──────────────────────────┐
   │ db.insert('pessoa_fisica')│
   │ ├─ gera ID local        │
   │ ├─ salva em localStorage│
   │ └─ console.log          │
   └───────┬──────────────────┘
           │
           ▼
   ┌──────────────────┐
   │ Mostra sucesso   │
   └──────────────────┘
   
❌ Problemas:
   • localStorage de 1 abra apenas
   • Sem validação real
   • Sem persistência
```

### Novo (API Django)

```
┌──────────────────────┐
│ Usuário clica "Novo" │
└──────────┬───────────┘
           │
           ▼
   ┌───────────────┐
   │  Valida HTML5 │ (frontend validação)
   └───────┬───────┘
           │
           ▼
   ┌─────────────────────────────────────┐
   │ POST /api/pessoas-fisicas/          │
   │ {                                   │
   │   "nome": "João",                  │
   │   "cpf": "123...",                 │
   │   "goa": "GOAINV001"               │
   │ }                                   │
   └────────────┬────────────────────────┘
                │
                ▼
   ┌──────────────────────────────────────┐
   │      Django REST Framework           │
   │  PessoaFisicaCreateUpdateSerializer  │
   │  ├─ validate_nome()                 │
   │  ├─ validate_cpf()                  │
   │  ├─ _validar_cpf(algoritmo)         │
   │  └─ create() transaction.atomic()    │
   └────────────┬─────────────────────────┘
                │
                ▼
   ┌──────────────────────────────────────┐
   │      Models - ORM Django             │
   │  Pessoa.objects.create(tipo='F')     │
   │  PessoaFisica.objects.create(...)    │
   │  Endereco.objects.create(...)        │
   └────────────┬─────────────────────────┘
                │
                ▼
   ┌──────────────────────────────────────┐
   │      PostgreSQL Database             │
   │  INSERT INTO pessoa ...              │
   │  INSERT INTO pessoa_fisica ...       │
   │  COMMIT (transaction.atomic)         │
   └────────────┬─────────────────────────┘
                │
                ▼
   ┌──────────────────────────────────────┐
   │    Response JSON com nova Pessoa     │
   │  HTTP 201 Created                    │
   │  {                                   │
   │    "id": 42,                        │
   │    "pessoa": {"id": 42, "goa": ...}│
   │    "nome": "João",                 │
   │    "created_at": "2025-01-04..."    │
   │  }                                   │
   └────────────┬─────────────────────────┘
                │
                ▼
   ┌──────────────────┐
   │ Mostra sucesso   │
   │ + relação em     │
   │   tempo real     │
   └──────────────────┘

✅ Vantagens:
   • Validação robusta no backend
   • Transação ACID
   • Persistência garantida
   • Auditoria de mudanças
   • Sincronização entre clientes
```

---

## 📦 ESTRUTURA DE PACOTES RECOMENDADA

```
core/
├── api/
│   ├── __init__.py
│   ├── views/
│   │   ├── __init__.py
│   │   ├── pessoa.py          (PessoaFisica, PessoaJuridica ViewSets)
│   │   ├── foto.py            (Foto ViewSet)
│   │   ├── relacionamento.py   (Relacionamento ViewSet)
│   │   ├── analise.py         (Análise automática)
│   │   ├── exportacao.py      (Backup/Restauração)
│   │   └── administracao.py   (Reset, limpeza)
│   │
│   ├── serializers/
│   │   ├── __init__.py
│   │   ├── pessoa.py          (PessoaFisica, PessoaJuridica)
│   │   ├── foto.py            (Foto)
│   │   ├── relacionamento.py   (Relacionamento)
│   │   └── base.py            (Base serializers)
│   │
│   ├── filters.py             (Filtros avançados)
│   ├── utils.py               (Validadores, utilitários)
│   ├── tasks.py               (Celery tasks)
│   ├── permissions.py         (Permissões customizadas)
│   └── urls.py                (Roteamento API)
│
├── migrations/                (Auto Django)
├── management/
│   └── commands/
│       └── analizar_dados.py  (Command para análise manual)
│
├── models.py                  (Models existentes)
├── admin.py                   (Django admin)
├── apps.py                    (Config)
└── tests/
    ├── test_api.py
    ├── test_models.py
    └── test_serializers.py

static/core/js/
├── api-client.js              (⭐ Nova estrutura)
├── forms.js                   (🔄 Refatorado para usar API)
├── fotos.js                   (🔄 Refatorado para usar API)
├── main.js                    (🔄 Refatorado para usar API)
├── arvore.js                  (⭐ Novo grafo)
└── backup.js                  (🔄 Refatorado para usar API)
```

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Fluxo JWT (JSON Web Token)

```
┌────────────────────────────────────────────┐
│  Frontend                                  │
├────────────────────────────────────────────┤
│                                            │
│  1. POST /api/login/                      │
│     {email: "user@test.com", senha: "..."} │
│                                            │
│  2. Response:                              │
│     {                                      │
│       "access": "eyJ0eXAi...",             │
│       "refresh": "eyJ0eXAi..."             │
│     }                                      │
│                                            │
│  3. localStorage.setItem('access_token')   │
│                                            │
│  4. GET /api/pessoas-fisicas/             │
│     Header: Authorization: Bearer ...      │
│                                            │
│  5. Renovar quando expirar:                │
│     POST /api/token/refresh/               │
│     {refresh: "eyJ0eXAi..."}              │
│                                            │
└────────────────────────────────────────────┘
         │
         │ HTTP
         ▼
┌────────────────────────────────────────────┐
│  Django Backend                            │
├────────────────────────────────────────────┤
│                                            │
│  1. POST /api/auth/login/                 │
│     ├─ Valida credenciais                 │
│     ├─ Verifica 2FA (opcional)            │
│     └─ Gera tokens JWT                    │
│                                            │
│  2. GET /api/pessoas-fisicas/             │
│     ├─ @permission_classes([IsAuth])     │
│     ├─ Decodifica JWT                    │
│     ├─ Valida assinatura                 │
│     ├─ Verifica permissões                │
│     └─ Executa view                      │
│                                            │
└────────────────────────────────────────────┘
```

### Permissões

```python
# Diferentes níveis de acesso

class IsOwnerOrAdmin(permissions.BasePermission):
    """Apenas o dono ou admin"""
    def has_object_permission(self, request, view, obj):
        return obj.criado_por == request.user or request.user.is_admin

class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin escreve, outros apenas leem"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_admin

# Uso
class PessoaFisicaViewSet(ModelViewSet):
    permission_classes = [
        IsAuthenticated,
        IsAdminOrReadOnly
    ]
```

---

## 🚀 TIMELINE DE IMPLEMENTAÇÃO

### Semana 1: Fundação
```
Seg: Setup DRF, JWT, modelos base
Ter: Serializers CRUD
Qua: ViewSets básicos
Qui: Testes unitários
Sex: Deploy staging
```

### Semana 2: Validações
```
Seg: Validadores (CPF, CNPJ, GOA)
Ter: SearchFilter, paginação
Qua: Actions customizadas (validate-goa, etc)
Qui: Testes de validação
Sex: Deploy staging
```

### Semana 3: Relacionamentos
```
Seg: Foto CRUD
Ter: Foto upload/storage
Qua: Relacionamento queries
Qui: Testes
Sex: Deploy staging
```

### Semana 4: Processamento
```
Seg: Celery setup
Ter: Tasks de análise
Qua: Monitoramento de tarefas
Qui: Backup/Restauração
Sex: Deploy staging
```

### Semana 5: Migração Frontend
```
Seg: Refactor forms.js
Ter: Refactor fotos.js
Qua: Refactor main.js
Qui: Testes integração
Sex: Deploy produção
```

---

## 💡 PRINCIPAIS DECISÕES

### 1. ✅ Usar Django REST Framework
- Padronizado
- Validação automática
- Documentação Swagger
- Comunidade ativa

### 2. ✅ Usar Celery para Análise Pesada
- Não bloqueia servidor
- Monitoramento de progresso
- Retry automático
- Suporta 1000+ análises

### 3. ✅ Usar PostgreSQL
- Melhor que SQLite
- Suporta constraints
- Índices eficientes
- Escala horizontal

### 4. ⚠️ Manter localStorage como cache
- Experiência offline limitada
- Sincronização ao reconectar
- Cache de busca local

### 5. ⚠️ Paginação server-side
- Não carregar tudo em memória
- Maior performance
- Padrão DRF

---

## 🎯 MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Tempo de lista (100 registros) | 50ms | 150ms | < 200ms |
| Throughput CRUD | 10 req/s | 100 req/s | > 50 |
| Taxa de erro | 0% | 0% | < 0.1% |
| Disponibilidade | 99% | 99.9% | > 99.9% |
| Tempo deploy | 5min | 2min | < 5min |

---

## 🔗 REFERÊNCIAS

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [DRF-Spectacular (Swagger/OpenAPI)](https://drf-spectacular.readthedocs.io/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)
- [DRF Filters](https://django-filter.readthedocs.io/)

