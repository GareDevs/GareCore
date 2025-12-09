/**
 * Sistema de Árvore de Relacionamentos Interativa
 * Versão melhorada com controles interativos completos
 */

// Configurações globais da árvore
let arvoreConfig = {
    modoExpansaoCompleta: true,
    telaCheia: false,
    layoutTipo: 'force', // force, hierarchical, circular
    escalaZoom: 1,
    centroX: 0,
    centroY: 0,
    coresPadrao: {
        fisica: {gradiente1: '#4facfe', gradiente2: '#00f2fe'},
        juridica: {gradiente1: '#43e97b', gradiente2: '#38f9d7'}
    },
    coresPersonalizadas: new Map(),
    fotosPersonalizadas: new Map()
};

// Estado dos nós expandidos
let nosExpandidos = new Set();
let simulacao = null;

// Configurar event listeners
function setupRelationshipListeners() {
    const formRelacionamento = document.getElementById('form-relacionamento');
    if (formRelacionamento) {
        formRelacionamento.addEventListener('submit', function(e) {
            e.preventDefault();
            criarRelacionamento();
        });
    }
    
    // Busca por GOA
    const buscaGoa = document.getElementById('busca-goa');
    if (buscaGoa) {
        buscaGoa.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarEExpandirPorGOA();
            }
        });
    }

    // Busca geral na árvore
    const buscaArvore = document.getElementById('busca-arvore');
    if (buscaArvore) {
        buscaArvore.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarPessoaNaArvore();
            }
        });
        
        buscaArvore.addEventListener('input', function() {
            if (this.value.length >= 2) {
                buscarPessoaNaArvore();
            } else if (this.value.length === 0) {
                document.getElementById('resultados-busca-arvore').innerHTML = '';
            }
        });
    }
}

// Carregar árvore de relacionamentos
function loadArvoreRelacionamentos() {
    inicializarArvoreInterativa();
    atualizarEstatisticasArvore();
    updateStatusBar('Árvore interativa carregada com todas as funcionalidades');
}

// Inicializar árvore interativa
function inicializarArvoreInterativa() {
    console.log('🌳 Inicializando árvore interativa...');
    
    // Criar relacionamentos automáticos completos
    criarRelacionamentosAutomaticosFamilia();
    
    // Expansão automática completa de todos os dados
    expandirTodosOsDadosAutomaticamente();
    
    // Renderizar árvore
    renderizarArvoreInterativa();
    
    // Configurar controles
    configurarControlesArvore();
    
    showNotification('🌳 Árvore interativa pronta com expansão completa! Use os controles para navegar e personalizar.', 'success');
}

// Configurar controles da árvore
function configurarControlesArvore() {
    // Controles de layout
    const layoutBtns = document.querySelectorAll('[data-layout]');
    layoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const layout = btn.dataset.layout;
            alterarLayoutArvore(layout);
            
            // Atualizar estado visual dos botões
            layoutBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Controles de zoom
    document.getElementById('zoom-in')?.addEventListener('click', () => ajustarZoom(1.2));
    document.getElementById('zoom-out')?.addEventListener('click', () => ajustarZoom(0.8));
    document.getElementById('zoom-reset')?.addEventListener('click', () => resetarZoom());
    
    // Controles de organização
    document.getElementById('expandir-todos')?.addEventListener('click', expandirTodosNos);
    document.getElementById('recolher-todos')?.addEventListener('click', recolherTodosNos);
    document.getElementById('reorganizar')?.addEventListener('click', reorganizarArvore);
    
    // Controles de espaçamento
    configurarControlesEspacamento();
    
    // Botão de exportar
    document.getElementById('exportar-arvore')?.addEventListener('click', exportarArvore);
}

// Configurar controles de espaçamento
function configurarControlesEspacamento() {
    const controleEspacamento = document.getElementById('controle-espacamento');
    const valorEspacamento = document.getElementById('valor-espacamento');
    
    if (!controleEspacamento || !valorEspacamento) return;
    
    // Inicializar valor de espaçamento
    if (!arvoreConfig.distanciaLinks) {
        arvoreConfig.distanciaLinks = 150;
    }
    
    controleEspacamento.value = arvoreConfig.distanciaLinks;
    valorEspacamento.textContent = arvoreConfig.distanciaLinks;
    
    // Event listener para o slider
    controleEspacamento.addEventListener('input', function() {
        const novoEspacamento = parseInt(this.value);
        arvoreConfig.distanciaLinks = novoEspacamento;
        valorEspacamento.textContent = novoEspacamento;
        aplicarNovoEspacamento(novoEspacamento);
    });
    
    // Botão diminuir espaçamento
    document.getElementById('diminuir-espaco')?.addEventListener('click', () => {
        const novoValor = Math.max(50, arvoreConfig.distanciaLinks - 25);
        controleEspacamento.value = novoValor;
        arvoreConfig.distanciaLinks = novoValor;
        valorEspacamento.textContent = novoValor;
        aplicarNovoEspacamento(novoValor);
    });
    
    // Botão aumentar espaçamento
    document.getElementById('aumentar-espaco')?.addEventListener('click', () => {
        const novoValor = Math.min(300, arvoreConfig.distanciaLinks + 25);
        controleEspacamento.value = novoValor;
        arvoreConfig.distanciaLinks = novoValor;
        valorEspacamento.textContent = novoValor;
        aplicarNovoEspacamento(novoValor);
    });
}

// Mostrar pontos de controle do vínculo para edição manual
function mostrarPontosControleVinculo(linkData, linkElement) {
    try {
        // Remover pontos anteriores
        esconderPontosControleVinculo();
        
        const svg = d3.select('#arvore-container svg');
        
        // Calcular posição do meio do link
        const source = linkData.source;
        const target = linkData.target;
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        
        // Criar grupo de controles
        const controlGroup = svg.append('g')
            .attr('class', 'link-controls')
            .attr('transform', `translate(${midX},${midY})`);
        
        // Ponto de controle principal (meio do link)
        const controlPoint = controlGroup.append('circle')
            .attr('r', 8)
            .attr('fill', '#007bff')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('cursor', 'move')
            .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Adicionar comportamento de arrastar
        const drag = d3.drag()
            .on('start', function(event) {
                d3.select(this).attr('fill', '#28a745'); // Verde quando arrastando
            })
            .on('drag', function(event) {
                // Atualizar posição do ponto de controle
                const newX = event.x;
                const newY = event.y;
                
                controlGroup.attr('transform', `translate(${newX},${newY})`);
                
                // Criar curva no link
                criarCurvaVinculo(linkData, newX, newY, linkElement);
            })
            .on('end', function(event) {
                d3.select(this).attr('fill', '#007bff'); // Voltar cor original
                
                // Salvar nova posição do vínculo
                salvarPosicaoVinculo(linkData, event.x, event.y);
                
                showNotification('📍 Posição do vínculo ajustada manualmente', 'success');
            });
        
        controlPoint.call(drag);
        
        // Botão para resetar posição
        const resetButton = controlGroup.append('circle')
            .attr('cx', 20)
            .attr('cy', -5)
            .attr('r', 6)
            .attr('fill', '#dc3545')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .style('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))')
            .on('click', function() {
                resetarPosicaoVinculo(linkData, linkElement);
                esconderPontosControleVinculo();
            });
        
        // Ícone X no botão reset
        controlGroup.append('text')
            .attr('x', 20)
            .attr('y', -1)
            .attr('text-anchor', 'middle')
            .attr('font-size', '8px')
            .attr('fill', 'white')
            .attr('pointer-events', 'none')
            .text('×');
        
    } catch (error) {
        console.error('Erro ao mostrar pontos de controle:', error);
    }
}

// Esconder pontos de controle do vínculo
function esconderPontosControleVinculo() {
    d3.select('#arvore-container svg .link-controls').remove();
}

// Criar curva no vínculo baseada na posição do ponto de controle
function criarCurvaVinculo(linkData, controlX, controlY, linkElement) {
    try {
        const source = linkData.source;
        const target = linkData.target;
        
        // Criar path curvo usando quadratic curve
        const pathData = `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
        
        // Substituir linha reta por path curvo
        d3.select(linkElement).remove();
        
        const svg = d3.select('#arvore-container svg');
        const linkGroup = svg.selectAll('.link').filter(d => d.id === linkData.id);
        
        linkGroup.append('path')
            .attr('d', pathData)
            .attr('stroke', getRelationshipColor(linkData.relationship))
            .attr('stroke-width', getRelationshipWidth(linkData.relationship))
            .attr('stroke-dasharray', getRelationshipDashArray(linkData.relationship))
            .attr('fill', 'none')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('opacity', getRelationshipOpacity(linkData.relationship))
            .style('filter', getRelationshipFilter(linkData.relationship));
        
    } catch (error) {
        console.error('Erro ao criar curva:', error);
    }
}

// Salvar posição personalizada do vínculo
function salvarPosicaoVinculo(linkData, x, y) {
    try {
        // Salvar no localStorage ou na estrutura de dados
        if (!arvoreConfig.vinculosPersonalizados) {
            arvoreConfig.vinculosPersonalizados = new Map();
        }
        
        arvoreConfig.vinculosPersonalizados.set(linkData.id, {
            controlX: x,
            controlY: y,
            timestamp: Date.now()
        });
        
        console.log(`💾 Posição do vínculo ${linkData.id} salva: (${x}, ${y})`);
        
    } catch (error) {
        console.error('Erro ao salvar posição:', error);
    }
}

// Resetar posição do vínculo para linha reta
function resetarPosicaoVinculo(linkData, linkElement) {
    try {
        // Remover posição personalizada
        if (arvoreConfig.vinculosPersonalizados) {
            arvoreConfig.vinculosPersonalizados.delete(linkData.id);
        }
        
        // Re-renderizar árvore para restaurar linha reta
        renderizarArvoreInterativa();
        
        showNotification('🔄 Posição do vínculo resetada', 'info');
        
    } catch (error) {
        console.error('Erro ao resetar posição:', error);
    }
}

// Aplicar novo espaçamento aos vínculos
function aplicarNovoEspacamento(distancia) {
    try {
        console.log(`🔄 Aplicando novo espaçamento: ${distancia}px`);
        
        if (!simulacao) {
            console.warn('Simulação não existe, re-renderizando árvore...');
            renderizarArvoreInterativa();
            return;
        }
        
        // Atualizar força de links na simulação atual
        const linkForce = simulacao.force('link');
        if (linkForce) {
            linkForce.distance(distancia);
            simulacao.alpha(0.3).restart(); // Reiniciar com animação suave
        }
        
        // Para layouts fixos, re-aplicar o layout com nova distância
        if (arvoreConfig.layoutTipo !== 'force') {
            setTimeout(() => {
                alterarLayoutArvore(arvoreConfig.layoutTipo);
            }, 100);
        }
        
        showNotification(`📏 Espaçamento ajustado para ${distancia}px`, 'info');
        
    } catch (error) {
        console.error('Erro ao aplicar espaçamento:', error);
        showNotification('Erro ao ajustar espaçamento', 'error');
    }
}

// Renderizar árvore interativa
function renderizarArvoreInterativa() {
    const container = document.getElementById('arvore-container');
    if (!container) {
        console.error('Container da árvore não encontrado');
        return;
    }

    try {
        // Limpar container
        container.innerHTML = '';

        const dados = prepararDadosArvore();
        
        if (dados.nodes.length === 0) {
            container.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100">
                    <div class="text-center">
                        <i class="fas fa-project-diagram fa-4x text-muted mb-3"></i>
                        <h5 class="text-muted">Nenhum relacionamento encontrado</h5>
                        <p class="text-muted">Crie relacionamentos entre pessoas para visualizar a árvore.</p>
                        <button class="btn btn-primary" onclick="analisarTodosOsDados()">
                            <i class="fas fa-magic me-1"></i>Analisar Dados Automaticamente
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Dimensões responsivas
        const rect = container.getBoundingClientRect();
        const width = Math.max(rect.width, 800);
        const height = Math.max(rect.height, 600);

        // Criar SVG principal com fundo elegante
        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', '#ffffff')
            .style('border-radius', '8px')
            .style('box-shadow', '0 4px 20px rgba(0,0,0,0.1)')
            .style('border', '1px solid #e1e5e9');

        // Configurar zoom e pan
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on('zoom', function(event) {
                g.attr('transform', event.transform);
                arvoreConfig.escalaZoom = event.transform.k;
                arvoreConfig.centroX = event.transform.x;
                arvoreConfig.centroY = event.transform.y;
            });

        svg.call(zoom);
        
        // Grupo principal
        const g = svg.append('g');

        // Configurar simulação baseada no layout
        configurarSimulacao(dados, width, height);

        // Criar elementos visuais
        criarElementosInterativos(g, dados, width, height);

        updateStatusBar(`Árvore interativa: ${dados.nodes.length} pessoas, ${dados.links.length} conexões`);

    } catch (error) {
        console.error('Erro ao renderizar árvore interativa:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Erro na renderização:</strong> ${error.message}
                <br><small>Verifique o console para mais detalhes.</small>
            </div>
        `;
    }
}

// Configurar simulação baseada no layout
function configurarSimulacao(dados, width, height) {
    if (simulacao) {
        simulacao.stop();
    }

    switch (arvoreConfig.layoutTipo) {
        case 'hierarchical':
            configurarLayoutHierarquico(dados, width, height);
            break;
        case 'circular':
            configurarLayoutCircular(dados, width, height);
            break;
        case 'radial':
            configurarLayoutRadial(dados, width, height);
            break;
        case 'grid':
            configurarLayoutGrade(dados, width, height);
            break;
        case 'cluster':
            configurarLayoutAgrupado(dados, width, height);
            break;
        case 'timeline':
            configurarLayoutTimeline(dados, width, height);
            break;
        case 'spiral':
            configurarLayoutEspiral(dados, width, height);
            break;
        case 'free':
            configurarLayoutLivre(dados, width, height);
            break;
        default:
            configurarLayoutForca(dados, width, height);
    }
}

// Layout de força (padrão)
function configurarLayoutForca(dados, width, height) {
    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links)
            .id(d => d.id)
            .distance(arvoreConfig.distanciaLinks || 150)
        )
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));
}

// Layout hierárquico
function configurarLayoutHierarquico(dados, width, height) {
    const hierarchy = d3.stratify()
        .id(d => d.id)
        .parentId(d => {
            // Lógica para determinar parent baseado em relacionamentos
            const parentLink = dados.links.find(l => 
                l.target === d.id && ['pai', 'mae'].includes(l.relationship)
            );
            return parentLink ? parentLink.source : null;
        });

    try {
        const root = hierarchy(dados.nodes);
        const tree = d3.tree().size([width - 100, height - 100]);
        tree(root);

        dados.nodes.forEach(node => {
            const treeNode = root.descendants().find(n => n.id === node.id);
            if (treeNode) {
                node.fx = treeNode.x + 50;
                node.fy = treeNode.y + 50;
            }
        });
    } catch (error) {
        console.warn('Layout hierárquico falhou, usando layout de força:', error);
        configurarLayoutForca(dados, width, height);
    }
}

// Layout circular
function configurarLayoutCircular(dados, width, height) {
    const radius = Math.min(width, height) / 3;
    const centerX = width / 2;
    const centerY = height / 2;

    dados.nodes.forEach((node, i) => {
        const angle = (i / dados.nodes.length) * 2 * Math.PI;
        node.fx = centerX + radius * Math.cos(angle);
        node.fy = centerY + radius * Math.sin(angle);
    });

    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(80))
        .force('collision', d3.forceCollide().radius(50));
}

// Layout radial (centro com raios)
function configurarLayoutRadial(dados, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2.5;

    // Encontrar nó central (com mais conexões)
    const conexoes = new Map();
    dados.links.forEach(link => {
        conexoes.set(link.source, (conexoes.get(link.source) || 0) + 1);
        conexoes.set(link.target, (conexoes.get(link.target) || 0) + 1);
    });

    let noCentral = dados.nodes[0];
    let maxConexoes = 0;
    dados.nodes.forEach(node => {
        const numConexoes = conexoes.get(node.id) || 0;
        if (numConexoes > maxConexoes) {
            maxConexoes = numConexoes;
            noCentral = node;
        }
    });

    // Posicionar nó central
    noCentral.fx = centerX;
    noCentral.fy = centerY;

    // Posicionar outros nós em círculos ao redor
    const outrosNos = dados.nodes.filter(n => n !== noCentral);
    const totalNos = outrosNos.length;
    
    outrosNos.forEach((node, i) => {
        const level = Math.floor(i / 8) + 1; // 8 nós por círculo
        const posInLevel = i % 8;
        const radius = (maxRadius / 3) * level;
        const angle = (posInLevel / 8) * 2 * Math.PI;
        
        node.fx = centerX + radius * Math.cos(angle);
        node.fy = centerY + radius * Math.sin(angle);
    });

    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(100))
        .force('collision', d3.forceCollide().radius(50));
}

// Layout em grade
function configurarLayoutGrade(dados, width, height) {
    const cols = Math.ceil(Math.sqrt(dados.nodes.length));
    const rows = Math.ceil(dados.nodes.length / cols);
    const cellWidth = (width - 100) / cols;
    const cellHeight = (height - 100) / rows;

    dados.nodes.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        node.fx = 50 + col * cellWidth + cellWidth / 2;
        node.fy = 50 + row * cellHeight + cellHeight / 2;
    });

    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(120))
        .force('collision', d3.forceCollide().radius(50));
}

// Layout agrupado (por tipo de relacionamento)
function configurarLayoutAgrupado(dados, width, height) {
    // Agrupar nós por tipo de relacionamento dominante
    const grupos = new Map();
    const tiposRelacionamento = ['familia', 'empresarial', 'social', 'outros'];
    
    dados.nodes.forEach(node => {
        const conexoesNode = dados.links.filter(l => 
            l.source === node.id || l.target === node.id
        );
        
        let tiposDominante = 'outros';
        const contadores = {};
        
        conexoesNode.forEach(link => {
            const tipo = link.relationship;
            if (['pai', 'mae', 'irmao', 'filho', 'conjuge', 'parente'].includes(tipo)) {
                contadores['familia'] = (contadores['familia'] || 0) + 1;
            } else if (['socio', 'empresarial'].includes(tipo)) {
                contadores['empresarial'] = (contadores['empresarial'] || 0) + 1;
            } else if (['amigo', 'profissional'].includes(tipo)) {
                contadores['social'] = (contadores['social'] || 0) + 1;
            } else {
                contadores['outros'] = (contadores['outros'] || 0) + 1;
            }
        });
        
        // Encontrar tipo dominante
        let maxCount = 0;
        Object.entries(contadores).forEach(([tipo, count]) => {
            if (count > maxCount) {
                maxCount = count;
                tiposDominante = tipo;
            }
        });
        
        if (!grupos.has(tiposDominante)) {
            grupos.set(tiposDominante, []);
        }
        grupos.get(tiposDominante).push(node);
    });

    // Posicionar grupos em quadrantes
    const quadrantes = [
        { x: width * 0.25, y: height * 0.25 }, // Superior esquerdo
        { x: width * 0.75, y: height * 0.25 }, // Superior direito
        { x: width * 0.25, y: height * 0.75 }, // Inferior esquerdo
        { x: width * 0.75, y: height * 0.75 }  // Inferior direito
    ];

    let quadranteIndex = 0;
    grupos.forEach((nosGrupo, tipoGrupo) => {
        const centro = quadrantes[quadranteIndex % 4];
        const radius = 80;
        
        nosGrupo.forEach((node, i) => {
            const angle = (i / nosGrupo.length) * 2 * Math.PI;
            node.fx = centro.x + radius * Math.cos(angle);
            node.fy = centro.y + radius * Math.sin(angle);
        });
        
        quadranteIndex++;
    });

    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(100))
        .force('collision', d3.forceCollide().radius(50));
}

