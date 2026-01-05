# 🗺️ DIAGRAMA VISUAL COMPLETO DA TRANSFORMAÇÃO

Representação visual dos fluxos e componentes.

---

## 1️⃣ ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   INTERNET                                  │
│                          HTTPS (TLS 1.3 encryption)                         │
└──────────────────────────┬──────────────────────────┬───────────────────────┘
                           │                          │
        ┌──────────────────▼────────────────┐   ┌────▼──────────────────────┐
        │      WEB BROWSER (Frontend)       │   │    OUTRO CLIENTE (Mobile) │
        │   ┌─────────────────────────────┐ │   │   ┌─────────────────────┐ │
        │   │  HTML/CSS/JavaScript        │ │   │   │  React Native App   │ │
        │   │  ├─ forms.js (refatorado)   │ │   │   │  consume same API   │ │
        │   │  ├─ fotos.js (refatorado)   │ │   │   └─────────────────────┘ │
        │   │  ├─ main.js (refatorado)    │ │   └────────────────────────────┘
        │   │  └─ api-client.js (novo)    │ │
        │   │     ├─ JWT auth             │ │
        │   │     ├─ fetch() calls        │ │
        │   │     └─ error handling       │ │
        │   │                             │ │
        │   │  localStorage (cache only)  │ │
        │   │  ├─ access_token            │ │
        │   │  ├─ user_data               │ │
        │   │  └─ recent_searches         │ │
        │   └─────────────────────────────┘ │
        └─────────────────────────────────────┘
                           │
                           │ REST API calls (JSON)
                           │ POST /api/pessoas-fisicas/
                           │ GET  /api/pessoas-fisicas/{id}/
                           │ PATCH /api/pessoas-fisicas/{id}/
                           │
        ┌──────────────────▼──────────────────────────────────────────┐
        │         Django REST Framework API (Backend)                 │
        │  ┌────────────────────────────────────────────────────────┐ │
        │  │  API Endpoints (ViewSets)                              │ │
        │  │  ├─ PessoaFisicaViewSet (CRUD + actions)               │ │
        │  │  ├─ PessoaJuridicaViewSet (CRUD + actions)             │ │
        │  │  ├─ FotoViewSet (upload/download)                      │ │
        │  │  ├─ RelacionamentoViewSet (queries)                    │ │
        │  │  ├─ AnaliseViewSet (async processing)                  │ │
        │  │  ├─ ExportacaoViewSet (backup/restore)                 │ │
        │  │  └─ AdministracaoViewSet (admin only)                  │ │
        │  └────────────────────────────────────────────────────────┘ │
        │                           │                                 │
        │  ┌────────────────────────▼──────────────────────────────┐ │
        │  │  Serializers & Validation                            │ │
        │  │  ├─ validate_cpf() / validate_cnpj() / validate_goa()│ │
        │  │  ├─ Fuzzy name matching (SequenceMatcher)            │ │
        │  │  └─ Automatic field validation                       │ │
        │  └────────────────────────────────────────────────────────┘ │
        │                           │                                 │
        │  ┌────────────────────────▼──────────────────────────────┐ │
        │  │  Models (ORM)                                        │ │
        │  │  ├─ Pessoa (F/J)                                     │ │
        │  │  ├─ PessoaFisica (200+ campos)                       │ │
        │  │  ├─ PessoaJuridica (20+ campos)                      │ │
        │  │  ├─ Endereco (indices)                               │ │
        │  │  ├─ Foto (file storage)                              │ │
        │  │  ├─ Relacionamento (graph)                           │ │
        │  │  └─ Usuario (auth)                                   │ │
        │  └────────────────────────────────────────────────────────┘ │
        │                           │                                 │
        └───────────────────────────┼─────────────────────────────────┘
                                    │
                                    ▼
        ┌──────────────────────────────────────────────────────────────┐
        │              PostgreSQL Database (Persistent)                │
        │  ┌────────────────────────────────────────────────────────┐ │
        │  │  Tables:                                               │ │
        │  │  ├─ pessoa (1M rows capacity)                          │ │
        │  │  ├─ pessoa_fisica (indexes on cpf, goa)               │ │
        │  │  ├─ pessoa_juridica (indexes on cnpj, goa)           │ │
        │  │  ├─ endereco (indexes on pessoa_id, cep)             │ │
        │  │  ├─ foto (with file_hash)                            │ │
        │  │  ├─ relacionamento (graph structure)                 │ │
        │  │  └─ usuario (bcrypt hashes)                          │ │
        │  │                                                        │ │
        │  │  Views:                                               │ │
        │  │  └─ vw_rede_pessoa (análise de grafo)                │ │
        │  │                                                        │ │
        │  │  Constraints:                                         │ │
        │  │  ├─ UNIQUE(cpf) + UNIQUE(cnpj) + UNIQUE(goa)         │ │
        │  │  └─ FK referential integrity + ON DELETE CASCADE      │ │
        │  └────────────────────────────────────────────────────────┘ │
        │                           │                                 │
        │  ┌────────────────────────▼──────────────────────────────┐ │
        │  │  Backup & Replication                                │ │
        │  │  ├─ Daily automated backups (WAL)                    │ │
        │  │  ├─ Point-in-time recovery                           │ │
        │  │  └─ Read replicas (optional)                         │ │
        │  └────────────────────────────────────────────────────────┘ │
        └──────────────────────────────────────────────────────────────┘

        ┌──────────────────────────────────────────────────────────────┐
        │         Celery Task Queue (Async Processing)                 │
        │  ┌────────────────────────────────────────────────────────┐ │
        │  │  Tasks:                                                │ │
        │  │  ├─ analisar_todos_relacionamentos()                  │ │
        │  │  │  └─ Processar N pessoas sem bloquear               │ │
        │  │  │                                                     │ │
        │  │  ├─ exportar_dados_background()                       │ │
        │  │  │  └─ Gerar arquivo grande                           │ │
        │  │  │                                                     │ │
        │  │  ├─ limpar_fotos_antigas()                            │ │
        │  │  │  └─ Garbage collection                             │ │
        │  │  │                                                     │ │
        │  │  └─ [Custom tasks as needed]                          │ │
        │  │                                                         │ │
        │  │  Workers:                                              │ │
        │  │  ├─ 2-4 processos default                            │ │
        │  │  ├─ Escalável conforme demanda                       │ │
        │  │  └─ Task retry automático                            │ │
        │  └────────────────────────────────────────────────────────┘ │
        │                           │                                 │
        └───────────────────────────┼─────────────────────────────────┘
                                    │
        ┌───────────────────────────▼─────────────────────────────────┐
        │         Redis (Cache + Message Broker)                      │
        │  ├─ Cache layer (users, recent searches)                   │
        │  ├─ Session storage (JWT refresh)                          │
        │  ├─ Message broker (Celery tasks)                          │
        │  └─ Rate limiting (throttle backend)                       │
        └────────────────────────────────────────────────────────────┘

        ┌────────────────────────────────────────────────────────────┐
        │         File Storage (Fotos)                               │
        │  Option 1: AWS S3                                          │
        │  ├─ $0.023 per GB (cheap)                                │
        │  ├─ CDN integrado                                          │
        │  └─ Auto backup                                            │
        │                                                            │
        │  Option 2: Local Storage                                   │
        │  ├─ /media/fotos/                                          │
        │  ├─ Simples, mas requires backup                           │
        │  └─ Suficiente para MVP                                    │
        └────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ FLUXO DE DADOS: Criar Pessoa Física

