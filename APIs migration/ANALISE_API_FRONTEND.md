# Análise das Chamadas API no Front-end

## 📊 Resumo Executivo

Seu projeto utiliza uma arquitetura de API REST com autenticação JWT. As chamadas HTTP são centralizadas em classes especializadas que gerenciam:
- Autenticação e interceptação de requisições
- Cache local para modo offline
- CRUD (Create, Read, Update, Delete) para 7 entidades principais
- Tratamento de erros e paginação

---

## 🏗️ Arquitetura de Chamadas API

### Estrutura de Camadas

```
Front-end (HTML/Templates)
        ↓
JavaScript (forms.js, arvore.js, etc)
        ↓
db (wrapper híbrido)  ← Interface de compatibilidade
        ↓
api (APIClient)  ← Cliente REST centralizado
        ↓
Interceptor (auth.js)  ← Adiciona token JWT
        ↓
fetch (nativo do navegador)
        ↓
Backend API (/api/)
```

---

## 🔑 Componentes Principais

### 1. **APIClient** ([core/static/core/js/api-client.js](core/static/core/js/api-client.js))

**Responsabilidade**: Cliente HTTP centralizado para todas as requisições REST

#### Configuração Base
```javascript
class APIClient {
    baseURL = '/api/'
    endpoints = {
        pessoa_fisica: 'pessoa-fisica/',
        pessoa_juridica: 'pessoa-juridica/',
        fotos: 'fotos/',
        relacionamentos: 'relacionamentos/',
        enderecos: 'enderecos/',
        contatos_empresa: 'contatos-empresa/',
        socios_empresa: 'socios-empresa/'
    }
}
```

