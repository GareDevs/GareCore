/**
 * Sistema de Relacionamentos Unificado
 * Consolida todas as funcionalidades de criação e gerenciamento de vínculos
 */

class RelacionamentoManager {
    constructor() {
        this.cache = new Map();
        this.relacionamentosExistentes = new Set();
        this.estatisticas = {
            criados: 0,
            automaticos: 0,
            manuais: 0,
            erros: 0
        };
        
        console.log('🔗 RelacionamentoManager inicializado');
    }
    
    // ✅ CRIAÇÃO DE RELACIONAMENTO UNIFICADA (substitui 2 versões duplicadas)
    async criarRelacionamento(dados) {
        console.log('🔗 Criando relacionamento:', dados);
        
        // Validação unificada
        if (!this.validarDados(dados)) {
            this.estatisticas.erros++;
            return { sucesso: false, motivo: 'Dados inválidos' };
        }
        
        // Cache de verificação
        const chaveUnica = this.gerarChaveRelacionamento(dados);
        if (this.relacionamentosExistentes.has(chaveUnica)) {
            return { sucesso: false, motivo: 'Relacionamento já existe' };
        }
        
        try {
            const resultado = await api.criarRelacionamento(dados);
            
            // Atualizar cache
            this.relacionamentosExistentes.add(chaveUnica);
            this.estatisticas.criados++;
            
            if (dados.automatico) {
                this.estatisticas.automaticos++;
            } else {
                this.estatisticas.manuais++;
            }
            
            // Invalidar cache de dados
            window.DataCache.invalidateRelacionamentos();
            
            console.log('✅ Relacionamento criado:', resultado);
            return { sucesso: true, dados: resultado };
            
        } catch (error) {
            this.estatisticas.erros++;
            console.error('❌ Erro ao criar relacionamento:', error);
            return { sucesso: false, erro: error.message };
        }
    }
    
    // ✅ AUTOMAÇÃO FAMILIAR - versão otimizada e unificada
    async criarRelacionamentosAutomaticosFamilia() {
        console.log('👨‍👩‍👧‍👦 Iniciando criação automática de relacionamentos familiares...');
        
        const stats = {
            filhos: 0,
            irmaos: 0, 
            socios: 0,
            sobrenomes: 0,
            total: 0
        };
        
        try {
            // Cache de dados para evitar múltiplas consultas
            const [pessoasFisicas, pessoasJuridicas, relacionamentosExistentes] = 
                await Promise.all([
                    window.DataCache.getPessoasFisicas(),
                    window.DataCache.getPessoasJuridicas(),
                    window.DataCache.getRelacionamentos()
                ]);
            
            console.log(`📊 Processando ${pessoasFisicas.length} pessoas físicas e ${pessoasJuridicas.length} empresas`);
            
            // Atualizar cache de relacionamentos existentes
            this.atualizarCacheRelacionamentos(relacionamentosExistentes);
            
            // Processamento paralelo por tipo
            const resultados = await Promise.allSettled([
                this.processarRelacionamentosFilhos(pessoasFisicas),
                this.processarRelacionamentosIrmaos(pessoasFisicas),
                this.processarRelacionamentosSocios(pessoasFisicas, pessoasJuridicas),
                this.processarRelacionamentosSobrenomes(pessoasFisicas)
            ]);
            
            // Consolidar resultados
            resultados.forEach((resultado, index) => {
                if (resultado.status === 'fulfilled') {
                    const tipos = ['filhos', 'irmaos', 'socios', 'sobrenomes'];
                    stats[tipos[index]] = resultado.value;
                    stats.total += resultado.value;
                }
            });
            
            console.log('📈 Estatísticas finais:', stats);
            showNotification(`✅ ${stats.total} relacionamentos automáticos criados!`, 'success');
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erro na criação automática de relacionamentos:', error);
            showNotification('❌ Erro na criação automática de relacionamentos', 'error');
            return stats;
        }
    }
    
    // ✅ PESSOA ESPECÍFICA - otimizada com cache
    async criarRelacionamentosParaPessoa(pessoaId, tipoPessoa) {
        console.log(`🔍 Analisando relacionamentos para ${tipoPessoa} ${pessoaId}...`);
        
        try {
            const pessoa = await window.DataCache.getPessoa(pessoaId, tipoPessoa);
            if (!pessoa) {
                console.warn(`❌ Pessoa ${tipoPessoa} ${pessoaId} não encontrada`);
                return 0;
            }
            
            let novosRelacionamentos = 0;
            
            if (tipoPessoa === 'fisica') {
                const processadores = [
                    () => this.analisarFilhos(pessoa),
                    () => this.analisarIrmaos(pessoa),
                    () => this.analisarEmpresas(pessoa),
                    () => this.analisarSobrenomes(pessoa)
                ];
                
                const resultados = await Promise.allSettled(
                    processadores.map(fn => fn())
                );
                
                novosRelacionamentos = resultados
                    .filter(r => r.status === 'fulfilled')
                    .reduce((sum, r) => sum + (r.value || 0), 0);
                    
            } else if (tipoPessoa === 'juridica') {
                // Análise específica para empresas
                novosRelacionamentos = await this.analisarSociosEmpresa(pessoa);
            }
            
            console.log(`✅ ${novosRelacionamentos} novos relacionamentos criados para ${pessoa.nome || pessoa.razao_social}`);
            return novosRelacionamentos;
            
        } catch (error) {
            console.error(`❌ Erro ao processar pessoa ${tipoPessoa} ${pessoaId}:`, error);
            return 0;
        }
    }
    
