/**
 * Sistema de Layouts Especializados 
 * Implementa os 9 tipos de layout especificados no plano de implementação
 */

class LayoutManager {
    constructor() {
        // ✅ Os 9 layouts especificados no plano original
        this.layouts = {
            'forca': this.configurarLayoutForca,
            'hierarquico': this.configurarLayoutHierarquico,
            'circular': this.configurarLayoutCircular,
            'radial': this.configurarLayoutRadial,
            'grade': this.configurarLayoutGrade,
            'agrupado': this.configurarLayoutAgrupado,
            'timeline': this.configurarLayoutTimeline,
            'espiral': this.configurarLayoutEspiral,
            'livre': this.configurarLayoutLivre
        };
        
        this.layoutAtivo = 'forca';
        
        console.log('📐 LayoutManager inicializado com 9 tipos de layout');
    }
    
    // ✅ Aplicar layout conforme especificação do plano
    aplicarLayout(tipo, dados, width, height) {
        const layoutFn = this.layouts[tipo];
        if (!layoutFn) {
            console.warn(`⚠️ Layout '${tipo}' não encontrado, usando 'forca'`);
            return this.configurarLayoutForca(dados, width, height);
        }
        
        console.log(`📐 Aplicando layout: ${tipo} (${dados.nodes.length} nós, ${dados.links.length} links)`);
        this.layoutAtivo = tipo;
        
        return layoutFn.call(this, dados, width, height);
    }
    
