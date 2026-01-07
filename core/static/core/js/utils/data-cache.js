/**
 * Sistema de Cache de Dados Unificado
 * Cache inteligente com TTL para otimizar performance das consultas API
 */

class DataCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutos
        this.stats = {
            hits: 0,
            misses: 0,
            invalidations: 0
        };
        
        console.log('🗄️ Sistema de cache inicializado (TTL: 5min)');
    }
    
    // ✅ Cache inteligente com TTL
    async getPessoasFisicas() {
        return this.getCachedData('pessoas_fisicas', async () => {
            const response = await api.listarPessoasFisicas();
            return response.results || response;
        });
    }
    
    async getPessoasJuridicas() {
        return this.getCachedData('pessoas_juridicas', async () => {
            const response = await api.listarPessoasJuridicas();
            return response.results || response;
        });
    }
    
    async getRelacionamentos() {
        return this.getCachedData('relacionamentos', async () => {
            const response = await api.listarRelacionamentos();
            return response.results || response;
        });
    }
    
    async getPessoa(id, tipo) {
        const chave = `${tipo}_${id}`;
        return this.getCachedData(chave, async () => {
            if (tipo === 'fisica') {
                return await api.obterPessoaFisica(id);
            } else {
                return await api.obterPessoaJuridica(id);
            }
        });
    }
    
    // Core do sistema de cache
    async getCachedData(key, fetcher) {
        const cached = this.cache.get(key);
        const now = Date.now();
        
        // Verificar se dados estão válidos
        if (cached && (now - cached.timestamp) < this.ttl) {
            this.stats.hits++;
            console.log(`📋 Cache HIT: ${key} (${this.stats.hits} hits total)`);
            return cached.data;
        }
        
        // Buscar dados fresh
        this.stats.misses++;
        console.log(`🔄 Cache MISS: ${key} (${this.stats.misses} misses total)`);
        
        try {
            const data = await fetcher();
            this.cache.set(key, { 
                data, 
                timestamp: now,
                size: JSON.stringify(data).length 
            });
            
            console.log(`💾 Dados cacheados: ${key} (${data?.length || 0} registros)`);
            return data;
            
        } catch (error) {
            console.error(`❌ Erro ao cachear ${key}:`, error);
            throw error;
        }
    }
    
    // Invalidar cache quando dados mudam
    invalidate(pattern) {
        const before = this.cache.size;
        let removed = 0;
        
        for (const key of this.cache.keys()) {
            if (!pattern || key.includes(pattern)) {
                this.cache.delete(key);
                removed++;
            }
        }
        
        this.stats.invalidations++;
        console.log(`🗑️ Cache invalidado: ${removed} chaves removidas (padrão: ${pattern || 'TODOS'})`);
        
        return removed;
    }
    
    // Invalidar cache por tipo específico
    invalidatePessoas(tipo = null) {
        if (tipo) {
            return this.invalidate(tipo === 'fisica' ? 'pessoas_fisicas' : 'pessoas_juridicas');
        } else {
            return this.invalidate('pessoas_');
        }
    }
    
    invalidateRelacionamentos() {
        return this.invalidate('relacionamentos');
    }
    
    // Limpar completamente o cache
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`🧹 Cache completamente limpo (${size} chaves removidas)`);
        return size;
    }
    
    // Estatísticas do cache
    getStats() {
        const totalSize = Array.from(this.cache.values())
            .reduce((sum, item) => sum + (item.size || 0), 0);
            
        return {
            entries: this.cache.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            invalidations: this.stats.invalidations,
            hitRate: this.stats.hits + this.stats.misses > 0 
                ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
                : '0%',
            totalSizeKB: (totalSize / 1024).toFixed(1) + 'KB',
            ttlMinutes: this.ttl / 60000
        };
    }
    
    // Debug - listar todas as chaves
    listKeys() {
        return Array.from(this.cache.keys());
    }
    
    // Pré-carregar dados essenciais
    async preload() {
        console.log('🚀 Pré-carregando dados essenciais...');
        
        const start = Date.now();
        
        try {
            await Promise.all([
                this.getPessoasFisicas(),
                this.getPessoasJuridicas(),
                this.getRelacionamentos()
            ]);
            
            const duration = Date.now() - start;
            console.log(`✅ Pré-carregamento concluído em ${duration}ms`);
            
            return this.getStats();
            
        } catch (error) {
            console.error('❌ Erro no pré-carregamento:', error);
            throw error;
        }
    }
}

// Instância global única
if (!window.DataCache) {
    window.DataCache = new DataCache();
}

// Auto-limpeza periódica (a cada hora)
setInterval(() => {
    const stats = window.DataCache.getStats();
    console.log('🕐 Limpeza automática do cache:', stats);
    
    // Se cache muito grande, limpar
    if (stats.entries > 50) {
        window.DataCache.clear();
    }
}, 60 * 60 * 1000); // 1 hora

console.log('✅ Módulo DataCache carregado');