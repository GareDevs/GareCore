/**
 * auth.js - Gerenciamento de autenticação JWT e interceptor global
 * Adiciona o token JWT a todas as requisições fetch e fornece helpers de autenticação
 */

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Decodifica um JWT e extrai o payload
 */
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (error) {
        console.error('Erro ao decodificar JWT:', error);
        return null;
    }
}

/**
 * Verifica se o token está expirado
 */
function isTokenExpired(token) {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
}

/**
 * Faz refresh do token usando o refresh token
 */
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    try {
        const response = await originalFetch('/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            const newToken = data.access;
            localStorage.setItem('access_token', newToken);
            
            // Atualiza o cookie também
            const decoded = decodeJWT(newToken);
            if (decoded && decoded.exp) {
                const maxAge = decoded.exp - Math.floor(Date.now() / 1000);
                document.cookie = `access_token=${newToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
            }
            
            console.log('✅ Token renovado com sucesso');
            return true;
        }
    } catch (error) {
        console.error('Erro ao renovar token:', error);
    }
    return false;
}

// ==========================================
// INTERCEPTOR DE REQUISIÇÕES
// ==========================================

// Armazena a função original de fetch
const originalFetch = window.fetch;

// Substitui a função fetch com um wrapper que adiciona o token JWT
window.fetch = async function(...args) {
    const [resource, config] = args;
    const resourceStr = typeof resource === 'string' ? resource : resource.url;
    
    // Não adiciona token para rotas públicas
    const publicRoutes = ['/login/', '/registro/', '/api/login/', '/api/registro/', '/api/token/refresh/'];
    const isPublicRoute = publicRoutes.some(route => resourceStr.includes(route));
    
    if (!isPublicRoute) {
        let token = localStorage.getItem('access_token');
        
        // Verifica se o token está expirado e tenta renovar
        if (token && isTokenExpired(token)) {
            console.warn('⚠️ Token expirado, tentando renovar...');
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                token = localStorage.getItem('access_token');
            } else {
                // Não conseguiu renovar, logout
                logout();
                return originalFetch(...args);
            }
        }
        
        if (token) {
            const newConfig = {
                ...config,
                headers: {
                    ...(config?.headers || {}),
                    'Authorization': `Bearer ${token}`
                }
            };
            return originalFetch(resource, newConfig);
        }
    }
    
    // Se for rota pública ou sem token, faz a requisição normal
    return originalFetch(...args);
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * logout() - Faz logout do usuário
 */
async function logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
        if (refreshToken) {
            // Tenta fazer logout na API
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
        console.error('Erro ao fazer logout na API:', error);
    }
    
    // Remove tokens do localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Remove cookie de autenticação
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
    
    // Redireciona para login
    window.location.href = '/login/';
}

/**
 * Verifica se o usuário está autenticado
 */
function isAuthenticated() {
    return !!localStorage.getItem('access_token');
}

/**
 * Retorna o token JWT atual
 */
function getAuthToken() {
    return localStorage.getItem('access_token');
}

/**
 * Faz requisição autenticada
 */
async function authenticatedFetch(url, options = {}) {
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
    
    // Se retornar 401, redireciona para login
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login/';
        return null;
    }
    
    return response;
}

/**
 * Inicializa o sistema de autenticação
 * Verifica se o usuário está autenticado e redireciona se necessário
 */
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login/' || currentPath === '/login';
    
    // Se estiver em página protegida, verifica autenticação
    if (!isLoginPage && !currentPath.startsWith('/static/') && !currentPath.startsWith('/media/')) {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            // Sem token, redireciona para login
            window.location.href = '/login/';
            return;
        }
    }
});

// ==========================================
// EVENT LISTENERS GLOBAIS
// ==========================================

// Detecta 401 em todas as requisições
document.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login/';
            }
            return response;
        })
    );
});

// Expõe funções globalmente
window.AuthAPI = {
    logout,
    isAuthenticated,
    getAuthToken,
    authenticatedFetch
};

console.log('✅ Sistema de autenticação JWT carregado');