    // ===== MÉTODOS DE PROCESSAMENTO =====
    
    async processarRelacionamentosFilhos(pessoasFisicas) {
        let novos = 0;
        
        for (const pessoa of pessoasFisicas) {
            if (!pessoa.filhos || typeof pessoa.filhos !== 'object') continue;
            
            const filhosArray = Object.values(pessoa.filhos);
            for (const filho of filhosArray) {
                if (!filho.nome?.trim()) continue;
                
                const filhoEncontrado = pessoasFisicas.find(p => 
                    p.id !== pessoa.id && 
                    p.nome && 
                    p.nome.toLowerCase().includes(filho.nome.toLowerCase())
                );
                
                if (filhoEncontrado) {
                    const sucesso = await this.criarRelacionamento({
                        pessoa_origem_id: pessoa.id,
                        pessoa_destino_id: filhoEncontrado.id,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        tipo_relacionamento: pessoa.sexo === 'Feminino' ? 'mae' : 'pai',
                        descricao: `👶 ${pessoa.sexo === 'Feminino' ? 'Mãe' : 'Pai'} de ${filhoEncontrado.nome}`,
                        automatico: true
                    });
                    
                    if (sucesso.sucesso) novos++;
                }
            }
        }
        
        console.log(`👶 Relacionamentos filhos processados: ${novos}`);
        return novos;
    }
    
    async processarRelacionamentosIrmaos(pessoasFisicas) {
        let novos = 0;
        
        for (const pessoa of pessoasFisicas) {
            if (!pessoa.irmaos || typeof pessoa.irmaos !== 'object') continue;
            
            const irmaosArray = Object.values(pessoa.irmaos);
            for (const irmao of irmaosArray) {
                if (!irmao.nome?.trim()) continue;
                
                const irmaoEncontrado = pessoasFisicas.find(p => 
                    p.id !== pessoa.id && 
                    p.nome && 
                    p.nome.toLowerCase().includes(irmao.nome.toLowerCase())
                );
                
                if (irmaoEncontrado) {
                    const sucesso = await this.criarRelacionamento({
                        pessoa_origem_id: pessoa.id,
                        pessoa_destino_id: irmaoEncontrado.id,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        tipo_relacionamento: 'irmao',
                        descricao: `👦 Irmão(s): ${irmaoEncontrado.nome}`,
                        automatico: true
                    });
                    
                    if (sucesso.sucesso) novos++;
                }
            }
        }
        
        console.log(`👦 Relacionamentos irmãos processados: ${novos}`);
        return novos;
    }
    
    async processarRelacionamentosSocios(pessoasFisicas, pessoasJuridicas) {
        let novos = 0;
        
        for (const pessoa of pessoasFisicas) {
            if (!pessoa.empresas || typeof pessoa.empresas !== 'object') continue;
            
            const empresasArray = Object.values(pessoa.empresas);
            for (const empresa of empresasArray) {
                if (!empresa.razao_social?.trim()) continue;
                
                const empresaEncontrada = pessoasJuridicas.find(pj => 
                    pj.razao_social && 
                    pj.razao_social.toLowerCase().includes(empresa.razao_social.toLowerCase())
                );
                
                if (empresaEncontrada) {
                    const sucesso = await this.criarRelacionamento({
                        pessoa_origem_id: pessoa.id,
                        pessoa_destino_id: empresaEncontrada.id,
                        tipo_origem: 'fisica',
                        tipo_destino: 'juridica',
                        tipo_relacionamento: 'socio',
                        descricao: `🤝 Sócio em ${empresaEncontrada.razao_social} (${empresa.participacao || '0%'})`,
                        automatico: true
                    });
                    
                    if (sucesso.sucesso) novos++;
                }
            }
        }
        
        console.log(`🏢 Relacionamentos sócios processados: ${novos}`);
        return novos;
    }
    
