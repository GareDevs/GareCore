# Mapeamento de Chamadas: .js → API Endpoints

Documento detalhando como cada arquivo JavaScript consumirá a API Django.

---

## 📋 SUMÁRIO POR ARQUIVO

| Arquivo | Funções db. | Endpoints API | Prioridade |
|---------|-------------|---------------|-----------|
| forms.js | insert, update, delete, getAll, count, validateGOA, goaExists | POST/PATCH/DELETE, GET | 🔴 HIGH |
| fotos.js | insert, getAll, getById, delete, getFotosPessoa | POST/GET, DELETE | 🔴 HIGH |
| main.js | count, getAll, insert, exportData, importData, searchByGOA, searchByGOAPrefix | GET, POST | 🟡 MEDIUM |
| exportacao-excel.js | getAll | GET | 🟡 MEDIUM |
| vinculos-avancados.js | getRelacionamentos, analyzeAllDataAndCreateRelationships | GET, POST | 🟠 LOW |
| arvore.js | getAll, getRelacionamentos | GET | 🟠 LOW |
| backup.js | getAll, exportData | GET | 🟠 LOW |

---

## 🎯 ARQUIVO: forms.js

**Localização:** `core/static/core/js/forms.js`  
**Tamanho:** 2.625 linhas  
**Responsabilidade:** Formulários CRUD de PF e PJ

### Chamadas database.js → API

#### 1. **linha 109** - Contar PF
```javascript
// ANTES
pfCount.textContent = db.count('pessoa_fisica');

// DEPOIS
const response = await api.get('/pessoas-fisicas/count/');
pfCount.textContent = response.total;
```

#### 2. **linha 113** - Contar PJ
```javascript
// ANTES
pjCount.textContent = db.count('pessoa_juridica');

// DEPOIS
const response = await api.get('/pessoas-juridicas/count/');
pjCount.textContent = response.total;
```

#### 3. **linha 1723** - Atualizar PF
```javascript
// ANTES
db.update('pessoa_fisica', editingRecord.id, formData);

// DEPOIS
const response = await api.patch(
    `/pessoas-fisicas/${editingRecord.id}/`,
    formData
);
```

#### 4. **linha 1749** - Criar PF
```javascript
// ANTES
const result = db.insert('pessoa_fisica', formData);

// DEPOIS
const result = await api.post('/pessoas-fisicas/', formData);
console.log('Pessoa criada:', result);
```

#### 5. **linha 1860** - Atualizar PJ
```javascript
// ANTES
db.update('pessoa_juridica', editingRecord.id, formData);

// DEPOIS
const response = await api.patch(
    `/pessoas-juridicas/${editingRecord.id}/`,
    formData
);
```

#### 6. **linha 1886** - Criar PJ
```javascript
// ANTES
const result = db.insert('pessoa_juridica', formData);

// DEPOIS
const result = await api.post('/pessoas-juridicas/', formData);
```

#### 7. **linha 1937** - Listar PF
```javascript
// ANTES
const pessoas = db.getAll('pessoa_fisica');

// DEPOIS
const response = await api.get('/pessoas-fisicas/');
const pessoas = response.results; // DRF pagination
```

#### 8. **linha 1980** - Listar PJ
```javascript
// ANTES
const pessoas = db.getAll('pessoa_juridica');

// DEPOIS
const response = await api.get('/pessoas-juridicas/');
const pessoas = response.results;
```

#### 9. **linhas 2019, 2238** - Buscar por ID
```javascript
// ANTES
const pessoa = db.getById(table, id);

// DEPOIS
const pessoa = await api.get(`/${table}/${id}/`);
// Onde table = 'pessoas-fisicas' ou 'pessoas-juridicas'
```

#### 10. **linha 2566** - Deletar
```javascript
// ANTES
db.delete(table, id);

// DEPOIS
await api.delete(`/${table}/${id}/`);
```

#### 11. **linha 2599** - Validar GOA
```javascript
// ANTES
const formatoValido = db.validateGOAFormat(goa);

// DEPOIS
const response = await api.get(`/validacao/formato-goa/?goa=${goa}`);
const { valido, message } = response;
```

#### 12. **linha 2609** - Verificar GOA existe
```javascript
// ANTES
const jaExiste = db.goaExists(goa, editingRecord?.id, editingRecord?.table);

// DEPOIS
const response = await api.get(
    `/pessoas-fisicas/validate-goa/?goa=${goa}&exclude_id=${id}`
);
const existe = response.existe;
```