```
USER INPUT                          FRONTEND                           BACKEND
────────────────────────────────────────────────────────────────────────────

Preenche form:
│
├─ Nome: "João Silva"
├─ CPF: "123.456.789-00"
├─ Telefone: "(11) 99999-9999"
└─ GOA: "GOAINV001"
│
▼
[Validação HTML5]
├─ required=""
├─ pattern="[0-9]{3}\.[0-9]{3}..."
└─ minlength="3"
│
▼
[onClick] handleFormSubmit()
│
├─ 1. Validação front (CPF format)
│   └─ if (!/\d{11}/.test(cpf)) error()
│
├─ 2. Prepara payload
│   └─ const data = {
│       nome: "João Silva",
│       cpf: "12345678900",
│       telefone1: "11999999999",
│       goa: "GOAINV001"
│      }
│
├─ 3. Busca token JWT
│   └─ token = localStorage.getItem('access_token')
│
└─ 4. Faz request
    
    POST /api/pessoas-fisicas/ HTTP/1.1
    Authorization: Bearer eyJ0eXAiOiJKV1...
    Content-Type: application/json
    
    {
      "nome": "João Silva",
      "cpf": "12345678900",
      "telefone1": "11999999999",
      "goa": "GOAINV001"
    }
                                    │
                                    ▼
                          [middleware] JWTAuthentication
                          ├─ Verifica token assinatura
                          ├─ Extrai user_id
                          └─ Adiciona request.user
                          
                                    │
                                    ▼
                          [view] PessoaFisicaViewSet.create()
                          ├─ Verifica permission_classes
                          │  └─ @permission_classes([IsAuthenticated])
                          │
                          ├─ Chama serializer.is_valid()
                          │
                          ▼
                    [serializer] PessoaFisicaCreateUpdateSerializer
                    ├─ validate_nome()
                    │  ├─ len > 3?
                    │  └─ .strip()
                    │
                    ├─ validate_cpf()
                    │  ├─ len == 11?
                    │  ├─ _validar_cpf() algorithm
                    │  │  ├─ Calcula dígito 1
                    │  │  └─ Calcula dígito 2
                    │  └─ Unique?
                    │
                    ├─ validate_goa() (custom)
                    │  ├─ Prefixo válido? (GOAINV, GOADEN, ...)
                    │  ├─ Número positivo?
                    │  └─ Não existe em outro?
                    │
                    └─ create()
                       └─ @transaction.atomic
                          ├─ 1. Pessoa.objects.create(
                          │      tipo='F',
                          │      goa='GOAINV001'
                          │    )
                          │
                          ├─ 2. PessoaFisica.objects.create(
                          │      pessoa=pessoa_obj,
                          │      nome='João Silva',
                          │      cpf='12345678900',
                          │      telefone1='11999999999'
                          │    )
                          │
                          └─ 3. COMMIT (all or nothing)
                    │
                    ▼
            [database] INSERT
            
            INSERT INTO pessoa (tipo, goa, created_at)
            VALUES ('F', 'GOAINV001', NOW())
            RETURNING id;
            
            INSERT INTO pessoa_fisica (
              id, nome, cpf, telefone1
            ) VALUES (42, 'João Silva', '12345678900', '11999999999')
            RETURNING *;
            │
            ▼
        [PostgreSQL] Executa com constraints
        ├─ CHECK tipo IN ('F', 'J')
        ├─ UNIQUE(goa)
        ├─ UNIQUE(cpf)
        ├─ NOT NULL nome
        └─ Trigger: updated_at = NOW()
        
        ✅ SUCCESS
                                    │
                                    ▼
                    Response JSON
                    
                    HTTP/1.1 201 Created
                    Content-Type: application/json
                    
                    {
                      "id": 42,
                      "pessoa": {
                        "id": 42,
                        "tipo": "F",
                        "goa": "GOAINV001",
                        "created_at": "2025-01-04T12:30:00Z"
                      },
                      "nome": "João Silva",
                      "cpf": "12345678900",
                      "telefone1": "11999999999",
                      "created_at": "2025-01-04T12:30:00Z"
                    }
│
▼
[Recebe response]
├─ status === 201?
│  └─ ✅ YES
│
├─ Parse JSON
│
├─ Update UI
│  ├─ Hide form
│  ├─ Show success message
│  └─ Adicionar à lista
│
├─ Atualizar contador
│  ├─ db.count() seria aqui no antigo
│  ├─ Agora já vem no response!
│  └─ Ou faz GET /count/
│
└─ Opcional: trigger análise automática
   └─ POST /pessoas/{id}/analisar-relacionamentos/
      (procura relacionamentos desta nova pessoa)

✅ COMPLETO!
```

