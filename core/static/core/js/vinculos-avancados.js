/**
 * Sistema Avançado de Manipulação de Vínculos da Árvore Genealógica
 * Permite movimentação livre, organização automática e personalização de links
 */

// Configuração global de vínculos
const vinculosConfig = {
    modoEdicao: false,
    vinculosEditaveis: new Map(), // Armazena posições personalizadas
    estiloAtual: 'padrao', // padrao, curvo, ortogonal, arco
    mostrarPontos: true,
    distanciaMinima: 50,
    suavizacao: 0.5
};

// Inicializar sistema de vínculos avançados
function inicializarVinculosAvancados() {
    console.log('🔗 Inicializando sistema avançado de vínculos...');
    
    // Adicionar botões de controle na interface
    adicionarControlesVinculos();
    
    // Carregar vínculos salvos
    carregarVinculosSalvos();
    
    console.log('✅ Sistema de vínculos avançados pronto!');
}

// Adicionar controles de vínculos na interface
function adicionarControlesVinculos() {
    const controles = document.querySelector('.arvore-controls');
    if (!controles) return;
    
    const divVinculos = document.createElement('div');
    divVinculos.className = 'control-group mb-3';
    divVinculos.innerHTML = `
        <div class="card border-primary">
            <div class="card-header bg-primary text-white">
                <i class="fas fa-bezier-curve me-2"></i>
                <strong>Controle de Vínculos</strong>
            </div>
            <div class="card-body">
                <!-- Modo de Edição -->
                <div class="mb-3">
                    <button id="toggle-edicao-vinculos" class="btn btn-sm btn-outline-primary w-100">
                        <i class="fas fa-edit me-1"></i>
                        <span id="texto-modo-edicao">Ativar Edição de Vínculos</span>
                    </button>
                </div>
                
                <!-- Estilos de Vínculo -->
                <div class="mb-3">
                    <label class="form-label small"><strong>Estilo dos Vínculos:</strong></label>
                    <select id="estilo-vinculos" class="form-select form-select-sm">
                        <option value="padrao">📏 Linhas Retas (Padrão)</option>
                        <option value="curvo">🌊 Curvas Suaves</option>
                        <option value="ortogonal">📐 Linhas Ortogonais (90°)</option>
                        <option value="arco">🌈 Arcos</option>
                        <option value="livre">✋ Livre (Editável)</option>
                    </select>
                </div>
                
                <!-- Organização Automática -->
                <div class="mb-3">
                    <label class="form-label small"><strong>Organizar Vínculos:</strong></label>
                    <div class="btn-group-vertical w-100" role="group">
                        <button class="btn btn-sm btn-outline-secondary" onclick="organizarVinculosPorTipo()">
                            <i class="fas fa-layer-group me-1"></i> Por Tipo
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="organizarVinculosPorDistancia()">
                            <i class="fas fa-arrows-alt-h me-1"></i> Por Distância
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="evitarCruzamentos()">
                            <i class="fas fa-project-diagram me-1"></i> Evitar Cruzamentos
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="agruparVinculosSimilares()">
                            <i class="fas fa-object-group me-1"></i> Agrupar Similares
                        </button>
                    </div>
                </div>
                
                <!-- Opções de Visualização -->
                <div class="mb-3">
                    <label class="form-label small"><strong>Visualização:</strong></label>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="mostrar-pontos-controle" checked>
                        <label class="form-check-label small" for="mostrar-pontos-controle">
                            Mostrar Pontos de Controle
                        </label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="mostrar-setas">
                        <label class="form-check-label small" for="mostrar-setas">
                            Mostrar Direção (Setas)
                        </label>
                    </div>
                </div>
                
                <!-- Ações -->
                <div class="d-grid gap-2">
                    <button class="btn btn-sm btn-success" onclick="salvarLayoutVinculos()">
                        <i class="fas fa-save me-1"></i> Salvar Layout
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="resetarTodosVinculos()">
                        <i class="fas fa-undo me-1"></i> Resetar Todos
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Inserir antes dos outros controles
    controles.insertBefore(divVinculos, controles.firstChild);
    
    // Adicionar event listeners
    configurarEventListenersVinculos();
}

// Configurar event listeners
function configurarEventListenersVinculos() {
    // Toggle modo de edição
    document.getElementById('toggle-edicao-vinculos')?.addEventListener('click', toggleModoEdicaoVinculos);
    
    // Mudar estilo
    document.getElementById('estilo-vinculos')?.addEventListener('change', (e) => {
        mudarEstiloVinculos(e.target.value);
    });
    
    // Mostrar/ocultar pontos
    document.getElementById('mostrar-pontos-controle')?.addEventListener('change', (e) => {
        vinculosConfig.mostrarPontos = e.target.checked;
        atualizarVisualizacaoVinculos();
    });
    
    // Mostrar/ocultar setas
    document.getElementById('mostrar-setas')?.addEventListener('change', (e) => {
        toggleSetas(e.target.checked);
    });
}

// Ativar/desativar modo de edição de vínculos
function toggleModoEdicaoVinculos() {
    vinculosConfig.modoEdicao = !vinculosConfig.modoEdicao;
    
    const botao = document.getElementById('toggle-edicao-vinculos');
    const texto = document.getElementById('texto-modo-edicao');
    
    if (vinculosConfig.modoEdicao) {
        botao.classList.remove('btn-outline-primary');
        botao.classList.add('btn-primary');
        texto.textContent = 'Modo Edição ATIVO';
        showNotification('✏️ Modo de edição de vínculos ATIVADO - Clique nos vínculos para editar', 'success');
        ativarEdicaoVinculos();
    } else {
        botao.classList.remove('btn-primary');
        botao.classList.add('btn-outline-primary');
        texto.textContent = 'Ativar Edição de Vínculos';
        showNotification('✅ Modo de edição desativado', 'info');
        desativarEdicaoVinculos();
    }
}

// Ativar edição de vínculos
function ativarEdicaoVinculos() {
    const svg = d3.select('#arvore-container svg');
    
    // Adicionar pontos de controle a todos os vínculos
    svg.selectAll('.link').each(function(d) {
        const link = d3.select(this);
        adicionarPontoControleVinculo(d, this);
    });
}

// Desativar edição de vínculos
function desativarEdicaoVinculos() {
    // Remover todos os pontos de controle
    d3.selectAll('.link-control-point').remove();
    d3.selectAll('.link-control-handle').remove();
}

// Adicionar ponto de controle editável a um vínculo
function adicionarPontoControleVinculo(linkData, linkElement) {
    const svg = d3.select('#arvore-container svg');
    const source = linkData.source;
    const target = linkData.target;
    
    // Verificar se já tem posição salva
    let controlX, controlY;
    if (vinculosConfig.vinculosEditaveis.has(linkData.id)) {
        const saved = vinculosConfig.vinculosEditaveis.get(linkData.id);
        controlX = saved.x;
        controlY = saved.y;
    } else {
        // Posição inicial no meio
        controlX = (source.x + target.x) / 2;
        controlY = (source.y + target.y) / 2;
    }
    
    // Criar grupo de controle
    const controlGroup = svg.append('g')
        .attr('class', 'link-control-handle')
        .attr('data-link-id', linkData.id);
    
    // Linha auxiliar do source ao ponto de controle
    controlGroup.append('line')
        .attr('class', 'control-guide')
        .attr('x1', source.x)
        .attr('y1', source.y)
        .attr('x2', controlX)
        .attr('y2', controlY)
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.3);
    
    // Linha auxiliar do ponto de controle ao target
    controlGroup.append('line')
        .attr('class', 'control-guide')
        .attr('x1', controlX)
        .attr('y1', controlY)
        .attr('x2', target.x)
        .attr('y2', target.y)
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.3);
    
    // Ponto de controle arrastável
    const controlPoint = controlGroup.append('circle')
        .attr('class', 'link-control-point')
        .attr('cx', controlX)
        .attr('cy', controlY)
        .attr('r', 10)
        .attr('fill', '#007bff')
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('cursor', 'move')
        .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))');
    
    // Adicionar drag behavior
    const drag = d3.drag()
        .on('start', function(event) {
            d3.select(this).attr('fill', '#28a745').attr('r', 12);
        })
        .on('drag', function(event) {
            const newX = event.x;
            const newY = event.y;
            
            // Atualizar posição do ponto
            d3.select(this).attr('cx', newX).attr('cy', newY);
            
            // Atualizar linhas guia
            d3.select(this.parentNode).selectAll('.control-guide')
                .attr('x2', (d, i) => i === 0 ? newX : target.x)
                .attr('y2', (d, i) => i === 0 ? newY : target.y)
                .attr('x1', (d, i) => i === 0 ? source.x : newX)
                .attr('y1', (d, i) => i === 0 ? source.y : newY);
            
            // Atualizar o link
            atualizarLinkComControle(linkData, linkElement, newX, newY);
        })
        .on('end', function(event) {
            d3.select(this).attr('fill', '#007bff').attr('r', 10);
            
            // Salvar posição
            vinculosConfig.vinculosEditaveis.set(linkData.id, {
                x: event.x,
                y: event.y,
                timestamp: Date.now()
            });
            
            showNotification('✅ Posição do vínculo atualizada', 'success');
        });
    
    controlPoint.call(drag);
    
    // Adicionar botão de reset miniatura
    const resetBtn = controlGroup.append('circle')
        .attr('cx', controlX + 15)
        .attr('cy', controlY - 15)
        .attr('r', 6)
        .attr('fill', '#dc3545')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('click', function() {
            resetarVinculo(linkData.id);
        });
    
    controlGroup.append('text')
        .attr('x', controlX + 15)
        .attr('y', controlY - 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .attr('pointer-events', 'none')
        .text('×');
}

// Atualizar link com ponto de controle
function atualizarLinkComControle(linkData, linkElement, controlX, controlY) {
    const source = linkData.source;
    const target = linkData.target;
    
    // Criar path com curva quadrática
    const pathData = `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
    
    // Atualizar o elemento
    const linkLine = d3.select(linkElement).select('line');
    const linkPath = d3.select(linkElement).select('path');
    
    if (linkPath.empty()) {
        // Substituir line por path
        const strokeColor = linkLine.attr('stroke');
        const strokeWidth = linkLine.attr('stroke-width');
        const strokeDasharray = linkLine.attr('stroke-dasharray');
        
        linkLine.remove();
        
        d3.select(linkElement).append('path')
            .attr('d', pathData)
            .attr('stroke', strokeColor)
            .attr('stroke-width', strokeWidth)
            .attr('stroke-dasharray', strokeDasharray)
            .attr('fill', 'none')
            .attr('marker-end', 'url(#arrowhead)');
    } else {
        // Atualizar path existente
        linkPath.attr('d', pathData);
    }
}