### Refactoring Necessário

```javascript
// Adicionar ao início do arquivo
const db = new DatabaseFacade(api);

class DatabaseFacade {
    /**
     * Camada de compatibilidade para usar localStorage OR API
     * Permite migração gradual
     */
    constructor(apiClient) {
        this.api = apiClient;
        this.useAPI = true; // Flag para ativar API
    }
    
    async count(table) {
        if (this.useAPI) {
            const endpoint = table === 'pessoa_fisica' ? 
                '/pessoas-fisicas/count/' : 
                '/pessoas-juridicas/count/';
            const response = await this.api.get(endpoint);
            return response.total;
        }
        // Fallback localStorage
        return this.countLocal(table);
    }
    
    async insert(table, data) {
        if (this.useAPI) {
            const endpoint = table === 'pessoa_fisica' ? 
                '/pessoas-fisicas/' : 
                '/pessoas-juridicas/';
            return await this.api.post(endpoint, data);
        }
        return this.insertLocal(table, data);
    }
    
    // Implementar outros métodos...
}
```

---

## 📸 ARQUIVO: fotos.js

**Localização:** `core/static/core/js/fotos.js`  
**Tamanho:** 1.136 linhas  
**Responsabilidade:** Gerenciamento de fotos/imagens

### Chamadas database.js → API

#### 1. **linha 144** - Listar pessoas
```javascript
// ANTES
const pessoas = db.getAll(table);

// DEPOIS
const endpoint = table === 'pessoa_fisica' ? 
    '/pessoas-fisicas/' : '/pessoas-juridicas/';
const response = await api.get(endpoint);
const pessoas = response.results;
```

#### 2. **linha 250** - Criar foto
```javascript
// ANTES
db.insert('fotos', fotoData);

// DEPOIS
const formData = new FormData();
formData.append('pessoa_id', fotoData.pessoa_id);
formData.append('arquivo', fotoData.arquivo); // Blob
formData.append('descricao', fotoData.descricao);

await api.uploadFoto(
    fotoData.pessoa_id,
    fotoData.arquivo,
    fotoData.descricao
);
```

#### 3. **linha 367** - Listar todas fotos
```javascript
// ANTES
const fotos = db.getAll('fotos');

// DEPOIS
const response = await api.get('/fotos/');
const fotos = response.results;
```

#### 4. **linha 400** - Buscar pessoa
```javascript
// ANTES
const pessoa = db.getById(table, pessoaId);

// DEPOIS
const pessoa = await api.get(`/${table}/${pessoaId}/`);
```

#### 5. **linhas 474, 610** - Buscar foto
```javascript
// ANTES
const foto = db.getById('fotos', fotoId);

// DEPOIS
const foto = await api.get(`/fotos/${fotoId}/`);
```

#### 6. **linha 648** - Deletar foto
```javascript
// ANTES
db.delete('fotos', fotoId);

// DEPOIS
await api.delete(`/fotos/${fotoId}/`);
```

#### 7. **linha 663** - Fotos de pessoa
```javascript
// ANTES
const fotos = db.getFotosPessoa(pessoaId, tipoPessoa);

// DEPOIS
const endpoint = tipoPessoa === 'fisica' ? 
    `/pessoas-fisicas/${pessoaId}/fotos/` :
    `/pessoas-juridicas/${pessoaId}/fotos/`;
const response = await api.get(endpoint);
const fotos = response.fotos;
```

#### 8. **linhas 693, 729, 958** - Listar fotos (com filtro)
```javascript
// ANTES
const fotos = db.getAll('fotos');
const filtradas = fotos.filter(f => f.pessoa_id === pessoaId);

// DEPOIS
const response = await api.get(`/fotos/?pessoa_id=${pessoaId}`);
const fotos = response.results;
```

### Implementação de Upload

```javascript
async function uploadFotoComProgresso(arquivo, pessoaId, descricao) {
    const formData = new FormData();
    formData.append('pessoa_id', pessoaId);
    formData.append('arquivo', arquivo);
    formData.append('descricao', descricao);
    
    try {
        const response = await fetch('/api/fotos/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        showNotification('✅ Foto enviada com sucesso!', 'success');
        return data;
    } catch (error) {
        showNotification('❌ Erro ao enviar foto', 'error');
        console.error('Upload error:', error);
    }
}
```