---

## 3️⃣ FLUXO DE ANÁLISE: Busca por GOA

```
USER                          FRONTEND                      BACKEND
────────────────────────────────────────────────────────────────

Usuário digita GOA:
│
├─ Input field: "GOAINV"
└─ Espera 500ms (debounce)
│
▼
[handleSearchGOA]
├─ goa = input.value.toUpperCase()
├─ if (goa.length < 4) return;
│
└─ Opção 1: Buscar exato
   GET /api/pessoas/search-by-goa/?goa=GOAINV001
   
   │
   ▼
   [view] @action detail=False
   ├─ goa = request.query_params.get('goa')
   ├─ pessoa = Pessoa.objects.filter(goa=goa).first()
   │
   ├─ IF pessoa is None:
   │  └─ return Response({erro: '404'}, status=404)
   │
   └─ IF pessoa found:
      ├─ IF tipo == 'F':
      │  └─ serializer = PessoaFisicaDetailSerializer
      └─ ELSE:
         └─ serializer = PessoaJuridicaDetailSerializer
      
      Response:
      {
        "pessoa": {...full data...},
        "tipo": "Física",
        "goa": "GOAINV001"
      }
   │
   ▼
   [Resultado]
   ├─ Mostra pessoa encontrada
   ├─ Carrega endereços, fotos
   └─ Botão para ver relacionamentos
   
   
   └─ Opção 2: Buscar por prefixo
      GET /api/pessoas/search-by-goa-prefix/?prefix=GOAINV
      
      SELECT * FROM pessoa WHERE goa LIKE 'GOAINV%'
      
      Response:
      {
        "total": 42,
        "resultados": [
          {...pessoa1...},
          {...pessoa2...},
          ...
        ]
      }
      │
      ▼
      Mostra lista com 42 resultados
      ├─ Físicas: 25
      ├─ Jurídicas: 17
      └─ Paginação: página 1 de 3
```