// Mudar estilo dos vínculos
function mudarEstiloVinculos(estilo) {
    vinculosConfig.estiloAtual = estilo;
    
    const svg = d3.select('#arvore-container svg');
    
    svg.selectAll('.link').each(function(d) {
        aplicarEstiloVinculo(d, this, estilo);
    });
    
    showNotification(`🎨 Estilo de vínculos alterado: ${getNomeEstilo(estilo)}`, 'info');
}

// Aplicar estilo específico a um vínculo
function aplicarEstiloVinculo(linkData, linkElement, estilo) {
    const source = linkData.source;
    const target = linkData.target;
    const link = d3.select(linkElement);
    
    // Remover elementos anteriores
    link.selectAll('line, path').remove();
    
    switch(estilo) {
        case 'padrao':
            // Linha reta simples
            link.append('line')
                .attr('x1', source.x)
                .attr('y1', source.y)
                .attr('x2', target.x)
                .attr('y2', target.y)
                .attr('stroke', getRelationshipColor(linkData.relationship))
                .attr('stroke-width', getRelationshipWidth(linkData.relationship))
                .attr('marker-end', 'url(#arrowhead)');
            break;
            
        case 'curvo':
            // Curva suave
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const offset = 50;
            const pathCurvo = `M ${source.x} ${source.y} Q ${midX} ${midY + offset} ${target.x} ${target.y}`;
            
            link.append('path')
                .attr('d', pathCurvo)
                .attr('stroke', getRelationshipColor(linkData.relationship))
                .attr('stroke-width', getRelationshipWidth(linkData.relationship))
                .attr('fill', 'none')
                .attr('marker-end', 'url(#arrowhead)');
            break;
            
        case 'ortogonal':
            // Linhas em 90 graus
            const midXOrt = (source.x + target.x) / 2;
            const pathOrt = `M ${source.x} ${source.y} L ${midXOrt} ${source.y} L ${midXOrt} ${target.y} L ${target.x} ${target.y}`;
            
            link.append('path')
                .attr('d', pathOrt)
                .attr('stroke', getRelationshipColor(linkData.relationship))
                .attr('stroke-width', getRelationshipWidth(linkData.relationship))
                .attr('fill', 'none')
                .attr('marker-end', 'url(#arrowhead)');
            break;
            
        case 'arco':
            // Arco
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            const pathArco = `M ${source.x} ${source.y} A ${dr} ${dr} 0 0 1 ${target.x} ${target.y}`;
            
            link.append('path')
                .attr('d', pathArco)
                .attr('stroke', getRelationshipColor(linkData.relationship))
                .attr('stroke-width', getRelationshipWidth(linkData.relationship))
                .attr('fill', 'none')
                .attr('marker-end', 'url(#arrowhead)');
            break;
            
        case 'livre':
            // Editável manualmente
            if (vinculosConfig.vinculosEditaveis.has(linkData.id)) {
                const saved = vinculosConfig.vinculosEditaveis.get(linkData.id);
                atualizarLinkComControle(linkData, linkElement, saved.x, saved.y);
            } else {
                // Começar com curva suave
                const midXLivre = (source.x + target.x) / 2;
                const midYLivre = (source.y + target.y) / 2;
                const pathLivre = `M ${source.x} ${source.y} Q ${midXLivre} ${midYLivre} ${target.x} ${target.y}`;
                
                link.append('path')
                    .attr('d', pathLivre)
                    .attr('stroke', getRelationshipColor(linkData.relationship))
                    .attr('stroke-width', getRelationshipWidth(linkData.relationship))
                    .attr('fill', 'none')
                    .attr('marker-end', 'url(#arrowhead)');
            }
            break;
    }
}