// Layout Timeline (por idade/data)
function configurarLayoutTimeline(dados, width, height) {
    // Ordenar nós por idade ou data de nascimento
    const nosComIdade = dados.nodes.map(node => {
        let idade = 0;
        
        // Tentar obter idade dos dados da pessoa
        try {
            const pessoa = obterInfoPessoaPorId(node.pessoa_id, node.type);
            if (pessoa && pessoa.data_nascimento) {
                const nascimento = new Date(pessoa.data_nascimento.split('/').reverse().join('-'));
                idade = new Date().getFullYear() - nascimento.getFullYear();
            }
        } catch (error) {
            // Se não conseguir obter idade, usar ID como fallback
            idade = parseInt(node.pessoa_id) || 0;
        }
        
        return { ...node, idade };
    }).sort((a, b) => a.idade - b.idade);
    
    // Posicionar nós em timeline horizontal
    const startX = 100;
    const endX = width - 100;
    const stepX = nosComIdade.length > 1 ? (endX - startX) / (nosComIdade.length - 1) : 0;
    
    nosComIdade.forEach((node, i) => {
        node.fx = startX + (stepX * i);
        node.fy = height / 2 + (Math.sin(i * 0.5) * 100); // Variação vertical sutil
    });
    
    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(150))
        .force('collision', d3.forceCollide().radius(50));
}

// Layout Espiral
function configurarLayoutEspiral(dados, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 3;
    
    dados.nodes.forEach((node, i) => {
        const angle = i * 0.5; // Incremento do ângulo
        const radius = (i / dados.nodes.length) * maxRadius; // Raio crescente
        
        node.fx = centerX + radius * Math.cos(angle);
        node.fy = centerY + radius * Math.sin(angle);
    });
    
    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(120))
        .force('collision', d3.forceCollide().radius(50));
}

// Layout Livre (permite arrastar sem simulação)
function configurarLayoutLivre(dados, width, height) {
    // Posicionamento inicial aleatório mas organizado
    const cols = Math.ceil(Math.sqrt(dados.nodes.length));
    const cellWidth = width / cols;
    const cellHeight = height / cols;
    
    dados.nodes.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Posição base + variação aleatória
        const baseX = (col + 0.5) * cellWidth;
        const baseY = (row + 0.5) * cellHeight;
        
        node.fx = baseX + (Math.random() - 0.5) * 50;
        node.fy = baseY + (Math.random() - 0.5) * 50;
    });
    
    // Simulação mínima apenas para links
    simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).id(d => d.id).distance(100))
        .force('collision', d3.forceCollide().radius(50))
        .alphaMin(0.001) // Para quase imediata
        .alphaDecay(0.1);
        
    // Ativar modo de edição livre
    arvoreConfig.modoEdicaoLivre = true;
    showNotification('🖱️ Modo Edição Livre ativado! Arraste os nós livremente pela tela.', 'info');
}

// Função auxiliar para obter informações da pessoa por ID
function obterInfoPessoaPorId(pessoaId, tipoPessoa) {
    try {
        const tabela = tipoPessoa === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica';
        return db.getById(tabela, pessoaId);
    } catch (error) {
        return null;
    }
}

// Criar elementos interativos
function criarElementosInterativos(g, dados, width, height) {
    // Definições (gradientes, sombras, marcadores)
    criarDefinicoesSVG(g);

    // Links (conexões)
    const links = criarLinksInterativos(g, dados);

    // Nós (pessoas)
    const nos = criarNosInterativos(g, dados);

    // Configurar animações da simulação
    if (simulacao) {
        simulacao.on('tick', () => {
            // Atualizar posições dos links
            links.selectAll('line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            // Atualizar posições dos labels dos links
            links.selectAll('.link-label')
                .attr('transform', d => {
                    const midX = (d.source.x + d.target.x) / 2;
                    const midY = (d.source.y + d.target.y) / 2;
                    return `translate(${midX}, ${midY})`;
                });

            // Atualizar posições dos nós
            nos.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
    }
}

// Criar definições SVG (gradientes, filtros, marcadores)
function criarDefinicoesSVG(g) {
    const svg = g.select(function() { return this.ownerSVGElement; });
    let defs = svg.select('defs');
    if (defs.empty()) {
        defs = svg.append('defs');
    }
    
    // Criar padrão de fundo elegante
    criarPadraoFundo(svg, defs);

    // Marcador de seta
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 35)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .append('path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#444')
        .style('stroke', 'none');

    // Gradientes para pessoas físicas
    const gradientFisica = defs.append('linearGradient')
        .attr('id', 'gradient-fisica')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
    
    gradientFisica.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', arvoreConfig.coresPadrao.fisica.gradiente1);
    
    gradientFisica.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', arvoreConfig.coresPadrao.fisica.gradiente2);

    // Gradientes para pessoas jurídicas
    const gradientJuridica = defs.append('linearGradient')
        .attr('id', 'gradient-juridica')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
    
    gradientJuridica.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', arvoreConfig.coresPadrao.juridica.gradiente1);
    
    gradientJuridica.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', arvoreConfig.coresPadrao.juridica.gradiente2);

    // Filtro de sombra
    const filter = defs.append('filter')
        .attr('id', 'shadow')
        .attr('x', '-50%').attr('y', '-50%')
        .attr('width', '200%').attr('height', '200%');
    
    filter.append('feDropShadow')
        .attr('dx', 3).attr('dy', 3)
        .attr('stdDeviation', 4)
        .attr('flood-opacity', 0.3);

    // Filtro de destaque
    const highlightFilter = defs.append('filter')
        .attr('id', 'highlight')
        .attr('x', '-50%').attr('y', '-50%')
        .attr('width', '200%').attr('height', '200%');
    
    highlightFilter.append('feDropShadow')
        .attr('dx', 0).attr('dy', 0)
        .attr('stdDeviation', 8)
        .attr('flood-color', '#ffd700')
        .attr('flood-opacity', 0.8);
}

// Criar padrão de fundo elegante
function criarPadraoFundo(svg, defs) {
    // Gradiente radial para o fundo
    const backgroundGradient = defs.append('radialGradient')
        .attr('id', 'background-gradient')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '100%');
    
    backgroundGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#ffffff')
        .attr('stop-opacity', 0.9);
    
    backgroundGradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', '#f8fafc')
        .attr('stop-opacity', 0.7);
        
    backgroundGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#e2e8f0')
        .attr('stop-opacity', 0.5);

    // Padrão de grid sutil
    const pattern = defs.append('pattern')
        .attr('id', 'grid-pattern')
        .attr('width', 40)
        .attr('height', 40)
        .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
        .attr('d', 'M 40 0 L 0 0 0 40')
        .attr('fill', 'none')
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.3);

    // Adicionar padrão de pontos decorativos
    const dotsPattern = defs.append('pattern')
        .attr('id', 'dots-pattern')
        .attr('width', 20)
        .attr('height', 20)
        .attr('patternUnits', 'userSpaceOnUse');

    dotsPattern.append('circle')
        .attr('cx', 10)
        .attr('cy', 10)
        .attr('r', 1)
        .attr('fill', '#94a3b8')
        .attr('opacity', 0.2);

    // Aplicar fundo melhorado ao SVG
    const rect = svg.select('rect.background');
    if (rect.empty()) {
        svg.insert('rect', ':first-child')
            .attr('class', 'background')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#background-gradient)');
            
        svg.insert('rect', ':nth-child(2)')
            .attr('class', 'grid-background')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#grid-pattern)');
            
        svg.insert('rect', ':nth-child(3)')
            .attr('class', 'dots-background')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#dots-pattern)');
    }
}

// Criar links interativos
function criarLinksInterativos(g, dados) {
    const linkGroup = g.append('g').attr('class', 'links');
    
    const links = linkGroup.selectAll('.link')
        .data(dados.links)
        .enter()
        .append('g')
        .attr('class', 'link')
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            event.stopPropagation();
            mostrarMenuRelacionamento(d, event);
        })
        .on('mouseover', function(event, d) {
            destacarRelacionamento(d, true);
        })
        .on('mouseout', function(event, d) {
            destacarRelacionamento(d, false);
        });

    // Linha do relacionamento com estilos variados
    const linkLines = links.append('line')
        .attr('stroke', d => getRelationshipColor(d.relationship))
        .attr('stroke-width', d => getRelationshipWidth(d.relationship))
        .attr('stroke-dasharray', d => getRelationshipDashArray(d.relationship))
        .attr('marker-end', 'url(#arrowhead)')
        .attr('opacity', d => getRelationshipOpacity(d.relationship))
        .style('filter', d => getRelationshipFilter(d.relationship))
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
            // Destacar linha quando mouse passar por cima
            d3.select(this).attr('stroke-width', parseInt(getRelationshipWidth(d.relationship)) + 2);
            mostrarPontosControleVinculo(d, this);
        })
        .on('mouseleave', function(event, d) {
            d3.select(this).attr('stroke-width', getRelationshipWidth(d.relationship));
            esconderPontosControleVinculo();
        });

    // Label do relacionamento
    const labelGroup = links.append('g').attr('class', 'link-label');
    
    // Fundo do label
    labelGroup.append('rect')
        .attr('width', 70)
        .attr('height', 18)
        .attr('x', -35)
        .attr('y', -12)
        .attr('rx', 9)
        .attr('fill', d => getRelationshipColor(d.relationship))
        .attr('fill-opacity', 0.9)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

    // Texto do label
    labelGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text(d => getRelationshipLabel(d.relationship));

    return links;
}

// Criar nós interativos
function criarNosInterativos(g, dados) {
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    const nos = nodeGroup.selectAll('.node')
        .data(dados.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        )
        .on('click', function(event, d) {
            event.stopPropagation();
            mostrarMenuNoSimples(d, event);
        })
        .on('dblclick', function(event, d) {
            event.stopPropagation();
            toggleExpansaoNoSimples(d);
        })
        .on('mouseover', function(event, d) {
            destacarNo(d, true);
        })
        .on('mouseout', function(event, d) {
            destacarNo(d, false);
        });

    // Círculo principal do nó (maior para acomodar nomes completos)
    nos.append('circle')
        .attr('r', 40)
        .attr('fill', d => {
            // Verificar se há cor personalizada
            const corPersonalizada = arvoreConfig.coresPersonalizadas.get(d.id);
            if (corPersonalizada) {
                return corPersonalizada;
            }
            return d.type === 'fisica' ? 'url(#gradient-fisica)' : 'url(#gradient-juridica)';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#shadow)');

    // Foto da pessoa (se disponível)
    nos.each(function(d) {
        const fotoUrl = arvoreConfig.fotosPersonalizadas.get(d.id);
        if (fotoUrl) {
            d3.select(this).append('image')
                .attr('href', fotoUrl)
                .attr('x', -30)
                .attr('y', -30)
                .attr('width', 60)
                .attr('height', 60)
                .attr('clip-path', 'circle(30px)')
                .attr('preserveAspectRatio', 'xMidYMid slice');
        } else {
            // Ícone padrão
            d3.select(this).append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr('font-size', '18px')
                .attr('font-family', 'Font Awesome 6 Free')
                .attr('font-weight', '900')
                .attr('fill', '#fff')
                .text(d => d.type === 'fisica' ? '\uf007' : '\uf1ad');
        }
    });

    // Nome da pessoa (completo com quebra de linha se necessário)
    nos.each(function(d) {
        const nomeCompleto = d.name;
        const palavras = nomeCompleto.split(' ');
        const g = d3.select(this);
        
        if (palavras.length <= 2 || nomeCompleto.length <= 20) {
            // Nome curto - uma linha só
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '45px')
                .attr('font-size', '11px')
                .attr('font-weight', 'bold')
                .attr('fill', '#333')
                .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
                .text(nomeCompleto);
        } else {
            // Nome longo - dividir em duas linhas
            const meio = Math.ceil(palavras.length / 2);
            const linha1 = palavras.slice(0, meio).join(' ');
            const linha2 = palavras.slice(meio).join(' ');
            
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '40px')
                .attr('font-size', '10px')
                .attr('font-weight', 'bold')
                .attr('fill', '#333')
                .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
                .text(linha1);
                
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '52px')
                .attr('font-size', '10px')
                .attr('font-weight', 'bold')
                .attr('fill', '#333')
                .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
                .text(linha2);
        }
    });

    // Documento (CPF/CNPJ) - posição ajustada
    nos.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '65px')
        .attr('font-size', '8px')
        .attr('fill', '#666')
        .style('text-shadow', '1px 1px 1px rgba(255,255,255,0.8)')
        .text(d => d.documento);

    // GOA (se disponível) - posição ajustada
    nos.filter(d => d.goa && d.goa !== '-')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '76px')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('fill', '#007bff')
        .style('text-shadow', '1px 1px 1px rgba(255,255,255,0.9)')
        .text(d => d.goa);

    // Indicador de expansão
    nos.filter(d => nosExpandidos.has(d.id))
        .append('circle')
        .attr('r', 8)
        .attr('cx', 25)
        .attr('cy', -25)
        .attr('fill', '#28a745')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    nos.filter(d => nosExpandidos.has(d.id))
        .append('text')
        .attr('x', 25)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text('E');

    // Botão de ações (menu)
    const actionBtn = nos.append('g')
        .attr('class', 'action-button')
        .style('opacity', 0);

    actionBtn.append('circle')
        .attr('r', 12)
        .attr('cx', -25)
        .attr('cy', -25)
        .attr('fill', '#6c757d')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    actionBtn.append('text')
        .attr('x', -25)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'Font Awesome 6 Free')
        .attr('font-weight', '900')
        .attr('fill', '#fff')
        .text('\uf013'); // cog/settings icon

    // Mostrar botão de ações no hover
    nos.on('mouseenter', function() {
        d3.select(this).select('.action-button')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }).on('mouseleave', function() {
        d3.select(this).select('.action-button')
            .transition()
            .duration(200)
            .style('opacity', 0);
    });

    return nos;
}

// Funções de drag
function dragstarted(event, d) {
    if (!event.active && simulacao) simulacao.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active && simulacao) simulacao.alphaTarget(0);
    // Mantém d.fx e d.fy fixos na posição final do arrasto
}

// Versão simples do menu contextual que sempre funciona
function mostrarMenuNoSimples(no, event) {
    console.log('Clicou na pessoa:', no.name);
    
    // Remover qualquer menu anterior
    const menuAnterior = document.querySelector('.menu-contextual-simples');
    if (menuAnterior) {
        menuAnterior.remove();
    }
    
    // Criar menu HTML diretamente
    const menu = document.createElement('div');
    menu.className = 'menu-contextual-simples';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px 0;
        z-index: 99999;
        min-width: 200px;
        font-family: Inter, sans-serif;
        font-size: 14px;
    `;
    
    // Calcular posição
    const x = Math.min(event.clientX, window.innerWidth - 220);
    const y = Math.min(event.clientY, window.innerHeight - 300);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    // Criar opções do menu
    const opcoes = [
        {
            icone: 'fas fa-eye',
            texto: 'Ver Detalhes',
            acao: () => {
                menu.remove();
                setTimeout(() => {
                    verDetalhesSeguro(no.type === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica', no.pessoa_id);
                }, 100);
            }
        },
        {
            icone: 'fas fa-expand-arrows-alt',
            texto: nosExpandidos.has(no.id) ? 'Recolher Vínculos' : 'Expandir Vínculos',
            acao: () => {
                menu.remove();
                toggleExpansaoNoSimples(no);
            }
        },
        {
            icone: 'fas fa-plus',
            texto: 'Novo Vínculo',
            acao: () => {
                menu.remove();
                criarNovoVinculoSimples(no);
            }
        },
        {
            icone: 'fas fa-user-plus',
            texto: 'Adicionar Nova Pessoa',
            acao: () => {
                menu.remove();
                adicionarNovaPessoa(no);
            }
        },
        {
            icone: 'fas fa-unlink',
            texto: 'Remover Vínculos',
            acao: () => {
                menu.remove();
                removerVinculosPessoa(no);
            }
        },
        {
            icone: 'fas fa-magic',
            texto: 'Ligações Automáticas',
            acao: () => {
                menu.remove();
                localizarEExpandirNaArvore(no.pessoa_id, no.type);
            }
        },
        {
            icone: 'fas fa-palette',
            texto: 'Personalizar Cor',
            acao: () => {
                menu.remove();
                personalizarCorSimples(no);
            }
        },
        {
            icone: 'fas fa-camera',
            texto: 'Adicionar Foto',
            acao: () => {
                menu.remove();
                adicionarFotoSimples(no);
            }
        },
        {
            icone: 'fas fa-crosshairs',
            texto: 'Centralizar na Tela',
            acao: () => {
                menu.remove();
                centralizarNo(no);
            }
        }
    ];
    
    // Adicionar opções ao menu
    opcoes.forEach(opcao => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background 0.2s;
        `;
        
        item.innerHTML = `
            <i class="${opcao.icone}" style="width: 16px; margin-right: 8px; color: #343a40;"></i>
            <span style="color: #212529;">${opcao.texto}</span>
        `;
        
        item.onmouseenter = () => item.style.background = '#f8f9fa';
        item.onmouseleave = () => item.style.background = 'transparent';
        item.onclick = opcao.acao;
        
        menu.appendChild(item);
    });
    
    // Adicionar ao body
    document.body.appendChild(menu);
    
    // Fechar menu ao clicar fora
    setTimeout(() => {
        const fecharMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', fecharMenu);
            }
        };
        document.addEventListener('click', fecharMenu);
    }, 100);
}

