/**
 * Sistema de Busca Inteligente
 * Implementa busca avançada com score de relevância e foco na árvore
 */

class BuscaInteligente {
    constructor() {
        this.resultadosCache = new Map();
        this.ultimaBusca = '';
        this.timeoutBusca = null;
        
        console.log('🔍 Sistema de Busca Inteligente inicializado');
    }
    
    // ✅ Função principal: pesquisarEExibirPessoaNaArvore() - do plano original
    // Aceita termo como parâmetro (para busca por GOA) ou usa campo de busca
    async pesquisarEExibirPessoaNaArvore(termoParam = null) {
        let termo;
        
        // Se termo for passado como parâmetro, usar ele
        if (termoParam && typeof termoParam === 'string') {
            termo = termoParam.trim();
        } else {
            // Senão, buscar do campo de busca
            const campo = document.getElementById('busca-arvore');
            if (!campo) {
                console.warn('❌ Campo de busca não encontrado');
                return null;
            }
            termo = campo.value.trim();
        }
        
        // Validação mínima
        if (termo.length < 2) {
            this.limparResultados();
            return null;
        }
        
        console.log(`🔍 Buscando: "${termo}"`);
        
        try {
            // 1. Buscar pessoa por termo
            const pessoa = await this.buscarPessoaPorTermo(termo);
            
            if (!pessoa) {
                this.mostrarSemResultados(termo);
                return null;
            }
            
            // 2. Criar relacionamentos automáticos para a pessoa
            console.log(`🔗 Criando relacionamentos para ${pessoa.nome || pessoa.razao_social}...`);
            if (window.RelacionamentoManager) {
                await window.RelacionamentoManager.criarRelacionamentosParaPessoa(pessoa.id, pessoa.tipo);
            }
            
            // 3. Renderizar árvore com foco na pessoa
            await this.renderizarArvoreComFoco(pessoa);
            
            // 4. Centralizar pessoa na árvore
            this.centralizarPessoaNaArvore(`${pessoa.tipo}_${pessoa.id}`);
            
            // 5. Mostrar informações da pessoa encontrada
            this.mostrarInfoPessoaEncontrada(pessoa);
            
            showNotification(`✅ Pessoa encontrada: ${pessoa.nome || pessoa.razao_social}`, 'success');
            
            // Retornar pessoa encontrada para uso em outras funções
            return pessoa;
            
        } catch (error) {
            console.error('❌ Erro na busca:', error);
            showNotification('❌ Erro ao buscar pessoa', 'error');
            return null;
        }
    }
    
    // ✅ Função do plano: buscarPessoaPorTermo() com score de relevância
    async buscarPessoaPorTermo(termo) {
        console.log(`🔎 Analisando termo: "${termo}"`);
        
        // Cache de resultados para termos repetidos
        if (this.resultadosCache.has(termo)) {
            console.log('📋 Usando resultado cacheado');
            return this.resultadosCache.get(termo);
        }
        
        const [pessoasFisicas, pessoasJuridicas] = await Promise.all([
            window.DataCache.getPessoasFisicas(),
            window.DataCache.getPessoasJuridicas()
        ]);
        
        const resultados = [];
        
        // Busca em pessoas físicas
        pessoasFisicas.forEach(pessoa => {
            const score = this.calcularScoreBusca(pessoa, termo, 'fisica');
            if (score > 0) {
                // Usar pessoa_id se disponível (da API), senão usar id
                const pessoaId = pessoa.pessoa_id || pessoa.id;
                resultados.push({ 
                    ...pessoa, 
                    id: pessoaId,
                    tipo: 'fisica', 
                    score,
                    nome_display: pessoa.nome || 'Nome não informado'
                });
            }
        });
        
        // Busca em pessoas jurídicas  
        pessoasJuridicas.forEach(pessoa => {
            const score = this.calcularScoreBusca(pessoa, termo, 'juridica');
            if (score > 0) {
                // Usar pessoa_id se disponível (da API), senão usar id
                const pessoaId = pessoa.pessoa_id || pessoa.id;
                resultados.push({ 
                    ...pessoa, 
                    id: pessoaId,
                    tipo: 'juridica', 
                    score,
                    nome_display: pessoa.razao_social || pessoa.nome_fantasia || 'Razão social não informada'
                });
            }
        });
        
        // Ordenar por score (maior primeiro)
        resultados.sort((a, b) => b.score - a.score);
        
        console.log(`📊 ${resultados.length} resultados encontrados:`, 
            resultados.slice(0, 3).map(r => `${r.nome_display} (score: ${r.score})`));
        
        const melhorResultado = resultados[0] || null;
        
        // Cache do resultado
        this.resultadosCache.set(termo, melhorResultado);
        
        return melhorResultado;
    }
    
