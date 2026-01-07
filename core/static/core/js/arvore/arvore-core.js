/**
 * Núcleo Unificado da Árvore Interativa
 * Consolida todas as funcionalidades principais em uma classe central
 */

class ArvoreCore {
    constructor() {
        this.relacionamentoManager = window.RelacionamentoManager;
        this.buscaInteligente = window.BuscaInteligente;
        this.layoutManager = window.LayoutManager;
        this.interfaceManager = window.InterfaceManager;
        
        this.config = {
            layoutAtivo: 'forca',
            zoomAtual: 1,
            centroAtual: { x: 0, y: 0 },
            nosExpandidos: new Set(),
            containerWidth: 0,
            containerHeight: 0
        };
        
        this.simulacao = null;
        this.svg = null;
        this.container = null;
        
        console.log('🌳 ArvoreCore inicializado');
    }
    
    // ✅ INICIALIZAÇÃO UNIFICADA
    async inicializar() {
        console.log('🚀 Inicializando Árvore Interativa Completa...');
        
        try {
            // 1. Verificar container
            this.container = document.getElementById('arvore-container');
            if (!this.container) {
                throw new Error('Container #arvore-container não encontrado');
            }
            
            // 2. Pré-carregar dados essenciais
            showNotification('📊 Carregando dados...', 'info');
            await window.DataCache.preload();
            
            // 3. Configurar interface
            this.configurarEventListeners();
            this.configurarControles();
            
            // 4. Renderizar árvore inicial
            await this.renderizarArvoreInterativa();
            
            // 5. Configurar busca inteligente
            this.configurarBuscaInteligente();
            
            showNotification('✅ Árvore Interativa inicializada com sucesso!', 'success');
            console.log('🎉 Árvore Interativa totalmente funcional!');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            showNotification(`❌ Erro na inicialização: ${error.message}`, 'error');
            return false;
        }
    }
    
    // ✅ RENDERIZAÇÃO PRINCIPAL OTIMIZADA
    async renderizarArvoreInterativa() {
        if (!this.container) {
            console.error('❌ Container não encontrado');
            return;
        }
        
        console.log('🎨 Renderizando árvore interativa...');
        
        try {
            // 1. Preparar dados otimizados
            const dados = await this.prepararDadosOtimizados();
            
            if (!dados.nodes.length) {
                this.mostrarArvoreVazia();
                return;
            }
            
            // 2. Configurar dimensões
            this.atualizarDimensoes();
            
            // 3. Limpar container anterior
            this.limparContainer();
            
            // 4. Criar SVG principal
            this.criarSVG();
            
            // 5. Configurar simulação baseada no layout ativo
            this.simulacao = this.layoutManager.aplicarLayout(
                this.config.layoutAtivo,
                dados,
                this.config.containerWidth,
                this.config.containerHeight
            );
            
            // 6. Criar elementos visuais interativos
            this.criarElementosInterativos(dados);
            
            // 7. Configurar zoom e pan
            this.configurarZoomEPan();
            
            // 8. Atualizar estatísticas
            this.atualizarEstatisticas(dados);
            
            console.log(`✅ Árvore renderizada: ${dados.nodes.length} nós, ${dados.links.length} links`);
            
        } catch (error) {
            console.error('❌ Erro na renderização:', error);
            showNotification('❌ Erro ao renderizar árvore', 'error');
            this.mostrarErroRenderizacao(error);
        }
    }
    
    // ✅ RENDERIZAÇÃO COM FOCO (para busca)
    async renderizarComFoco(dados, pessoaEncontrada) {
        console.log(`🎯 Renderizando com foco em: ${pessoaEncontrada.nome_display}`);
        
        // Temporariamente alterar dados globais para incluir apenas o foco
        const dadosOriginais = await this.prepararDadosOtimizados();
        
        // Renderizar com dados focados
        await this.renderizarComDadosEspecificos(dados);
        
        // Centralizar na pessoa encontrada após renderização
        setTimeout(() => {
            this.buscaInteligente.centralizarPessoaNaArvore(`${pessoaEncontrada.tipo}_${pessoaEncontrada.id}`);
        }, 500);
    }
    