---

## 🎯 ARQUIVO: main.js

**Localização:** `core/static/core/js/main.js`  
**Tamanho:** ~900 linhas  
**Responsabilidade:** Dashboard e funcionalidades globais

### Chamadas database.js → API

#### 1. **linhas 281-284** - Contadores dashboard
```javascript
// ANTES
const totalPF = db.count('pessoa_fisica');
const totalPJ = db.count('pessoa_juridica');
const totalFotos = db.count('fotos');
const totalRelacionamentos = db.count('relacionamentos');

// DEPOIS
async function updateDashboardStats() {
    try {
        const [pfRes, pjRes, fotosRes, relRes] = await Promise.all([
            api.get('/pessoas-fisicas/count/'),
            api.get('/pessoas-juridicas/count/'),
            api.get('/fotos/'),
            api.get('/relacionamentos/')
        ]);
        
        return {
            totalPF: pfRes.total,
            totalPJ: pjRes.total,
            totalFotos: fotosRes.count,
            totalRelacionamentos: relRes.count
        };
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}
```

#### 2. **linhas 375-377** - Últimas pessoas e fotos
```javascript
// ANTES
const pessoasFisicas = db.getAll('pessoa_fisica').slice(-6);
const pessoasJuridicas = db.getAll('pessoa_juridica').slice(-4);
const todasFotos = db.getAll('fotos');

// DEPOIS
const pfRes = await api.get('/pessoas-fisicas/?ordering=-created_at&page_size=6');
const pessoasFisicas = pfRes.results;

const pjRes = await api.get('/pessoas-juridicas/?ordering=-created_at&page_size=4');
const pessoasJuridicas = pjRes.results;

const fotosRes = await api.get('/fotos/?ordering=-created_at');
const todasFotos = fotosRes.results;
```

#### 3. **linhas 500-568** - Inserir dados de exemplo
```javascript
// ANTES
db.insert('pessoa_fisica', {
    nome: 'João Silva',
    cpf: '12345678900',
    // ...
});

// DEPOIS
await api.post('/pessoas-fisicas/', {
    nome: 'João Silva',
    cpf: '12345678900',
    // ...
});
```

#### 4. **linha 637** - Exportar dados
```javascript
// ANTES
const data = db.exportData();

// DEPOIS
const response = await api.get('/exportacao/backup/');
const data = JSON.stringify(response, null, 2);

// Ou baixar arquivo direto
window.location.href = '/api/exportacao/backup-arquivo/';
```

#### 5. **linha 661** - Importar dados
```javascript
// ANTES
const success = db.importData(e.target.result);

// DEPOIS
const jsonData = JSON.parse(e.target.result);
const response = await api.post('/exportacao/restaurar/', jsonData);

if (response.sucesso) {
    showNotification('✅ Backup restaurado!', 'success');
}
```

#### 6. **linha 764** - Buscar por prefixo GOA
```javascript
// ANTES
resultados = db.searchByGOAPrefix(goa);

// DEPOIS
const response = await api.get(`/pessoas/search-by-goa-prefix/?prefix=${goa}`);
const resultados = response.resultados;
```

#### 7. **linha 767** - Buscar por GOA exato
```javascript
// ANTES
const resultado = db.searchByGOA(goa);

// DEPOIS
const response = await api.get(`/pessoas/search-by-goa/?goa=${goa}`);
const resultado = response;
```

---

## 📊 ARQUIVO: exportacao-excel.js

**Localização:** `core/static/core/js/exportacao-excel.js`  
**Tamanho:** ~1.400 linhas  
**Responsabilidade:** Exportação para Excel

### Chamadas database.js → API

#### 1. **linhas 14, 45, 85-86** - Buscar dados
```javascript
// ANTES
let dados = db.getAll('pessoa_fisica');
const pessoasFisicas = db.getAll('pessoa_fisica');
const pessoasJuridicas = db.getAll('pessoa_juridica');

// DEPOIS
// Buscar com paginação completa
async function getAllData(endpoint) {
    let allData = [];
    let nextUrl = endpoint;
    
    while (nextUrl) {
        const response = await api.get(nextUrl);
        allData = allData.concat(response.results);
        nextUrl = response.next; // DRF pagination
    }
    
    return allData;
}

const pessoasFisicas = await getAllData('/pessoas-fisicas/');
const pessoasJuridicas = await getAllData('/pessoas-juridicas/');
```

