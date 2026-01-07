// Dashboard JavaScript - Sistema Desktop
// Funções para carregar e exibir estatísticas no dashboard

// Configuração da API
const API_BASE_URL = '/api';

// Função utilitária para fazer requisições
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    };
    
    // Adicionar token JWT se disponível
    const token = localStorage.getItem('access_token') || getCookie('access_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('Token expirado ou inválido. Redirecionando para login...');
                // Limpar tokens inválidos
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login/';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição API:', error);
        throw error;
    }
}

// Função para obter cookie CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Carregar estatísticas do dashboard
async function loadDashboardStats() {
    try {
        console.log('Iniciando carregamento de estatísticas...'); // Debug
        showLoading(true);
        
        const data = await apiRequest('/dashboard/stats/');
        console.log('Dados recebidos:', data); // Debug
        
        if (!data) {
            throw new Error('Nenhum dado recebido da API');
        }
        
        // Atualizar estatísticas gerais
        if (data.estatisticas_gerais) {
            updateGeneralStats(data.estatisticas_gerais);
        } else {
            console.warn('Estatísticas gerais não encontradas nos dados');
        }
        
        // Atualizar gráficos
        updateRelationshipsChart(data.relacionamentos_por_tipo);
        updateGOAChart(data.estatisticas_goa);
        
        // Atualizar atividades recentes
        updateRecentActivities(data.atividades_recentes);
        
        showLoading(false);
        console.log('Estatísticas carregadas com sucesso!'); // Debug
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showError(`Não foi possível carregar as estatísticas do dashboard: ${error.message}`);
        showLoading(false);
    }
}

// Atualizar cards de estatísticas gerais
function updateGeneralStats(stats) {
    console.log('Atualizando estatísticas gerais:', stats); // Debug
    
    const elements = {
        'total-pessoas': stats.total_pessoas,
        'total-pessoas-fisicas': stats.total_pessoas_fisicas,
        'total-pessoas-juridicas': stats.total_pessoas_juridicas,
        'total-relacionamentos': stats.total_relacionamentos,
        'total-fotos': stats.total_fotos,
        'pessoas-com-fotos': stats.pessoas_com_fotos,
        'percentual-com-fotos': stats.percentual_com_fotos,
        'pessoas-com-relacionamentos': stats.pessoas_com_relacionamentos,
        'percentual-com-relacionamentos': stats.percentual_com_relacionamentos
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('percentual')) {
                element.textContent = `${value}%`;
            } else {
                element.textContent = value.toLocaleString('pt-BR');
            }
            console.log(`Atualizado ${id}: ${value}`); // Debug
        } else {
            console.warn(`Elemento não encontrado: ${id}`); // Debug
        }
    });
}

// Atualizar gráfico de relacionamentos por tipo
function updateRelationshipsChart(data) {
    console.log('Atualizando gráfico de relacionamentos:', data); // Debug
    
    const container = document.getElementById('relacionamentos-chart');
    if (!container) {
        console.warn('Container relacionamentos-chart não encontrado'); // Debug
        return;
    }
    
    if (!data || !data.length) {
        container.innerHTML = '<p class="text-muted">Nenhum relacionamento encontrado</p>';
        return;
    }
    
    // Criar gráfico de barras simples
    const chartHTML = `
        <div class="chart-container">
            <h6>Relacionamentos por Tipo</h6>
            <div class="bar-chart">
                ${data.map(item => `
                    <div class="bar-item">
                        <div class="bar-label">${item.tipo_relacionamento}</div>
                        <div class="bar-wrapper">
                            <div class="bar" style="width: ${(item.count / Math.max(...data.map(d => d.count))) * 100}%"></div>
                        </div>
                        <div class="bar-value">${item.count}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = chartHTML;
}

// Atualizar gráfico de estatísticas GOA
function updateGOAChart(data) {
    console.log('Atualizando gráfico GOA:', data); // Debug
    
    const container = document.getElementById('goa-chart');
    if (!container) {
        console.warn('Container goa-chart não encontrado'); // Debug
        return;
    }
    
    if (!data || !Object.keys(data).length) {
        container.innerHTML = '<p class="text-muted">Nenhum dado GOA encontrado</p>';
        return;
    }
    
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    const chartHTML = `
        <div class="chart-container">
            <h6>Distribuição por Prefixo GOA</h6>
            <div class="goa-stats">
                ${entries.map(([prefixo, count]) => `
                    <div class="goa-item">
                        <span class="goa-prefixo">${prefixo}</span>
                        <span class="goa-count">${count}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = chartHTML;
}

// Atualizar atividades recentes
function updateRecentActivities(activities) {
    console.log('Atualizando atividades recentes:', activities); // Debug
    
    const container = document.getElementById('atividades-recentes');
    if (!container) {
        console.warn('Container atividades-recentes não encontrado'); // Debug
        return;
    }
    
    if (!activities) {
        container.innerHTML = '<p class="text-muted">Nenhuma atividade recente</p>';
        return;
    }
    
    // Combinar pessoas e relacionamentos recentes
    const allActivities = [];
    
    if (activities.pessoas && activities.pessoas.length) {
        activities.pessoas.forEach(p => {
            allActivities.push({
                type: 'pessoa',
                icon: p.tipo === 'F' ? 'fa-user' : 'fa-building',
                title: p.nome,
                details: `GOA: ${p.goa} | Tipo: ${p.tipo === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}`,
                time: p.created_at
            });
        });
    }
    
    if (activities.relacionamentos && activities.relacionamentos.length) {
        activities.relacionamentos.forEach(r => {
            allActivities.push({
                type: 'relacionamento',
                icon: 'fa-link',
                title: r.tipo_relacionamento,
                details: `${r.origem_nome} → ${r.destino_nome}`,
                time: r.created_at
            });
        });
    }
    
    // Ordenar por data (mais recentes primeiro)
    allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (!allActivities.length) {
        container.innerHTML = '<p class="text-muted">Nenhuma atividade recente</p>';
        return;
    }
    
    const activitiesHTML = allActivities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-type">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-details">${activity.details}</div>
                <div class="activity-time">${formatDateTime(activity.time)}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = activitiesHTML;
}