---

## 4️⃣ FLUXO ASSÍNCRONO: Análise em Lote

```
USUÁRIO CLICA                   FRONTEND                    CELERY WORKERS
────────────────────────────────────────────────────────────────────────

[Análise de Todos]
├─ showLoadingSpinner()
│
└─ POST /api/analise/processar-todos/
   {
     "async": true
   }
   │
   │                           ▼
   │                  [view] AnaliseViewSet.post()
   │                  ├─ Se async=true:
   │                  │  └─ task = analyze_all_data.delay()
   │                  │     ├─ Celery coloca na fila
   │                  │     └─ Retorna task_id imediatamente
   │                  │
   │                  └─ Response (202 Accepted)
   │                     {
   │                       "task_id": "a1b2c3d4e5f6g7h8",
   │                       "status": "processing"
   │                     }
   │
   ◄─ Recebe task_id
   │
   ├─ localStorage.setItem('task_id', 'a1b2c3d4...')
   │
   └─ monitorarProgresso(task_id)
      ├─ Polling cada 2 segundos
      │  GET /api/analise/status/a1b2c3d4.../
      │  │
      │  ▼
      │  [view] fetch_task_status()
      │  │
      │  ▼
      │                             [celery] analyze_all_data task
      │                             │
      │                             ├─ for pessoa in Pessoa.objects.all():
      │                             │
      │                             │  ├─ 1. Análise familiar
      │                             │  │   └─ Buscar mesmo sobrenome
      │                             │  │      Criar relacionamento
      │                             │  │
      │                             │  ├─ 2. Análise empresarial
      │                             │  │   └─ Buscar mesmo CNPJ
      │                             │  │      Criar relacionamento
      │                             │  │
      │                             │  ├─ 3. Análise endereço
      │                             │  │   └─ Fuzzy match endereço
      │                             │  │      Criar relacionamento
      │                             │  │
      │                             │  ├─ 4. Análise telefone
      │                             │  │   └─ Match exato telefone
      │                             │  │      Criar relacionamento
      │                             │  │
      │                             │  └─ update_state(
      │                             │      state='PROGRESS',
      │                             │      meta={
      │                             │        'current': idx,
      │                             │        'total': 1000,
      │                             │        'status': f'Analisando {idx}...'
      │                             │      }
      │                             │    )
      │                             │
      │                             └─ return {
      │                                  'status': 'success',
      │                                  'total': 1000,
      │                                  'relacionamentos': 5234
      │                                }
      │
      └─ Response:
         {
           "state": "PROGRESS",
           "current": 456,
           "total": 1000,
           "percentage": 45.6,
           "status": "Analisando 456/1000..."
         }
      │
      ├─ Atualiza progresso bar (456/1000)
      │
      └─ Quando state == "SUCCESS":
         ├─ hideLoadingSpinner()
         ├─ showNotification("✅ Análise completa! 5.234 relacionamentos encontrados")
         ├─ Recarrega lista de relacionamentos
         └─ localStorage.removeItem('task_id')
```

---

## 5️⃣ FLUXO DE UPLOAD: Foto

