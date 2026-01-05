/**
 * ApiClient - Cliente REST para consumir Django API
 * Substitui database.js com chamadas HTTP
 */
class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('access_token');
        this.timeout = 30000; // 30 segundos
    }
    
    /**
     * Define token de autenticação
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }
    
    /**
     * Retorna headers padrão para requisições
     */
    getHeaders(includeContentType = true) {
        const headers = {};
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        
        return headers;
    }
    
    /**
     * Realiza requisição HTTP genérica
     */
    async request(method, endpoint, data = null, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const fetchOptions = {
                method,
                headers: this.getHeaders(!options.isFormData),
                timeout: this.timeout,
                ...options
            };
            
            if (data) {
                if (options.isFormData) {
                    fetchOptions.body = data;
                } else {
                    fetchOptions.body = JSON.stringify(data);
                }
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }
    
    // ========================
    // CRUD BÁSICO
    // ========================
    
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request('GET', url);
    }
    
    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }
    
    async patch(endpoint, data) {
        return this.request('PATCH', endpoint, data);
    }
    
    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }
    
    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
    
    // ========================
    // PESSOA FÍSICA
    // ========================
    
    /**
     * Listar pessoas físicas com paginação e filtros
     */
    async listarPessoasFisicas(page = 1, search = '', filters = {}) {
        const params = {
            page,
            search,
            ...filters
        };
        return this.get('/pessoas-fisicas/', params);
    }
    
    /**
     * Obter pessoa física específica
     */
    async obterPessoaFisica(id) {
        return this.get(`/pessoas-fisicas/${id}/`);
    }
    
    /**
     * Criar nova pessoa física
     */
    async criarPessoaFisica(dados) {
        return this.post('/pessoas-fisicas/', dados);
    }
    
    /**
     * Atualizar pessoa física
     */
    async atualizarPessoaFisica(id, dados) {
        return this.patch(`/pessoas-fisicas/${id}/`, dados);
    }
    
    /**
     * Deletar pessoa física
     */
    async deletarPessoaFisica(id) {
        return this.delete(`/pessoas-fisicas/${id}/`);
    }
    
    /**
     * Contar total de pessoas físicas
     */
    async contarPessoasFisicas() {
        const response = await this.get('/pessoas-fisicas/count/');
        return response.total || 0;
    }
    
    /**
     * Analisar e sugerir relacionamentos para pessoa
     */
    async analisarRelacionamentos(id) {
        return this.post(`/pessoas-fisicas/${id}/analisar-relacionamentos/`, {});
    }
    
    /**
     * Validar GOA durante cadastro
     */
    async validarGoa(goa, excludeId = null) {
        const params = { goa };
        if (excludeId) params.exclude_id = excludeId;
        return this.get('/pessoas-fisicas/validate-goa/', params);
    }
    
    /**
     * Validar nome/duplicidade
     */
    async validarNome(nome, excludeId = null) {
        const params = { nome };
        if (excludeId) params.exclude_id = excludeId;
        return this.get('/pessoas-fisicas/validate-name/', params);
    }
    
    /**
     * Limpar todas as pessoas físicas
     */
    async limparPessoasFisicas() {
        return this.request('DELETE', '/pessoas-fisicas/limpar/', { confirm: true });
    }
    
    /**
     * Obter relacionamentos de pessoa física
     */
    async obterRelacionamentosPF(id) {
        const response = await this.get(`/pessoas-fisicas/${id}/relacionamentos/`);
        return response.relacionamentos || [];
    }
    
    /**
     * Obter fotos de pessoa física
     */
    async obterFotosPF(id) {
        const response = await this.get(`/pessoas-fisicas/${id}/fotos/`);
        return response.fotos || [];
    }
    
    // ========================
    // PESSOA JURÍDICA
    // ========================
    
    /**
     * Listar pessoas jurídicas
     */
    async listarPessoasJuridicas(page = 1, search = '', filters = {}) {
        const params = {
            page,
            search,
            ...filters
        };
        return this.get('/pessoas-juridicas/', params);
    }
    
    /**
     * Obter pessoa jurídica específica
     */
    async obterPessoaJuridica(id) {
        return this.get(`/pessoas-juridicas/${id}/`);
    }
    
    /**
     * Criar nova pessoa jurídica
     */
    async criarPessoaJuridica(dados) {
        return this.post('/pessoas-juridicas/', dados);
    }
    
    /**
     * Atualizar pessoa jurídica
     */
    async atualizarPessoaJuridica(id, dados) {
        return this.patch(`/pessoas-juridicas/${id}/`, dados);
    }
    
    /**
     * Deletar pessoa jurídica
     */
    async deletarPessoaJuridica(id) {
        return this.delete(`/pessoas-juridicas/${id}/`);
    }
    
    /**
     * Contar total de pessoas jurídicas
     */
    async contarPessoasJuridicas() {
        const response = await this.get('/pessoas-juridicas/count/');
        return response.total || 0;
    }
    
    /**
     * Validar GOA para PJ
     */
    async validarGoaPJ(goa, excludeId = null) {
        const params = { goa };
        if (excludeId) params.exclude_id = excludeId;
        return this.get('/pessoas-juridicas/validate-goa/', params);
    }
    
    /**
     * Obter relacionamentos de pessoa jurídica
     */
    async obterRelacionamentosPJ(id) {
        const response = await this.get(`/pessoas-juridicas/${id}/relacionamentos/`);
        return response.relacionamentos || [];
    }
    
    /**
     * Obter fotos de pessoa jurídica
     */
    async obterFotosPJ(id) {
        const response = await this.get(`/pessoas-juridicas/${id}/fotos/`);
        return response.fotos || [];
    }
    
    // ========================
    // FOTOS
    // ========================
    
    /**
     * Listar fotos
     */
    async listarFotos(pessoaId = null) {
        const params = {};
        if (pessoaId) params.pessoa_id = pessoaId;
        return this.get('/fotos/', params);
    }
    
    /**
     * Obter foto específica
     */
    async obterFoto(id) {
        return this.get(`/fotos/${id}/`);
    }
    
    /**
     * Upload de foto
     */
    async uploadFoto(pessoaId, arquivo, descricao = '') {
        const formData = new FormData();
        formData.append('pessoa_id', pessoaId);
        formData.append('arquivo', arquivo);
        formData.append('descricao', descricao);
        
        // Usar fetch direto para FormData
        try {
            const response = await fetch(`${this.baseURL}/fotos/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao upload foto:', error);
            throw error;
        }
    }
    
    /**
     * Deletar foto
     */
    async deletarFoto(id) {
        return this.delete(`/fotos/${id}/`);
    }
    
    /**
     * Obter fotos por pessoa
     */
    async obterFotosPorPessoa(pessoaId) {
        const response = await this.get('/fotos/por-pessoa/', { pessoa_id: pessoaId });
        return response.fotos || [];
    }
    
    // ========================
    // RELACIONAMENTOS
    // ========================
    
    /**
     * Listar relacionamentos
     */
    async listarRelacionamentos(pessoaId = null, tipo = null) {
        const params = {};
        if (pessoaId) params.pessoa_id = pessoaId;
        if (tipo) params.tipo = tipo;
        return this.get('/relacionamentos/', params);
    }
    
    /**
     * Obter relacionamento específico
     */
    async obterRelacionamento(id) {
        return this.get(`/relacionamentos/${id}/`);
    }
    
    /**
     * Criar novo relacionamento
     */
    async criarRelacionamento(dados) {
        return this.post('/relacionamentos/', dados);
    }
    
    /**
     * Atualizar relacionamento
     */
    async atualizarRelacionamento(id, dados) {
        return this.patch(`/relacionamentos/${id}/`, dados);
    }
    
    /**
     * Deletar relacionamento
     */
    async deletarRelacionamento(id) {
        return this.delete(`/relacionamentos/${id}/`);
    }
    
    /**
     * Obter relacionamentos por pessoa
     */
    async obterRelacionamentosPorPessoa(pessoaId) {
        const response = await this.get('/relacionamentos/por-pessoa/', { pessoa_id: pessoaId });
        return {
            comOrigem: response.como_origem || [],
            comDestino: response.como_destino || [],
            todos: response.todos || []
        };
    }
    
    /**
     * Analisar rede de relacionamentos
     */
    async analisarRede(pessoaId, profundidade = 2) {
        return this.post('/relacionamentos/analisar-rede/', {
            pessoa_id: pessoaId,
            profundidade
        });
    }
}

// Criar instância global
const api = new ApiClient('/api');

/**
 * Verificar autenticação e redirecionar se necessário
 */
function verificarAutenticacao() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
        return false;
    }
    return true;
}

/**
 * Fazer login e obter token
 */
async function fazerLogin(email, senha) {
    try {
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password: senha })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao fazer login');
        }
        
        const data = await response.json();
        api.setToken(data.access);
        return data;
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
}

/**
 * Fazer logout
 */
function fazerLogout() {
    api.setToken(null);
    localStorage.removeItem('access_token');
    window.location.href = '/login/';
}