    // ✅ Função do plano: calcularScoreBusca() - sistema de pontuação 0-100
    calcularScoreBusca(pessoa, termo, tipo) {
        let score = 0;
        const termoLower = termo.toLowerCase();
        const termoLimpo = termo.replace(/\D/g, ''); // Só números
        
        if (tipo === 'fisica') {
            const nome = pessoa.nome?.toLowerCase() || '';
            const cpf = pessoa.cpf?.replace(/\D/g, '') || '';
            const goa = pessoa.goa?.toString() || '';
            
            // Nome - pontuações diferenciadas
            if (nome === termoLower) {
                score += 100; // Match exato = 100 pontos
            } else if (nome.startsWith(termoLower)) {
                score += 80;  // Começa com = 80 pontos
            } else if (nome.includes(termoLower)) {
                score += 60;  // Contém = 60 pontos
            }
            
            // Busca por palavras individuais do nome
            if (score === 0 && nome.length > 0) {
                const palavrasNome = nome.split(' ');
                const palavrasTermo = termoLower.split(' ');
                
                palavrasTermo.forEach(palavraTermo => {
                    palavrasNome.forEach(palavraNome => {
                        if (palavraNome.includes(palavraTermo) && palavraTermo.length > 2) {
                            score += 40; // Match parcial por palavra
                        }
                    });
                });
            }
            
            // CPF - alta prioridade para documentos
            if (termoLimpo && cpf.includes(termoLimpo)) {
                score += 90;
            }
            
            // GOA - prioridade alta para busca por código
            // GOA está na tabela pessoa pai, acessível via pessoa.goa ou pessoa.pessoa?.goa
            const goaPessoa = pessoa.goa || pessoa.pessoa?.goa || '';
            const goaUpper = goaPessoa.toString().toUpperCase();
            const termoUpper = termo.toUpperCase();
            
            if (goaUpper && goaUpper === termoUpper) {
                score += 100; // Match exato de GOA = máxima prioridade
            } else if (goaUpper && goaUpper.includes(termoUpper)) {
                score += 85; // GOA contém o termo
            }
            
            // Telefones
            [pessoa.telefone1, pessoa.telefone2, pessoa.telefone3, pessoa.telefone4, pessoa.telefone5].forEach(tel => {
                if (tel && tel.replace(/\D/g, '').includes(termoLimpo)) {
                    score += 30;
                }
            });
            
            // Endereços
            [pessoa.endereco1, pessoa.endereco2, pessoa.endereco3, pessoa.endereco4, pessoa.endereco5].forEach(end => {
                if (end && end.toLowerCase().includes(termoLower)) {
                    score += 20;
                }
            });
            
        } else if (tipo === 'juridica') {
            const razaoSocial = pessoa.razao_social?.toLowerCase() || '';
            const nomeFantasia = pessoa.nome_fantasia?.toLowerCase() || '';
            const cnpj = pessoa.cnpj?.replace(/\D/g, '') || '';
            
            // GOA da empresa - também verificar
            const goaPJ = pessoa.goa || pessoa.pessoa?.goa || '';
            const goaUpper = goaPJ.toString().toUpperCase();
            const termoUpper = termo.toUpperCase();
            
            if (goaUpper && goaUpper === termoUpper) {
                score += 100; // Match exato de GOA
            } else if (goaUpper && goaUpper.includes(termoUpper)) {
                score += 85;
            }
            
            // Razão social - prioridade máxima
            if (razaoSocial === termoLower) {
                score += 100;
            } else if (razaoSocial.includes(termoLower)) {
                score += 70;
            }
            
            // Nome fantasia
            if (nomeFantasia === termoLower) {
                score += 90;
            } else if (nomeFantasia.includes(termoLower)) {
                score += 60;
            }
            
            // CNPJ
            if (termoLimpo && cnpj.includes(termoLimpo)) {
                score += 95;
            }
            
            // Endereço
            if (pessoa.endereco && pessoa.endereco.toLowerCase().includes(termoLower)) {
                score += 25;
            }
        }
        
        return Math.min(score, 100); // Cap em 100
    }
    