```
USER                          FRONTEND                      BACKEND
─────────────────────────────────────────────────────────────────

Seleciona arquivo:
│
├─ <input type="file" accept="image/*">
│  └─ onChange → seleção
│
├─ Preview (FileReader)
│
└─ Input: Descrição
   │
   ▼
[Upload onClick]
├─ Validar:
│  ├─ Arquivo selecionado?
│  ├─ Tipo image/*?
│  ├─ Tamanho < 10MB?
│  └─ Descrição preenchida?
│
├─ Preparar FormData
│  const formData = new FormData();
│  formData.append('arquivo', file);
│  formData.append('pessoa_id', 123);
│  formData.append('descricao', 'RG frontal');
│
├─ showProgress()
│
└─ fetch('/api/fotos/', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ...'
     },
     body: formData,
     onuploadprogress: (e) => {
       percent = (e.loaded / e.total) * 100;
       updateProgressBar(percent);
     }
   })
     │
     ▼
     [middleware] JWTAuth
     [permission] IsAuthenticated
     
     ├─ Parse multipart/form-data
     │
     ├─ Validar pessoa_id existe
     │
     └─ Validar arquivo tipo MIME
        │
        ▼
     [serializer] FotoCreateSerializer
     ├─ validate_arquivo()
     │  ├─ Checar extensão
     │  ├─ Checar magic bytes (não confiamos em .mime)
     │  └─ Checar tamanho
     │
     └─ create()
        ├─ Generate hash SHA256(arquivo)
        ├─ Checar duplicidade
        │  └─ IF hash exists: retornar old foto
        │
        └─ Salvar arquivo
           │
           IF settings.USE_S3:
           ├─ boto3.upload_to_s3()
           └─ salvar URL em model
           
           ELSE (local storage):
           ├─ Salvar em /media/fotos/{uuid}.jpg
           └─ salvar path relativo em model
        
        ├─ Criar entrada DB
        │  Foto.objects.create(
        │    pessoa_id=123,
        │    arquivo_url='/media/fotos/abc123.jpg',
        │    tamanho_bytes=2048576,
        │    hash_sha256='abc123...',
        │    descricao='RG frontal',
        │    uploaded_by=request.user
        │  )
        │
        └─ Response 201
           {
             "id": 789,
             "pessoa_id": 123,
             "arquivo_url": "/media/fotos/abc123.jpg",
             "tamanho_bytes": 2048576,
             "descricao": "RG frontal",
             "created_at": "2025-01-04T12:35:00Z"
           }
│
▼
[Frontend recebe]
├─ hideProgress()
├─ showNotification("✅ Foto enviada!")
├─ Limpar form
└─ Recarregar galeria
   GET /api/pessoas/123/fotos/
   │
   ▼
   [Response]
   {
     "pessoa_id": 123,
     "total": 3,
     "fotos": [
       {id: 789, url: '/media/...', descricao: 'RG frontal'},
       {id: 788, url: '/media/...', descricao: 'RG verso'},
       {id: 787, url: '/media/...', descricao: 'Comprovante endereço'}
     ]
   }
   
   Exibe thumbnails em grid
```

---

## 6️⃣ ÁRVORE DE DECISÃO: Qual Função Usar?

```
PRECISO FAZER ALGO:
│
├─ CRUD básico?
│  ├─ Criar         → POST /endpoint/
│  ├─ Listar        → GET /endpoint/
│  ├─ Detalhe       → GET /endpoint/{id}/
│  ├─ Atualizar     → PATCH /endpoint/{id}/
│  └─ Deletar       → DELETE /endpoint/{id}/
│
├─ BUSCAR?
│  ├─ Por nome/termo
│  │  └─ GET /endpoint/?search=termo
│  │
│  ├─ Por GOA exato
│  │  └─ GET /pessoas/search-by-goa/?goa=GOAINV001
│  │
│  ├─ Por prefixo GOA
│  │  └─ GET /pessoas/search-by-goa-prefix/?prefix=GOAINV
│  │
│  ├─ Contar registros
│  │  └─ GET /endpoint/count/
│  │
│  └─ Filtros avançados
│     └─ GET /endpoint/?idade_min=20&estado_civil=solteiro
│
├─ VALIDAR?
│  ├─ GOA já existe
│  │  └─ GET /pessoas/validate-goa/?goa=...
│  │
│  ├─ Nome já existe
│  │  └─ GET /pessoas/validate-name/?nome=...
│  │
│  └─ Formato GOA válido
│     └─ GET /validacao/formato-goa/?goa=...
│
├─ RELACIONADOS?
│  ├─ Ver relacionamentos de uma pessoa
│  │  └─ GET /pessoas/{id}/relacionamentos/
│  │
│  ├─ Ver fotos de uma pessoa
│  │  └─ GET /pessoas/{id}/fotos/
│  │
│  └─ Analisar relacionamentos sugeridos
│     └─ POST /pessoas/{id}/analisar-relacionamentos/
│
├─ PROCESSAR EM LOTE?
│  └─ POST /analise/processar-todos/ (async with task_id)
│
├─ BACKUP/RESTORE?
│  ├─ Exportar
│  │  └─ GET /exportacao/backup/
│  │
│  ├─ Importar
│  │  └─ POST /exportacao/restaurar/
│  │
│  ├─ Limpar tabela
│  │  └─ DELETE /endpoint/limpar/ (confirm required)
│  │
│  └─ Reset completo
│     └─ POST /administracao/reset/ (admin + password)
│
└─ UPLOAD?
   └─ POST /fotos/ (multipart/form-data)
```