### Tratamento de Grandes Volumes

```javascript
async function exportarComProgresso(tipo) {
    const endpoint = tipo === 'PF' ? '/pessoas-fisicas/' : '/pessoas-juridicas/';
    
    let pagina = 1;
    let todosRegistros = [];
    let temMais = true;
    
    while (temMais) {
        const response = await api.get(`${endpoint}?page=${pagina}&page_size=100`);
        todosRegistros = todosRegistros.concat(response.results);
        temMais = response.next !== null;
        pagina++;
        
        // Atualizar progresso
        showProgress(`Carregando ${todosRegistros.length} registros...`);
    }
    
    // Gerar Excel
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(todosRegistros);
    XLSX.utils.book_append_sheet(workbook, sheet, tipo);
    XLSX.writeFile(workbook, `export_${tipo}.xlsx`);
}
```

---

## 🔗 ARQUIVO: vinculos-avancados.js

**Localização:** `core/static/core/js/vinculos-avancados.js`  
**Responsabilidade:** Análise de relacionamentos avançada

### Chamadas database.js → API

#### 1. Buscar Relacionamentos
```javascript
// ANTES
const relacionamentos = db.getRelacionamentos(pessoaId, tipoPessoa);

// DEPOIS
const endpoint = tipoPessoa === 'F' ? 
    `/pessoas-fisicas/${pessoaId}/relacionamentos/` :
    `/pessoas-juridicas/${pessoaId}/relacionamentos/`;

const response = await api.get(endpoint);
const relacionamentos = response.relacionamentos;
```

#### 2. Análise Automática Completa
```javascript
// ANTES
const resultado = db.analyzeAllDataAndCreateRelationships();

// DEPOIS
const response = await api.post('/analise/processar-todos/', {});

if (response.status === 'processing') {
    // Monitorar tarefa assíncrona
    const taskId = response.task_id;
    await monitorarTarefa(taskId);
}

function monitorarTarefa(taskId) {
    const interval = setInterval(async () => {
        const status = await api.get(`/analise/status/${taskId}/`);
        
        if (status.state === 'SUCCESS') {
            clearInterval(interval);
            console.log('✅ Análise concluída!', status.result);
        } else if (status.state === 'FAILURE') {
            clearInterval(interval);
            console.error('❌ Erro na análise');
        } else {
            console.log(`Progresso: ${status.current}/${status.total}`);
        }
    }, 2000);
}
```

---

## 🌳 ARQUIVO: arvore.js

**Localização:** `core/static/core/js/arvore.js`  
**Responsabilidade:** Visualização de árvore genealógica/rede

### Chamadas database.js → API

#### 1. Buscar rede de pessoa
```javascript
// ANTES
const pessoas = db.getAll('pessoa_fisica');
const relacionamentos = db.getAll('relacionamentos');

// DEPOIS
async function buscarRedePessoa(pessoaId, profundidade = 2) {
    const response = await api.get(
        `/rede/analise/?pessoa_id=${pessoaId}&profundidade=${profundidade}`
    );
    
    return {
        pessoa_central: response.pessoa_central,
        total_pessoas: response.total_pessoas,
        pessoas: response.pessoas,
        relacionamentos: response.relacionamentos
    };
}
```

#### 2. Grafo para visualização
```javascript
// ANTES
const nodes = [];
const edges = [];
// Construir manualmente

// DEPOIS
async function obterGrafoDados() {
    const response = await api.get('/rede/grafo/');
    
    return {
        nodes: response.nodes,  // [{id, label, type, color}, ...]
        edges: response.edges   // [{from, to, label, confianca}, ...]
    };
}

// Usar com vis.js ou D3.js
async function renderizarGrafo() {
    const dados = await obterGrafoDados();
    
    const container = document.getElementById('network');
    const data = {
        nodes: new vis.DataSet(dados.nodes),
        edges: new vis.DataSet(dados.edges)
    };
    
    const network = new vis.Network(container, data, options);
}
```

---

## 💾 ARQUIVO: backup.js

**Localização:** `core/static/core/js/backup.js`  
**Responsabilidade:** Backup e restore de dados

### Chamadas database.js → API