    // ✅ Função do plano: renderizarArvoreComFoco()
    async renderizarArvoreComFoco(pessoaEncontrada) {
        console.log(`🎯 Renderizando árvore com foco em: ${pessoaEncontrada.nome_display}`);
        
        try {
            // 1. Preparar dados focados na pessoa
            const dados = await this.prepararDadosComFoco(pessoaEncontrada);
            
            // 2. Verificar se ArvoreCore existe
            if (window.ArvoreCore) {
                // Nova versão - usar ArvoreCore
                window.ArvoreCore.renderizarComFoco(dados, pessoaEncontrada);
            } else {
                // Fallback - usar sistema existente
                this.renderizarComSistemaExistente(dados, pessoaEncontrada);
            }
            
        } catch (error) {
            console.error('❌ Erro ao renderizar árvore com foco:', error);
            // Fallback - renderizar árvore normal
            if (typeof renderizarArvoreInterativa === 'function') {
                await renderizarArvoreInterativa();
            }
        }
    }
    
    // ✅ Função do plano: prepararDadosComFoco()
    async prepararDadosComFoco(pessoaEncontrada) {
        console.log(`📋 Preparando dados com foco para: ${pessoaEncontrada.nome_display}`);
        
        // 1. Obter relacionamentos da pessoa
        const relacionamentos = await this.obterRelacionamentosDaPessoa(
            pessoaEncontrada.id, 
            pessoaEncontrada.tipo
        );
        
        // 2. Criar nó principal (pessoa encontrada)
        const nodes = [{
            id: `${pessoaEncontrada.tipo}_${pessoaEncontrada.id}`,
            nome: pessoaEncontrada.nome_display,
            tipo: pessoaEncontrada.tipo,
            isPrincipal: true, // Marcar como nó principal
            ...pessoaEncontrada
        }];
        
        const links = [];
        const pessoasRelacionadas = new Set();
        
        // 3. Processar cada relacionamento
        for (const rel of relacionamentos) {
            let pessoaRelacionada = null;
            let isOrigem = false;
            
            // Determinar qual pessoa é a relacionada
            if (rel.pessoa_origem_id == pessoaEncontrada.id && rel.tipo_origem === pessoaEncontrada.tipo) {
                // Pessoa encontrada é origem, buscar destino
                pessoaRelacionada = await window.DataCache.getPessoa(rel.pessoa_destino_id, rel.tipo_destino);
                pessoaRelacionada.tipo = rel.tipo_destino;
                isOrigem = true;
            } else if (rel.pessoa_destino_id == pessoaEncontrada.id && rel.tipo_destino === pessoaEncontrada.tipo) {
                // Pessoa encontrada é destino, buscar origem
                pessoaRelacionada = await window.DataCache.getPessoa(rel.pessoa_origem_id, rel.tipo_origem);
                pessoaRelacionada.tipo = rel.tipo_origem;
                isOrigem = false;
            }
            
            if (pessoaRelacionada) {
                const nodeId = `${pessoaRelacionada.tipo}_${pessoaRelacionada.id}`;
                
                // Adicionar nó se ainda não existe
                if (!pessoasRelacionadas.has(nodeId)) {
                    nodes.push({
                        id: nodeId,
                        nome: pessoaRelacionada.nome || pessoaRelacionada.razao_social || 'Nome não informado',
                        tipo: pessoaRelacionada.tipo,
                        isPrincipal: false,
                        ...pessoaRelacionada
                    });
                    pessoasRelacionadas.add(nodeId);
                }
                
                // Adicionar link
                const sourceId = isOrigem ? `${pessoaEncontrada.tipo}_${pessoaEncontrada.id}` : nodeId;
                const targetId = isOrigem ? nodeId : `${pessoaEncontrada.tipo}_${pessoaEncontrada.id}`;
                
                links.push({
                    source: sourceId,
                    target: targetId,
                    relationship: rel.tipo_relacionamento,
                    description: rel.descricao,
                    id: rel.id
                });
            }
        }
        
        console.log(`📊 Dados preparados: ${nodes.length} nós, ${links.length} links`);
        
        return { nodes, links };
    }
    