// Organização automática de vínculos
function organizarVinculosPorTipo() {
    showNotification('🔄 Organizando vínculos por tipo...', 'info');
    
    // Agrupar vínculos por tipo de relacionamento
    const vinculos = Array.from(document.querySelectorAll('.link'));
    const grupos = {};
    
    vinculos.forEach(v => {
        const tipo = v.__data__.relationship;
        if (!grupos[tipo]) grupos[tipo] = [];
        grupos[tipo].push(v);
    });
    
    // Aplicar offsets diferentes para cada grupo
    Object.keys(grupos).forEach((tipo, index) => {
        const offset = (index - Object.keys(grupos).length / 2) * 20;
        grupos[tipo].forEach(link => {
            const d = link.__data__;
            aplicarOffsetVinculo(d, link, offset);
        });
    });
    
    showNotification('✅ Vínculos organizados por tipo!', 'success');
}

function organizarVinculosPorDistancia() {
    showNotification('🔄 Organizando vínculos por distância...', 'info');
    
    const vinculos = Array.from(document.querySelectorAll('.link'));
    
    vinculos.forEach(link => {
        const d = link.__data__;
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Vínculos mais longos = curvas mais suaves
        const curvatura = Math.min(dist / 4, 100);
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        
        atualizarLinkComControle(d, link, midX, midY + curvatura);
    });
    
    showNotification('✅ Vínculos organizados por distância!', 'success');
}