#### Método Central: `request(method, endpoint, data)`
- **Local**: [api-client.js#L42-L73](core/static/core/js/api-client.js#L42-L73)
- **Função**: Faz requisições HTTP com autenticação
- **Características**:
  - Adiciona header `Authorization: Bearer {token}`
  - Redireciona para login se token expirado (HTTP 401)
  - Trata status 204 (No Content) sem error
  - Log estruturado com emojis para debugging

#### Métodos CRUD Específicos (3 métodos por entidade)

**Exemplo - Pessoa Física**:
- `getPessoaFisica(id)` - GET /api/pessoa-fisica/{id}/
- `getAllPessoasFisicas()` - GET /api/pessoa-fisica/
- `createPessoaFisica(data)` - POST /api/pessoa-fisica/
- `updatePessoaFisica(id, data)` - PUT /api/pessoa-fisica/{id}/
- `deletePessoaFisica(id)` - DELETE /api/pessoa-fisica/{id}/

**Entidades com CRUD Completo**:
1. ✅ Pessoa Física
2. ✅ Pessoa Jurídica
3. ✅ Fotos
4. ✅ Relacionamentos
5. ✅ Endereços
6. ✅ Contatos Empresa
7. ✅ Sócios Empresa

#### Métodos Genéricos
- `insert(table, data)` - Inserir com compatibilidade
- `getAll(table)` - Buscar todos (com suporte a paginação DRF)
- `getById(table, id)` - Buscar por ID
- `update(table, id, data)` - Atualizar registro
- `delete(table, id)` - Deletar registro
- `count(table)` - Contar registros
- `search(table, searchTerm, fields)` - Buscar com filtro

---

### 2. **Autenticação JWT** ([core/static/core/js/auth.js](core/static/core/js/auth.js))

**Responsabilidade**: Interceptar todas as requisições e adicionar token JWT

#### Interceptor Global
```javascript
window.fetch = function(...args) {
    // Adiciona token JWT automaticamente
    // Exceções: /login/, /registro/, /api/login/, /api/registro/
}
```

#### Funções Auxiliares
- `logout()` - [auth.js#L49-L73](core/static/core/js/auth.js#L49-L73)
  - Chama POST /api/logout/
  - Remove tokens do localStorage
  - Remove cookie de autenticação
  - Redireciona para /login/

- `isAuthenticated()` - Verifica se há token
- `getAuthToken()` - Retorna token atual
- `authenticatedFetch(url, options)` - Wrapper para requisições autenticadas

---

### 3. **DatabaseWrapper** ([core/static/core/js/database-wrapper.js](core/static/core/js/database-wrapper.js))

**Responsabilidade**: Compatibilidade entre código síncrono (legacy) e assincronano (API)

#### Recursos
- Cache local de todas as entidades
- Carregamento paralelo na inicialização (Promise.all)
- Tratamento de paginação DRF (detecta `data.results`)
- Fallback para cache se API falhar
- Log detalhado de operações

#### Métodos
```javascript
async initialize()     // Carrega dados de todas as tabelas
async loadTableData(table)
async insert(table, data)
async getAll(table)
async getById(table, id)  // Tenta cache primeiro, depois API
async update(table, id, data)
async delete(table, id)
async count(table)
async search(table, searchTerm, fields)
```

---

### 4. **Cache Local (dbCache)**

```javascript
const dbCache = {
    pessoa_fisica: [],
    pessoa_juridica: [],
    fotos: [],
    relacionamentos: [],
    enderecos: [],
    contatos_empresa: [],
    socios_empresa: [],
    
    async init()  // Carrega todos os dados da API
    updateCache(table, records)
}
```

**Benefícios**:
- Modo offline parcial
- Reduz requisições à API
- Sincronização automática ao carregar

---

## 📡 Fluxo de Requisições

### Exemplo: Criar uma Pessoa Física

```
1. User clica em "Salvar"
   ↓
2. forms.js chama: await db.insert('pessoa_fisica', {nome: '...', cpf: '...'})
   ↓
3. DatabaseWrapper.insert() chama: await api.insert('pessoa_fisica', data)
   ↓
4. APIClient.insert() seleciona entidade: await this.createPessoaFisica(data)
   ↓
5. APIClient.createPessoaFisica() chama: this.request('POST', 'pessoa-fisica/', data)
   ↓
6. APIClient.request():
   - Cria URL: /api/pessoa-fisica/
   - Obtém token: localStorage.getItem('access_token')
   - Headers: { Authorization: 'Bearer {token}' }
   - Envia: fetch(url, { method: 'POST', body: JSON.stringify(data) })
   ↓
7. auth.js interceptor:
   - Detecta que NÃO é rota pública
   - Adiciona token automaticamente (redundante aqui)
   ↓
8. Backend API recebe POST /api/pessoa-fisica/ com token validado
   ↓
9. Backend retorna: { id: 123, nome: '...', cpf: '...', ... }
   ↓
10. APIClient adiciona ao cache: dbCache.pessoa_fisica.push(result)
   ↓
11. DatabaseWrapper retorna resultado para forms.js
   ↓
12. UI atualizada com novo registro
```

---

## 🔐 Segurança & Autenticação

### Headers Padrão
```javascript
{
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {access_token}'
}
```

### Tratamento de Token Expirado
- **Status 401**: Redireciona para `/login` automaticamente ([api-client.js#L55-L58](core/static/core/js/api-client.js#L55-L58))
- **Token em localStorage**: Recuperado a cada requisição
- **Logout**: Remove access_token e refresh_token

### Rotas Públicas (sem token obrigatório)
- `/login/`
- `/registro/`
- `/api/login/`
- `/api/registro/`

---

## 📊 Mapeamento de Endpoints

| Entidade | GET | GET /:id | POST | PUT | DELETE |
|----------|-----|---------|------|-----|--------|
| **Pessoa Física** | `/api/pessoa-fisica/` | `/api/pessoa-fisica/:id/` | ✅ | ✅ | ✅ |
| **Pessoa Jurídica** | `/api/pessoa-juridica/` | `/api/pessoa-juridica/:id/` | ✅ | ✅ | ✅ |
| **Fotos** | `/api/fotos/` | `/api/fotos/:id/` | ✅ | ✅ | ✅ |
| **Relacionamentos** | `/api/relacionamentos/` | `/api/relacionamentos/:id/` | ✅ | ✅ | ✅ |
| **Endereços** | `/api/enderecos/` | `/api/enderecos/:id/` | ✅ | ✅ | ✅ |
| **Contatos Empresa** | `/api/contatos-empresa/` | `/api/contatos-empresa/:id/` | ✅ | ✅ | ✅ |
| **Sócios Empresa** | `/api/socios-empresa/` | `/api/socios-empresa/:id/` | ✅ | ✅ | ✅ |
| **Autenticação** | - | - | `/api/login/` | - | `/api/logout/` |

---

## 🎯 Tratamento de Erros

### Cenários Cobertos

1. **Erro HTTP (não 200-299)**
   ```javascript
   if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
   }
   ```

2. **Token Expirado (401)**
   ```javascript
   if (response.status === 401) {
       window.location.href = '/login';
   }
   ```

3. **Sem conteúdo (204)**
   ```javascript
   if (response.status === 204) {
       return null;
   }
   ```

4. **Erro de rede**
   ```javascript
   catch (error) {
       console.error('❌ Erro na requisição:', error);
       throw error;
   }
   ```

---

## 💾 Paginação (DRF)

### Detecção Automática
```javascript
// Se API retorna { results: [...], count: 100, next: '...', previous: '...' }
if (response.results) {
    return response.results;
}
```

### Local da Implementação
- [api-client.js#L353-L360](core/static/core/js/api-client.js#L353-L360)
- [database-wrapper.js#L62-L68](core/static/core/js/database-wrapper.js#L62-L68)

---

## 🔍 Busca & Filtro

### Método de Busca
```javascript
async search(table, searchTerm, fields = []) {
    const registros = await this.getAll(table);
    
    // Se fields vazio: busca em todos os campos
    // Se fields preenchido: busca apenas nesses campos
    
    return registros.filter(record => {
        return Object.values(record).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
}
```

**Características**:
- Case-insensitive
- Busca em texto (converte valores)
- Suporta campos específicos
- Executa no client-side (cuidado com grandes datasets!)

---

## ⚠️ Possíveis Problemas & Recomendações

### 1. **Busca no Client-side**
**Problema**: `search()` carrega TODOS os registros e filtra no JavaScript
**Impacto**: Performance ruim com > 1000 registros
**Solução**: Implementar `/api/{table}/?search=termo` no backend

### 2. **Cache não sincronizado**
**Problema**: Cache local pode ficar desatualizado se outros usuários modificam dados
**Impacto**: Dados obsoletos na interface
**Solução**: 
- WebSocket para notificações em tempo real
- Implementar versionamento de cache
- TTL (time-to-live) para dados em cache

### 3. **Modo Offline Limitado**
**Problema**: Cache é apenas leitura, não salva modificações offline
**Impacto**: Usuário perde dados se conexão cair
**Solução**: Usar IndexedDB + Service Worker para sincronização

### 4. **Duplicação de Código**
**Problema**: DatabaseWrapper e APIClient fazem operações similares
**Solução**: Remover DatabaseWrapper e usar APIClient diretamente

### 5. **Sem Rate Limiting no Client**
**Problema**: Nada impede requisições em cascata
**Solução**: Implementar debounce/throttle para operações

### 6. **Sem Retry Automático**
**Problema**: Falha de rede = erro imediato
**Solução**: Implementar retry com exponential backoff

---

## 📈 Estatísticas

- **Total de Entidades**: 7
- **Total de Endpoints CRUD**: 35 (5 por entidade)
- **Funções Genéricas**: 8 (insert, getAll, getById, update, delete, count, search, etc)
- **Arquivos JavaScript com API**: 5 (api-client.js, auth.js, database-wrapper.js, forms.js, arvore.js)
- **Linhas de Código (api-client.js)**: 596

---

## 🚀 Melhorias Sugeridas

### Curto Prazo (Fácil)
- [ ] Adicionar timeout nas requisições
- [ ] Implementar abort controller para cancelar requisições
- [ ] Melhorar mensagens de erro para o usuário
- [ ] Adicionar logs estruturados (JSON)

### Médio Prazo (Moderado)
- [ ] Migrar para uma library (axios, ky)
- [ ] Implementar retry automático
- [ ] Adicionar request/response interceptors
- [ ] Validação de schema no front-end

### Longo Prazo (Complexo)
- [ ] WebSocket para sincronização em tempo real
- [ ] Service Worker + IndexedDB para offline
- [ ] Implementar GraphQL ao invés de REST
- [ ] Testes unitários para APIClient

---

## 📝 Exemplo de Uso

### Criar um Registro
```javascript
// Opção 1: Via db (recomendado para compatibilidade)
const novaPessoa = await db.insert('pessoa_fisica', {
    nome: 'João Silva',
    cpf: '12345678900',
    data_nascimento: '1990-01-15'
});

// Opção 2: Via api (mais direto)
const novaPessoa = await api.createPessoaFisica({
    nome: 'João Silva',
    cpf: '12345678900',
    data_nascimento: '1990-01-15'
});
```

### Buscar Todos
```javascript
const pessoas = await db.getAll('pessoa_fisica');
console.log(`Total: ${pessoas.length}`);
```

### Atualizar
```javascript
const atualizada = await db.update('pessoa_fisica', 123, {
    nome: 'João Silva Santos'
});
```

### Deletar
```javascript
const sucesso = await db.delete('pessoa_fisica', 123);
```

### Buscar com Filtro
```javascript
const resultados = await db.search('pessoa_fisica', 'João');
// Retorna todos os registros que contêm "joão" em qualquer campo
```

---

## 📂 Estrutura de Arquivos Relacionados

```
core/static/core/js/
├── api-client.js          ← Cliente REST (596 linhas)
├── auth.js                ← Autenticação JWT (166 linhas)
├── database-wrapper.js    ← Compatibilidade (329 linhas)
├── forms.js               ← Utiliza db.* para CRUD
├── arvore.js              ← Utiliza db.* para relacionamentos
├── main.js                ← Inicializa db
└── ...
```

---

**Última atualização**: 2025-01-04
**Versão analisada**: API Client v1.0