---

## 7️⃣ MATRIZ DE PERMISSÕES

```
┌──────────────────┬────────┬────────┬────────┬────────┐
│ Endpoint         │ Anonimo│ User   │ Admin  │ Notes  │
├──────────────────┼────────┼────────┼────────┼────────┤
│ POST /login/     │ ✅     │ ✅     │ ✅     │ Public │
│ POST /registro/  │ ✅     │ ✅     │ ❌     │ Public │
├──────────────────┼────────┼────────┼────────┼────────┤
│ GET /pessoas/    │ ❌     │ ✅     │ ✅     │ Auth   │
│ POST /pessoas/   │ ❌     │ ✅     │ ✅     │ Create │
│ PATCH /pessoas/  │ ❌     │ ✅*    │ ✅     │ Self   │
│ DELETE /pessoas/ │ ❌     │ ❌     │ ✅     │ Admin  │
├──────────────────┼────────┼────────┼────────┼────────┤
│ GET /fotos/      │ ❌     │ ✅     │ ✅     │ Auth   │
│ POST /fotos/     │ ❌     │ ✅     │ ✅     │ Upload │
│ DELETE /fotos/   │ ❌     │ ✅*    │ ✅     │ Self   │
├──────────────────┼────────┼────────┼────────┼────────┤
│ POST /analise/   │ ❌     │ ❌     │ ✅     │ Admin  │
│ POST /backup/    │ ❌     │ ❌     │ ✅     │ Admin  │
│ POST /reset/     │ ❌     │ ❌     │ ✅     │ Admin  │
│                  │        │        │        │ +pass  │
└──────────────────┴────────┴────────┴────────┴────────┘

* = Can only modify own data
```

---

## 8️⃣ CICLO DE VIDA DE UMA TAREFA CELERY

```
Task: analyze_all_data.delay()
│
├─ 1. ENVIADA (PENDING)
│  └─ Enqueued em Redis
│     {
│       'id': 'a1b2c3d4...',
│       'task': 'core.tasks.analyze_all_data',
│       'args': [],
│       'kwargs': {}
│     }
│
├─ 2. INICIADA (STARTED)
│  └─ Worker pega da fila
│     celery worker -A gare_core
│       ├─ Inicia processo
│       ├─ redis PUBLISH task:started
│       └─ update_state(state='STARTED')
│
├─ 3. PROGRESSO (PROGRESS)
│  └─ 1000 iterações
│     for idx, pessoa in enumerate(pessoas):
│       ├─ Processa
│       ├─ self.update_state(
│       │    state='PROGRESS',
│       │    meta={
│       │      'current': idx,
│       │      'total': 1000,
│       │      'percent': idx/1000*100
│       │    }
│       │  )
│       └─ redis PUBLISH task:progress
│
├─ 4. SUCESSO ou ERRO
│  │
│  ├─ SUCCESS
│  │  ├─ return {...resultado...}
│  │  ├─ update_state(state='SUCCESS')
│  │  └─ redis EXPIRE key after 1 hour
│  │
│  └─ FAILURE
│     ├─ except Exception as e:
│     │  └─ self.update_state(
│     │      state='FAILURE',
│     │      meta={'error': str(e)}
│     │    )
│     ├─ Log in error queue
│     └─ Retry (max 3 vezes)
│        ├─ Wait 60 segundos
│        └─ Re-enqueue
│
└─ 5. LIMPEZA
   └─ Task result deletado após 1 hora
      ├─ Ou manter indefinidamente com:
      │  └─ CELERY_RESULT_EXPIRES = None
      └─ Backend: cache, db, ou redis
```

---

Esta visualização completa ajuda a entender toda a arquitetura e fluxos da transformação!