function evitarCruzamentos() {
    showNotification('🔄 Otimizando para evitar cruzamentos...', 'info');
    
    // Algoritmo simples para detectar e separar vínculos que se cruzam
    const vinculos = Array.from(document.querySelectorAll('.link'));
    
    for (let i = 0; i < vinculos.length; i++) {
        for (let j = i + 1; j < vinculos.length; j++) {
            const link1 = vinculos[i].__data__;
            const link2 = vinculos[j].__data__;
            
            if (vinculosSeCruzam(link1, link2)) {
                // Aplicar offset oposto para separar
                aplicarOffsetVinculo(link1, vinculos[i], 30);
                aplicarOffsetVinculo(link2, vinculos[j], -30);
            }
        }
    }
    
    showNotification('✅ Cruzamentos minimizados!', 'success');
}

function agruparVinculosSimilares() {
    showNotification('🔄 Agrupando vínculos similares...', 'info');
    
    const vinculos = Array.from(document.querySelectorAll('.link'));
    
    // Agrupar vínculos entre os mesmos pares de nós
    const grupos = new Map();
    
    vinculos.forEach(link => {
        const d = link.__data__;
        const key = `${d.source.id}-${d.target.id}`;
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key).push({data: d, element: link});
    });
    
    // Aplicar offsets para vínculos múltiplos
    grupos.forEach(grupo => {
        if (grupo.length > 1) {
            grupo.forEach((item, index) => {
                const offset = (index - (grupo.length - 1) / 2) * 25;
                aplicarOffsetVinculo(item.data, item.element, offset);
            });
        }
    });
    
    showNotification('✅ Vínculos similares agrupados!', 'success');
}