// Mostrar menu contextual do nó (versão antiga - manter para compatibilidade)
function mostrarMenuNo(no, event) {
    // Fechar menu anterior se existir
    d3.select('.menu-contextual').remove();
    
    const menu = criarMenuContextual([
        {
            icone: 'fas fa-eye',
            texto: 'Ver Detalhes',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => verDetalhes(no.type === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica', no.pessoa_id), 100);
            }
        },
        {
            icone: 'fas fa-expand-arrows-alt',
            texto: nosExpandidos.has(no.id) ? 'Recolher Vínculos' : 'Expandir Vínculos',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => toggleExpansaoNo(no), 100);
            }
        },
        {
            icone: 'fas fa-plus',
            texto: 'Novo Vínculo',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => criarNovoVinculo(no), 100);
            }
        },
        {
            icone: 'fas fa-magic',
            texto: 'Ligações Automáticas',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => localizarEExpandirNaArvore(no.pessoa_id, no.type), 100);
            }
        },
        {
            icone: 'fas fa-palette',
            texto: 'Personalizar Cor',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => personalizarCorNoSeguro(no), 100);
            }
        },
        {
            icone: 'fas fa-camera',
            texto: 'Adicionar Foto',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => adicionarFotoNoSeguro(no), 100);
            }
        },
        {
            icone: 'fas fa-crosshairs',
            texto: 'Centralizar na Tela',
            acao: () => {
                d3.select('.menu-contextual').remove();
                setTimeout(() => centralizarNo(no), 100);
            }
        }
    ]);

    posicionarMenuContextual(menu, event);
}

// Mostrar menu contextual do relacionamento
function mostrarMenuRelacionamento(rel, event) {
    const menu = criarMenuContextual([
        {
            icone: 'fas fa-info-circle',
            texto: 'Detalhes do Relacionamento',
            acao: () => mostrarInfoRelacionamento(rel)
        },
        {
            icone: 'fas fa-edit',
            texto: 'Editar Relacionamento',
            acao: () => editarRelacionamento(rel)
        },
        {
            icone: 'fas fa-trash',
            texto: 'Excluir Relacionamento',
            acao: () => excluirRelacionamento(rel.id)
        }
    ]);

    posicionarMenuContextual(menu, event);
}

// Função para editar relacionamento (implementação que estava faltando)
function editarRelacionamento(relacionamento) {
    try {
        console.log('🔧 Editando relacionamento:', relacionamento);
        
        // Criar modal para edição
        const modalHtml = `
            <div class="modal fade" id="modalEditarRelacionamento" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-edit me-2"></i>Editar Relacionamento
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarRelacionamento">
                                <div class="mb-3">
                                    <label class="form-label">ID do Relacionamento</label>
                                    <input type="text" class="form-control" value="${relacionamento.id}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tipo de Relacionamento</label>
                                    <select class="form-select" id="tipoRelacionamentoEdit" required>
                                        <option value="PAI" ${relacionamento.tipo === 'PAI' ? 'selected' : ''}>Pai</option>
                                        <option value="MAE" ${relacionamento.tipo === 'MAE' ? 'selected' : ''}>Mãe</option>
                                        <option value="FILHO" ${relacionamento.tipo === 'FILHO' ? 'selected' : ''}>Filho</option>
                                        <option value="IRMAO" ${relacionamento.tipo === 'IRMAO' ? 'selected' : ''}>Irmão</option>
                                        <option value="CONJUGE" ${relacionamento.tipo === 'CONJUGE' ? 'selected' : ''}>Cônjuge</option>
                                        <option value="SOCIO" ${relacionamento.tipo === 'SOCIO' ? 'selected' : ''}>Sócio</option>
                                        <option value="EMPRESARIAL" ${relacionamento.tipo === 'EMPRESARIAL' ? 'selected' : ''}>Empresarial</option>
                                        <option value="PARENTE" ${relacionamento.tipo === 'PARENTE' ? 'selected' : ''}>Parente</option>
                                        <option value="TELEFONE" ${relacionamento.tipo === 'TELEFONE' ? 'selected' : ''}>Telefone</option>
                                        <option value="ENDERECO" ${relacionamento.tipo === 'ENDERECO' ? 'selected' : ''}>Endereço</option>
                                        <option value="OUTRO" ${relacionamento.tipo === 'OUTRO' ? 'selected' : ''}>Outro</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descrição (Opcional)</label>
                                    <textarea class="form-control" id="descricaoRelacionamentoEdit" rows="3" placeholder="Informações adicionais sobre o relacionamento">${relacionamento.descricao || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="relacionamentoBidirecionalEdit" ${relacionamento.bidirecional ? 'checked' : ''}>
                                        <label class="form-check-label">
                                            Relacionamento bidirecional (aparece para ambas as pessoas)
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-success" onclick="salvarEdicaoRelacionamento('${relacionamento.id}')">
                                <i class="fas fa-save me-1"></i>Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalEditarRelacionamento'));
        modal.show();
        
        // Remover modal quando fechado
        document.getElementById('modalEditarRelacionamento').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Erro ao editar relacionamento:', error);
        showNotification('Erro ao abrir edição de relacionamento', 'error');
    }
}

// Função para salvar edição de relacionamento
function salvarEdicaoRelacionamento(relacionamentoId) {
    try {
        const tipo = document.getElementById('tipoRelacionamentoEdit').value;
        const descricao = document.getElementById('descricaoRelacionamentoEdit').value;
        const bidirecional = document.getElementById('relacionamentoBidirecionalEdit').checked;
        
        // Buscar relacionamento no banco
        const relacionamentos = db.getAll('relacionamentos');
        const relacionamento = relacionamentos.find(r => r.id === relacionamentoId);
        
        if (!relacionamento) {
            throw new Error('Relacionamento não encontrado');
        }
        
        // Atualizar dados
        relacionamento.tipo = tipo;
        relacionamento.descricao = descricao;
        relacionamento.bidirecional = bidirecional;
        relacionamento.data_modificacao = new Date().toISOString();
        
        // Salvar no banco
        db.update('relacionamentos', relacionamentoId, relacionamento);
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('modalEditarRelacionamento')).hide();
        
        // Atualizar árvore
        renderizarArvoreInterativa();
        
        showNotification('✅ Relacionamento atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar relacionamento:', error);
        showNotification('Erro ao salvar relacionamento: ' + error.message, 'error');
    }
}

// Criar menu contextual
function criarMenuContextual(opcoes) {
    // Remover qualquer menu anterior
    d3.selectAll('.menu-contextual').remove();
    
    // Limpar event listeners anteriores
    d3.select('body').on('click.menu-contextual', null);

    const menu = d3.select('body')
        .append('div')
        .attr('class', 'menu-contextual')
        .style('position', 'fixed') // Usar fixed em vez de absolute
        .style('background', '#fff')
        .style('border', '1px solid #ddd')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('padding', '8px 0')
        .style('z-index', '99999') // Z-index mais alto
        .style('min-width', '180px')
        .style('max-width', '250px');

    opcoes.forEach((opcao, index) => {
        const item = menu.append('div')
            .style('padding', '8px 16px')
            .style('cursor', 'pointer')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('transition', 'background 0.2s')
            .style('font-family', 'Inter, sans-serif')
            .on('mouseover', function() {
                d3.select(this).style('background', '#f8f9fa');
            })
            .on('mouseout', function() {
                d3.select(this).style('background', 'transparent');
            })
            .on('click', function(event) {
                event.stopPropagation();
                event.preventDefault();
                
                // Remover menu imediatamente
                menu.remove();
                d3.select('body').on('click.menu-contextual', null);
                
                // Executar ação após pequeno delay
                setTimeout(() => {
                    try {
                        opcao.acao();
                    } catch (error) {
                        console.error('Erro ao executar ação do menu:', error);
                        showNotification('Erro ao executar ação. Tente novamente.', 'error');
                    }
                }, 50);
            });

        // Ícone
        item.append('i')
            .attr('class', opcao.icone + ' me-2')
            .style('width', '16px')
            .style('color', '#6c757d')
            .style('margin-right', '8px');

        // Texto
        item.append('span')
            .text(opcao.texto)
            .style('font-size', '14px')
            .style('color', '#333');
    });

    // Fechar menu ao clicar fora ou pressionar ESC
    setTimeout(() => {
        // Listener para clique fora
        d3.select('body').on('click.menu-contextual', function(event) {
            if (!menu.node().contains(event.target)) {
                menu.remove();
                d3.select('body').on('click.menu-contextual', null);
                d3.select('body').on('keydown.menu-contextual', null);
            }
        });
        
        // Listener para ESC
        d3.select('body').on('keydown.menu-contextual', function(event) {
            if (event.key === 'Escape') {
                menu.remove();
                d3.select('body').on('click.menu-contextual', null);
                d3.select('body').on('keydown.menu-contextual', null);
            }
        });
    }, 100);

    return menu;
}

// Posicionar menu contextual
function posicionarMenuContextual(menu, event) {
    const menuNode = menu.node();
    const rect = menuNode.getBoundingClientRect();
    
    let x = event.pageX;
    let y = event.pageY;

    // Ajustar se sair da tela
    if (x + rect.width > window.innerWidth) {
        x = event.pageX - rect.width;
    }
    if (y + rect.height > window.innerHeight) {
        y = event.pageY - rect.height;
    }

    menu.style('left', x + 'px')
        .style('top', y + 'px');
}

// Toggle expansão do nó
function toggleExpansaoNo(no) {
    try {
        if (nosExpandidos.has(no.id)) {
            nosExpandidos.delete(no.id);
            showNotification(`Vínculos de ${truncarTexto(no.name, 20)} recolhidos`, 'info');
        } else {
            nosExpandidos.add(no.id);
            
            showNotification('Analisando relacionamentos...', 'info');
            
            // Criar relacionamentos automáticos em background
            setTimeout(() => {
                try {
                    const novosRels = criarRelacionamentosParaPessoa(no.pessoa_id, no.type);
                    
                    if (novosRels > 0) {
                        showNotification(`${novosRels} novo(s) vínculo(s) encontrado(s) para ${truncarTexto(no.name, 20)}!`, 'success');
                    } else {
                        showNotification(`Vínculos de ${truncarTexto(no.name, 20)} expandidos`, 'info');
                    }
                    
                    // Re-renderizar árvore
                    renderizarArvoreInterativa();
                } catch (error) {
                    console.error('Erro ao criar relacionamentos:', error);
                    showNotification('Erro ao analisar relacionamentos', 'error');
                }
            }, 100);
        }

        // Re-renderizar árvore imediatamente para mostrar estado expandido/recolhido
        setTimeout(() => {
            renderizarArvoreInterativa();
        }, 50);
        
    } catch (error) {
        console.error('Erro ao expandir/recolher vínculos:', error);
        showNotification('Erro ao alterar vínculos. Tente novamente.', 'error');
    }
}

// Personalizar cor do nó (versão segura)
function personalizarCorNoSeguro(no) {
    try {
        // Garantir que não há modal aberto
        fecharModalSeguro();
        
        // Esperar um pouco antes de abrir o novo modal
        setTimeout(() => {
            personalizarCorNo(no);
        }, 200);
    } catch (error) {
        console.error('Erro ao abrir personalização de cor:', error);
        showNotification('Erro ao abrir personalização. Tente novamente.', 'error');
    }
}

// Personalizar cor do nó
function personalizarCorNo(no) {
    const cores = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
        '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f',
        '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa'
    ];

    const paletaHtml = cores.map(cor => 
        `<div class="cor-opcao" data-cor="${cor}" style="
            width: 40px; height: 40px; background: ${cor}; 
            border-radius: 50%; cursor: pointer; margin: 5px;
            border: 3px solid transparent; display: inline-block;
        "></div>`
    ).join('');

    // Mostrar modal de seleção de cor
    fecharModalSeguro();
    
    setTimeout(() => {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
        
        modalTitle.innerHTML = '<i class="fas fa-palette me-2"></i>Personalizar Cor';
        modalBody.innerHTML = `
            <div class="text-center mb-3">
                <h6>Escolha uma cor para ${truncarTexto(no.name, 30)}</h6>
            </div>
            <div class="d-flex flex-wrap justify-content-center mb-3">
                ${paletaHtml}
            </div>
            <div class="text-center">
                <button class="btn btn-secondary me-2" onclick="removerCorPersonalizada('${no.id}')">
                    <i class="fas fa-undo me-1"></i>Cor Padrão
                </button>
                <button class="btn btn-success" onclick="fecharModal()">
                    <i class="fas fa-check me-1"></i>Concluído
                </button>
            </div>
        `;

        // Event listeners para seleção de cor (versão segura)
        modalBody.querySelectorAll('.cor-opcao').forEach(elemento => {
            elemento.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                try {
                    const cor = this.dataset.cor;
                    arvoreConfig.coresPersonalizadas.set(no.id, cor);
                    
                    // Remover seleção anterior
                    modalBody.querySelectorAll('.cor-opcao').forEach(el => {
                        el.style.border = '3px solid transparent';
                    });
                    
                    // Destacar cor selecionada
                    this.style.border = '3px solid #007bff';
                    
                    showNotification(`Cor alterada para ${truncarTexto(no.name, 20)}`, 'success');
                    
                    // Re-renderizar árvore após fechar modal
                    setTimeout(() => {
                        renderizarArvoreInterativa();
                    }, 300);
                    
                } catch (error) {
                    console.error('Erro ao alterar cor:', error);
                    showNotification('Erro ao alterar cor. Tente novamente.', 'error');
                }
            });
        });

        // Mostrar modal
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.show();
        } else {
            modalInstance = new bootstrap.Modal(modalEl);
            modalInstance.show();
        }
    }, 100);
}

// Remover cor personalizada
function removerCorPersonalizada(nodeId) {
    try {
        arvoreConfig.coresPersonalizadas.delete(nodeId);
        showNotification('Cor padrão restaurada', 'info');
        
        // Re-renderizar após pequeno delay
        setTimeout(() => {
            renderizarArvoreInterativa();
        }, 200);
    } catch (error) {
        console.error('Erro ao remover cor:', error);
        showNotification('Erro ao restaurar cor padrão', 'error');
    }
}

// Adicionar foto ao nó (versão segura)
function adicionarFotoNoSeguro(no) {
    try {
        // Garantir que não há modal aberto
        fecharModalSeguro();
        
        // Esperar um pouco antes de abrir o novo modal
        setTimeout(() => {
            adicionarFotoNo(no);
        }, 200);
    } catch (error) {
        console.error('Erro ao abrir adição de foto:', error);
        showNotification('Erro ao abrir adição de foto. Tente novamente.', 'error');
    }
}

// Adicionar foto ao nó
function adicionarFotoNo(no) {
    fecharModalSeguro();
    
    setTimeout(() => {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
        
        modalTitle.innerHTML = '<i class="fas fa-camera me-2"></i>Adicionar Foto';
        modalBody.innerHTML = `
            <div class="text-center mb-3">
                <h6>Adicionar foto para ${truncarTexto(no.name, 30)}</h6>
            </div>
            <div class="mb-3">
                <label class="form-label">URL da Imagem:</label>
                <input type="url" class="form-control" id="foto-url" 
                       placeholder="https://exemplo.com/foto.jpg">
                <small class="text-muted">Cole o link de uma imagem online</small>
            </div>
            <div class="mb-3">
                <label class="form-label">Ou selecione um arquivo:</label>
                <input type="file" class="form-control" id="foto-arquivo" 
                       accept="image/*">
            </div>
            <div id="preview-foto" class="text-center mb-3" style="display: none;">
                <img id="img-preview" style="max-width: 150px; max-height: 150px; border-radius: 50%;">
            </div>
            <div class="text-center">
                <button class="btn btn-secondary me-2" onclick="removerFoto('${no.id}')">
                    <i class="fas fa-times me-1"></i>Remover Foto
                </button>
                <button class="btn btn-primary me-2" onclick="previewFoto()">
                    <i class="fas fa-eye me-1"></i>Preview
                </button>
                <button class="btn btn-success" onclick="salvarFoto('${no.id}')">
                    <i class="fas fa-save me-1"></i>Salvar
                </button>
            </div>
        `;

        // Event listeners
        document.getElementById('foto-url').addEventListener('input', previewFoto);
        document.getElementById('foto-arquivo').addEventListener('change', handleFileSelect);

        // Mostrar modal
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.show();
        } else {
            modalInstance = new bootstrap.Modal(modalEl);
            modalInstance.show();
        }
    }, 100);
}

// Preview da foto
function previewFoto() {
    const url = document.getElementById('foto-url').value;
    const preview = document.getElementById('preview-foto');
    const img = document.getElementById('img-preview');
    
    if (url) {
        img.src = url;
        preview.style.display = 'block';
        
        img.onerror = () => {
            showNotification('Erro ao carregar imagem. Verifique o URL.', 'error');
            preview.style.display = 'none';
        };
    }
}

// Handle file select
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('foto-url').value = e.target.result;
            previewFoto();
        };
        reader.readAsDataURL(file);
    }
}

// Salvar foto
function salvarFoto(nodeId) {
    try {
        const url = document.getElementById('foto-url').value;
        if (url) {
            arvoreConfig.fotosPersonalizadas.set(nodeId, url);
            showNotification('Foto adicionada com sucesso!', 'success');
            
            // Fechar modal primeiro
            fecharModal();
            
            // Re-renderizar árvore após fechar modal
            setTimeout(() => {
                renderizarArvoreInterativa();
            }, 300);
        } else {
            showNotification('Selecione uma foto primeiro', 'warning');
        }
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        showNotification('Erro ao salvar foto. Tente novamente.', 'error');
    }
}

// Remover foto
function removerFoto(nodeId) {
    try {
        arvoreConfig.fotosPersonalizadas.delete(nodeId);
        showNotification('Foto removida', 'info');
        
        // Fechar modal primeiro
        fecharModal();
        
        // Re-renderizar após fechar modal
        setTimeout(() => {
            renderizarArvoreInterativa();
        }, 300);
    } catch (error) {
        console.error('Erro ao remover foto:', error);
        showNotification('Erro ao remover foto', 'error');
    }
}

// Centralizar nó na tela
function centralizarNo(no) {
    const svg = d3.select('#arvore-container svg');
    const zoom = d3.zoom();
    
    // Calcular transformação para centralizar o nó
    const rect = svg.node().getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const transform = d3.zoomIdentity
        .translate(centerX - no.x, centerY - no.y)
        .scale(1.5);
    
    svg.transition()
        .duration(750)
        .call(zoom.transform, transform);
    
    showNotification(`${truncarTexto(no.name, 20)} centralizado na tela`, 'info');
}

// Criar novo vínculo
function criarNovoVinculo(no) {
    // Implementar interface para criar novo relacionamento
    const origemSelect = document.getElementById('pessoa-origem');
    const destinoSelect = document.getElementById('pessoa-destino');
    
    if (origemSelect && destinoSelect) {
        // Pré-selecionar a pessoa atual
        origemSelect.value = `${no.type}_${no.pessoa_id}`;
        
        // Focar no campo de destino
        destinoSelect.focus();
        
        // Mostrar aba de relacionamentos
        const tabRelacionamentos = document.querySelector('[data-bs-target="#relacionamentos"]');
        if (tabRelacionamentos) {
            tabRelacionamentos.click();
        }
        
        showNotification(`Pessoa "${truncarTexto(no.name, 20)}" pré-selecionada. Escolha o destino do relacionamento.`, 'info');
    } else {
        showNotification('Formulário de relacionamentos não encontrado', 'error');
    }
}