#### 1. Criar backup
```javascript
// ANTES
if (typeof db !== 'undefined' && db.getAll) {
    // Usar localStorage

// DEPOIS
async function criarBackup() {
    try {
        const response = await api.get('/exportacao/backup/');
        
        const blob = new Blob(
            [JSON.stringify(response, null, 2)],
            { type: 'application/json' }
        );
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    } catch (error) {
        console.error('Erro ao criar backup:', error);
    }
}
```

#### 2. Restaurar backup
```javascript
async function restaurarBackup(file) {
    try {
        const text = await file.text();
        const dados = JSON.parse(text);
        
        const response = await api.post('/exportacao/restaurar/', dados);
        
        if (response.sucesso) {
            showNotification('✅ Backup restaurado!', 'success');
            location.reload(); // Recarregar página
        }
    } catch (error) {
        showNotification('❌ Erro ao restaurar backup', 'error');
    }
}
```

---

## 🔄 ARQUIVO: api-client.js

**Localização:** `core/static/core/js/api-client.js`  
**Status:** ⚠️ Necessita refactoring

### Implementação Recomendada

```javascript
/**
 * Client de API Moderna
 * Substituir chamdas de database.js
 */

class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.timeout = 30000;
        this.retries = 3;
    }
    
    getToken() {
        return localStorage.getItem('access_token');
    }
    
    async request(method, endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
        };
        
        const config = {
            method,
            headers,
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expirado - fazer login
                this.redirectToLogin();
            }
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (this.retries > 0) {
                this.retries--;
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s
                return this.request(method, endpoint, options);
            }
            throw error;
        }
    }
    
    // Métodos convenientes
    get(endpoint) { return this.request('GET', endpoint); }
    post(endpoint, data) { return this.request('POST', endpoint, { body: JSON.stringify(data) }); }
    patch(endpoint, data) { return this.request('PATCH', endpoint, { body: JSON.stringify(data) }); }
    delete(endpoint) { return this.request('DELETE', endpoint); }
    
    // Upload arquivo
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('arquivo', file);
        
        for (const [key, value] of Object.entries(additionalData)) {
            formData.append(key, value);
        }
        
        return await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: formData
        }).then(r => r.json());
    }
    
    redirectToLogin() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login/';
    }
}

// Instância global
window.api = new ApiClient('/api');
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

### Fase 1: Preparação (Semana 1)
- [ ] Criar API endpoints base com ViewSets
- [ ] Implementar autenticação JWT
- [ ] Criar serializers com validação
- [ ] Inicializar novo api-client.js

### Fase 2: CRUD Básico (Semana 2)
- [ ] Implementar POST /pessoas-fisicas/
- [ ] Implementar GET /pessoas-fisicas/
- [ ] Implementar PATCH /pessoas-fisicas/{id}/
- [ ] Implementar DELETE /pessoas-fisicas/{id}/
- [ ] Repetir para PJ e Fotos
- [ ] Testar com Postman

### Fase 3: Validações (Semana 3)
- [ ] Validar GOA
- [ ] Validar CPF/CNPJ
- [ ] Validar nomes duplicados
- [ ] Implementar search

### Fase 4: Relacionamentos (Semana 4)
- [ ] Listar relacionamentos
- [ ] Análise automática
- [ ] Análise em lote (Celery)

### Fase 5: Migração Frontend (Semana 5)
- [ ] Refactor forms.js
- [ ] Refactor fotos.js
- [ ] Refactor main.js
- [ ] Testar integração completa

### Fase 6: Otimização (Semana 6)
- [ ] Rate limiting
- [ ] Caching com Redis
- [ ] Paginação
- [ ] Documentação Swagger

---

## 📊 ESTIMATIVA DE TRABALHO

| Componente | Horas | Prioridade |
|------------|-------|-----------|
| ViewSets base | 16 | 🔴 |
| Serializers validação | 12 | 🔴 |
| Actions customizadas | 20 | 🔴 |
| Refactor forms.js | 24 | 🔴 |
| Refactor fotos.js | 16 | 🔴 |
| Refactor main.js | 12 | 🔴 |
| Testes unitários | 20 | 🟡 |
| Documentação API | 10 | 🟡 |
| Otimização/Caching | 12 | 🟠 |
| **TOTAL** | **142 horas** | |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Análise concluída (este documento)
2. ⬜ Implementar ViewSets
3. ⬜ Criar testes para endpoints
4. ⬜ Refactor progressivo do frontend
5. ⬜ Deprecar database.js