    // ✅ Função do plano: centralizarPessoaNaArvore()
    centralizarPessoaNaArvore(nodeId) {
        console.log(`🎯 Centralizando nó: ${nodeId}`);
        
        try {
            const svg = d3.select('#arvore-container svg');
            if (svg.empty()) {
                console.warn('❌ SVG da árvore não encontrado');
                return;
            }
            
            // Encontrar nó no SVG
            const node = svg.select(`[data-node-id="${nodeId}"]`);
            if (node.empty()) {
                console.warn(`❌ Nó ${nodeId} não encontrado no SVG`);
                return;
            }
            
            // Obter posição do nó
            const nodeData = node.datum();
            if (!nodeData) return;
            
            const containerRect = document.getElementById('arvore-container').getBoundingClientRect();
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;
            
            // Calcular transformação para centralizar
            const transform = d3.zoomIdentity
                .translate(centerX - nodeData.x, centerY - nodeData.y)
                .scale(1.5); // Zoom ligeiro para destacar
            
            // Aplicar transformação suave
            svg.transition()
                .duration(1000)
                .call(d3.zoom().transform, transform);
            
            // Destacar nó temporariamente
            node.select('circle')
                .transition()
                .duration(500)
                .attr('stroke', '#ff6b35')
                .attr('stroke-width', 6)
                .transition()
                .delay(1500)
                .duration(500)
                .attr('stroke', '#fff')
                .attr('stroke-width', 3);
                
            console.log('✅ Nó centralizado e destacado');
            
        } catch (error) {
            console.error('❌ Erro ao centralizar nó:', error);
        }
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    async obterRelacionamentosDaPessoa(pessoaId, tipoPessoa) {
        const todosRelacionamentos = await window.DataCache.getRelacionamentos();
        
        return todosRelacionamentos.filter(rel => 
            (rel.pessoa_origem_id == pessoaId && rel.tipo_origem === tipoPessoa) ||
            (rel.pessoa_destino_id == pessoaId && rel.tipo_destino === tipoPessoa)
        );
    }
    
    renderizarComSistemaExistente(dados, pessoaEncontrada) {
        console.log('🔄 Usando sistema de renderização existente');
        
        // Usar função existente se disponível
        if (typeof renderizarArvoreInterativa === 'function') {
            renderizarArvoreInterativa();
        } else if (typeof renderizarArvore === 'function') {
            renderizarArvore();
        }
    }
    
    mostrarInfoPessoaEncontrada(pessoa) {
        const info = `
            <div class="pessoa-encontrada-info">
                <h5>👤 Pessoa Encontrada</h5>
                <p><strong>Nome:</strong> ${pessoa.nome_display}</p>
                <p><strong>Tipo:</strong> ${pessoa.tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                <p><strong>Score:</strong> ${pessoa.score}/100</p>
                ${pessoa.cpf ? `<p><strong>CPF:</strong> ${pessoa.cpf}</p>` : ''}
                ${pessoa.cnpj ? `<p><strong>CNPJ:</strong> ${pessoa.cnpj}</p>` : ''}
                ${pessoa.goa ? `<p><strong>GOA:</strong> ${pessoa.goa}</p>` : ''}
            </div>
        `;
        
        // Mostrar em modal ou área específica se existir
        const infoArea = document.getElementById('info-pessoa-encontrada');
        if (infoArea) {
            infoArea.innerHTML = info;
            infoArea.style.display = 'block';
        }
    }
    
    mostrarSemResultados(termo) {
        console.log(`❌ Nenhum resultado para: "${termo}"`);
        showNotification(`❌ Nenhuma pessoa encontrada para "${termo}"`, 'warning');
        
        const container = document.getElementById('resultados-busca-arvore');
        if (container) {
            container.innerHTML = `
                <div class="sem-resultados">
                    <i class="fas fa-search"></i>
                    <p>Nenhum resultado encontrado para "<strong>${termo}</strong>"</p>
                    <small>Tente buscar por nome, CPF, CNPJ ou GOA</small>
                </div>
            `;
        }
    }
    
    limparResultados() {
        const container = document.getElementById('resultados-busca-arvore');
        if (container) {
            container.innerHTML = '';
        }
        
        const infoArea = document.getElementById('info-pessoa-encontrada');
        if (infoArea) {
            infoArea.style.display = 'none';
        }
    }
    
    // Busca com debounce para performance
    configurarBuscaComDebounce(campo, delay = 300) {
        if (!campo) return;
        
        campo.addEventListener('input', () => {
            clearTimeout(this.timeoutBusca);
            this.timeoutBusca = setTimeout(() => {
                this.pesquisarEExibirPessoaNaArvore();
            }, delay);
        });
        
        campo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(this.timeoutBusca);
                this.pesquisarEExibirPessoaNaArvore();
            }
        });
    }
    
    // Limpar cache de resultados
    limparCache() {
        this.resultadosCache.clear();
        console.log('🗑️ Cache de busca limpo');
    }
}

// Instância global
if (!window.BuscaInteligente) {
    window.BuscaInteligente = new BuscaInteligente();
}

console.log('✅ Módulo BuscaInteligente carregado');