    async renderizarComDadosEspecificos(dados) {
        if (!this.container) return;
        
        // Configurar dimensões
        this.atualizarDimensoes();
        
        // Limpar container
        this.limparContainer();
        
        // Criar SVG
        this.criarSVG();
        
        // Configurar simulação
        this.simulacao = this.layoutManager.aplicarLayout(
            this.config.layoutAtivo,
            dados,
            this.config.containerWidth,
            this.config.containerHeight
        );
        
        // Criar elementos
        this.criarElementosInterativos(dados);
        
        // Configurar controles
        this.configurarZoomEPan();
    }
    
    // ✅ PREPARAÇÃO DE DADOS OTIMIZADA
    async prepararDadosOtimizados() {
        console.log('📋 Preparando dados da árvore...');
        
        // Cache inteligente evita múltiplas consultas
        const [pessoasFisicas, pessoasJuridicas, relacionamentos] = await Promise.all([
            window.DataCache.getPessoasFisicas(),
            window.DataCache.getPessoasJuridicas(),
            window.DataCache.getRelacionamentos()
        ]);
        
        const nodes = [];
        const links = [];
        const nodeIds = new Set();
        
        // Processamento paralelo para melhor performance
        const [nosPF, nosPJ, linksProcessados] = await Promise.all([
            this.processarPessoasFisicas(pessoasFisicas),
            this.processarPessoasJuridicas(pessoasJuridicas),
            this.processarRelacionamentos(relacionamentos)
        ]);
        
        // Consolidar nós
        nosPF.forEach(no => {
            if (!nodeIds.has(no.id)) {
                nodes.push(no);
                nodeIds.add(no.id);
            }
        });
        
        nosPJ.forEach(no => {
            if (!nodeIds.has(no.id)) {
                nodes.push(no);
                nodeIds.add(no.id);
            }
        });
        
        // Filtrar links para nós existentes
        linksProcessados.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
                links.push(link);
            }
        });
        
        console.log(`📊 Dados preparados: ${nodes.length} nós, ${links.length} links`);
        
        return { nodes, links };
    }
    
    async processarPessoasFisicas(pessoasFisicas) {
        return pessoasFisicas.map(pessoa => {
            // Usar pessoa_id se disponível (da API), senão usar id
            const pessoaId = pessoa.pessoa_id || pessoa.id;
            return {
                id: `fisica_${pessoaId}`,
                nome: pessoa.nome || 'Nome não informado',
                tipo: 'fisica',
                originalData: pessoa,
                cor: this.obterCorPersonalizada(`fisica_${pessoaId}`, '#4facfe'),
                foto: this.obterFotoPersonalizada(`fisica_${pessoaId}`),
                goa: pessoa.goa,
                ...pessoa
            };
        });
    }
    
    async processarPessoasJuridicas(pessoasJuridicas) {
        return pessoasJuridicas.map(empresa => {
            // Usar pessoa_id se disponível (da API), senão usar id
            const pessoaId = empresa.pessoa_id || empresa.id;
            return {
                id: `juridica_${pessoaId}`,
                nome: empresa.razao_social || empresa.nome_fantasia || 'Razão social não informada',
                tipo: 'juridica',
                originalData: empresa,
                cor: this.obterCorPersonalizada(`juridica_${pessoaId}`, '#43e97b'),
                foto: this.obterFotoPersonalizada(`juridica_${pessoaId}`),
                goa: empresa.goa,
                ...empresa
            };
        });
    }
    
    async processarRelacionamentos(relacionamentos) {
        return relacionamentos.map(rel => {
            // Converter tipo do banco (F/J) para nomenclatura interna (fisica/juridica)
            const tipoOrigemConv = (rel.tipo_origem === 'F' || rel.tipo_origem === 'fisica') ? 'fisica' : 'juridica';
            const tipoDestinoConv = (rel.tipo_destino === 'F' || rel.tipo_destino === 'fisica') ? 'fisica' : 'juridica';
            
            return {
                source: `${tipoOrigemConv}_${rel.pessoa_origem_id || rel.pessoa_origem}`,
                target: `${tipoDestinoConv}_${rel.pessoa_destino_id || rel.pessoa_destino}`,
                relationship: rel.tipo_relacionamento?.toLowerCase() || 'vinculo',
                description: rel.descricao,
                id: rel.id,
                automatico: rel.eh_auto || rel.automatico || false
            };
        });
    }
    
    // ✅ CRIAÇÃO DE ELEMENTOS VISUAIS INTERATIVOS
    criarElementosInterativos(dados) {
        console.log('🎨 Criando elementos visuais interativos...');
        
        const g = this.svg.append('g').attr('class', 'arvore-content');
        
        // 1. Definições (gradientes, filtros, setas)
        this.criarDefinicoesSVG();
        
        // 2. Links (conexões)
        this.criarLinksInterativos(g, dados.links);
        
        // 3. Nós (pessoas/empresas)
        this.criarNosInterativos(g, dados.nodes);
        
        // 4. Configurar simulação
        if (this.simulacao) {
            this.configurarSimulacao(dados);
        }
    }
    
    criarDefinicoesSVG() {
        let defs = this.svg.select('defs');
        if (defs.empty()) {
            defs = this.svg.append('defs');
        }
        
        // Seta para direção dos relacionamentos
        defs.selectAll('marker').remove();
        
        // Seta padrão (cinza)
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#666')
            .style('stroke', 'none');
        
        // Setas coloridas por tipo de relacionamento
        const coresSetas = {
            'mae': '#ff6b6b', 'pai': '#4ecdc4', 'filho': '#96ceb4',
            'irmao': '#45b7d1', 'socio': '#feca57', 'parente': '#ff9ff3'
        };
        
        Object.entries(coresSetas).forEach(([tipo, cor]) => {
            defs.append('marker')
                .attr('id', `arrowhead-${tipo}`)
                .attr('viewBox', '-0 -5 10 10')
                .attr('refX', 25)
                .attr('refY', 0)
                .attr('orient', 'auto')
                .attr('markerWidth', 10)
                .attr('markerHeight', 10)
                .append('path')
                .attr('d', 'M 0,-5 L 10,0 L 0,5')
                .attr('fill', cor)
                .style('stroke', 'none');
        });
        
        // Gradientes para pessoas físicas
        this.criarGradiente(defs, 'gradient-fisica', '#4facfe', '#00f2fe');
        this.criarGradiente(defs, 'gradient-juridica', '#43e97b', '#38f9d7');
        
        // Filtro de sombra
        const filter = defs.append('filter')
            .attr('id', 'shadow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        
        filter.append('feDropShadow')
            .attr('dx', 2)
            .attr('dy', 2)
            .attr('stdDeviation', 3)
            .attr('flood-opacity', 0.3);
    }
    
    criarGradiente(defs, id, cor1, cor2) {
        const gradient = defs.append('linearGradient').attr('id', id);
        gradient.append('stop').attr('offset', '0%').attr('stop-color', cor1);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', cor2);
    }
    
    criarLinksInterativos(g, links) {
        const linkGroup = g.append('g').attr('class', 'links');
        
        const link = linkGroup.selectAll('g')
            .data(links)
            .enter()
            .append('g')
            .attr('class', 'link');
        
        // Linha da conexão com setas coloridas
        link.append('line')
            .attr('stroke', d => this.getRelationshipColor(d.relationship))
            .attr('stroke-width', d => this.getRelationshipWidth(d.relationship))
            .attr('stroke-dasharray', d => d.automatico ? '5,5' : 'none')
            .attr('marker-end', d => {
                // Usar seta colorida se existir, senão usar padrão
                const tipoNorm = d.relationship?.toLowerCase() || 'vinculo';
                const tiposComSeta = ['mae', 'pai', 'filho', 'irmao', 'socio', 'parente'];
                return tiposComSeta.includes(tipoNorm) ? `url(#arrowhead-${tipoNorm})` : 'url(#arrowhead)';
            })
            .style('cursor', 'pointer')
            .style('opacity', 0.8)
            .on('click', (event, d) => {
                event.stopPropagation();
                this.mostrarInfoRelacionamento(d);
            })
            .on('mouseenter', function() {
                d3.select(this).style('opacity', 1).attr('stroke-width', 4);
            })
            .on('mouseleave', function(event, d) {
                d3.select(this).style('opacity', 0.8).attr('stroke-width', window.ArvoreCore.getRelationshipWidth(d.relationship));
            });
        
        // Label do relacionamento
        const labelBg = link.append('g').attr('class', 'label-background');
        
        labelBg.append('rect')
            .attr('width', 60)
            .attr('height', 16)
            .attr('x', -30)
            .attr('y', -13)
            .attr('rx', 8)
            .attr('fill', d => this.getRelationshipColor(d.relationship))
            .attr('fill-opacity', 0.9)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        
        link.append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#ffffff')
            .attr('font-weight', 'bold')
            .attr('dy', '-2px')
            .text(d => this.getRelationshipLabel(d.relationship))
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                this.mostrarInfoRelacionamento(d);
            });
        
        // Tooltip
        link.append('title')
            .text(d => `${this.getRelationshipLabel(d.relationship)}${d.description ? ': ' + d.description : ''}`);
    }
    
    criarNosInterativos(g, nodes) {
        const nodeGroup = g.append('g').attr('class', 'nodes');
        
        const node = nodeGroup.selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('data-node-id', d => d.id)
            .style('cursor', 'pointer')
            .call(this.configurarDrag())
            .on('click', (event, d) => {
                event.stopPropagation();
                this.interfaceManager.mostrarMenuNoSimples(d, event);
            })
            .on('dblclick', (event, d) => {
                event.stopPropagation();
                this.interfaceManager.toggleExpansaoNoSimples(d);
            });
        
        // Círculo principal
        node.append('circle')
            .attr('r', d => d.isPrincipal ? 35 : 30)
            .attr('fill', d => d.cor || (d.tipo === 'fisica' ? 'url(#gradient-fisica)' : 'url(#gradient-juridica)'))
            .attr('stroke', d => d.isPrincipal ? '#ff6b35' : '#fff')
            .attr('stroke-width', d => d.isPrincipal ? 4 : 3)
            .attr('filter', 'url(#shadow)')
            .on('mouseenter', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', (d.isPrincipal ? 35 : 30) + 5)
                    .attr('stroke-width', (d.isPrincipal ? 4 : 3) + 2);
            })
            .on('mouseleave', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', d.isPrincipal ? 35 : 30)
                    .attr('stroke-width', d.isPrincipal ? 4 : 3);
            });
        
        // Ícone ou foto
        this.adicionarIconeOuFoto(node);
        
        // Label
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '45px')
            .attr('font-size', '11px')
            .attr('fill', '#333')
            .style('font-weight', 'bold')
            .text(d => {
                const nome = d.nome || 'Sem nome';
                return nome.length > 20 ? nome.substring(0, 20) + '...' : nome;
            });
        
        // Indicador de expansão
        this.adicionarIndicadorExpansao(node);
        
        // Tooltip
        node.append('title')
            .text(d => `${d.nome}\nTipo: ${d.tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}\nClique para menu, duplo clique para expandir`);
    }
    
    adicionarIconeOuFoto(node) {
        // Verificar se há foto personalizada
        node.each(function(d) {
            const nodeElement = d3.select(this);
            
            if (d.foto) {
                // Adicionar foto
                nodeElement.append('defs')
                    .append('pattern')
                    .attr('id', `foto-${d.id}`)
                    .attr('patternUnits', 'objectBoundingBox')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .append('image')
                    .attr('xlink:href', d.foto)
                    .attr('width', 60)
                    .attr('height', 60)
                    .attr('x', -30)
                    .attr('y', -30);
                
                nodeElement.select('circle')
                    .attr('fill', `url(#foto-${d.id})`);
            } else {
                // Ícone padrão
                nodeElement.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('font-size', '18px')
                    .attr('fill', 'white')
                    .attr('font-family', 'Font Awesome 6 Free')
                    .attr('font-weight', '900')
                    .text(d.tipo === 'fisica' ? '\uf007' : '\uf1ad')
                    .style('pointer-events', 'none');
            }
        });
    }
    
    adicionarIndicadorExpansao(node) {
        const indicator = node.append('g')
            .attr('class', 'expansion-indicator')
            .attr('transform', 'translate(20, -20)')
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                this.interfaceManager.toggleExpansaoNoSimples(d);
            });
        
        indicator.append('circle')
            .attr('r', 8)
            .attr('fill', '#28a745')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        indicator.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('font-size', '10px')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .text('+')
            .style('pointer-events', 'none');
    }
    
    // ===== CONFIGURAÇÕES =====
    
    configurarEventListeners() {
        // Event listeners globais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.interfaceManager.esconderMenu();
            }
        });
        
        // Resize do container
        window.addEventListener('resize', () => {
            setTimeout(() => this.redimensionar(), 250);
        });
    }
    
    configurarControles() {
        // Controles de layout
        this.configurarSeletorLayouts();
        
        // Controles de zoom
        this.configurarControlesZoom();
        
        // Outros controles
        this.configurarOutrosControles();
    }
    
    configurarSeletorLayouts() {
        const layoutBtns = document.querySelectorAll('[data-layout]');
        layoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                this.alterarLayoutArvore(layout);
                
                // Atualizar estado visual dos botões
                layoutBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    configurarControlesZoom() {
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const zoomReset = document.getElementById('zoom-reset');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.ajustarZoom(1.2));
        if (zoomOut) zoomOut.addEventListener('click', () => this.ajustarZoom(0.8));
        if (zoomReset) zoomReset.addEventListener('click', () => this.resetarZoom());
    }
    
    configurarOutrosControles() {
        const expandirTodos = document.getElementById('expandir-todos');
        const recolherTodos = document.getElementById('recolher-todos');
        const reorganizar = document.getElementById('reorganizar');
        const exportarBtn = document.getElementById('exportar-arvore');
        
        if (expandirTodos) {
            expandirTodos.addEventListener('click', () => this.expandirTodosNos());
        }
        if (recolherTodos) {
            recolherTodos.addEventListener('click', () => this.recolherTodosNos());
        }
        if (reorganizar) {
            reorganizar.addEventListener('click', () => this.reorganizarArvore());
        }
        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarArvore());
        }
    }
    
    configurarBuscaInteligente() {
        const campoBusca = document.getElementById('busca-arvore');
        if (campoBusca) {
            this.buscaInteligente.configurarBuscaComDebounce(campoBusca, 300);
        }
    }
    
    configurarDrag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active && this.simulacao) {
                    this.simulacao.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active && this.simulacao) {
                    this.simulacao.alphaTarget(0);
                }
                
                // Salvar posição se layout for livre
                if (this.config.layoutAtivo === 'livre') {
                    this.layoutManager.salvarPosicaoNo(d.id, d.x, d.y);
                } else {
                    d.fx = null;
                    d.fy = null;
                }
            });
    }
    
    configurarZoomEPan() {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on('zoom', (event) => {
                this.config.zoomAtual = event.transform.k;
                this.svg.select('.arvore-content')
                    .attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
    }
    
    configurarSimulacao(dados) {
        if (!this.simulacao) return;
        
        this.simulacao
            .nodes(dados.nodes)
            .on('tick', () => {
                // Atualizar posições dos links
                this.svg.selectAll('.link line')
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                
                // Atualizar posições dos labels dos links
                this.svg.selectAll('.link .label-background')
                    .attr('transform', d => {
                        const x = (d.source.x + d.target.x) / 2;
                        const y = (d.source.y + d.target.y) / 2;
                        return `translate(${x},${y})`;
                    });
                
                this.svg.selectAll('.link text')
                    .attr('x', d => (d.source.x + d.target.x) / 2)
                    .attr('y', d => (d.source.y + d.target.y) / 2);
                
                // Atualizar posições dos nós
                this.svg.selectAll('.node')
                    .attr('transform', d => `translate(${d.x},${d.y})`);
            });
        
        // Configurar força de links se existir
        const linkForce = this.simulacao.force('link');
        if (linkForce) {
            linkForce.links(dados.links);
        }
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    atualizarDimensoes() {
        const rect = this.container.getBoundingClientRect();
        this.config.containerWidth = rect.width || 1200;
        this.config.containerHeight = rect.height || 800;
    }
    
    limparContainer() {
        d3.select(this.container).selectAll('*').remove();
    }
    
    criarSVG() {
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.config.containerWidth)
            .attr('height', this.config.containerHeight)
            .style('border', '1px solid #e0e0e0')
            .style('border-radius', '8px')
            .style('background', '#fafafa');
    }
    
    mostrarArvoreVazia() {
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.config.containerWidth || 800)
            .attr('height', this.config.containerHeight || 600);
        
        svg.append('text')
            .attr('x', (this.config.containerWidth || 800) / 2)
            .attr('y', (this.config.containerHeight || 600) / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('fill', '#666')
            .text('Nenhum dado encontrado para exibir na árvore');
    }
    
    mostrarErroRenderizacao(error) {
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.config.containerWidth || 800)
            .attr('height', this.config.containerHeight || 600);
        
        svg.append('text')
            .attr('x', (this.config.containerWidth || 800) / 2)
            .attr('y', (this.config.containerHeight || 600) / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('fill', '#dc3545')
            .text(`Erro ao renderizar árvore: ${error.message}`);
    }
    
    obterCorPersonalizada(nodeId, corPadrao) {
        try {
            const cores = JSON.parse(localStorage.getItem('arvore_cores_personalizadas') || '{}');
            return cores[nodeId] || corPadrao;
        } catch {
            return corPadrao;
        }
    }
    
    obterFotoPersonalizada(nodeId) {
        try {
            const fotos = JSON.parse(localStorage.getItem('arvore_fotos_personalizadas') || '{}');
            return fotos[nodeId] || null;
        } catch {
            return null;
        }
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    async alterarLayoutArvore(novoLayout) {
        if (!this.layoutManager.layouts[novoLayout]) {
            console.warn(`❌ Layout '${novoLayout}' não existe`);
            showNotification(`❌ Layout '${novoLayout}' não disponível`, 'error');
            return false;
        }
        
        console.log(`🔄 Alterando layout para: ${novoLayout}`);
        this.config.layoutAtivo = novoLayout;
        
        showNotification(`📐 Layout alterado: ${this.layoutManager.getLayoutInfo().descricoes[novoLayout]}`, 'info');
        
        // Re-renderizar com novo layout
        await this.renderizarArvoreInterativa();
        return true;
    }
    
    ajustarZoom(fator) {
        if (!this.svg) return;
        
        const novoZoom = Math.max(0.1, Math.min(5, this.config.zoomAtual * fator));
        
        this.svg.transition()
            .duration(300)
            .call(d3.zoom().scaleTo, novoZoom);
        
        this.config.zoomAtual = novoZoom;
        console.log(`🔍 Zoom ajustado para: ${(novoZoom * 100).toFixed(0)}%`);
    }
    
    resetarZoom() {
        if (!this.svg) return;
        
        this.svg.transition()
            .duration(500)
            .call(d3.zoom().transform, d3.zoomIdentity);
        
        this.config.zoomAtual = 1;
        console.log('🔄 Zoom resetado');
    }
    
    async expandirTodosNos() {
        console.log('📂 Expandindo todos os nós...');
        
        // Criar relacionamentos automáticos para todos
        const stats = await this.relacionamentoManager.criarRelacionamentosAutomaticosFamilia();
        
        showNotification(`📂 Todos os nós expandidos! ${stats.total} novos relacionamentos`, 'success');
        
        // Re-renderizar
        await this.renderizarArvoreInterativa();
    }
    
    recolherTodosNos() {
        console.log('📁 Recolhendo todos os nós...');
        this.config.nosExpandidos.clear();
        showNotification('📁 Todos os nós recolhidos', 'info');
        
        // Re-renderizar sem relacionamentos automáticos
        this.renderizarArvoreInterativa();
    }
    
    async reorganizarArvore() {
        console.log('🔄 Reorganizando árvore...');
        
        if (this.simulacao) {
            this.simulacao.alpha(1).restart();
        }
        
        showNotification('🔄 Árvore reorganizada', 'info');
    }
    
    async redimensionar() {
        console.log('📐 Redimensionando árvore...');
        await this.renderizarArvoreInterativa();
    }
    
    atualizarEstatisticas(dados) {
        const stats = {
            nos: dados.nodes.length,
            links: dados.links.length,
            pessoasFisicas: dados.nodes.filter(n => n.tipo === 'fisica').length,
            pessoasJuridicas: dados.nodes.filter(n => n.tipo === 'juridica').length,
            relacionamentosAutomaticos: dados.links.filter(l => l.automatico).length
        };
        
        // Atualizar elementos da interface se existirem
        this.atualizarElementosEstatisticas(stats);
        
        console.log('📊 Estatísticas atualizadas:', stats);
    }
    
    atualizarElementosEstatisticas(stats) {
        // IDs corretos do HTML em arvore.html
        const elementos = {
            'total-pessoas-arvore': stats.nos,
            'total-relacionamentos-arvore': stats.links,
            'nos-expandidos': this.config.nosExpandidos?.size || 0
        };
        
        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        });
        
        console.log(`📊 Estatísticas: ${stats.nos} pessoas, ${stats.links} relacionamentos`);
    }
    
    // Métodos de relacionamento (delegados)
    getRelationshipColor(tipo) {
        const cores = {
            'mae': '#ff6b6b', 'pai': '#4ecdc4',
            'irmao': '#45b7d1', 'filho': '#96ceb4',
            'socio': '#feca57', 'parente': '#ff9ff3',
            'endereco': '#54a0ff', 'telefone': '#5f27cd'
        };
        return cores[tipo] || '#6c757d';
    }
    
    getRelationshipWidth(tipo) {
        const larguras = {
            'mae': 3, 'pai': 3, 'filho': 3,
            'irmao': 2, 'socio': 2,
            'parente': 1, 'endereco': 1, 'telefone': 1
        };
        return larguras[tipo] || 1;
    }
    
    getRelationshipLabel(tipo) {
        const labels = {
            'mae': 'Mãe', 'pai': 'Pai', 'irmao': 'Irmão',
            'filho': 'Filho', 'socio': 'Sócio', 'parente': 'Parente',
            'endereco': 'Endereço', 'telefone': 'Telefone'
        };
        return labels[tipo] || tipo;
    }
    
    mostrarInfoRelacionamento(relacionamento) {
        // Delegar para interface manager se existir função global
        if (typeof mostrarInfoRelacionamento === 'function') {
            mostrarInfoRelacionamento(relacionamento);
        } else {
            console.log('ℹ️ Info relacionamento:', relacionamento);
            showNotification(`🔗 ${this.getRelationshipLabel(relacionamento.relationship)}: ${relacionamento.description || 'Sem descrição'}`, 'info');
        }
    }
    
    async exportarArvore() {
        console.log('📤 Exportando árvore...');
        
        if (!this.svg) {
            showNotification('❌ Nenhuma árvore para exportar', 'error');
            return;
        }
        
        try {
            // Criar link de download
            const svgString = new XMLSerializer().serializeToString(this.svg.node());
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `arvore-relacionamentos-${new Date().toISOString().slice(0, 10)}.svg`;
            a.click();
            
            URL.revokeObjectURL(url);
            showNotification('📤 Árvore exportada com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro na exportação:', error);
            showNotification('❌ Erro ao exportar árvore', 'error');
        }
    }
}

// ===== FUNÇÕES DE INICIALIZAÇÃO GLOBAL =====

// Função unificada para substituir as antigas
async function inicializarArvoreInterativa() {
    console.log('🌳 Iniciando sistema unificado...');
    
    if (!window.ArvoreCore) {
        window.ArvoreCore = new ArvoreCore();
    }
    
    return await window.ArvoreCore.inicializar();
}

// Função para compatibilidade com código existente
async function loadArvoreRelacionamentos() {
    return await inicializarArvoreInterativa();
}

// Configurar event listeners globais (compatibilidade)
function setupRelationshipListeners() {
    if (window.ArvoreCore) {
        window.ArvoreCore.configurarEventListeners();
    }
}

// Instância global
if (!window.ArvoreCore) {
    window.ArvoreCore = new ArvoreCore();
}

console.log('✅ ArvoreCore - Sistema unificado carregado');