// Destacar nó
function destacarNo(no, destacar) {
    const svg = d3.select('#arvore-container svg');
    const nodeElement = svg.selectAll('.node').filter(d => d.id === no.id);
    
    if (destacar) {
        nodeElement.select('circle')
            .attr('filter', 'url(#highlight)')
            .transition()
            .duration(200)
            .attr('r', 45);
    } else {
        nodeElement.select('circle')
            .attr('filter', 'url(#shadow)')
            .transition()
            .duration(200)
            .attr('r', 40);
    }
}

// Destacar relacionamento
function destacarRelacionamento(rel, destacar) {
    const svg = d3.select('#arvore-container svg');
    const linkElement = svg.selectAll('.link').filter(d => d.id === rel.id);
    
    if (destacar) {
        linkElement.select('line')
            .transition()
            .duration(200)
            .attr('stroke-width', d => getRelationshipWidth(d.relationship) + 2)
            .attr('opacity', 1);
    } else {
        linkElement.select('line')
            .transition()
            .duration(200)
            .attr('stroke-width', d => getRelationshipWidth(d.relationship))
            .attr('opacity', 0.8);
    }
}

// Alterar layout da árvore
function alterarLayoutArvore(layout) {
    arvoreConfig.layoutTipo = layout;
    renderizarArvoreInterativa();
    showNotification(`Layout alterado para: ${layout}`, 'info');
}

// Controles de zoom
function ajustarZoom(fator) {
    const svg = d3.select('#arvore-container svg');
    const zoom = d3.zoom();
    
    svg.transition()
        .duration(300)
        .call(zoom.scaleBy, fator);
}

function resetarZoom() {
    const svg = d3.select('#arvore-container svg');
    const zoom = d3.zoom();
    
    svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
}

// Expandir todos os nós
function expandirTodosNos() {
    const dados = prepararDadosArvore();
    dados.nodes.forEach(no => {
        nosExpandidos.add(no.id);
        criarRelacionamentosParaPessoa(no.pessoa_id, no.type);
    });
    
    renderizarArvoreInterativa();
    showNotification('Todos os vínculos expandidos!', 'success');
}

// Recolher todos os nós
function recolherTodosNos() {
    nosExpandidos.clear();
    renderizarArvoreInterativa();
    showNotification('Todos os vínculos recolhidos', 'info');
}

// Reorganizar árvore
function reorganizarArvore() {
    if (simulacao) {
        simulacao.alpha(1).restart();
        showNotification('Árvore reorganizada', 'info');
    }
}

// Buscar pessoa na árvore (implementação melhorada)
function buscarPessoaNaArvore() {
    const termo = document.getElementById('busca-arvore').value.trim().toLowerCase();
    const resultadosDiv = document.getElementById('resultados-busca-arvore');
    
    if (!termo) {
        resultadosDiv.innerHTML = '';
        return;
    }

    if (termo.length < 2) {
        resultadosDiv.innerHTML = '<div class="alert alert-info">Digite pelo menos 2 caracteres</div>';
        return;
    }

    // Buscar em pessoas físicas e jurídicas
    const pessoasFisicas = db.getAll('pessoa_fisica');
    const pessoasJuridicas = db.getAll('pessoa_juridica');
    const resultados = [];

    // Buscar matches
    pessoasFisicas.forEach(pessoa => {
        if (matchPessoaFisica(pessoa, termo)) {
            resultados.push({
                pessoa: pessoa,
                tipo: 'fisica',
                table: 'pessoa_fisica',
                score: calcularScore(pessoa, termo, 'fisica')
            });
        }
    });

    pessoasJuridicas.forEach(pessoa => {
        if (matchPessoaJuridica(pessoa, termo)) {
            resultados.push({
                pessoa: pessoa,
                tipo: 'juridica',
                table: 'pessoa_juridica',
                score: calcularScore(pessoa, termo, 'juridica')
            });
        }
    });

    // Ordenar por relevância
    resultados.sort((a, b) => b.score - a.score);

    mostrarResultadosBusca(resultados.slice(0, 10), termo);
}

// Calcular score de relevância
function calcularScore(pessoa, termo, tipo) {
    let score = 0;
    const termoLower = termo.toLowerCase();
    
    const nome = tipo === 'fisica' ? pessoa.nome : pessoa.razao_social;
    if (nome && nome.toLowerCase().includes(termoLower)) {
        score += nome.toLowerCase() === termoLower ? 100 : 50;
    }
    
    if (pessoa.goa && pessoa.goa.toLowerCase().includes(termoLower)) {
        score += 75;
    }
    
    const documento = tipo === 'fisica' ? pessoa.cpf : pessoa.cnpj;
    if (documento && documento.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) {
        score += 60;
    }
    
    return score;
}