// Buscar no dashboard
async function searchDashboard(query, tipo = 'todos') {
    try {
        const data = await apiRequest(`/dashboard/search/?q=${encodeURIComponent(query)}&tipo=${tipo}`);
        
        displaySearchResults(data);
        
    } catch (error) {
        console.error('Erro na busca:', error);
        showError('Erro ao realizar busca.');
    }
}

// Exibir resultados da busca
function displaySearchResults(data) {
    const container = document.getElementById('search-results');
    const section = document.getElementById('search-results-section');
    
    if (!container || !section) return;
    
    if (!data.resultados || !data.resultados.length) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Nenhum resultado encontrado para "${data.query}"
            </div>
        `;
        section.style.display = 'block';
        return;
    }
    
    const resultsHTML = data.resultados.map(result => {
        let icon = 'fa-question';
        let detailUrl = '#';
        
        switch (result.tipo) {
            case 'pessoa_fisica':
                icon = 'fa-user';
                detailUrl = `/pessoas-fisicas/${result.id}/`;
                break;
            case 'pessoa_juridica':
                icon = 'fa-building';
                detailUrl = `/pessoas-juridicas/${result.id}/`;
                break;
            case 'relacionamento':
                icon = 'fa-link';
                detailUrl = `/relacionamentos/${result.id}/`;
                break;
        }
        
        return `
            <div class="search-result-item">
                <div class="result-type">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="result-content">
                    <div class="result-title">
                        <a href="${detailUrl}">${result.nome || result.tipo_relacionamento}</a>
                    </div>
                    <div class="result-details">${result.detalhes}</div>
                    ${result.goa ? `<div class="result-goa">GOA: ${result.goa}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="search-results-header">
            <h6>${data.total} resultado(s) encontrados para "${data.query}"</h6>
        </div>
        <div class="search-results-list">
            ${resultsHTML}
        </div>
    `;
    
    section.style.display = 'block';
}

// Funções auxiliares
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(show) {
    const loadingElements = document.querySelectorAll('.dashboard-loading');
    loadingElements.forEach(el => {
        el.style.display = show ? 'flex' : 'none';
    });
}

function showError(message) {
    console.error('Dashboard Error:', message); // Debug adicional
    
    const alertHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const container = document.querySelector('.dashboard-content') || document.querySelector('#dashboard');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alertHTML);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            const alert = container.querySelector('.alert-danger');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

// Função principal do dashboard
async function loadDashboard() {
    console.log('Carregando dashboard...'); // Debug
    
    // Verificar se há token válido
    const token = localStorage.getItem('access_token') || getCookie('access_token');
    if (!token) {
        console.warn('Token não encontrado. Redirecionando para login...');
        window.location.href = '/login/';
        return;
    }
    
    console.log('Token encontrado, carregando estatísticas...'); // Debug
    
    // Carregar estatísticas
    await loadDashboardStats();
    
    // Configurar eventos
    setupDashboardEvents();
    
    console.log('Dashboard carregado com sucesso!'); // Debug
}

// Configurar eventos do dashboard
function setupDashboardEvents() {
    // Evento de busca
    const searchInput = document.getElementById('busca-goa-dashboard');
    const searchButton = document.querySelector('[onclick="buscarGoaDashboard()"]');
    
    if (searchInput && searchButton) {
        // Busca ao digitar (com debounce)
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    searchDashboard(query);
                }, 500);
            } else {
                // Limpar resultados se busca muito curta
                const resultsContainer = document.getElementById('search-results');
                const resultsSection = document.getElementById('search-results-section');
                if (resultsContainer && resultsSection) {
                    resultsContainer.innerHTML = '';
                    resultsSection.style.display = 'none';
                }
            }
        });
        
        // Busca ao clicar no botão
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                searchDashboard(query);
            }
        });
        
        // Busca ao pressionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    searchDashboard(query);
                }
            }
        });
    }
    
    // Evento de filtro por prefixo
    const filterLinks = document.querySelectorAll('[onclick^="filtrarPorPrefixo"]');
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const prefixo = link.getAttribute('onclick').match(/'([^']+)'/)[1];
            searchDashboard(prefixo, 'pessoa');
        });
    });
    
    // Auto-refresh a cada 5 minutos
    setInterval(() => {
        console.log('Auto-refresh do dashboard...');
        loadDashboardStats();
    }, 5 * 60 * 1000);
}

// Funções globais para compatibilidade
window.buscarGoaDashboard = function() {
    const searchInput = document.getElementById('busca-goa-dashboard');
    if (searchInput) {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            searchDashboard(query);
        }
    }
};

window.filtrarPorPrefixo = function(prefixo) {
    searchDashboard(prefixo, 'pessoa');
};

// Exportar funções para uso global
window.loadDashboard = loadDashboard;
window.searchDashboard = searchDashboard;