// Funções auxiliares
function aplicarOffsetVinculo(linkData, linkElement, offset) {
    const source = linkData.source;
    const target = linkData.target;
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    
    // Calcular perpendicular
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / dist * offset;
    const perpY = dx / dist * offset;
    
    atualizarLinkComControle(linkData, linkElement, midX + perpX, midY + perpY);
}

function vinculosSeCruzam(link1, link2) {
    // Algoritmo simples de detecção de cruzamento de linhas
    const a = link1.source, b = link1.target;
    const c = link2.source, d = link2.target;
    
    const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
    if (det === 0) return false;
    
    const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
    
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

function getNomeEstilo(estilo) {
    const nomes = {
        'padrao': 'Linhas Retas',
        'curvo': 'Curvas Suaves',
        'ortogonal': 'Linhas Ortogonais',
        'arco': 'Arcos',
        'livre': 'Livre (Editável)'
    };
    return nomes[estilo] || estilo;
}

function toggleSetas(mostrar) {
    const svg = d3.select('#arvore-container svg');
    svg.selectAll('.link line, .link path')
        .attr('marker-end', mostrar ? 'url(#arrowhead)' : null);
}

function atualizarVisualizacaoVinculos() {
    if (vinculosConfig.modoEdicao) {
        d3.selectAll('.link-control-point').style('display', vinculosConfig.mostrarPontos ? 'block' : 'none');
        d3.selectAll('.control-guide').style('display', vinculosConfig.mostrarPontos ? 'block' : 'none');
    }
}

function salvarLayoutVinculos() {
    try {
        const dados = {
            vinculos: Array.from(vinculosConfig.vinculosEditaveis.entries()),
            estilo: vinculosConfig.estiloAtual,
            timestamp: Date.now()
        };
        
        localStorage.setItem('layout_vinculos_' + (window.currentProject || 'default'), JSON.stringify(dados));
        showNotification('✅ Layout de vínculos salvo com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar layout:', error);
        showNotification('❌ Erro ao salvar layout', 'error');
    }
}

function carregarVinculosSalvos() {
    try {
        const dados = localStorage.getItem('layout_vinculos_' + (window.currentProject || 'default'));
        if (dados) {
            const parsed = JSON.parse(dados);
            vinculosConfig.vinculosEditaveis = new Map(parsed.vinculos);
            vinculosConfig.estiloAtual = parsed.estilo;
            console.log(`📥 Layout carregado: ${vinculosConfig.vinculosEditaveis.size} vínculos personalizados`);
        }
    } catch (error) {
        console.error('Erro ao carregar layout:', error);
    }
}

function resetarVinculo(linkId) {
    vinculosConfig.vinculosEditaveis.delete(linkId);
    
    // Remover ponto de controle
    d3.select(`.link-control-handle[data-link-id="${linkId}"]`).remove();
    
    // Resetar link para estilo padrão
    const linkElement = d3.selectAll('.link').filter(d => d.id === linkId).node();
    if (linkElement) {
        const linkData = linkElement.__data__;
        aplicarEstiloVinculo(linkData, linkElement, 'padrao');
    }
    
    showNotification('✅ Vínculo resetado', 'info');
}

function resetarTodosVinculos() {
    if (confirm('Tem certeza que deseja resetar TODOS os vínculos para o padrão?')) {
        vinculosConfig.vinculosEditaveis.clear();
        
        d3.selectAll('.link-control-handle').remove();
        
        const svg = d3.select('#arvore-container svg');
        svg.selectAll('.link').each(function(d) {
            aplicarEstiloVinculo(d, this, 'padrao');
        });
        
        document.getElementById('estilo-vinculos').value = 'padrao';
        vinculosConfig.estiloAtual = 'padrao';
        
        showNotification('✅ Todos os vínculos foram resetados!', 'success');
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarVinculosAvancados);
} else {
    // Se já carregou, inicializar imediatamente (mas aguardar árvore estar pronta)
    setTimeout(inicializarVinculosAvancados, 1000);
}

console.log('✅ Módulo de vínculos avançados carregado!');