// Buscar e expandir por GOA
function buscarEExpandirPorGOA() {
    const goa = document.getElementById('busca-goa').value.trim();
    if (!goa) {
        showNotification('Digite um GOA para buscar', 'warning');
        return;
    }

    // Buscar pessoa pelo GOA
    const pessoasFisicas = db.getAll('pessoa_fisica');
    const pessoasJuridicas = db.getAll('pessoa_juridica');
    
    let pessoaEncontrada = null;
    let tipoPessoa = null;

    // Buscar em PF
    for (let pessoa of pessoasFisicas) {
        if (pessoa.goa && pessoa.goa.toLowerCase() === goa.toLowerCase()) {
            pessoaEncontrada = pessoa;
            tipoPessoa = 'fisica';
            break;
        }
    }

    // Buscar em PJ se não encontrou
    if (!pessoaEncontrada) {
        for (let pessoa of pessoasJuridicas) {
            if (pessoa.goa && pessoa.goa.toLowerCase() === goa.toLowerCase()) {
                pessoaEncontrada = pessoa;
                tipoPessoa = 'juridica';
                break;
            }
        }
    }

    if (pessoaEncontrada) {
        // Expandir na árvore
        localizarEExpandirNaArvore(pessoaEncontrada.id, tipoPessoa);
        
        // Mostrar resultado na interface
        document.getElementById('resultado-goa').innerHTML = `
            <div class="alert alert-success">
                <div class="d-flex align-items-center">
                    <i class="fas fa-${tipoPessoa === 'fisica' ? 'user' : 'building'} fa-2x me-3"></i>
                    <div>
                        <h6><strong>${pessoaEncontrada.nome || pessoaEncontrada.razao_social}</strong></h6>
                        <small>${tipoPessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'} • GOA: ${pessoaEncontrada.goa}</small>
                    </div>
                </div>
            </div>
        `;
        
        showNotification(`GOA encontrado: ${pessoaEncontrada.nome || pessoaEncontrada.razao_social}`, 'success');
    } else {
        document.getElementById('resultado-goa').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                GOA "${goa}" não encontrado
            </div>
        `;
        showNotification(`GOA "${goa}" não encontrado`, 'error');
    }
}

// Localizar e expandir na árvore (versão melhorada)
function localizarEExpandirNaArvore(pessoaId, tipoPessoa) {
    try {
        console.log('🎯 Localizando e expandindo:', pessoaId, tipoPessoa);
        
        // Criar relacionamentos automáticos
        const novosRels = criarRelacionamentosParaPessoa(pessoaId, tipoPessoa);
        
        // Expandir nó
        const nodeId = `${tipoPessoa}_${pessoaId}`;
        nosExpandidos.add(nodeId);
        
        // Re-renderizar
        renderizarArvoreInterativa();
        
        // Centralizar na tela após renderização
        setTimeout(() => {
            const dados = prepararDadosArvore();
            const no = dados.nodes.find(n => n.id === nodeId);
            if (no) {
                centralizarNo(no);
            }
        }, 500);
        
        if (novosRels > 0) {
            showNotification(`${novosRels} novo(s) vínculo(s) criado(s) automaticamente!`, 'success');
        } else {
            showNotification('Pessoa localizada e vínculos expandidos', 'info');
        }
        
    } catch (error) {
        console.error('Erro ao localizar e expandir:', error);
        showNotification('Erro ao localizar pessoa', 'error');
    }
}

// Preparar dados da árvore (reutilizando função existente)
function prepararDadosArvore() {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    try {
        // Criar relacionamentos automáticos se necessário
        criarRelacionamentosAutomaticosFamilia();
        
        const relacionamentos = db.getAll('relacionamentos');

        relacionamentos.forEach(rel => {
            const tipoOrigem = rel.tipo_origem || 'fisica';
            const tipoDestino = rel.tipo_destino || 'juridica';
            
            // Nó de origem
            const origemId = `${tipoOrigem}_${rel.pessoa_origem_id}`;
            if (!nodeIds.has(origemId)) {
                const origemInfo = obterInfoPessoa(rel.pessoa_origem_id, tipoOrigem);
                nodes.push({
                    id: origemId,
                    name: origemInfo.nome,
                    type: tipoOrigem,
                    documento: origemInfo.documento,
                    goa: origemInfo.goa,
                    pessoa_id: rel.pessoa_origem_id
                });
                nodeIds.add(origemId);
            }

            // Nó de destino
            const destinoId = `${tipoDestino}_${rel.pessoa_destino_id}`;
            if (!nodeIds.has(destinoId)) {
                const destinoInfo = obterInfoPessoa(rel.pessoa_destino_id, tipoDestino);
                nodes.push({
                    id: destinoId,
                    name: destinoInfo.nome,
                    type: tipoDestino,
                    documento: destinoInfo.documento,
                    goa: destinoInfo.goa,
                    pessoa_id: rel.pessoa_destino_id
                });
                nodeIds.add(destinoId);
            }

            // Link
            links.push({
                source: origemId,
                target: destinoId,
                relationship: rel.tipo_relacionamento || rel.tipo,
                description: rel.descricao,
                id: rel.id,
                automatico: rel.automatico || false
            });
        });

        return { nodes, links };
    } catch (error) {
        console.error('Erro ao preparar dados da árvore:', error);
        return { nodes: [], links: [] };
    }
}

// Funções auxiliares (reutilizadas)
function getDistanciaRelacionamento(tipo) {
    const distancias = {
        'pai': 120, 'mae': 120, 'irmao': 100,
        'filho': 100, 'socio': 150, 'empresarial': 180
    };
    return distancias[tipo] || 130;
}

function getRelationshipColor(tipo) {
    const cores = {
        'pai': '#dc3545',        // Vermelho forte
        'mae': '#e83e8c',        // Rosa forte
        'irmao': '#fd7e14',      // Laranja
        'filho': '#28a745',      // Verde
        'conjuge': '#ffc107',    // Amarelo/dourado
        'socio': '#20c997',      // Verde água
        'empresarial': '#17a2b8', // Azul ciano
        'parente': '#6f42c1',    // Roxo
        'amigo': '#17a2b8',      // Azul claro
        'profissional': '#495057', // Cinza escuro
        'familiar': '#20c997'     // Verde claro
    };
    return cores[tipo] || '#6c757d';
}

function getRelationshipWidth(tipo) {
    const larguras = {
        'pai': 4, 'mae': 4, 'irmao': 3,
        'filho': 3, 'conjuge': 3.5, 'socio': 2.5, 
        'empresarial': 2, 'parente': 2, 'amigo': 1.5,
        'profissional': 2
    };
    return larguras[tipo] || 2;
}

// Obter padrão de linha do relacionamento
function getRelationshipDashArray(tipo) {
    const padroes = {
        'pai': 'none',           // Linha sólida
        'mae': 'none',           // Linha sólida  
        'irmao': 'none',         // Linha sólida
        'filho': 'none',         // Linha sólida
        'conjuge': '8,4',        // Linha tracejada
        'socio': '12,6',         // Tracejado longo
        'empresarial': '4,4',    // Pontilhado
        'parente': '6,3',        // Tracejado médio
        'amigo': '2,3',          // Pontilhado fino
        'profissional': '10,5'   // Tracejado profissional
    };
    return padroes[tipo] || 'none';
}

// Obter opacidade do relacionamento
function getRelationshipOpacity(tipo) {
    const opacidades = {
        'pai': 1.0,         // Família - mais visível
        'mae': 1.0,         // Família - mais visível
        'irmao': 1.0,       // Família - mais visível  
        'filho': 1.0,       // Família - mais visível
        'conjuge': 0.9,     // Casamento - bem visível
        'socio': 0.8,       // Negócios - visível
        'empresarial': 0.7, // Empresarial - moderado
        'parente': 0.6,     // Parente - discreto
        'amigo': 0.5,       // Amizade - sutil
        'profissional': 0.7 // Profissional - moderado
    };
    return opacidades[tipo] || 0.8;
}

// Obter filtro visual do relacionamento
function getRelationshipFilter(tipo) {
    const filtros = {
        'pai': 'drop-shadow(0 2px 4px rgba(220,53,69,0.3))',      // Sombra vermelha
        'mae': 'drop-shadow(0 2px 4px rgba(232,62,140,0.3))',     // Sombra rosa
        'irmao': 'drop-shadow(0 2px 4px rgba(253,126,20,0.3))',   // Sombra laranja
        'filho': 'drop-shadow(0 2px 4px rgba(40,167,69,0.3))',    // Sombra verde
        'conjuge': 'drop-shadow(0 2px 4px rgba(255,193,7,0.4))',  // Sombra dourada
        'socio': 'drop-shadow(0 2px 4px rgba(40,167,69,0.2))',    // Sombra verde clara
        'empresarial': 'drop-shadow(0 2px 4px rgba(23,162,184,0.2))', // Sombra azul
        'parente': 'none',        // Sem filtro
        'amigo': 'none',          // Sem filtro  
        'profissional': 'none'    // Sem filtro
    };
    return filtros[tipo] || 'none';
}

function getRelationshipLabel(tipo) {
    const labels = {
        'pai': '👨 PAI', 
        'mae': '👩 MÃE', 
        'irmao': '👦 IRMÃO',
        'filho': '👶 FILHO', 
        'conjuge': '💑 CÔNJUGE',
        'parente': '👥 PARENTE', 
        'socio': '🤝 SÓCIO',
        'empresarial': '🏢 EMPRESA', 
        'profissional': '💼 TRABALHO',
        'familiar': '👪 FAMÍLIA',
        'amigo': '🤗 AMIGO',
        'endereco': '🏠 ENDEREÇO',
        'telefone': '📞 TELEFONE'
    };
    return labels[tipo] || `🔗 ${tipo.toUpperCase()}`;
}

function truncarTexto(texto, limite) {
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
}

// Atualizar estatísticas da árvore
function atualizarEstatisticasArvore() {
    try {
        const pessoasFisicas = db.getAll('pessoa_fisica');
        const pessoasJuridicas = db.getAll('pessoa_juridica');
        const relacionamentos = db.getAll('relacionamentos');
        
        const totalPessoas = pessoasFisicas.length + pessoasJuridicas.length;
        const totalRelacionamentos = relacionamentos.length;
        const nosExpandidosCount = nosExpandidos.size;
        
        // Atualizar elementos na interface se existirem
        const totalPessoasEl = document.getElementById('total-pessoas-arvore');
        if (totalPessoasEl) totalPessoasEl.textContent = totalPessoas;
        
        const totalRelsEl = document.getElementById('total-relacionamentos-arvore');
        if (totalRelsEl) totalRelsEl.textContent = totalRelacionamentos;
        
        const expandidosEl = document.getElementById('nos-expandidos');
        if (expandidosEl) expandidosEl.textContent = nosExpandidosCount;
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Função para alternar tela cheia
function toggleTelaCheia() {
    const container = document.getElementById('arvore-container');
    const card = container.closest('.card');
    const botao = document.querySelector('button[onclick="toggleTelaCheia()"]');
    
    if (!arvoreConfig.telaCheia) {
        // Entrar em tela cheia
        arvoreConfig.telaCheia = true;
        
        card.style.position = 'fixed';
        card.style.top = '0';
        card.style.left = '0';
        card.style.width = '100vw';
        card.style.height = '100vh';
        card.style.zIndex = '9999';
        card.style.margin = '0';
        card.style.borderRadius = '0';
        
        container.style.height = 'calc(100vh - 120px)';
        
        if (botao) {
            botao.innerHTML = '<i class="fas fa-compress me-1"></i>Sair Tela Cheia';
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                toggleTelaCheia();
            }
        });
        
        setTimeout(() => renderizarArvoreInterativa(), 300);
        showNotification('Árvore em tela cheia! Pressione ESC para sair.', 'info');
        
    } else {
        // Sair da tela cheia
        arvoreConfig.telaCheia = false;
        
        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
        card.style.height = '';
        card.style.zIndex = '';
        card.style.margin = '';
        card.style.borderRadius = '';
        
        container.style.height = '600px';
        
        if (botao) {
            botao.innerHTML = '<i class="fas fa-expand me-1"></i>Tela Cheia';
        }
        
        setTimeout(() => renderizarArvoreInterativa(), 300);
        showNotification('Árvore retornada ao tamanho normal', 'info');
    }
}

// Fechar modal (função auxiliar)
function fecharModal() {
    const modalEl = document.getElementById('modalDetalhes');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
}

// Função para fechar modal de forma segura
function fecharModalSeguro() {
    try {
        // Primeiro, tentar fechar qualquer modal do Bootstrap
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modalEl => {
            try {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) {
                    modalInstance.hide();
                    // Aguardar um pouco antes de destruir
                    setTimeout(() => {
                        try {
                            modalInstance.dispose();
                        } catch (e) {
                            console.warn('Erro ao destruir modal:', e);
                        }
                    }, 100);
                }
            } catch (e) {
                console.warn('Erro ao processar modal:', e);
            }
        });
        
        // Limpar todos os backdrops
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                try {
                    backdrop.remove();
                } catch (e) {
                    console.warn('Erro ao remover backdrop:', e);
                }
            });
            
            // Limpar classes do body
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
            
            // Remover qualquer menu contextual
            d3.select('.menu-contextual').remove();
        }, 150);
        
    } catch (error) {
        console.error('Erro ao fechar modal:', error);
        
        // Fallback: forçar limpeza
        try {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
            d3.select('.menu-contextual').remove();
        } catch (fallbackError) {
            console.error('Erro no fallback:', fallbackError);
        }
    }
}

// Implementar as funções de relacionamentos automáticos (do arquivo original)
function criarRelacionamentosAutomaticosFamilia() {
    try {
        console.log('👨‍👩‍👧‍👦 Criando relacionamentos automáticos de família...');
        
        const pessoasFisicas = db.getAll('pessoa_fisica');
        const relacionamentosExistentes = db.getAll('relacionamentos');
        let novosRelacionamentos = 0;
        
        pessoasFisicas.forEach(pessoa => {
            // Relacionamentos com filhos
            if (pessoa.filhos && typeof pessoa.filhos === 'object') {
                Object.values(pessoa.filhos).forEach((filho, index) => {
                    if (filho.nome && filho.nome.trim()) {
                        const filhoEncontrado = pessoasFisicas.find(p => 
                            p.nome && p.nome.toLowerCase().includes(filho.nome.toLowerCase())
                        );
                        
                        if (filhoEncontrado && filhoEncontrado.id !== pessoa.id) {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == filhoEncontrado.id) ||
                                (rel.pessoa_origem_id == filhoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                db.insert('relacionamentos', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: filhoEncontrado.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'fisica',
                                    tipo_relacionamento: pessoa.sexo === 'Feminino' ? 'mae' : 'pai',
                                    descricao: `Relacionamento familiar automático - ${pessoa.sexo === 'Feminino' ? 'Mãe' : 'Pai'} de ${filho.nome}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                            }
                        }
                    }
                });
            }
            
            // Relacionamentos com irmãos
            if (pessoa.irmaos && typeof pessoa.irmaos === 'object') {
                Object.values(pessoa.irmaos).forEach(irmao => {
                    if (irmao.nome && irmao.nome.trim()) {
                        const irmaoEncontrado = pessoasFisicas.find(p => 
                            p.nome && p.nome.toLowerCase().includes(irmao.nome.toLowerCase())
                        );
                        
                        if (irmaoEncontrado && irmaoEncontrado.id !== pessoa.id) {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == irmaoEncontrado.id) ||
                                (rel.pessoa_origem_id == irmaoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                db.insert('relacionamentos', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: irmaoEncontrado.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'fisica',
                                    tipo_relacionamento: 'irmao',
                                    descricao: `Relacionamento fraterno automático - Irmão(s): ${irmao.nome}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                            }
                        }
                    }
                });
            }
            
            // Relacionamentos empresariais
            if (pessoa.empresas && typeof pessoa.empresas === 'object') {
                Object.values(pessoa.empresas).forEach(empresa => {
                    if (empresa.razao_social && empresa.razao_social.trim()) {
                        const pessoasJuridicas = db.getAll('pessoa_juridica');
                        const empresaEncontrada = pessoasJuridicas.find(pj => 
                            pj.razao_social && pj.razao_social.toLowerCase().includes(empresa.razao_social.toLowerCase())
                        );
                        
                        if (empresaEncontrada) {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == empresaEncontrada.id && rel.tipo_destino === 'juridica') ||
                                (rel.pessoa_origem_id == empresaEncontrada.id && rel.pessoa_destino_id == pessoa.id && rel.tipo_origem === 'juridica')
                            );
                            
                            if (!jaExiste) {
                                db.insert('relacionamentos', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: empresaEncontrada.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'juridica',
                                    tipo_relacionamento: 'socio',
                                    descricao: `Sócio com ${empresa.participacao || '0%'} de participação`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                            }
                        }
                    }
                    
                    // Relacionamentos entre sócios da mesma empresa
                    if (empresa.socios && typeof empresa.socios === 'object') {
                        Object.values(empresa.socios).forEach(socio => {
                            if (socio.nome && socio.nome.trim()) {
                                const socioEncontrado = pessoasFisicas.find(p => 
                                    p.nome && p.nome.toLowerCase().includes(socio.nome.toLowerCase())
                                );
                                
                                if (socioEncontrado && socioEncontrado.id !== pessoa.id) {
                                    const jaExiste = relacionamentosExistentes.some(rel => 
                                        (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == socioEncontrado.id) ||
                                        (rel.pessoa_origem_id == socioEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                                    );
                                    
                                    if (!jaExiste) {
                                        db.insert('relacionamentos', {
                                            pessoa_origem_id: pessoa.id,
                                            pessoa_destino_id: socioEncontrado.id,
                                            tipo_origem: 'fisica',
                                            tipo_destino: 'fisica',
                                            tipo_relacionamento: 'socio',
                                            descricao: `Sócios na empresa: ${empresa.razao_social}`,
                                            automatico: true
                                        });
                                        novosRelacionamentos++;
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });
        
        if (novosRelacionamentos > 0) {
            console.log(`✅ ${novosRelacionamentos} relacionamentos automáticos de família criados!`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar relacionamentos automáticos de família:', error);
    }
}

function criarRelacionamentosParaPessoa(pessoaId, tipoPessoa) {
    try {
        console.log(`🔍 Analisando relacionamentos para pessoa ${pessoaId} (${tipoPessoa})...`);
        
        let novosRelacionamentos = 0;
        const relacionamentosExistentes = db.getAll('relacionamentos');
        
        if (tipoPessoa === 'fisica') {
            const pessoa = db.getById('pessoa_fisica', pessoaId);
            if (!pessoa) return 0;
            
            const todasPessoasFisicas = db.getAll('pessoa_fisica');
            const todasPessoasJuridicas = db.getAll('pessoa_juridica');
            
            // Análise de FILHOS
            if (pessoa.filhos && typeof pessoa.filhos === 'object') {
                Object.values(pessoa.filhos).forEach(filho => {
                    if (filho.nome && filho.nome.trim()) {
                        const filhosEncontrados = todasPessoasFisicas.filter(p => 
                            p.id !== pessoa.id && 
                            p.nome && 
                            (p.nome.toLowerCase().includes(filho.nome.toLowerCase()) ||
                             filho.nome.toLowerCase().includes(p.nome.toLowerCase()))
                        );
                        
                        if (filho.cpf && filho.cpf.trim()) {
                            const cpfLimpo = filho.cpf.replace(/\D/g, '');
                            const filhoPorCpf = todasPessoasFisicas.find(p => 
                                p.cpf && p.cpf.replace(/\D/g, '') === cpfLimpo
                            );
                            if (filhoPorCpf && !filhosEncontrados.includes(filhoPorCpf)) {
                                filhosEncontrados.push(filhoPorCpf);
                            }
                        }
                        
                        filhosEncontrados.forEach(filhoEncontrado => {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == filhoEncontrado.id) ||
                                (rel.pessoa_origem_id == filhoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                db.insert('relacionamentos', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: filhoEncontrado.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'fisica',
                                    tipo_relacionamento: pessoa.sexo === 'Feminino' ? 'mae' : 'pai',
                                    descricao: `👶 ${pessoa.sexo === 'Feminino' ? 'Mãe' : 'Pai'} de ${filhoEncontrado.nome}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                            }
                        });
                    }
                });
            }
            
            // Análise de IRMÃOS
            if (pessoa.irmaos && typeof pessoa.irmaos === 'object') {
                Object.values(pessoa.irmaos).forEach(irmao => {
                    if (irmao.nome && irmao.nome.trim()) {
                        const irmaosEncontrados = todasPessoasFisicas.filter(p => 
                            p.id !== pessoa.id && 
                            p.nome && 
                            (p.nome.toLowerCase().includes(irmao.nome.toLowerCase()) ||
                             irmao.nome.toLowerCase().includes(p.nome.toLowerCase()))
                        );
                        
                        if (irmao.cpf && irmao.cpf.trim()) {
                            const cpfLimpo = irmao.cpf.replace(/\D/g, '');
                            const irmaoPorCpf = todasPessoasFisicas.find(p => 
                                p.cpf && p.cpf.replace(/\D/g, '') === cpfLimpo
                            );
                            if (irmaoPorCpf && !irmaosEncontrados.includes(irmaoPorCpf)) {
                                irmaosEncontrados.push(irmaoPorCpf);
                            }
                        }
                        
                        irmaosEncontrados.forEach(irmaoEncontrado => {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == irmaoEncontrado.id) ||
                                (rel.pessoa_origem_id == irmaoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                db.insert('relacionamentos', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: irmaoEncontrado.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'fisica',
                                    tipo_relacionamento: 'irmao',
                                    descricao: `👦 Irmão(s): ${irmaoEncontrado.nome}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                            }
                        });
                    }
                });
            }
            
            // Análise de EMPRESAS/SÓCIOS
            if (pessoa.empresas && typeof pessoa.empresas === 'object') {
                Object.values(pessoa.empresas).forEach(empresa => {
                    if (empresa.razao_social && empresa.razao_social.trim()) {
                        const empresasEncontradas = todasPessoasJuridicas.filter(pj => 
                            pj.razao_social && 
                            (pj.razao_social.toLowerCase().includes(empresa.razao_social.toLowerCase()) ||
                             empresa.razao_social.toLowerCase().includes(pj.razao_social.toLowerCase()))
                        );
                        
                        if (empresa.cnpj && empresa.cnpj.trim()) {
                            const cnpjLimpo = empresa.cnpj.replace(/\D/g, '');
                            const empresaPorCnpj = todasPessoasJuridicas.find(pj => 
                                pj.cnpj && pj.cnpj.replace(/\D/g, '') === cnpjLimpo
                            );
                            if (empresaPorCnpj && !empresasEncontradas.includes(empresaPorCnpj)) {
                                empresasEncontradas.push(empresaPorCnpj);
                            }
                        }
                        
                        empresasEncontradas.forEach(empresaEncontrada => {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == empresaEncontrada.id && rel.tipo_destino === 'juridica') ||
                                (rel.pessoa_origem_id == empresaEncontrada.id && rel.pessoa_destino_id == pessoa.id && rel.tipo_origem === 'juridica')
                            );
                            
                            if (!jaExiste) {
                                db.insert('relacionamentos', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: empresaEncontrada.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'juridica',
                                    tipo_relacionamento: 'socio',
                                    descricao: `🤝 Sócio com ${empresa.participacao || '0%'} de participação em ${empresaEncontrada.razao_social}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                            }
                        });
                        
                        // Análise de sócios da empresa
                        if (empresa.socios && typeof empresa.socios === 'object') {
                            Object.values(empresa.socios).forEach(socio => {
                                if (socio.nome && socio.nome.trim()) {
                                    const sociosEncontrados = todasPessoasFisicas.filter(p => 
                                        p.id !== pessoa.id && 
                                        p.nome && 
                                        (p.nome.toLowerCase().includes(socio.nome.toLowerCase()) ||
                                         socio.nome.toLowerCase().includes(p.nome.toLowerCase()))
                                    );
                                    
                                    if (socio.cpf && socio.cpf.trim()) {
                                        const cpfLimpo = socio.cpf.replace(/\D/g, '');
                                        const socioPorCpf = todasPessoasFisicas.find(p => 
                                            p.cpf && p.cpf.replace(/\D/g, '') === cpfLimpo
                                        );
                                        if (socioPorCpf && !sociosEncontrados.includes(socioPorCpf)) {
                                            sociosEncontrados.push(socioPorCpf);
                                        }
                                    }
                                    
                                    sociosEncontrados.forEach(socioEncontrado => {
                                        const jaExiste = relacionamentosExistentes.some(rel => 
                                            (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == socioEncontrado.id) ||
                                            (rel.pessoa_origem_id == socioEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                                        );
                                        
                                        if (!jaExiste) {
                                            db.insert('relacionamentos', {
                                                pessoa_origem_id: pessoa.id,
                                                pessoa_destino_id: socioEncontrado.id,
                                                tipo_origem: 'fisica',
                                                tipo_destino: 'fisica',
                                                tipo_relacionamento: 'socio',
                                                descricao: `🤝 Sócios na empresa: ${empresa.razao_social}`,
                                                automatico: true
                                            });
                                            novosRelacionamentos++;
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
            
            // Análise por NOME DE FAMÍLIA (sobrenomes em comum)
            if (pessoa.nome && pessoa.nome.includes(' ')) {
                const sobrenomes = pessoa.nome.split(' ');
                const ultimoSobrenome = sobrenomes[sobrenomes.length - 1];
                
                if (ultimoSobrenome.length > 3) {
                    const pessoasComMesmoSobrenome = todasPessoasFisicas.filter(p => 
                        p.id !== pessoa.id && 
                        p.nome && 
                        p.nome.toLowerCase().includes(ultimoSobrenome.toLowerCase())
                    );
                    
                    pessoasComMesmoSobrenome.forEach(parente => {
                        const jaExiste = relacionamentosExistentes.some(rel => 
                            (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == parente.id) ||
                            (rel.pessoa_origem_id == parente.id && rel.pessoa_destino_id == pessoa.id)
                        );
                        
                        if (!jaExiste) {
                            db.insert('relacionamentos', {
                                pessoa_origem_id: pessoa.id,
                                pessoa_destino_id: parente.id,
                                tipo_origem: 'fisica',
                                tipo_destino: 'fisica',
                                tipo_relacionamento: 'parente',
                                descricao: `👥 Possível parentesco pelo sobrenome "${ultimoSobrenome}"`,
                                automatico: true
                            });
                            novosRelacionamentos++;
                        }
                    });
                }
            }
        }
        
        console.log(`🏁 Análise concluída para ${tipoPessoa} ${pessoaId}: ${novosRelacionamentos} novos relacionamentos`);
        return novosRelacionamentos;
        
    } catch (error) {
        console.error('❌ Erro ao criar relacionamentos para pessoa específica:', error);
        return 0;
    }
}

// Implementações específicas que foram reutilizadas do arquivo original
function mostrarInfoRelacionamento(relacionamento) {
    // Reutilizar implementação do arquivo original
    fecharModalSeguro();
    
    setTimeout(() => {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
    
        modalTitle.textContent = 'Detalhes do Relacionamento';
        
        const origemInfo = obterInfoPessoa(relacionamento.source.pessoa_id, relacionamento.source.type);
        const destinoInfo = obterInfoPessoa(relacionamento.target.pessoa_id, relacionamento.target.type);
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <h6><i class="fas fa-${relacionamento.source.type === 'fisica' ? 'user' : 'building'} me-2"></i>Pessoa Origem</h6>
                    <p><strong>Nome:</strong> ${origemInfo.nome}<br>
                    <strong>Documento:</strong> ${origemInfo.documento}<br>
                    <strong>Tipo:</strong> ${relacionamento.source.type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                </div>
                <div class="col-md-2 text-center">
                    <i class="fas fa-arrow-right fa-2x text-primary mt-3"></i>
                    <br><br>
                    <span class="badge bg-primary">${relacionamento.relationship}</span>
                </div>
                <div class="col-md-5">
                    <h6><i class="fas fa-${relacionamento.target.type === 'fisica' ? 'user' : 'building'} me-2"></i>Pessoa Destino</h6>
                    <p><strong>Nome:</strong> ${destinoInfo.nome}<br>
                    <strong>Documento:</strong> ${destinoInfo.documento}<br>
                    <strong>Tipo:</strong> ${relacionamento.target.type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                </div>
            </div>
            ${relacionamento.description ? `
                <hr>
                <div class="row">
                    <div class="col-12">
                        <h6>Descrição</h6>
                        <p>${relacionamento.description}</p>
                    </div>
                </div>
            ` : ''}
            <hr>
            <div class="row">
                <div class="col-12 text-center">
                    <button class="btn btn-danger btn-sm" onclick="excluirRelacionamento('${relacionamento.id}')">
                        <i class="fas fa-trash me-1"></i>Excluir Relacionamento
                    </button>
                </div>
            </div>
        `;
        
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.show();
        } else {
            modalInstance = new bootstrap.Modal(modalEl);
            modalInstance.show();
        }
    }, 100);
}

function obterInfoPessoa(pessoaId, tipoPessoa) {
    try {
        const table = tipoPessoa === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica';
        const pessoa = db.getById(table, pessoaId);
        
        if (!pessoa) return { nome: 'Pessoa não encontrada', documento: '-', goa: '-' };
        
        if (tipoPessoa === 'fisica') {
            return {
                nome: pessoa.nome,
                documento: formatUtils.formatCPF(pessoa.cpf),
                goa: pessoa.goa || '-'
            };
        } else {
            return {
                nome: pessoa.razao_social,
                documento: formatUtils.formatCNPJ(pessoa.cnpj),
                goa: pessoa.goa || '-'
            };
        }
    } catch (error) {
        console.error('Erro ao obter informações da pessoa:', error);
        return { nome: 'Erro ao carregar', documento: '-', goa: '-' };
    }
}

// Função para criar relacionamento (reutilizada)
function criarRelacionamento() {
    try {
        const origemValue = document.getElementById('pessoa-origem').value;
        const destinoValue = document.getElementById('pessoa-destino').value;
        const tipoRelacionamento = document.getElementById('tipo-relacionamento').value;
        const descricao = document.getElementById('descricao-relacionamento').value;

        if (!origemValue || !destinoValue || !tipoRelacionamento) {
            showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (origemValue === destinoValue) {
            showNotification('Não é possível criar relacionamento de uma pessoa com ela mesma', 'error');
            return;
        }

        const [tipoOrigem, idOrigem] = origemValue.split('_');
        const [tipoDestino, idDestino] = destinoValue.split('_');

        const relacionamentoExistente = verificarRelacionamentoExistente(
            idOrigem, tipoOrigem, idDestino, tipoDestino
        );

        if (relacionamentoExistente) {
            showNotification('Relacionamento já existe entre essas pessoas', 'error');
            return;
        }

        const relacionamentoData = {
            pessoa_origem_id: idOrigem,
            pessoa_destino_id: idDestino,
            tipo_origem: tipoOrigem,
            tipo_destino: tipoDestino,
            tipo_relacionamento: tipoRelacionamento,
            descricao: descricao
        };

        db.insert('relacionamentos', relacionamentoData);
        showNotification('Relacionamento criado com sucesso!', 'success');
        
        document.getElementById('form-relacionamento').reset();
        renderizarArvoreInterativa();
        loadDashboard();
        updateStatusBar('Novo relacionamento criado');
        
    } catch (error) {
        console.error('Erro ao criar relacionamento:', error);
        showNotification('Erro ao criar relacionamento', 'error');
    }
}

function verificarRelacionamentoExistente(idOrigem, tipoOrigem, idDestino, tipoDestino) {
    try {
        const relacionamentos = db.getAll('relacionamentos');
        return relacionamentos.some(rel => 
            (rel.pessoa_origem_id === idOrigem && rel.tipo_origem === tipoOrigem &&
             rel.pessoa_destino_id === idDestino && rel.tipo_destino === tipoDestino) ||
            (rel.pessoa_origem_id === idDestino && rel.tipo_origem === tipoDestino &&
             rel.pessoa_destino_id === idOrigem && rel.tipo_destino === tipoOrigem)
        );
    } catch (error) {
        console.error('Erro ao verificar relacionamento existente:', error);
        return false;
    }
}

function excluirRelacionamento(relacionamentoId) {
    if (confirm('Deseja realmente excluir este relacionamento?')) {
        try {
            db.delete('relacionamentos', relacionamentoId);
            showNotification('Relacionamento excluído com sucesso!', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
            if (modal) modal.hide();
            
            renderizarArvoreInterativa();
            loadDashboard();
            updateStatusBar('Relacionamento excluído');
        } catch (error) {
            console.error('Erro ao excluir relacionamento:', error);
            showNotification('Erro ao excluir relacionamento', 'error');
        }
    }
}

// Funções do arquivo original que devem ser mantidas (implementações auxiliares)
function matchPessoaFisica(pessoa, termo) {
    const termoLower = termo.toLowerCase();
    
    return (
        (pessoa.nome && pessoa.nome.toLowerCase().includes(termoLower)) ||
        (pessoa.goa && pessoa.goa.toLowerCase().includes(termoLower)) ||
        (pessoa.cpf && pessoa.cpf.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) ||
        (pessoa.rg && pessoa.rg.toLowerCase().includes(termoLower)) ||
        (pessoa.mae && pessoa.mae.toLowerCase().includes(termoLower)) ||
        (pessoa.pai && pessoa.pai.toLowerCase().includes(termoLower)) ||
        (pessoa.telefone1 && pessoa.telefone1.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) ||
        (pessoa.ocupacao && pessoa.ocupacao.toLowerCase().includes(termoLower)) ||
        (pessoa.endereco1 && pessoa.endereco1.toLowerCase().includes(termoLower))
    );
}

function matchPessoaJuridica(pessoa, termo) {
    const termoLower = termo.toLowerCase();
    
    return (
        (pessoa.razao_social && pessoa.razao_social.toLowerCase().includes(termoLower)) ||
        (pessoa.nome_fantasia && pessoa.nome_fantasia.toLowerCase().includes(termoLower)) ||
        (pessoa.goa && pessoa.goa.toLowerCase().includes(termoLower)) ||
        (pessoa.cnpj && pessoa.cnpj.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) ||
        (pessoa.telefone1 && pessoa.telefone1.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) ||
        (pessoa.endereco && pessoa.endereco.toLowerCase().includes(termoLower)) ||
        (pessoa.cidade && pessoa.cidade.toLowerCase().includes(termoLower))
    );
}

function mostrarResultadosBusca(resultados, termo) {
    const resultadosDiv = document.getElementById('resultados-busca-arvore');
    
    if (resultados.length === 0) {
        resultadosDiv.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Nenhum resultado encontrado para "<strong>${termo}</strong>"
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            ${resultados.length} pessoa(s) encontrada(s)
        </div>
        <div class="list-group">
    `;
    
    resultados.forEach((resultado, index) => {
        const pessoa = resultado.pessoa;
        const tipo = resultado.tipo;
        
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                        <div class="fw-bold">
                            <i class="fas fa-${tipo === 'fisica' ? 'user' : 'building'} me-2"></i>
                            ${tipo === 'fisica' ? pessoa.nome : pessoa.razao_social}
                        </div>
                        <small class="text-muted">
                            GOA: ${pessoa.goa || 'Não definido'} • 
                            ${tipo === 'fisica' ? 'CPF' : 'CNPJ'}: 
                            ${tipo === 'fisica' 
                                ? (formatUtils.formatCPF(pessoa.cpf) || '-')
                                : (formatUtils.formatCNPJ(pessoa.cnpj) || '-')
                            }
                        </small>
                    </div>
                    <span class="badge bg-${tipo === 'fisica' ? 'info' : 'success'} rounded-pill">
                        ${tipo === 'fisica' ? 'PF' : 'PJ'}
                    </span>
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary me-2" onclick="verDetalhes('${resultado.table}', '${pessoa.id}')">
                        <i class="fas fa-eye me-1"></i>Detalhes
                    </button>
                    <button class="btn btn-sm btn-success" onclick="localizarEExpandirNaArvore('${pessoa.id}', '${tipo}')">
                        <i class="fas fa-crosshairs me-1"></i>Localizar
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultadosDiv.innerHTML = html;
}

// Análise automática de todos os dados (implementação melhorada)
function analisarTodosOsDados() {
    if (!confirm('🧠 Esta função irá analisar TODOS os dados e criar relacionamentos automáticos. Continuar?')) {
        return;
    }
    
    try {
        showNotification('🔍 Iniciando análise automática completa...', 'info');
        
        const progressContainer = document.createElement('div');
        progressContainer.innerHTML = `
            <div class="alert alert-info d-flex align-items-center" id="progress-analise">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>Analisando todos os dados... Aguarde.</span>
            </div>
        `;
        
        const arvoreContainer = document.getElementById('arvore-container');
        arvoreContainer.insertBefore(progressContainer, arvoreContainer.firstChild);
        
        setTimeout(() => {
            let totalRelacionamentos = 0;
            
            // Analisar pessoas físicas
            const pessoasFisicas = db.getAll('pessoa_fisica');
            pessoasFisicas.forEach(pessoa => {
                totalRelacionamentos += criarRelacionamentosParaPessoa(pessoa.id, 'fisica');
            });
            
            // Remover indicador de progresso
            const progressElement = document.getElementById('progress-analise');
            if (progressElement) {
                progressElement.parentElement.remove();
            }
            
            showNotification(
                `✅ Análise concluída! ${totalRelacionamentos} relacionamentos criados.`,
                'success'
            );
            
            renderizarArvoreInterativa();
            loadDashboard();
            updateStatusBar(`Análise automática: ${totalRelacionamentos} vínculos criados`);
            
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao executar análise automática:', error);
        showNotification('Erro ao executar análise automática', 'error');
        
        const progressElement = document.getElementById('progress-analise');
        if (progressElement) {
            progressElement.parentElement.remove();
        }
    }
}

// Funções de limpeza (compatibilidade com sistema antigo)
function limparConexoesAutomaticas() {
    if (!confirm('Deseja realmente limpar APENAS as conexões automáticas? As conexões manuais serão mantidas.')) {
        return;
    }
    
    try {
        const relacionamentos = db.getAll('relacionamentos');
        const relacionamentosAutomaticos = relacionamentos.filter(rel => rel.automatico);
        
        relacionamentosAutomaticos.forEach(rel => {
            db.delete('relacionamentos', rel.id);
        });
        
        showNotification(`${relacionamentosAutomaticos.length} conexões automáticas removidas!`, 'success');
        renderizarArvoreInterativa();
        loadDashboard();
        updateStatusBar('Conexões automáticas limpas');
        
    } catch (error) {
        console.error('Erro ao limpar conexões automáticas:', error);
        showNotification('Erro ao limpar conexões automáticas', 'error');
    }
}

function limparTodasConexoes() {
    if (!confirm('⚠️ ATENÇÃO: Isso removerá TODAS as conexões da árvore (automáticas E manuais). Deseja continuar?')) {
        return;
    }
    
    if (!confirm('Confirma a remoção TOTAL de todos os relacionamentos? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const relacionamentos = db.getAll('relacionamentos');
        const total = relacionamentos.length;
        
        if (total === 0) {
            showNotification('Não há relacionamentos para remover', 'info');
            return;
        }
        
        relacionamentos.forEach(rel => {
            db.delete('relacionamentos', rel.id);
        });
        
        showNotification(`${total} relacionamentos removidos completamente`, 'success');
        renderizarArvoreInterativa();
        loadDashboard();
        updateStatusBar(`Todas as ${total} conexões foram limpas`);
        
    } catch (error) {
        console.error('Erro ao limpar todas as conexões:', error);
        showNotification('Erro ao limpar conexões', 'error');
    }
}

// Renderizar árvore (alias para compatibilidade)
function renderizarArvore() {
    renderizarArvoreInterativa();
}

// Função segura para ver detalhes sem travamento
function verDetalhesSeguro(tabela, id) {
    try {
        // Garantir que não há modal aberto
        const modalsAbertos = document.querySelectorAll('.modal.show');
        modalsAbertos.forEach(modal => {
            const instance = bootstrap.Modal.getInstance(modal);
            if (instance) instance.hide();
        });
        
        // Limpar backdrops
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
        // Chamar função original após limpeza
        setTimeout(() => {
            if (typeof verDetalhes === 'function') {
                verDetalhes(tabela, id);
            } else {
                showNotification('Função de detalhes não encontrada', 'error');
            }
        }, 200);
        
    } catch (error) {
        console.error('Erro ao ver detalhes:', error);
        showNotification('Erro ao abrir detalhes. Tente novamente.', 'error');
    }
}

// Adicionar nova pessoa diretamente na árvore
function adicionarNovaPessoa(pessoaBase) {
    try {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const painel = document.createElement('div');
        painel.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        painel.innerHTML = `
            <h4><i class="fas fa-user-plus me-2"></i>Adicionar Nova Pessoa</h4>
            <p class="text-muted">Vínculo com: <strong>${pessoaBase.name}</strong></p>
            <hr>
            
            <div class="mb-3">
                <label class="form-label">Nome Completo *</label>
                <input type="text" id="novo-nome" class="form-control" placeholder="Digite o nome completo">
            </div>
            
            <div class="mb-3">
                <label class="form-label">CPF</label>
                <input type="text" id="novo-cpf" class="form-control" placeholder="000.000.000-00" maxlength="14">
            </div>
            
            <div class="mb-3">
                <label class="form-label">Tipo de Relacionamento *</label>
                <select id="novo-relacionamento" class="form-control">
                    <option value="">Selecione o parentesco</option>
                    <option value="pai">👨 Pai</option>
                    <option value="mae">👩 Mãe</option>
                    <option value="filho">👶 Filho(a)</option>
                    <option value="irmao">👦 Irmão(ã)</option>
                    <option value="conjuge">💑 Cônjuge</option>
                    <option value="socio">🤝 Sócio</option>
                    <option value="parente">👥 Parente</option>
                    <option value="amigo">🤗 Amigo</option>
                    <option value="profissional">💼 Profissional</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Sexo</label>
                <select id="novo-sexo" class="form-control">
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Telefone</label>
                <input type="text" id="novo-telefone" class="form-control" placeholder="(00) 00000-0000">
            </div>
            
            <div class="mb-3">
                <label class="form-label">Observações</label>
                <textarea id="novo-obs" class="form-control" rows="2" placeholder="Informações adicionais"></textarea>
            </div>
            
            <hr>
            <div class="d-flex justify-content-end">
                <button id="btn-cancelar-pessoa" class="btn btn-secondary me-2">Cancelar</button>
                <button id="btn-salvar-pessoa" class="btn btn-primary">
                    <i class="fas fa-save me-1"></i>Salvar e Criar Vínculo
                </button>
            </div>
        `;

        // Event listeners
        const nomeInput = painel.querySelector('#novo-nome');
        const cpfInput = painel.querySelector('#novo-cpf');
        const relacionamentoSelect = painel.querySelector('#novo-relacionamento');
        const sexoSelect = painel.querySelector('#novo-sexo');
        const telefoneInput = painel.querySelector('#novo-telefone');
        const obsInput = painel.querySelector('#novo-obs');

        // Máscara para CPF
        cpfInput.oninput = (e) => {
            let valor = e.target.value.replace(/\D/g, '');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = valor;
        };

        // Máscara para telefone
        telefoneInput.oninput = (e) => {
            let valor = e.target.value.replace(/\D/g, '');
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
            e.target.value = valor;
        };

        painel.querySelector('#btn-cancelar-pessoa').onclick = () => overlay.remove();

        painel.querySelector('#btn-salvar-pessoa').onclick = () => {
            const nome = nomeInput.value.trim();
            const cpf = cpfInput.value.trim();
            const relacionamento = relacionamentoSelect.value;
            const sexo = sexoSelect.value;
            const telefone = telefoneInput.value.trim();
            const obs = obsInput.value.trim();

            if (!nome) {
                showNotification('Nome é obrigatório', 'error');
                nomeInput.focus();
                return;
            }

            if (!relacionamento) {
                showNotification('Tipo de relacionamento é obrigatório', 'error');
                relacionamentoSelect.focus();
                return;
            }

            // Gerar GOA automático
            const prefixo = 'GOAFAM';
            const numero = String(Date.now()).slice(-3);
            const goa = `${prefixo}${numero}`;

            // Criar nova pessoa
            const novaPessoa = {
                nome: nome,
                cpf: cpf,
                sexo: sexo,
                telefone1: telefone,
                goa: goa,
                observacoes: obs,
                data_cadastro: new Date().toISOString()
            };

            try {
                // Salvar pessoa física
                const novoId = db.insert('pessoa_fisica', novaPessoa);

                // Criar relacionamento
                const novoRelacionamento = {
                    pessoa_origem_id: pessoaBase.pessoa_id,
                    pessoa_destino_id: novoId,
                    tipo_origem: pessoaBase.type,
                    tipo_destino: 'fisica',
                    tipo_relacionamento: relacionamento,
                    descricao: `Adicionado via árvore: ${obs || 'Sem observações'}`,
                    automatico: false
                };

                db.insert('relacionamentos', novoRelacionamento);

                showNotification(`✅ ${nome} adicionado(a) com sucesso! GOA: ${goa}`, 'success');
                overlay.remove();

                // Atualizar árvore
                setTimeout(() => {
                    renderizarArvoreInterativa();
                    updateStatusBar(`Nova pessoa adicionada: ${nome}`);
                    if (typeof loadDashboard === 'function') loadDashboard();
                }, 200);

            } catch (error) {
                console.error('Erro ao salvar nova pessoa:', error);
                showNotification('Erro ao salvar pessoa. Tente novamente.', 'error');
            }
        };

        overlay.appendChild(painel);
        document.body.appendChild(overlay);

        // Fechar ao clicar fora
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // Focar no nome
        setTimeout(() => nomeInput.focus(), 100);

    } catch (error) {
        console.error('Erro ao adicionar nova pessoa:', error);
        showNotification('Erro ao abrir formulário', 'error');
    }
}

// Remover vínculos de uma pessoa
function removerVinculosPessoa(pessoa) {
    try {
        // Buscar relacionamentos da pessoa
        const relacionamentos = db.getAll('relacionamentos');
        const vinculosPessoa = relacionamentos.filter(rel => 
            (rel.pessoa_origem_id == pessoa.pessoa_id) || 
            (rel.pessoa_destino_id == pessoa.pessoa_id)
        );

        if (vinculosPessoa.length === 0) {
            showNotification(`${pessoa.name} não possui vínculos para remover`, 'info');
            return;
        }

        // Criar interface para seleção de vínculos
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const painel = document.createElement('div');
        painel.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        let vinculosHtml = '';
        vinculosPessoa.forEach(rel => {
            const outraPessoa = rel.pessoa_origem_id == pessoa.pessoa_id 
                ? obterInfoPessoa(rel.pessoa_destino_id, rel.tipo_destino)
                : obterInfoPessoa(rel.pessoa_origem_id, rel.tipo_origem);

            const tipoIcon = getRelationshipLabel(rel.tipo_relacionamento);
            
            vinculosHtml += `
                <div class="form-check mb-2 p-3 border rounded">
                    <input class="form-check-input" type="checkbox" value="${rel.id}" id="vinculo-${rel.id}">
                    <label class="form-check-label" for="vinculo-${rel.id}">
                        <div class="d-flex align-items-center">
                            <span class="me-2">${tipoIcon}</span>
                            <div>
                                <strong>${outraPessoa.nome}</strong><br>
                                <small class="text-muted">${rel.descricao || 'Sem descrição'}</small>
                            </div>
                        </div>
                    </label>
                </div>
            `;
        });

        painel.innerHTML = `
            <h4><i class="fas fa-unlink me-2"></i>Remover Vínculos</h4>
            <p class="text-muted">Pessoa: <strong>${pessoa.name}</strong></p>
            <p class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Selecione os vínculos que deseja remover:</p>
            <hr>
            
            <div style="max-height: 300px; overflow-y: auto;">
                ${vinculosHtml}
            </div>
            
            <hr>
            <div class="d-flex justify-content-between">
                <div>
                    <button id="btn-selecionar-todos" class="btn btn-outline-primary btn-sm">Selecionar Todos</button>
                    <button id="btn-desmarcar-todos" class="btn btn-outline-secondary btn-sm">Desmarcar</button>
                </div>
                <div>
                    <button id="btn-cancelar-remover" class="btn btn-secondary me-2">Cancelar</button>
                    <button id="btn-remover-selecionados" class="btn btn-danger">
                        <i class="fas fa-trash me-1"></i>Remover Selecionados
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        painel.querySelector('#btn-selecionar-todos').onclick = () => {
            painel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        };

        painel.querySelector('#btn-desmarcar-todos').onclick = () => {
            painel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        };

        painel.querySelector('#btn-cancelar-remover').onclick = () => overlay.remove();

        painel.querySelector('#btn-remover-selecionados').onclick = () => {
            const selecionados = Array.from(painel.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            if (selecionados.length === 0) {
                showNotification('Selecione pelo menos um vínculo para remover', 'warning');
                return;
            }

            if (confirm(`Confirma a remoção de ${selecionados.length} vínculo(s)? Esta ação não pode ser desfeita.`)) {
                try {
                    selecionados.forEach(id => {
                        db.delete('relacionamentos', id);
                    });

                    showNotification(`✅ ${selecionados.length} vínculo(s) removido(s) com sucesso`, 'success');
                    overlay.remove();

                    // Atualizar árvore
                    setTimeout(() => {
                        renderizarArvoreInterativa();
                        if (typeof loadDashboard === 'function') loadDashboard();
                    }, 200);

                } catch (error) {
                    console.error('Erro ao remover vínculos:', error);
                    showNotification('Erro ao remover vínculos', 'error');
                }
            }
        };

        overlay.appendChild(painel);
        document.body.appendChild(overlay);

        // Fechar ao clicar fora
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

    } catch (error) {
        console.error('Erro ao remover vínculos:', error);
        showNotification('Erro ao abrir remoção de vínculos', 'error');
    }
}

// Funções simples que sempre funcionam
function toggleExpansaoNoSimples(no) {
    try {
        if (nosExpandidos.has(no.id)) {
            nosExpandidos.delete(no.id);
            showNotification(`Vínculos recolhidos: ${no.name}`, 'info');
        } else {
            nosExpandidos.add(no.id);
            showNotification(`Vínculos expandidos: ${no.name}`, 'info');
            
            // Criar relacionamentos em background
            setTimeout(() => {
                const novos = criarRelacionamentosParaPessoa(no.pessoa_id, no.type);
                if (novos > 0) {
                    showNotification(`${novos} novo(s) relacionamento(s) criado(s)!`, 'success');
                }
            }, 100);
        }
        
        // Re-renderizar
        setTimeout(() => renderizarArvoreInterativa(), 200);
    } catch (error) {
        console.error('Erro ao expandir:', error);
        showNotification('Erro ao expandir vínculos', 'error');
    }
}

function criarNovoVinculoSimples(no) {
    try {
        // Criar interface direta para novo vínculo
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const painel = document.createElement('div');
        painel.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Obter lista de todas as pessoas para seleção
        const pessoasFisicas = db.getAll('pessoa_fisica');
        const pessoasJuridicas = db.getAll('pessoa_juridica');
        
        let opcoesDestino = '<option value="">Selecione a pessoa de destino</option>';
        
        // Adicionar pessoas físicas
        pessoasFisicas.forEach(pessoa => {
            if (pessoa.id != no.pessoa_id) {
                opcoesDestino += `<option value="fisica_${pessoa.id}">[PF] ${pessoa.nome} ${pessoa.goa ? '('+pessoa.goa+')' : ''}</option>`;
            }
        });
        
        // Adicionar pessoas jurídicas  
        pessoasJuridicas.forEach(pessoa => {
            if (pessoa.id != no.pessoa_id) {
                opcoesDestino += `<option value="juridica_${pessoa.id}">[PJ] ${pessoa.razao_social} ${pessoa.goa ? '('+pessoa.goa+')' : ''}</option>`;
            }
        });

        painel.innerHTML = `
            <h4><i class="fas fa-plus me-2"></i>Criar Novo Vínculo</h4>
            <p class="text-muted">Origem: <strong>${no.name}</strong></p>
            <hr>
            
            <div class="mb-3">
                <label class="form-label">Pessoa de Destino *</label>
                <select id="vinculo-destino" class="form-control">
                    ${opcoesDestino}
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Tipo de Relacionamento *</label>
                <select id="vinculo-tipo" class="form-control">
                    <option value="">Selecione o tipo de relacionamento</option>
                    <option value="pai">👨 Pai</option>
                    <option value="mae">👩 Mãe</option>
                    <option value="filho">👶 Filho(a)</option>
                    <option value="irmao">👦 Irmão(ã)</option>
                    <option value="conjuge">💑 Cônjuge</option>
                    <option value="socio">🤝 Sócio</option>
                    <option value="empresarial">🏢 Empresarial</option>
                    <option value="parente">👥 Parente</option>
                    <option value="amigo">🤗 Amigo</option>
                    <option value="profissional">💼 Profissional</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Descrição</label>
                <textarea id="vinculo-descricao" class="form-control" rows="2" placeholder="Detalhes sobre o relacionamento (opcional)"></textarea>
            </div>
            
            <hr>
            <div class="d-flex justify-content-end">
                <button id="btn-cancelar-vinculo" class="btn btn-secondary me-2">Cancelar</button>
                <button id="btn-salvar-vinculo" class="btn btn-primary">
                    <i class="fas fa-save me-1"></i>Criar Vínculo
                </button>
            </div>
        `;

        // Event listeners
        painel.querySelector('#btn-cancelar-vinculo').onclick = () => overlay.remove();

        painel.querySelector('#btn-salvar-vinculo').onclick = () => {
            const destino = painel.querySelector('#vinculo-destino').value;
            const tipo = painel.querySelector('#vinculo-tipo').value;
            const descricao = painel.querySelector('#vinculo-descricao').value;

            if (!destino) {
                showNotification('Selecione a pessoa de destino', 'error');
                return;
            }

            if (!tipo) {
                showNotification('Selecione o tipo de relacionamento', 'error');
                return;
            }

            const [tipoDestino, idDestino] = destino.split('_');

            // Verificar se relacionamento já existe
            const relacionamentos = db.getAll('relacionamentos');
            const jaExiste = relacionamentos.some(rel => 
                (rel.pessoa_origem_id == no.pessoa_id && rel.pessoa_destino_id == idDestino) ||
                (rel.pessoa_origem_id == idDestino && rel.pessoa_destino_id == no.pessoa_id)
            );

            if (jaExiste) {
                showNotification('Relacionamento já existe entre essas pessoas', 'warning');
                return;
            }

            try {
                // Criar relacionamento
                const novoRelacionamento = {
                    pessoa_origem_id: no.pessoa_id,
                    pessoa_destino_id: idDestino,
                    tipo_origem: no.type,
                    tipo_destino: tipoDestino,
                    tipo_relacionamento: tipo,
                    descricao: descricao || `Vínculo criado via árvore`,
                    automatico: false
                };

                db.insert('relacionamentos', novoRelacionamento);
                showNotification('✅ Vínculo criado com sucesso!', 'success');
                overlay.remove();

                // Atualizar árvore
                setTimeout(() => {
                    renderizarArvoreInterativa();
                    if (typeof loadDashboard === 'function') loadDashboard();
                }, 200);

            } catch (error) {
                console.error('Erro ao salvar vínculo:', error);
                showNotification('Erro ao criar vínculo', 'error');
            }
        };

        overlay.appendChild(painel);
        document.body.appendChild(overlay);

        // Fechar ao clicar fora
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // Focar no select de destino
        setTimeout(() => painel.querySelector('#vinculo-destino').focus(), 100);

    } catch (error) {
        console.error('Erro ao criar vínculo:', error);
        showNotification('Erro ao abrir criação de vínculo', 'error');
    }
}

function personalizarCorSimples(no) {
    try {
        const cores = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f',
            '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa'
        ];

        // Criar seletor de cor simples
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const painel = document.createElement('div');
        painel.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            text-align: center;
        `;

        painel.innerHTML = `
            <h5>Escolha uma cor para ${no.name}</h5>
            <div id="cores-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0;"></div>
            <button id="btn-padrao" class="btn btn-secondary me-2">Cor Padrão</button>
            <button id="btn-fechar" class="btn btn-primary">Fechar</button>
        `;

        const coresGrid = painel.querySelector('#cores-grid');
        cores.forEach(cor => {
            const corBtn = document.createElement('div');
            corBtn.style.cssText = `
                width: 50px;
                height: 50px;
                background: ${cor};
                border-radius: 50%;
                cursor: pointer;
                border: 3px solid transparent;
                transition: transform 0.2s;
            `;
            
            corBtn.onmouseenter = () => corBtn.style.transform = 'scale(1.1)';
            corBtn.onmouseleave = () => corBtn.style.transform = 'scale(1)';
            corBtn.onclick = () => {
                arvoreConfig.coresPersonalizadas.set(no.id, cor);
                showNotification(`Cor alterada para ${no.name}`, 'success');
                overlay.remove();
                setTimeout(() => renderizarArvoreInterativa(), 200);
            };
            
            coresGrid.appendChild(corBtn);
        });

        painel.querySelector('#btn-padrao').onclick = () => {
            arvoreConfig.coresPersonalizadas.delete(no.id);
            showNotification('Cor padrão restaurada', 'info');
            overlay.remove();
            setTimeout(() => renderizarArvoreInterativa(), 200);
        };

        painel.querySelector('#btn-fechar').onclick = () => overlay.remove();

        overlay.appendChild(painel);
        document.body.appendChild(overlay);

        // Fechar ao clicar fora
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

    } catch (error) {
        console.error('Erro ao personalizar cor:', error);
        showNotification('Erro ao personalizar cor', 'error');
    }
}

function adicionarFotoSimples(no) {
    try {
        // Criar interface simples para foto
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const painel = document.createElement('div');
        painel.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            text-align: center;
        `;

        painel.innerHTML = `
            <h5>Adicionar foto para ${no.name}</h5>
            <div style="margin: 20px 0;">
                <input type="url" id="foto-url-simples" class="form-control mb-3" placeholder="Cole o link da imagem aqui">
                <input type="file" id="foto-arquivo-simples" class="form-control mb-3" accept="image/*">
            </div>
            <div id="preview-simples" style="margin: 15px 0; display: none;">
                <img id="img-preview-simples" style="max-width: 150px; max-height: 150px; border-radius: 50%;">
            </div>
            <div>
                <button id="btn-preview" class="btn btn-info me-2">Preview</button>
                <button id="btn-salvar-foto" class="btn btn-success me-2">Salvar</button>
                <button id="btn-remover-foto" class="btn btn-danger me-2">Remover</button>
                <button id="btn-fechar-foto" class="btn btn-secondary">Fechar</button>
            </div>
        `;

        // Event listeners
        const urlInput = painel.querySelector('#foto-url-simples');
        const fileInput = painel.querySelector('#foto-arquivo-simples');
        const preview = painel.querySelector('#preview-simples');
        const imgPreview = painel.querySelector('#img-preview-simples');

        painel.querySelector('#btn-preview').onclick = () => {
            const url = urlInput.value;
            if (url) {
                imgPreview.src = url;
                preview.style.display = 'block';
                imgPreview.onerror = () => {
                    showNotification('Erro ao carregar imagem', 'error');
                    preview.style.display = 'none';
                };
            }
        };

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    urlInput.value = e.target.result;
                    imgPreview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };

        painel.querySelector('#btn-salvar-foto').onclick = () => {
            const url = urlInput.value;
            if (url) {
                arvoreConfig.fotosPersonalizadas.set(no.id, url);
                showNotification('Foto adicionada com sucesso!', 'success');
                overlay.remove();
                setTimeout(() => renderizarArvoreInterativa(), 200);
            } else {
                showNotification('Selecione uma foto primeiro', 'warning');
            }
        };

        painel.querySelector('#btn-remover-foto').onclick = () => {
            arvoreConfig.fotosPersonalizadas.delete(no.id);
            showNotification('Foto removida', 'info');
            overlay.remove();
            setTimeout(() => renderizarArvoreInterativa(), 200);
        };

        painel.querySelector('#btn-fechar-foto').onclick = () => overlay.remove();

        overlay.appendChild(painel);
        document.body.appendChild(overlay);

        // Fechar ao clicar fora
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

    } catch (error) {
        console.error('Erro ao adicionar foto:', error);
        showNotification('Erro ao adicionar foto', 'error');
    }
}

// Exportar árvore em alta resolução
function exportarArvore() {
    try {
        showNotification('🖼️ Gerando exportação da árvore...', 'info');
        
        // Criar overlay de progresso
        const progressOverlay = document.createElement('div');
        progressOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
        `;
        progressOverlay.innerHTML = `
            <div class="text-center">
                <div class="spinner-border mb-3" role="status"></div>
                <div>Exportando árvore em alta resolução...</div>
                <div class="mt-2"><small>Aguarde alguns segundos</small></div>
            </div>
        `;
        document.body.appendChild(progressOverlay);

        setTimeout(() => {
            try {
                const dados = prepararDadosArvore();
                
                if (dados.nodes.length === 0) {
                    progressOverlay.remove();
                    showNotification('Não há dados na árvore para exportar', 'warning');
                    return;
                }

                // Configurações de alta resolução
                const width = 3840;  // 4K width
                const height = 2160; // 4K height
                const scale = 2;     // Escala adicional para qualidade

                // Criar SVG temporário para exportação
                const tempContainer = document.createElement('div');
                tempContainer.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
                document.body.appendChild(tempContainer);

                const exportSvg = d3.select(tempContainer)
                    .append('svg')
                    .attr('width', width * scale)
                    .attr('height', height * scale)
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .style('background', '#ffffff')
                    .style('font-family', 'Inter, Arial, sans-serif');

                // Criar gradiente de fundo elegante
                const defs = exportSvg.append('defs');
                
                const backgroundGradient = defs.append('radialGradient')
                    .attr('id', 'export-background')
                    .attr('cx', '50%').attr('cy', '50%').attr('r', '100%');
                
                backgroundGradient.append('stop')
                    .attr('offset', '0%').attr('stop-color', '#f8fafc');
                backgroundGradient.append('stop')
                    .attr('offset', '100%').attr('stop-color', '#e2e8f0');

                // Fundo
                exportSvg.append('rect')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('fill', 'url(#export-background)');

                // Título da árvore
                exportSvg.append('text')
                    .attr('x', width / 2)
                    .attr('y', 50)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '36px')
                    .attr('font-weight', 'bold')
                    .attr('fill', '#1a202c')
                    .text('Árvore de Relacionamentos');

                // Subtítulo com data
                const dataAtual = new Date().toLocaleDateString('pt-BR');
                exportSvg.append('text')
                    .attr('x', width / 2)
                    .attr('y', 90)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '18px')
                    .attr('fill', '#718096')
                    .text(`Gerado em ${dataAtual} • ${dados.nodes.length} pessoas • ${dados.links.length} relacionamentos`);

                // Grupo principal com posição ajustada
                const g = exportSvg.append('g')
                    .attr('transform', `translate(0, 120)`);

                // Configurar simulação para exportação (layout otimizado)
                const exportHeight = height - 140;
                configurarLayoutParaExportacao(dados, width, exportHeight);
                
                // Aguardar um pouco para simulação estabilizar
                setTimeout(() => {
                    // Criar elementos da árvore
                    criarElementosParaExportacao(g, dados);
                    
                    setTimeout(() => {
                        // Converter SVG para imagem
                        const svgData = new XMLSerializer().serializeToString(exportSvg.node());
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = width * scale;
                        canvas.height = height * scale;
                        
                        const img = new Image();
                        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(svgBlob);
                        
                        img.onload = () => {
                            try {
                                // Fundo branco
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                
                                // Desenhar SVG
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                
                                // Converter para PNG e fazer download
                                canvas.toBlob((blob) => {
                                    const downloadUrl = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = downloadUrl;
                                    link.download = `arvore-relacionamentos-${dataAtual.replace(/\//g, '-')}-${Date.now()}.png`;
                                    
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    
                                    // Limpeza
                                    URL.revokeObjectURL(url);
                                    URL.revokeObjectURL(downloadUrl);
                                    tempContainer.remove();
                                    progressOverlay.remove();
                                    
                                    showNotification('✅ Árvore exportada com sucesso!', 'success');
                                    
                                }, 'image/png', 0.95);
                                
                            } catch (error) {
                                console.error('Erro na conversão:', error);
                                progressOverlay.remove();
                                tempContainer.remove();
                                showNotification('Erro ao gerar imagem da árvore', 'error');
                            }
                        };
                        
                        img.onerror = () => {
                            progressOverlay.remove();
                            tempContainer.remove();
                            showNotification('Erro ao processar imagem da árvore', 'error');
                        };
                        
                        img.src = url;
                        
                    }, 1000);
                }, 500);
                
            } catch (error) {
                console.error('Erro na exportação:', error);
                progressOverlay.remove();
                showNotification('Erro ao exportar árvore', 'error');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao exportar árvore:', error);
        showNotification('Erro ao iniciar exportação', 'error');
    }
}

// Configurar layout otimizado para exportação
function configurarLayoutParaExportacao(dados, width, height) {
    // Usar layout de força otimizado para visualização
    const simulacao = d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links)
            .id(d => d.id)
            .distance(d => getDistanciaRelacionamento(d.relationship) * 1.5)
        )
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(80))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.1));

    // Executar simulação até estabilizar
    for (let i = 0; i < 300; i++) {
        simulacao.tick();
    }
    simulacao.stop();
}

// Criar elementos otimizados para exportação
function criarElementosParaExportacao(g, dados) {
    // Definições para exportação
    const svg = g.select(function() { return this.ownerSVGElement; });
    let defs = svg.select('defs');
    if (defs.empty()) {
        defs = svg.append('defs');
    }

    // Gradientes para pessoas físicas
    const gradientFisica = defs.append('linearGradient')
        .attr('id', 'export-gradient-fisica')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
    
    gradientFisica.append('stop')
        .attr('offset', '0%').attr('stop-color', '#4facfe');
    gradientFisica.append('stop')
        .attr('offset', '100%').attr('stop-color', '#00f2fe');

    // Gradientes para pessoas jurídicas
    const gradientJuridica = defs.append('linearGradient')
        .attr('id', 'export-gradient-juridica')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
    
    gradientJuridica.append('stop')
        .attr('offset', '0%').attr('stop-color', '#43e97b');
    gradientJuridica.append('stop')
        .attr('offset', '100%').attr('stop-color', '#38f9d7');

    // Links
    const linkGroup = g.append('g').attr('class', 'export-links');
    
    const links = linkGroup.selectAll('.export-link')
        .data(dados.links)
        .enter()
        .append('g')
        .attr('class', 'export-link');

    // Linha do relacionamento
    links.append('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', d => getRelationshipColor(d.relationship))
        .attr('stroke-width', d => getRelationshipWidth(d.relationship) * 2)
        .attr('stroke-dasharray', d => getRelationshipDashArray(d.relationship))
        .attr('opacity', 0.8);

    // Labels dos relacionamentos
    const labelGroup = links.append('g')
        .attr('class', 'export-link-label')
        .attr('transform', d => {
            const midX = (d.source.x + d.target.x) / 2;
            const midY = (d.source.y + d.target.y) / 2;
            return `translate(${midX}, ${midY})`;
        });

    labelGroup.append('rect')
        .attr('width', 120)
        .attr('height', 28)
        .attr('x', -60)
        .attr('y', -14)
        .attr('rx', 14)
        .attr('fill', d => getRelationshipColor(d.relationship))
        .attr('fill-opacity', 0.9)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    labelGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text(d => getRelationshipLabel(d.relationship));

    // Nós
    const nodeGroup = g.append('g').attr('class', 'export-nodes');
    
    const nos = nodeGroup.selectAll('.export-node')
        .data(dados.nodes)
        .enter()
        .append('g')
        .attr('class', 'export-node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Círculo principal
    nos.append('circle')
        .attr('r', 60)
        .attr('fill', d => {
            const corPersonalizada = arvoreConfig.coresPersonalizadas.get(d.id);
            if (corPersonalizada) return corPersonalizada;
            return d.type === 'fisica' ? 'url(#export-gradient-fisica)' : 'url(#export-gradient-juridica)';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 4)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

    // Foto da pessoa (se disponível)
    nos.each(function(d) {
        const fotoUrl = arvoreConfig.fotosPersonalizadas.get(d.id);
        if (fotoUrl) {
            d3.select(this).append('image')
                .attr('href', fotoUrl)
                .attr('x', -45)
                .attr('y', -45)
                .attr('width', 90)
                .attr('height', 90)
                .attr('clip-path', 'circle(45px)')
                .attr('preserveAspectRatio', 'xMidYMid slice');
        } else {
            // Ícone padrão
            d3.select(this).append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr('font-size', '28px')
                .attr('font-family', 'Font Awesome 6 Free')
                .attr('font-weight', '900')
                .attr('fill', '#fff')
                .text(d => d.type === 'fisica' ? '\uf007' : '\uf1ad');
        }
    });

    // Nome da pessoa
    nos.each(function(d) {
        const nomeCompleto = d.name;
        const palavras = nomeCompleto.split(' ');
        const g = d3.select(this);
        
        if (palavras.length <= 2 || nomeCompleto.length <= 20) {
            // Nome curto
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '80px')
                .attr('font-size', '16px')
                .attr('font-weight', 'bold')
                .attr('fill', '#1a202c')
                .style('text-shadow', '2px 2px 4px rgba(255,255,255,0.8)')
                .text(nomeCompleto);
        } else {
            // Nome longo - dividir
            const meio = Math.ceil(palavras.length / 2);
            const linha1 = palavras.slice(0, meio).join(' ');
            const linha2 = palavras.slice(meio).join(' ');
            
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '75px')
                .attr('font-size', '14px')
                .attr('font-weight', 'bold')
                .attr('fill', '#1a202c')
                .style('text-shadow', '2px 2px 4px rgba(255,255,255,0.8)')
                .text(linha1);
                
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '95px')
                .attr('font-size', '14px')
                .attr('font-weight', 'bold')
                .attr('fill', '#1a202c')
                .style('text-shadow', '2px 2px 4px rgba(255,255,255,0.8)')
                .text(linha2);
        }
    });

    // Documento
    nos.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '110px')
        .attr('font-size', '11px')
        .attr('fill', '#4a5568')
        .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
        .text(d => d.documento);

    // GOA (se disponível)
    nos.filter(d => d.goa && d.goa !== '-')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '125px')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#3182ce')
        .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.9)')
        .text(d => d.goa);
}

// Expansão automática completa de todos os dados
function expandirTodosOsDadosAutomaticamente() {
    try {
        console.log('🚀 Iniciando expansão automática COMPLETA de TODOS os dados...');
        
        let totalRelacionamentos = 0;
        let estatisticas = {
            pessoasFisicas: 0,
            pessoasJuridicas: 0,
            relacionamentosFamiliares: 0,
            relacionamentosEmpresariais: 0,
            relacionamentosCruzados: 0
        };
        
        const pessoasFisicas = db.getAll('pessoa_fisica');
        const pessoasJuridicas = db.getAll('pessoa_juridica');
        
        console.log(`📊 Processando ${pessoasFisicas.length} pessoas físicas e ${pessoasJuridicas.length} empresas...`);
        
        // EXPANDIR TODOS os nós de pessoas físicas com TODOS os dados
        pessoasFisicas.forEach((pessoa, index) => {
            const nodeId = `fisica_${pessoa.id}`;
            nosExpandidos.add(nodeId);
            
            // Criar relacionamentos detalhados (filhos, irmãos, pais, empresas)
            const novosRels = criarRelacionamentosCompletosPessoa(pessoa.id, 'fisica');
            totalRelacionamentos += novosRels;
            estatisticas.relacionamentosFamiliares += novosRels;
            estatisticas.pessoasFisicas++;
            
            // Log de progresso
            if ((index + 1) % 10 === 0) {
                console.log(`   ✓ Processadas ${index + 1}/${pessoasFisicas.length} pessoas físicas`);
            }
        });
        
        // EXPANDIR TODOS os nós de pessoas jurídicas com TODOS os dados
        pessoasJuridicas.forEach((empresa, index) => {
            const nodeId = `juridica_${empresa.id}`;
            nosExpandidos.add(nodeId);
            
            // Criar relacionamentos empresariais (sócios, filiais, participações)
            const novosRels = criarRelacionamentosCompletosEmpresa(empresa.id);
            totalRelacionamentos += novosRels;
            estatisticas.relacionamentosEmpresariais += novosRels;
            estatisticas.pessoasJuridicas++;
            
            // Log de progresso
            if ((index + 1) % 10 === 0) {
                console.log(`   ✓ Processadas ${index + 1}/${pessoasJuridicas.length} empresas`);
            }
        });
        
        // Criar relacionamentos cruzados COMPLETOS (pessoa-empresa, empresa-empresa, pessoa-pessoa)
        console.log('🔗 Criando relacionamentos cruzados avançados...');
        const relacionamentosCruzados = criarRelacionamentosCruzadosCompletos();
        totalRelacionamentos += relacionamentosCruzados;
        estatisticas.relacionamentosCruzados = relacionamentosCruzados;
        
        // Marcar modo de expansão completa ativo
        arvoreConfig.modoExpansaoCompleta = true;
        
        // Relatório final detalhado
        console.log(`✅ EXPANSÃO COMPLETA FINALIZADA:`);
        console.log(`   👥 ${estatisticas.pessoasFisicas} pessoas físicas expandidas`);
        console.log(`   🏢 ${estatisticas.pessoasJuridicas} empresas expandidas`);
        console.log(`   👨‍👩‍👧‍👦 ${estatisticas.relacionamentosFamiliares} vínculos familiares`);
        console.log(`   💼 ${estatisticas.relacionamentosEmpresariais} vínculos empresariais`);
        console.log(`   🔗 ${estatisticas.relacionamentosCruzados} vínculos cruzados`);
        console.log(`   🎯 TOTAL: ${totalRelacionamentos} relacionamentos criados`);
        
        showNotification(`🌟 EXPANSÃO COMPLETA: ${totalRelacionamentos} vínculos! Filhos, pais, empresas, sócios - TUDO expandido!`, 'success');
        
        return totalRelacionamentos;
        
    } catch (error) {
        console.error('❌ Erro na expansão automática completa:', error);
        showNotification('Erro na expansão automática completa', 'error');
        return 0;
    }
}

// Criar relacionamentos COMPLETOS para pessoa física (nova função aprimorada)
function criarRelacionamentosCompletosPessoa(pessoaId, tipoPessoa) {
    try {
        const pessoa = db.getById('pessoa_fisica', pessoaId);
        if (!pessoa) return 0;
        
        let novosRelacionamentos = 0;
        const relacionamentosExistentes = db.getAll('relacionamentos');
        
        // FILHOS - Expansão completa de todos os filhos cadastrados
        if (pessoa.filhos && typeof pessoa.filhos === 'object') {
            for (let i = 1; i <= 5; i++) {
                const filho = pessoa.filhos[i];
                if (filho && filho.nome && filho.nome.trim()) {
                    novosRelacionamentos += criarVinculoFamiliar(pessoaId, filho, 'FILHO', relacionamentosExistentes);
                }
            }
        }
        
        // IRMÃOS - Expansão completa de todos os irmãos cadastrados  
        if (pessoa.irmaos && typeof pessoa.irmaos === 'object') {
            for (let i = 1; i <= 5; i++) {
                const irmao = pessoa.irmaos[i];
                if (irmao && irmao.nome && irmao.nome.trim()) {
                    novosRelacionamentos += criarVinculoFamiliar(pessoaId, irmao, 'IRMAO', relacionamentosExistentes);
                }
            }
        }
        
        // PAIS - Vínculos com pai e mãe se tiverem CPF
        if (pessoa.mae && pessoa.mae.trim()) {
            novosRelacionamentos += criarVinculoPorNome(pessoaId, pessoa.mae, 'MAE', relacionamentosExistentes);
        }
        if (pessoa.pai && pessoa.pai.trim()) {
            novosRelacionamentos += criarVinculoPorNome(pessoaId, pessoa.pai, 'PAI', relacionamentosExistentes);
        }
        
        // EMPRESAS - Todas as participações empresariais
        if (pessoa.empresas && typeof pessoa.empresas === 'object') {
            for (let i = 1; i <= 8; i++) {
                const empresa = pessoa.empresas[i];
                if (empresa && empresa.razao_social && empresa.razao_social.trim()) {
                    novosRelacionamentos += criarVinculoEmpresarial(pessoaId, empresa, 'SOCIO', relacionamentosExistentes);
                }
            }
        }
        
        return novosRelacionamentos;
        
    } catch (error) {
        console.warn(`Erro ao criar relacionamentos para pessoa ${pessoaId}:`, error);
        return 0;
    }
}

// Criar relacionamentos COMPLETOS para empresa (nova função aprimorada)
function criarRelacionamentosCompletosEmpresa(empresaId) {
    try {
        const empresa = db.getById('pessoa_juridica', empresaId);
        if (!empresa) return 0;
        
        let novosRelacionamentos = 0;
        const relacionamentosExistentes = db.getAll('relacionamentos');
        
        // SÓCIOS - Todos os sócios cadastrados (até 8)
        if (empresa.socios && typeof empresa.socios === 'object') {
            for (let i = 1; i <= 8; i++) {
                const socio = empresa.socios[i];
                if (socio && socio.nome && socio.nome.trim()) {
                    novosRelacionamentos += criarVinculoSocietario(empresaId, socio, 'SOCIO', relacionamentosExistentes);
                }
            }
        }
        
        // FILIAIS - Se houver informações de filiais nos endereços alternativos
        if (empresa.endereco_filial_1) {
            novosRelacionamentos += criarVinculoFilial(empresaId, empresa.endereco_filial_1, relacionamentosExistentes);
        }
        if (empresa.endereco_filial_2) {
            novosRelacionamentos += criarVinculoFilial(empresaId, empresa.endereco_filial_2, relacionamentosExistentes);
        }
        
        return novosRelacionamentos;
        
    } catch (error) {
        console.warn(`Erro ao criar relacionamentos para empresa ${empresaId}:`, error);
        return 0;
    }
}

// Criar relacionamentos cruzados COMPLETOS (nova função)
function criarRelacionamentosCruzadosCompletos() {
    try {
        console.log('🔍 Analisando relacionamentos cruzados avançados...');
        
        let novosRelacionamentos = 0;
        const pessoasFisicas = db.getAll('pessoa_fisica');
        const pessoasJuridicas = db.getAll('pessoa_juridica');
        const relacionamentosExistentes = db.getAll('relacionamentos');
        
        // Relacionamentos por SOBRENOME (famílias)
        const familiasPorSobrenome = agruparPorSobrenome(pessoasFisicas);
        for (const [sobrenome, pessoas] of familiasPorSobrenome) {
            if (pessoas.length > 1) {
                novosRelacionamentos += criarVinculosFamiliaPorSobrenome(pessoas, relacionamentosExistentes);
            }
        }
        
        // Relacionamentos por TELEFONE compartilhado
        const pessoasPorTelefone = agruparPorTelefone(pessoasFisicas);
        for (const [telefone, pessoas] of pessoasPorTelefone) {
            if (pessoas.length > 1) {
                novosRelacionamentos += criarVinculosPorTelefone(pessoas, relacionamentosExistentes);
            }
        }
        
        // Relacionamentos por ENDEREÇO compartilhado
        const pessoasPorEndereco = agruparPorEndereco(pessoasFisicas);
        for (const [endereco, pessoas] of pessoasPorEndereco) {
            if (pessoas.length > 1) {
                novosRelacionamentos += criarVinculosPorEndereco(pessoas, relacionamentosExistentes);
            }
        }
        
        // Relacionamentos PESSOA-EMPRESA por nome da empresa
        pessoasFisicas.forEach(pessoa => {
            if (pessoa.empresas) {
                for (let i = 1; i <= 8; i++) {
                    const emp = pessoa.empresas[i];
                    if (emp && emp.razao_social) {
                        const empresaEncontrada = encontrarEmpresaPorNome(emp.razao_social, pessoasJuridicas);
                        if (empresaEncontrada) {
                            novosRelacionamentos += criarVinculoPessoaEmpresa(pessoa.id, empresaEncontrada.id, emp.participacao || '0%', relacionamentosExistentes);
                        }
                    }
                }
            }
        });
        
        console.log(`✅ Relacionamentos cruzados: ${novosRelacionamentos} vínculos criados`);
        return novosRelacionamentos;
        
    } catch (error) {
        console.error('Erro nos relacionamentos cruzados:', error);
        return 0;
    }
}

// Criar relacionamentos específicos para empresas
function criarRelacionamentosParaEmpresa(empresaId) {
    try {
        const empresa = db.getById('pessoa_juridica', empresaId);
        if (!empresa) return 0;
        
        let novosRelacionamentos = 0;
        const relacionamentosExistentes = db.getAll('relacionamentos');
        const pessoasFisicas = db.getAll('pessoa_fisica');
        
        // Relacionamentos com sócios (se existirem dados de sócios)
        if (empresa.socios && typeof empresa.socios === 'object') {
            Object.values(empresa.socios).forEach(socio => {
                if (socio.nome && socio.nome.trim()) {
                    const sociosEncontrados = pessoasFisicas.filter(pf => 
                        pf.nome && 
                        (pf.nome.toLowerCase().includes(socio.nome.toLowerCase()) ||
                         socio.nome.toLowerCase().includes(pf.nome.toLowerCase()))
                    );
                    
                    // Buscar por CPF se disponível
                    if (socio.cpf && socio.cpf.trim()) {
                        const cpfLimpo = socio.cpf.replace(/\D/g, '');
                        const socioPorCpf = pessoasFisicas.find(pf => 
                            pf.cpf && pf.cpf.replace(/\D/g, '') === cpfLimpo
                        );
                        if (socioPorCpf && !sociosEncontrados.includes(socioPorCpf)) {
                            sociosEncontrados.push(socioPorCpf);
                        }
                    }
                    
                    sociosEncontrados.forEach(socioEncontrado => {
                        const jaExiste = relacionamentosExistentes.some(rel => 
                            (rel.pessoa_origem_id == socioEncontrado.id && rel.pessoa_destino_id == empresa.id && rel.tipo_destino === 'juridica') ||
                            (rel.pessoa_origem_id == empresa.id && rel.pessoa_destino_id == socioEncontrado.id && rel.tipo_origem === 'juridica')
                        );
                        
                        if (!jaExiste) {
                            db.insert('relacionamentos', {
                                pessoa_origem_id: socioEncontrado.id,
                                pessoa_destino_id: empresa.id,
                                tipo_origem: 'fisica',
                                tipo_destino: 'juridica',
                                tipo_relacionamento: 'socio',
                                descricao: `🤝 Sócio ${socio.participacao ? 'com ' + socio.participacao + ' de participação' : ''} em ${empresa.razao_social}`,
                                automatico: true
                            });
                            novosRelacionamentos++;
                        }
                    });
                }
            });
        }
        
        // Relacionamentos baseados em endereços similares
        if (empresa.endereco) {
            const pessoasNoMesmoEndereco = pessoasFisicas.filter(pf => {
                return pf.endereco1 && 
                       empresa.endereco &&
                       (pf.endereco1.toLowerCase().includes(empresa.endereco.toLowerCase()) ||
                        empresa.endereco.toLowerCase().includes(pf.endereco1.toLowerCase()));
            });
            
            pessoasNoMesmoEndereco.forEach(pessoa => {
                const jaExiste = relacionamentosExistentes.some(rel => 
                    (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == empresa.id && rel.tipo_destino === 'juridica') ||
                    (rel.pessoa_origem_id == empresa.id && rel.pessoa_destino_id == pessoa.id && rel.tipo_origem === 'juridica')
                );
                
                if (!jaExiste) {
                    db.insert('relacionamentos', {
                        pessoa_origem_id: pessoa.id,
                        pessoa_destino_id: empresa.id,
                        tipo_origem: 'fisica',
                        tipo_destino: 'juridica',
                        tipo_relacionamento: 'endereco',
                        descricao: `🏠 Mesmo endereço: ${empresa.endereco}`,
                        automatico: true
                    });
                    novosRelacionamentos++;
                }
            });
        }
        
        return novosRelacionamentos;
        
    } catch (error) {
        console.error('Erro ao criar relacionamentos para empresa:', error);
        return 0;
    }
}

// Criar relacionamentos cruzados especiais
function criarRelacionamentosCruzados() {
    try {
        let novosRelacionamentos = 0;
        const relacionamentosExistentes = db.getAll('relacionamentos');
        const pessoasFisicas = db.getAll('pessoa_fisica');
        
        // Relacionamentos por telefones compartilhados
        const telefonesPessoas = new Map();
        pessoasFisicas.forEach(pessoa => {
            [pessoa.telefone1, pessoa.telefone2, pessoa.telefone3, pessoa.telefone4, pessoa.telefone5].forEach(tel => {
                if (tel && tel.trim() && tel.length >= 10) {
                    const telLimpo = tel.replace(/\D/g, '');
                    if (!telefonesPessoas.has(telLimpo)) {
                        telefonesPessoas.set(telLimpo, []);
                    }
                    telefonesPessoas.get(telLimpo).push(pessoa);
                }
            });
        });
        
        // Criar vínculos entre pessoas com telefones compartilhados
        telefonesPessoas.forEach((pessoas, telefone) => {
            if (pessoas.length > 1) {
                for (let i = 0; i < pessoas.length; i++) {
                    for (let j = i + 1; j < pessoas.length; j++) {
                        const pessoa1 = pessoas[i];
                        const pessoa2 = pessoas[j];
                        
                        const jaExiste = relacionamentosExistentes.some(rel => 
                            (rel.pessoa_origem_id == pessoa1.id && rel.pessoa_destino_id == pessoa2.id) ||
                            (rel.pessoa_origem_id == pessoa2.id && rel.pessoa_destino_id == pessoa1.id)
                        );
                        
                        if (!jaExiste) {
                            db.insert('relacionamentos', {
                                pessoa_origem_id: pessoa1.id,
                                pessoa_destino_id: pessoa2.id,
                                tipo_origem: 'fisica',
                                tipo_destino: 'fisica',
                                tipo_relacionamento: 'telefone',
                                descricao: `📞 Telefone compartilhado: ${telefone}`,
                                automatico: true
                            });
                            novosRelacionamentos++;
                        }
                    }
                }
            }
        });
        
        // Relacionamentos por endereços similares (rua/número)
        const enderecosPessoas = new Map();
        pessoasFisicas.forEach(pessoa => {
            [pessoa.endereco1, pessoa.endereco2, pessoa.endereco3, pessoa.endereco4, pessoa.endereco5].forEach(end => {
                if (end && end.trim() && end.length > 10) {
                    // Normalizar endereço (remover números de apartamento, etc)
                    const enderecoBase = end.toLowerCase()
                        .replace(/apto?\s*\d+/gi, '')
                        .replace(/apartamento\s*\d+/gi, '')
                        .replace(/sala\s*\d+/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    if (enderecoBase.length > 10) {
                        if (!enderecosPessoas.has(enderecoBase)) {
                            enderecosPessoas.set(enderecoBase, []);
                        }
                        enderecosPessoas.get(enderecoBase).push(pessoa);
                    }
                }
            });
        });
        
        // Criar vínculos entre pessoas no mesmo endereço
        enderecosPessoas.forEach((pessoas, endereco) => {
            if (pessoas.length > 1) {
                for (let i = 0; i < pessoas.length; i++) {
                    for (let j = i + 1; j < pessoas.length; j++) {
                        const pessoa1 = pessoas[i];
                        const pessoa2 = pessoas[j];
                        
                        const jaExiste = relacionamentosExistentes.some(rel => 
                            (rel.pessoa_origem_id == pessoa1.id && rel.pessoa_destino_id == pessoa2.id) ||
                            (rel.pessoa_origem_id == pessoa2.id && rel.pessoa_destino_id == pessoa1.id)
                        );
                        
                        if (!jaExiste) {
                            db.insert('relacionamentos', {
                                pessoa_origem_id: pessoa1.id,
                                pessoa_destino_id: pessoa2.id,
                                tipo_origem: 'fisica',
                                tipo_destino: 'fisica',
                                tipo_relacionamento: 'endereco',
                                descricao: `🏠 Mesmo endereço residencial`,
                                automatico: true
                            });
                            novosRelacionamentos++;
                        }
                    }
                }
            }
        });
        
        return novosRelacionamentos;
        
    } catch (error) {
        console.error('Erro ao criar relacionamentos cruzados:', error);
        return 0;
    }
}

console.log('🌳 Sistema de Árvore Interativa carregado com sucesso!');