    async processarRelacionamentosSobrenomes(pessoasFisicas) {
        let novos = 0;
        
        for (const pessoa of pessoasFisicas) {
            if (!pessoa.nome?.trim()) continue;
            
            const nomeParts = pessoa.nome.trim().split(' ');
            if (nomeParts.length < 2) continue;
            
            const ultimoSobrenome = nomeParts[nomeParts.length - 1];
            if (ultimoSobrenome.length < 3) continue;
            
            const pessoasComMesmoSobrenome = pessoasFisicas.filter(p => 
                p.id !== pessoa.id && 
                p.nome && 
                p.nome.toLowerCase().includes(ultimoSobrenome.toLowerCase())
            );
            
            for (const parente of pessoasComMesmoSobrenome) {
                const sucesso = await this.criarRelacionamento({
                    pessoa_origem_id: pessoa.id,
                    pessoa_destino_id: parente.id,
                    tipo_origem: 'fisica',
                    tipo_destino: 'fisica',
                    tipo_relacionamento: 'parente',
                    descricao: `👥 Possível parentesco pelo sobrenome "${ultimoSobrenome}"`,
                    automatico: true
                });
                
                if (sucesso.sucesso) novos++;
            }
        }
        
        console.log(`👥 Relacionamentos por sobrenome processados: ${novos}`);
        return novos;
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    validarDados(dados) {
        if (!dados) return false;
        
        const camposObrigatorios = [
            'pessoa_origem_id', 'pessoa_destino_id',
            'tipo_origem', 'tipo_destino', 'tipo_relacionamento'
        ];
        
        return camposObrigatorios.every(campo => dados[campo] != null);
    }
    
    gerarChaveRelacionamento(dados) {
        const origem = `${dados.tipo_origem}_${dados.pessoa_origem_id}`;
        const destino = `${dados.tipo_destino}_${dados.pessoa_destino_id}`;
        
        // Normalizar ordem para evitar duplicatas A->B e B->A
        return [origem, destino].sort().join('|');
    }
    
    atualizarCacheRelacionamentos(relacionamentos) {
        this.relacionamentosExistentes.clear();
        
        relacionamentos.forEach(rel => {
            const chave = this.gerarChaveRelacionamento({
                pessoa_origem_id: rel.pessoa_origem_id,
                pessoa_destino_id: rel.pessoa_destino_id,
                tipo_origem: rel.tipo_origem,
                tipo_destino: rel.tipo_destino,
                tipo_relacionamento: rel.tipo_relacionamento
            });
            this.relacionamentosExistentes.add(chave);
        });
        
        console.log(`📋 Cache de relacionamentos atualizado: ${this.relacionamentosExistentes.size} entradas`);
    }
    
    async analisarFilhos(pessoa) {
        // Implementação específica para análise de filhos
        return await this.processarRelacionamentosFilhos([pessoa]);
    }
    
    async analisarIrmaos(pessoa) {
        // Implementação específica para análise de irmãos
        return await this.processarRelacionamentosIrmaos([pessoa]);
    }
    
    async analisarEmpresas(pessoa) {
        const pessoasJuridicas = await window.DataCache.getPessoasJuridicas();
        return await this.processarRelacionamentosSocios([pessoa], pessoasJuridicas);
    }
    
    async analisarSobrenomes(pessoa) {
        const pessoasFisicas = await window.DataCache.getPessoasFisicas();
        return await this.processarRelacionamentosSobrenomes([pessoa]);
    }
    
    async analisarSociosEmpresa(empresa) {
        // Análise específica para relacionamentos de empresa
        let novos = 0;
        
        if (empresa.socios && typeof empresa.socios === 'object') {
            const pessoasFisicas = await window.DataCache.getPessoasFisicas();
            
            for (const socio of Object.values(empresa.socios)) {
                if (!socio.nome?.trim()) continue;
                
                const socioEncontrado = pessoasFisicas.find(pf => 
                    pf.nome && 
                    pf.nome.toLowerCase().includes(socio.nome.toLowerCase())
                );
                
                if (socioEncontrado) {
                    const sucesso = await this.criarRelacionamento({
                        pessoa_origem_id: socioEncontrado.id,
                        pessoa_destino_id: empresa.id,
                        tipo_origem: 'fisica',
                        tipo_destino: 'juridica',
                        tipo_relacionamento: 'socio',
                        descricao: `🤝 Sócio em ${empresa.razao_social}`,
                        automatico: true
                    });
                    
                    if (sucesso.sucesso) novos++;
                }
            }
        }
        
        return novos;
    }
    
    // Estatísticas
    getEstatisticas() {
        return {
            ...this.estatisticas,
            cacheSize: this.relacionamentosExistentes.size,
            successRate: this.estatisticas.criados > 0 
                ? ((this.estatisticas.criados / (this.estatisticas.criados + this.estatisticas.erros)) * 100).toFixed(1) + '%'
                : '0%'
        };
    }
    
    // Reset
    reset() {
        this.cache.clear();
        this.relacionamentosExistentes.clear();
        this.estatisticas = {
            criados: 0,
            automaticos: 0,
            manuais: 0,
            erros: 0
        };
        console.log('🔄 RelacionamentoManager resetado');
    }
}

// Instância global
if (!window.RelacionamentoManager) {
    window.RelacionamentoManager = new RelacionamentoManager();
}

console.log('✅ Módulo RelacionamentoManager carregado');