    // ⚡ Layout 1: Força (padrão) - simulação física
    configurarLayoutForca(dados, width, height) {
        console.log('⚡ Configurando layout de força...');
        
        const simulacao = d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links)
                .id(d => d.id)
                .distance(d => {
                    // Distância baseada no tipo de relacionamento
                    const distancias = {
                        'mae': 120, 'pai': 120,
                        'irmao': 100,
                        'filho': 120,
                        'socio': 150,
                        'parente': 180,
                        'endereco': 200,
                        'telefone': 220
                    };
                    return distancias[d.relationship] || 150;
                })
                .strength(0.8)
            )
            .force('charge', d3.forceManyBody()
                .strength(d => d.isPrincipal ? -400 : -300) // Nó principal repele mais
            )
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.isPrincipal ? 60 : 50) // Nó principal é maior
            )
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));
        
        return simulacao;
    }
    
    // 📊 Layout 2: Hierárquico - estrutura top-down
    configurarLayoutHierarquico(dados, width, height) {
        console.log('📊 Configurando layout hierárquico...');
        
        try {
            // Verificar se dagre está disponível
            if (typeof dagre === 'undefined') {
                console.warn('⚠️ Biblioteca dagre não encontrada, usando layout de força');
                return this.configurarLayoutForca(dados, width, height);
            }
            
            const g = new dagre.graphlib.Graph();
            g.setGraph({ 
                rankdir: 'TB',    // Top-Bottom
                nodesep: 100,     // Espaçamento horizontal entre nós
                ranksep: 150,     // Espaçamento vertical entre níveis
                marginx: 50,
                marginy: 50
            });
            
            // Adicionar nós
            dados.nodes.forEach(node => {
                g.setNode(node.id, { 
                    width: node.isPrincipal ? 120 : 100, 
                    height: node.isPrincipal ? 80 : 60 
                });
            });
            
            // Adicionar arestas
            dados.links.forEach(link => {
                g.setEdge(
                    link.source.id || link.source, 
                    link.target.id || link.target
                );
            });
            
            // Calcular layout
            dagre.layout(g);
            
            // Aplicar posições calculadas
            dados.nodes.forEach(node => {
                const dagreeNode = g.node(node.id);
                if (dagreeNode) {
                    node.fx = dagreeNode.x;
                    node.fy = dagreeNode.y;
                }
            });
            
            // Simulação leve para ajustes finos
            return d3.forceSimulation(dados.nodes)
                .force('link', d3.forceLink(dados.links).id(d => d.id).distance(50))
                .alphaDecay(0.1)
                .velocityDecay(0.8);
                
        } catch (error) {
            console.error('❌ Erro no layout hierárquico:', error);
            return this.configurarLayoutForca(dados, width, height);
        }
    }
    
    // ⭕ Layout 3: Circular - nós em círculo perfeito
    configurarLayoutCircular(dados, width, height) {
        console.log('⭕ Configurando layout circular...');
        
        const raio = Math.min(width, height) * 0.35;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Encontrar nó principal
        const noPrincipal = dados.nodes.find(n => n.isPrincipal);
        
        if (noPrincipal) {
            // Colocar nó principal no centro
            noPrincipal.fx = centerX;
            noPrincipal.fy = centerY;
            
            // Outros nós em círculo ao redor
            const outrosNos = dados.nodes.filter(n => !n.isPrincipal);
            const angleStep = (2 * Math.PI) / outrosNos.length;
            
            outrosNos.forEach((node, i) => {
                const angle = i * angleStep;
                node.fx = centerX + raio * Math.cos(angle);
                node.fy = centerY + raio * Math.sin(angle);
            });
        } else {
            // Todos os nós em círculo
            const angleStep = (2 * Math.PI) / dados.nodes.length;
            dados.nodes.forEach((node, i) => {
                const angle = i * angleStep;
                node.fx = centerX + raio * Math.cos(angle);
                node.fy = centerY + raio * Math.sin(angle);
            });
        }
        
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(50))
            .alphaDecay(0.05);
    }
    
    // 🌟 Layout 4: Radial - expansão radial do centro
    configurarLayoutRadial(dados, width, height) {
        console.log('🌟 Configurando layout radial...');
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.4;
        
        // Encontrar nó principal
        const noPrincipal = dados.nodes.find(n => n.isPrincipal);
        
        if (noPrincipal) {
            // Nó principal no centro
            noPrincipal.fx = centerX;
            noPrincipal.fy = centerY;
            
            // Organizar outros nós por níveis de relacionamento
            const niveis = this.calcularNiveisRelacionamento(dados, noPrincipal.id);
            
            Object.keys(niveis).forEach(nivel => {
                const raio = (parseInt(nivel) + 1) * (maxRadius / 4);
                const nosDoNivel = niveis[nivel];
                const angleStep = (2 * Math.PI) / nosDoNivel.length;
                
                nosDoNivel.forEach((nodeId, i) => {
                    const node = dados.nodes.find(n => n.id === nodeId);
                    if (node && !node.isPrincipal) {
                        const angle = i * angleStep;
                        node.fx = centerX + raio * Math.cos(angle);
                        node.fy = centerY + raio * Math.sin(angle);
                    }
                });
            });
        } else {
            // Fallback para circular se não houver nó principal
            return this.configurarLayoutCircular(dados, width, height);
        }
        
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(80))
            .force('collision', d3.forceCollide().radius(40))
            .alphaDecay(0.02);
    }
    
    // 📋 Layout 5: Grade - posicionamento em grade organizada
    configurarLayoutGrade(dados, width, height) {
        console.log('📋 Configurando layout em grade...');
        
        const margin = 50;
        const cols = Math.ceil(Math.sqrt(dados.nodes.length));
        const cellWidth = (width - 2 * margin) / cols;
        const cellHeight = (height - 2 * margin) / Math.ceil(dados.nodes.length / cols);
        
        dados.nodes.forEach((node, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            node.fx = margin + col * cellWidth + cellWidth / 2;
            node.fy = margin + row * cellHeight + cellHeight / 2;
        });
        
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(100))
            .force('collision', d3.forceCollide().radius(30))
            .alpha(0.3)
            .alphaDecay(0.05);
    }
    
    // 🎯 Layout 6: Agrupado - clusters por tipo de relacionamento
    configurarLayoutAgrupado(dados, width, height) {
        console.log('🎯 Configurando layout agrupado...');
        
        // Agrupar nós por tipo de relacionamento
        const grupos = this.agruparPorTipoRelacionamento(dados);
        
        const numGrupos = Object.keys(grupos).length;
        const angleStep = (2 * Math.PI) / numGrupos;
        const raioGrupos = Math.min(width, height) * 0.25;
        const centerX = width / 2;
        const centerY = height / 2;
        
        Object.keys(grupos).forEach((tipo, i) => {
            const angle = i * angleStep;
            const grupoCenterX = centerX + raioGrupos * Math.cos(angle);
            const grupoCenterY = centerY + raioGrupos * Math.sin(angle);
            
            const nosDoGrupo = grupos[tipo];
            const raioIntraGrupo = Math.sqrt(nosDoGrupo.length) * 25;
            
            nosDoGrupo.forEach((node, j) => {
                const intraAngle = (2 * Math.PI * j) / nosDoGrupo.length;
                node.fx = grupoCenterX + raioIntraGrupo * Math.cos(intraAngle);
                node.fy = grupoCenterY + raioIntraGrupo * Math.sin(intraAngle);
            });
        });
        
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(80))
            .force('collision', d3.forceCollide().radius(35))
            .alpha(0.5)
            .alphaDecay(0.02);
    }
    
    // ⏰ Layout 7: Timeline - organização temporal
    configurarLayoutTimeline(dados, width, height) {
        console.log('⏰ Configurando layout timeline...');
        
        const margin = 80;
        const timelineWidth = width - 2 * margin;
        const timelineY = height / 2;
        
        // Tentar obter datas dos nós (data de nascimento, criação, etc.)
        const nosComData = dados.nodes.map(node => ({
            ...node,
            data: this.extrairDataDoNo(node)
        })).sort((a, b) => (a.data || 0) - (b.data || 0));
        
        // Posicionar nós ao longo da timeline
        nosComData.forEach((node, i) => {
            node.fx = margin + (i / (nosComData.length - 1)) * timelineWidth;
            node.fy = timelineY + (Math.random() - 0.5) * 100; // Pequena variação vertical
        });
        
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(120))
            .force('y', d3.forceY(timelineY).strength(0.1))
            .force('collision', d3.forceCollide().radius(40))
            .alphaDecay(0.03);
    }
    
    // 🌀 Layout 8: Espiral - disposição em espiral matemática
    configurarLayoutEspiral(dados, width, height) {
        console.log('🌀 Configurando layout espiral...');
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.4;
        
        dados.nodes.forEach((node, i) => {
            const angle = i * 0.5; // 0.5 radianos por nó
            const radius = (i / dados.nodes.length) * maxRadius;
            
            node.fx = centerX + radius * Math.cos(angle);
            node.fy = centerY + radius * Math.sin(angle);
        });
        
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(60))
            .force('collision', d3.forceCollide().radius(30))
            .alpha(0.3)
            .alphaDecay(0.02);
    }
    
    // ✋ Layout 9: Livre - posicionamento manual/editável
    configurarLayoutLivre(dados, width, height) {
        console.log('✋ Configurando layout livre...');
        
        // Carregar posições salvas ou usar distribuição aleatória
        dados.nodes.forEach(node => {
            const posicaoSalva = this.carregarPosicaoNo(node.id);
            
            if (posicaoSalva) {
                node.fx = posicaoSalva.x;
                node.fy = posicaoSalva.y;
            } else {
                // Posição aleatória inicial
                node.fx = Math.random() * width;
                node.fy = Math.random() * height;
            }
        });
        
        // Simulação mínima para permitir edição
        return d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(100))
            .force('collision', d3.forceCollide().radius(40))
            .alpha(0.1)
            .alphaDecay(0.01)
            .stop(); // Parar simulação para permitir edição manual
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    calcularNiveisRelacionamento(dados, noPrincipalId) {
        const niveis = {};
        const visitados = new Set([noPrincipalId]);
        let nivel = 0;
        let proximosNos = [noPrincipalId];
        
        while (proximosNos.length > 0) {
            const nosAtual = [...proximosNos];
            proximosNos = [];
            niveis[nivel] = [];
            
            nosAtual.forEach(nodeId => {
                // Encontrar nós conectados
                dados.links.forEach(link => {
                    let vizinho = null;
                    
                    if ((link.source.id || link.source) === nodeId) {
                        vizinho = link.target.id || link.target;
                    } else if ((link.target.id || link.target) === nodeId) {
                        vizinho = link.source.id || link.source;
                    }
                    
                    if (vizinho && !visitados.has(vizinho)) {
                        visitados.add(vizinho);
                        proximosNos.push(vizinho);
                        niveis[nivel].push(vizinho);
                    }
                });
            });
            
            nivel++;
            if (nivel > 5) break; // Limite de segurança
        }
        
        return niveis;
    }
    
    agruparPorTipoRelacionamento(dados) {
        const grupos = {};
        const nosProcessados = new Set();
        
        // Criar grupos baseados nos tipos de relacionamento
        dados.links.forEach(link => {
            const tipo = link.relationship || 'outros';
            
            if (!grupos[tipo]) {
                grupos[tipo] = [];
            }
            
            // Adicionar nós source e target ao grupo
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            
            [sourceId, targetId].forEach(nodeId => {
                if (!nosProcessados.has(nodeId)) {
                    const node = dados.nodes.find(n => n.id === nodeId);
                    if (node) {
                        grupos[tipo].push(node);
                        nosProcessados.add(nodeId);
                    }
                }
            });
        });
        
        // Nós sem relacionamento vão para grupo "isolados"
        dados.nodes.forEach(node => {
            if (!nosProcessados.has(node.id)) {
                if (!grupos['isolados']) grupos['isolados'] = [];
                grupos['isolados'].push(node);
            }
        });
        
        return grupos;
    }
    
    extrairDataDoNo(node) {
        // Tentar extrair data de nascimento, criação, etc.
        if (node.data_nascimento) {
            return new Date(node.data_nascimento).getTime();
        }
        if (node.data_constituicao) {
            return new Date(node.data_constituicao).getTime();
        }
        if (node.created_at) {
            return new Date(node.created_at).getTime();
        }
        
        // Fallback: usar ID como proxy temporal
        return node.id || 0;
    }
    
    carregarPosicaoNo(nodeId) {
        try {
            const posicoesSalvas = JSON.parse(localStorage.getItem('arvore_posicoes_livres') || '{}');
            return posicoesSalvas[nodeId] || null;
        } catch (error) {
            return null;
        }
    }
    
    salvarPosicaoNo(nodeId, x, y) {
        try {
            const posicoesSalvas = JSON.parse(localStorage.getItem('arvore_posicoes_livres') || '{}');
            posicoesSalvas[nodeId] = { x, y, timestamp: Date.now() };
            localStorage.setItem('arvore_posicoes_livres', JSON.stringify(posicoesSalvas));
            
            console.log(`💾 Posição salva para nó ${nodeId}: (${x}, ${y})`);
        } catch (error) {
            console.error('❌ Erro ao salvar posição:', error);
        }
    }
    
    // Obter informações do layout ativo
    getLayoutInfo() {
        return {
            ativo: this.layoutAtivo,
            disponiveis: Object.keys(this.layouts),
            descricoes: {
                'forca': '⚡ Simulação física com forças',
                'hierarquico': '📊 Estrutura hierárquica top-down',
                'circular': '⭕ Nós dispostos em círculo',
                'radial': '🌟 Expansão radial do centro',
                'grade': '📋 Posicionamento em grade',
                'agrupado': '🎯 Clusters por tipo de relacionamento',
                'timeline': '⏰ Organização temporal',
                'espiral': '🌀 Disposição em espiral',
                'livre': '✋ Posicionamento manual editável'
            }
        };
    }
    
    // Alternar entre layouts
    alterarLayout(novoLayout) {
        if (!this.layouts[novoLayout]) {
            console.warn(`❌ Layout '${novoLayout}' não existe`);
            return false;
        }
        
        this.layoutAtivo = novoLayout;
        console.log(`🔄 Layout alterado para: ${novoLayout}`);
        return true;
    }
}

// Instância global
if (!window.LayoutManager) {
    window.LayoutManager = new LayoutManager();
}

console.log('✅ Módulo LayoutManager carregado com 9 tipos de layout');