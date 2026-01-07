/**
 * Sistema de Árvore de Relacionamentos
 * Visualização gráfica dos relacionamentos entre pessoas físicas e jurídicas
 */

// Configurar event listeners para relacionamentos
function setupRelationshipListeners() {
    // Event listener para o formulário de relacionamento
    const formRelacionamento = document.getElementById('form-relacionamento');
    if (formRelacionamento) {
        formRelacionamento.addEventListener('submit', function(e) {
            e.preventDefault();
            criarRelacionamento();
        });
    }
    
    // Event listener para busca por GOA
    const buscaGoa = document.getElementById('busca-goa');
    if (buscaGoa) {
        buscaGoa.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarPorGOA();
            }
        });
    }
}

// Carregar árvore de relacionamentos
function loadArvoreRelacionamentos() {
    inicializarArvoreExpandida();
    atualizarEstatisticasArvore();
    updateStatusBar('Árvore de relacionamentos carregada com vínculos expandidos');
}

// Função removida - agora usamos apenas busca inteligente

// Criar relacionamento
async function criarRelacionamento() {
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

        // Extrair tipo e ID da origem
        const [tipoOrigem, idOrigem] = origemValue.split('_');
        const [tipoDestino, idDestino] = destinoValue.split('_');

        // Verificar se relacionamento já existe
        const relacionamentoExistente = await verificarRelacionamentoExistente(
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

        api.post('/relacionamentos/', relacionamentoData);
        showNotification('Relacionamento criado com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('form-relacionamento').reset();
        
        // Recarregar árvore
        renderizarArvore();
        loadDashboard();
        updateStatusBar('Novo relacionamento criado');
        
    } catch (error) {
        console.error('Erro ao criar relacionamento:', error);
        showNotification('Erro ao criar relacionamento', 'error');
    }
}

// Verificar se relacionamento já existe
async function verificarRelacionamentoExistente(idOrigem, tipoOrigem, idDestino, tipoDestino) {
    try {
        const relacionamentos = await api.get('/relacionamentos/');
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

// Renderizar árvore usando D3.js
function renderizarArvore() {
    const container = document.getElementById('arvore-container');
    if (!container) return;

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
                        <p class="text-muted">Crie relacionamentos entre pessoas para visualizar a árvorjjje.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Configurações do SVG - Tela cheia responsiva
        const width = Math.max(container.clientWidth, window.innerWidth - 100);
        const height = Math.max(600, window.innerHeight - 200);

        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
            .style('border-radius', '8px')
            .style('box-shadow', '0 4px 20px rgba(0,0,0,0.15)')
            .call(d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', function(event) {
                    g.attr('transform', event.transform);
                }));
        
        // Grupo principal para zoom/pan
        const g = svg.append('g');

        // Criar simulação de força aprimorada
        const simulation = d3.forceSimulation(dados.nodes)
            .force('link', d3.forceLink(dados.links).id(d => d.id).distance(d => {
                // Distância baseada no tipo de relacionamento
                const distancias = {
                    'pai': 120, 'mae': 120, 'irmao': 100,
                    'filho': 100, 'socio': 180, 'empresarial': 200
                };
                return distancias[d.relationship] || 150;
            }))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(50))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1));

        // Criar elementos visuais no grupo transformável
        criarElementosArvore(g, dados, simulation, width, height);

        updateStatusBar(`Árvore renderizada com ${dados.nodes.length} nós e ${dados.links.length} conexões`);

    } catch (error) {
        console.error('Erro ao renderizar árvore:', error);
        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erro ao renderizar árvore de relacionamentos
                </div>
            </div>
        `;
    }
}

// Preparar dados para a árvore
async function prepararDadosArvore() {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    try {
        // Primeiro, criar relacionamentos automáticos baseados nos dados de família
        await criarRelacionamentosAutomaticosFamilia();
        
        // Obter todos os relacionamentos (manuais + automáticos)
        const relacionamentos = await api.get('/relacionamentos/');

        relacionamentos.forEach(rel => {
            // Corrigir nomes dos campos baseado na estrutura real
            const tipoOrigem = rel.tipo_origem || 'fisica';
            const tipoDestino = rel.tipo_destino || 'juridica';
            
            // Adicionar nó de origem se não existir
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

            // Adicionar nó de destino se não existir
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

            // Sempre adicionar o link - todas as ligações serão visíveis
            links.push({
                source: origemId,
                target: destinoId,
                relationship: rel.tipo_relacionamento || rel.tipo,
                description: rel.descricao,
                id: rel.id,
                visible: true,
                automatico: rel.automatico || false
            });
        });

        return { nodes, links };
    } catch (error) {
        console.error('Erro ao preparar dados da árvore:', error);
        return { nodes: [], links: [] };
    }
}

// Criar relacionamentos automáticos baseados nos dados de família
async function criarRelacionamentosAutomaticosFamilia() {
    try {
        console.log('👨‍👩‍👧‍👦 Criando relacionamentos automáticos de família...');
        
        const pessoasFisicas = await api.get('/pessoas-fisicas/');
        const relacionamentosExistentes = await api.get('/relacionamentos/');
        let novosRelacionamentos = 0;
        
        for (const pessoa of pessoasFisicas) {
            // Relacionamentos com filhos
            if (pessoa.filhos && typeof pessoa.filhos === 'object') {
                for (const filho of Object.values(pessoa.filhos)) {
                    if (filho.nome && filho.nome.trim()) {
                        // Procurar filho pelo nome nos registros
                        const filhoEncontrado = pessoasFisicas.find(p => 
                            p.nome && p.nome.toLowerCase().includes(filho.nome.toLowerCase())
                        );
                        
                        if (filhoEncontrado && filhoEncontrado.id !== pessoa.id) {
                            // Verificar se relacionamento já existe
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == filhoEncontrado.id) ||
                                (rel.pessoa_origem_id == filhoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                // Criar relacionamento pai/mãe -> filho (async, não esperar)
                                api.post('/relacionamentos/', {
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
                }
            }
            
            // Relacionamentos com irmãos
            if (pessoa.irmaos && typeof pessoa.irmaos === 'object') {
                for (const irmao of Object.values(pessoa.irmaos)) {
                    if (irmao.nome && irmao.nome.trim()) {
                        // Procurar irmão pelo nome nos registros
                        const irmaoEncontrado = pessoasFisicas.find(p => 
                            p.nome && p.nome.toLowerCase().includes(irmao.nome.toLowerCase())
                        );
                        
                        if (irmaoEncontrado && irmaoEncontrado.id !== pessoa.id) {
                            // Verificar se relacionamento já existe
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == irmaoEncontrado.id) ||
                                (rel.pessoa_origem_id == irmaoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                // Criar relacionamento irmão
                                api.post('/relacionamentos/', {
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
                }
            }
            
            // Relacionamentos empresariais
            if (pessoa.empresas && typeof pessoa.empresas === 'object') {
                const pessoasJuridicas = await api.get('/pessoas-juridicas/');
                
                for (const empresa of Object.values(pessoa.empresas)) {
                    if (empresa.razao_social && empresa.razao_social.trim()) {
                        // Procurar empresa nos registros de PJ
                        const empresaEncontrada = pessoasJuridicas.find(pj => 
                            pj.razao_social && pj.razao_social.toLowerCase().includes(empresa.razao_social.toLowerCase())
                        );
                        
                        if (empresaEncontrada) {
                            // Verificar se relacionamento já existe
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == empresaEncontrada.id && rel.tipo_destino === 'juridica') ||
                                (rel.pessoa_origem_id == empresaEncontrada.id && rel.pessoa_destino_id == pessoa.id && rel.tipo_origem === 'juridica')
                            );
                            
                            if (!jaExiste) {
                                // Criar relacionamento empresarial
                                api.post('/relacionamentos/', {
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
                        for (const socio of Object.values(empresa.socios)) {
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
                                        api.post('/relacionamentos/', {
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
                        }
                    }
                }
            }
        }
        
        if (novosRelacionamentos > 0) {
            console.log(`✅ ${novosRelacionamentos} relacionamentos automáticos de família criados!`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar relacionamentos automáticos de família:', error);
    }
}

// Criar relacionamentos automáticos para uma pessoa específica
async function criarRelacionamentosParaPessoa(pessoaId, tipoPessoa) {
    try {
        console.log(`🔍 Analisando relacionamentos para pessoa ${pessoaId} (${tipoPessoa})...`);
        
        let novosRelacionamentos = 0;
        const relacionamentosExistentes = await api.get('/relacionamentos/');
        
        if (tipoPessoa === 'fisica') {
            const pessoa = await api.get(`/pessoas-fisicas/${pessoaId}/`);
            if (!pessoa) return 0;
            
            const todasPessoasFisicas = await api.get('/pessoas-fisicas/');
            const todasPessoasJuridicas = await api.get('/pessoas-juridicas/');
            
            // Análise de FILHOS
            if (pessoa.filhos && typeof pessoa.filhos === 'object') {
                for (const filho of Object.values(pessoa.filhos)) {
                    if (filho.nome && filho.nome.trim()) {
                        console.log(`👶 Procurando filho: ${filho.nome}`);
                        
                        // Buscar por nome (match parcial)
                        const filhosEncontrados = todasPessoasFisicas.filter(p => 
                            p.id !== pessoa.id && 
                            p.nome && 
                            (p.nome.toLowerCase().includes(filho.nome.toLowerCase()) ||
                             filho.nome.toLowerCase().includes(p.nome.toLowerCase()))
                        );
                        
                        // Buscar por CPF se disponível
                        if (filho.cpf && filho.cpf.trim()) {
                            const cpfLimpo = filho.cpf.replace(/\D/g, '');
                            const filhoPorCpf = todasPessoasFisicas.find(p => 
                                p.cpf && p.cpf.replace(/\D/g, '') === cpfLimpo
                            );
                            if (filhoPorCpf && !filhosEncontrados.includes(filhoPorCpf)) {
                                filhosEncontrados.push(filhoPorCpf);
                            }
                        }
                        
                        for (const filhoEncontrado of filhosEncontrados) {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == filhoEncontrado.id) ||
                                (rel.pessoa_origem_id == filhoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                api.post('/relacionamentos/', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: filhoEncontrado.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'fisica',
                                    tipo_relacionamento: pessoa.sexo === 'Feminino' ? 'mae' : 'pai',
                                    descricao: `👶 ${pessoa.sexo === 'Feminino' ? 'Mãe' : 'Pai'} de ${filhoEncontrado.nome}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                                console.log(`✅ Relacionamento criado: ${pessoa.nome} → ${filhoEncontrado.nome} (${pessoa.sexo === 'Feminino' ? 'Mãe' : 'Pai'})`);
                            }
                        }
                    }
                }
            }
            
            // Análise de IRMÃOS
            if (pessoa.irmaos && typeof pessoa.irmaos === 'object') {
                for (const irmao of Object.values(pessoa.irmaos)) {
                    if (irmao.nome && irmao.nome.trim()) {
                        console.log(`👦 Procurando irmão: ${irmao.nome}`);
                        
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
                        
                        for (const irmaoEncontrado of irmaosEncontrados) {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == irmaoEncontrado.id) ||
                                (rel.pessoa_origem_id == irmaoEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                            );
                            
                            if (!jaExiste) {
                                api.post('/relacionamentos/', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: irmaoEncontrado.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'fisica',
                                    tipo_relacionamento: 'irmao',
                                    descricao: `👦 Irmão(s): ${irmaoEncontrado.nome}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                                console.log(`✅ Relacionamento criado: ${pessoa.nome} ↔ ${irmaoEncontrado.nome} (Irmãos)`);
                            }
                        }
                    }
                }
            }
            
            // Análise de EMPRESAS/SÓCIOS
            if (pessoa.empresas && typeof pessoa.empresas === 'object') {
                for (const empresa of Object.values(pessoa.empresas)) {
                    if (empresa.razao_social && empresa.razao_social.trim()) {
                        console.log(`🏢 Procurando empresa: ${empresa.razao_social}`);
                        
                        // Buscar empresa na lista de PJ
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
                        
                        for (const empresaEncontrada of empresasEncontradas) {
                            const jaExiste = relacionamentosExistentes.some(rel => 
                                (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == empresaEncontrada.id && rel.tipo_destino === 'juridica') ||
                                (rel.pessoa_origem_id == empresaEncontrada.id && rel.pessoa_destino_id == pessoa.id && rel.tipo_origem === 'juridica')
                            );
                            
                            if (!jaExiste) {
                                api.post('/relacionamentos/', {
                                    pessoa_origem_id: pessoa.id,
                                    pessoa_destino_id: empresaEncontrada.id,
                                    tipo_origem: 'fisica',
                                    tipo_destino: 'juridica',
                                    tipo_relacionamento: 'socio',
                                    descricao: `🤝 Sócio com ${empresa.participacao || '0%'} de participação em ${empresaEncontrada.razao_social}`,
                                    automatico: true
                                });
                                novosRelacionamentos++;
                                console.log(`✅ Vínculo empresarial criado: ${pessoa.nome} → ${empresaEncontrada.razao_social} (Sócio)`);
                            }
                        }
                        
                        // Análise de sócios da empresa
                        if (empresa.socios && typeof empresa.socios === 'object') {
                            for (const socio of Object.values(empresa.socios)) {
                                if (socio.nome && socio.nome.trim()) {
                                    console.log(`🤝 Procurando sócio: ${socio.nome}`);
                                    
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
                                    
                                    for (const socioEncontrado of sociosEncontrados) {
                                        const jaExiste = relacionamentosExistentes.some(rel => 
                                            (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == socioEncontrado.id) ||
                                            (rel.pessoa_origem_id == socioEncontrado.id && rel.pessoa_destino_id == pessoa.id)
                                        );
                                        
                                        if (!jaExiste) {
                                            api.post('/relacionamentos/', {
                                                pessoa_origem_id: pessoa.id,
                                                pessoa_destino_id: socioEncontrado.id,
                                                tipo_origem: 'fisica',
                                                tipo_destino: 'fisica',
                                                tipo_relacionamento: 'socio',
                                                descricao: `🤝 Sócios na empresa: ${empresa.razao_social}`,
                                                automatico: true
                                            });
                                            novosRelacionamentos++;
                                            console.log(`✅ Parceria criada: ${pessoa.nome} ↔ ${socioEncontrado.nome} (Sócios)`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Análise por NOME DE FAMÍLIA (sobrenomes em comum)
            if (pessoa.nome && pessoa.nome.includes(' ')) {
                const sobrenomes = pessoa.nome.split(' ');
                const ultimoSobrenome = sobrenomes[sobrenomes.length - 1];
                
                if (ultimoSobrenome.length > 3) { // Evitar sobrenomes muito curtos
                    const pessoasComMesmoSobrenome = todasPessoasFisicas.filter(p => 
                        p.id !== pessoa.id && 
                        p.nome && 
                        p.nome.toLowerCase().includes(ultimoSobrenome.toLowerCase())
                    );
                    
                    for (const parente of pessoasComMesmoSobrenome) {
                        const jaExiste = relacionamentosExistentes.some(rel => 
                            (rel.pessoa_origem_id == pessoa.id && rel.pessoa_destino_id == parente.id) ||
                            (rel.pessoa_origem_id == parente.id && rel.pessoa_destino_id == pessoa.id)
                        );
                        
                        if (!jaExiste) {
                            api.post('/relacionamentos/', {
                                pessoa_origem_id: pessoa.id,
                                pessoa_destino_id: parente.id,
                                tipo_origem: 'fisica',
                                tipo_destino: 'fisica',
                                tipo_relacionamento: 'parente',
                                descricao: `👥 Possível parentesco pelo sobrenome "${ultimoSobrenome}"`,
                                automatico: true
                            });
                            novosRelacionamentos++;
                            console.log(`✅ Parentesco criado: ${pessoa.nome} ↔ ${parente.nome} (Mesmo sobrenome)`);
                        }
                    }
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

// Obter informações da pessoa
async function obterInfoPessoa(pessoaId, tipoPessoa) {
    try {
        const table = tipoPessoa === 'fisica' ? '/pessoas-fisicas/' : '/pessoas-juridicas/';
        const pessoa = await api.get(`${table}${pessoaId}/`);
        
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

// Criar elementos visuais da árvore
function criarElementosArvore(g, dados, simulation, width, height) {
    // Criar definições para setas no SVG pai
    const svg = g.select(function() { return this.ownerSVGElement; });
    let defs = svg.select('defs');
    if (defs.empty()) {
        defs = svg.append('defs');
    }
    
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#666')
        .style('stroke', 'none');

    // Criar links (conexões) no grupo transformável
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('g')
        .data(dados.links)
        .enter()
        .append('g');
    
    // Linha da conexão - SEMPRE VISÍVEL
    link.append('line')
        .attr('stroke', d => getRelationshipColor(d.relationship))
        .attr('stroke-width', d => getRelationshipWidth(d.relationship))
        .attr('marker-end', 'url(#arrowhead)')
        .style('cursor', 'pointer')
        .style('opacity', 1)
        .on('click', function(event, d) {
            mostrarInfoRelacionamento(d);
        });

    // Fundo do label (para melhor legibilidade)
    const labelBg = link.append('g').attr('class', 'label-background');
    
    labelBg.append('rect')
        .attr('width', 60)
        .attr('height', 16)
        .attr('x', -30)
        .attr('y', -13)
        .attr('rx', 8)
        .attr('fill', d => getRelationshipColor(d.relationship))
        .attr('fill-opacity', 0.9)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    
    // Label do relacionamento aprimorado - SEMPRE VISÍVEL
    link.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#ffffff')
        .attr('font-weight', 'bold')
        .attr('dy', '-2px')
        .text(d => getRelationshipLabel(d.relationship))
        .style('cursor', 'pointer')
        .style('opacity', 1)
        .on('click', function(event, d) {
            mostrarInfoRelacionamento(d);
        });

    // Criar tooltips para links
    link.selectAll('*').append('title')
        .text(d => `${getRelationshipLabel(d.relationship)}${d.description ? ': ' + d.description : ''}`);

    // Criar nós (pessoas) no grupo transformável
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(dados.nodes)
        .enter()
        .append('g')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('click', function(event, d) {
            mostrarInfoPessoa(d);
        });

    // Adicionar círculos aos nós com gradientes
    node.append('circle')
        .attr('r', 30) // Nós maiores para melhor visibilidade
        .attr('fill', d => d.type === 'fisica' ? 
            'url(#gradient-fisica)' : 'url(#gradient-juridica)')
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#shadow)');
    
    // Definir gradientes e filtros
    defs.append('linearGradient')
        .attr('id', 'gradient-fisica')
        .selectAll('stop')
        .data([{offset: '0%', color: '#4facfe'}, {offset: '100%', color: '#00f2fe'}])
        .enter().append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);
    
    defs.append('linearGradient')
        .attr('id', 'gradient-juridica')
        .selectAll('stop')
        .data([{offset: '0%', color: '#43e97b'}, {offset: '100%', color: '#38f9d7'}])
        .enter().append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);
    
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

    // Adicionar ícones aos nós
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('font-size', '16px')
        .attr('fill', 'white')
        .attr('font-family', 'Font Awesome 6 Free')
        .attr('font-weight', '900')
        .text(d => d.type === 'fisica' ? '\uf007' : '\uf1ad'); // user / building

    // Adicionar labels aos nós
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '40px')
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .style('font-weight', 'bold')
        .text(d => {
            const maxLength = 15;
            return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
        });

    // BOTÃO DE CRIAÇÃO DE LIGAÇÕES AUTOMÁTICAS
    const autoButton = node.append('g')
        .attr('class', 'auto-link-button')
        .style('cursor', 'pointer');

    // Círculo do botão de ligações automáticas
    autoButton.append('circle')
        .attr('r', 10)
        .attr('cx', 25)
        .attr('cy', -25)
        .attr('fill', '#28a745')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('opacity', 0.95);

    // Ícone do botão (link/chain)
    autoButton.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', 25)
        .attr('y', -20)
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .attr('font-family', 'Font Awesome 6 Free')
        .attr('font-weight', '900')
        .text('\uf0c1') // link icon
        .style('pointer-events', 'none');

    // Event listener para criar ligações automáticas
    autoButton.on('click', function(event, d) {
        event.stopPropagation();
        console.log('Clicou no botão de ligações automáticas para:', d.name);
        localizarEExpandirNaArvore(d.pessoa_id, d.type);
    });

    // Tooltip para o botão
    autoButton.append('title')
        .text('Clique para criar ligações automáticas para esta pessoa');

    // Adicionar documento aos nós
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '50px')
        .attr('font-size', '8px')
        .attr('fill', '#666')
        .text(d => d.documento);

    // Adicionar GOA aos nós
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '62px')
        .attr('font-size', '10px')
        .attr('fill', '#007bff')
        .attr('font-weight', 'bold')
        .text(d => d.goa !== '-' ? d.goa : '');

    // Atualizar posições durante a simulação
    simulation.on('tick', () => {
        // Atualizar linhas
        link.select('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        // Atualizar labels dos relacionamentos
        link.select('text')
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);

        // Atualizar nós
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Funções de drag
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Função para fechar modal de forma segura (copiada do forms.js)
function fecharModalSeguro() {
    try {
        const modalEl = document.getElementById('modalDetalhes');
        if (!modalEl) return;

        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        
        if (modalInstance) {
            modalInstance.hide();
            
            modalEl.addEventListener('hidden.bs.modal', function destruirModal() {
                try {
                    modalInstance.dispose();
                } catch (error) {
                    console.warn('⚠️ Erro ao destruir modal:', error);
                }
                modalEl.removeEventListener('hidden.bs.modal', destruirModal);
            }, { once: true });
        }
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
    } catch (error) {
        console.error('❌ Erro ao fechar modal:', error);
        
        try {
            const modalEl = document.getElementById('modalDetalhes');
            if (modalEl) {
                modalEl.style.display = 'none';
                modalEl.classList.remove('show');
            }
            
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
        } catch (forceError) {
            console.error('❌ Erro na limpeza forçada:', forceError);
        }
    }
}

// Mostrar informações do relacionamento
async function mostrarInfoRelacionamento(relacionamento) {
    fecharModalSeguro(); // Fechar qualquer modal aberto
    
    setTimeout(async () => {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
    
    modalTitle.textContent = 'Detalhes do Relacionamento';
    
const origemInfo = await obterInfoPessoa(relacionamento.source.pessoa_id, relacionamento.source.type);
    const destinoInfo = await obterInfoPessoa(relacionamento.target.pessoa_id, relacionamento.target.type);
    
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
        
        // Usar sistema robusto de modal
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.show();
        } else {
            modalInstance = new bootstrap.Modal(modalEl);
            modalInstance.show();
        }
    }, 100);
}

// Mostrar informações da pessoa
function mostrarInfoPessoa(node) {
    const table = node.type === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica';
    verDetalhes(table, node.pessoa_id);
}

// Excluir relacionamento
async function excluirRelacionamento(relacionamentoId) {
    if (confirm('Deseja realmente excluir este relacionamento?')) {
        try {
            await api.delete(`/relacionamentos/${relacionamentoId}/`);
            showNotification('Relacionamento excluído com sucesso!', 'success');
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
            if (modal) modal.hide();
            
            // Recarregar árvore
            renderizarArvore();
            loadDashboard();
            updateStatusBar('Relacionamento excluído');
        } catch (error) {
            console.error('Erro ao excluir relacionamento:', error);
            showNotification('Erro ao excluir relacionamento', 'error');
        }
    }
}

// Buscar relacionamentos de uma pessoa
async function buscarRelacionamentosPessoa(pessoaId, tipoPessoa) {
    try {
        const response = await api.listarRelacionamentos();
        const relacionamentos = response.results || response;
        return relacionamentos.filter(rel => 
            (rel.pessoa_origem_id == pessoaId && rel.tipo_origem === tipoPessoa) ||
            (rel.pessoa_destino_id == pessoaId && rel.tipo_destino === tipoPessoa)
        );
    } catch (error) {
        console.error('Erro ao buscar relacionamentos:', error);
        return [];
    }
}

// Estatísticas de relacionamentos
async function getEstatisticasRelacionamentos() {
    try {
        const response = await api.listarRelacionamentos();
        const relacionamentos = response.results || response;
        const tipos = {};
        
        relacionamentos.forEach(rel => {
            tipos[rel.tipo_relacionamento] = (tipos[rel.tipo_relacionamento] || 0) + 1;
        });
        
        return {
            total: relacionamentos.length,
            tipos: tipos,
            mais_comum: Object.keys(tipos).reduce((a, b) => tipos[a] > tipos[b] ? a : b, 'N/A')
        };
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        return { total: 0, tipos: {}, mais_comum: 'N/A' };
    }
}

// Buscar pessoa por GOA e destacar na árvore
async function buscarPorGOA() {
    const goaInput = document.getElementById('busca-goa');
    const resultadoDiv = document.getElementById('resultado-goa');
    
    if (!goaInput || !resultadoDiv) return;
    
    const goa = goaInput.value.trim();
    
    if (!goa) {
        resultadoDiv.innerHTML = '';
        return;
    }
    
    try {
        // Buscar em pessoas físicas
        let resultado = null;
        const pf = await api.listarPessoasFisicas(1, goa);
        const pessoasFisicas = pf.results || pf;
        
        if (pessoasFisicas && pessoasFisicas.length > 0) {
            resultado = { pessoa: pessoasFisicas[0], tipo: 'fisica' };
        } else {
            // Buscar em pessoas jurídicas
            const pj = await api.listarPessoasJuridicas(1, goa);
            const pessoasJuridicas = pj.results || pj;
            if (pessoasJuridicas && pessoasJuridicas.length > 0) {
                resultado = { pessoa: pessoasJuridicas[0], tipo: 'juridica' };
            }
        }
        
        if (resultado) {
            const pessoa = resultado.pessoa;
            const tipo = resultado.tipo;
            
            // Mostrar informações da pessoa encontrada
            resultadoDiv.innerHTML = `
                <div class="alert alert-success">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-${tipo === 'fisica' ? 'user' : 'building'} fa-2x me-3"></i>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                <strong>${tipo === 'fisica' ? pessoa.nome : pessoa.razao_social}</strong>
                                <span class="badge bg-primary ms-2">${pessoa.goa}</span>
                            </h6>
                            <small class="text-muted">
                                ${tipo === 'fisica' ? 
                                    `CPF: ${formatUtils.formatCPF(pessoa.cpf)} • ${pessoa.telefone1 || 'Sem telefone'}` : 
                                    `CNPJ: ${formatUtils.formatCNPJ(pessoa.cnpj)} • ${pessoa.situacao || 'Situação não informada'}`
                                }
                            </small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="destacarPessoaNaArvore('${tipo}_${pessoa.id}')">
                                <i class="fas fa-crosshairs me-1"></i>Destacar na Árvore
                            </button>
                            <button class="btn btn-sm btn-outline-info" onclick="verDetalhes('${resultado.table}', '${pessoa.id}')">
                                <i class="fas fa-eye me-1"></i>Ver Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Destacar automaticamente na árvore e mostrar relacionamentos
            setTimeout(() => {
                buscarPorGOAComRelacionamentos(goa);
            }, 500);
            
            updateStatusBar(`Pessoa encontrada: ${pessoa.goa} - ${tipo === 'fisica' ? pessoa.nome : pessoa.razao_social}`);
        } else {
            resultadoDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>GOA "${goa}" não encontrado</strong><br>
                    <small>Verifique se o código está correto ou cadastre a pessoa primeiro.</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao buscar por GOA:', error);
        resultadoDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-times me-2"></i>
                <strong>Erro na busca</strong><br>
                <small>Ocorreu um erro ao buscar o GOA informado.</small>
            </div>
        `;
    }
}

// Destacar pessoa específica na árvore
function destacarPessoaNaArvore(nodeId) {
    try {
        const svg = d3.select('#arvore-container svg');
        
        if (svg.empty()) {
            showNotification('Árvore não encontrada. Certifique-se de que há relacionamentos criados.', 'warning');
            return;
        }
        
        // Remover destaque anterior
        svg.selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 2);
        
        // Encontrar e destacar o nó específico
        const node = svg.selectAll('g').filter(function(d) {
            return d && d.id === nodeId;
        });
        
        if (!node.empty()) {
            // Destacar com animação
            node.select('circle')
                .attr('stroke', '#ff6b6b')
                .attr('stroke-width', 4)
                .transition()
                .duration(500)
                .attr('r', 35)
                .transition()
                .duration(500)
                .attr('r', 25);
            
            // Scroll suave até o nó (se necessário)
            const nodeData = node.datum();
            if (nodeData) {
                showNotification(`Pessoa destacada na árvore: ${nodeData.name}`, 'success');
            }
        } else {
            showNotification('Pessoa não encontrada na árvore. Verifique se possui relacionamentos criados.', 'info');
        }
    } catch (error) {
        console.error('Erro ao destacar na árvore:', error);
        showNotification('Erro ao destacar pessoa na árvore', 'error');
    }
}

// Limpar conexões automáticas
async function limparConexoesAutomaticbuscarRelacionamentosas() {
    if (!confirm('Deseja realmente limpar APENAS as conexões automáticas? As conexões manuais serão mantidas.')) {
        return;
    }
    
    try {
        // Buscar apenas relacionamentos automáticos (com campo auto_related) e deletar
        const relacionamentos = await api.get('/relacionamentos/?auto_related=true');
        for (const rel of relacionamentos) {
            await api.delete(`/relacionamentos/${rel.id}/`);
        }
        showNotification('Conexões automáticas removidas com sucesso!', 'success');
        renderizarArvore();
        loadDashboard();
        updateStatusBar('Conexões automáticas limpas');
        
    } catch (error) {
        console.error('Erro ao limpar conexões automáticas:', error);
        showNotification('Erro ao limpar conexões automáticas', 'error');
    }
}

// Limpar todas as conexões
async function limparTodasConexoes() {
    if (!confirm('⚠️ ATENÇÃO: Isso removerá TODAS as conexões da árvore (automáticas E manuais). Deseja continuar?')) {
        return;
    }
    
    // Segunda confirmação para operação crítica
    if (!confirm('Confirma a remoção TOTAL de todos os relacionamentos? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await api.listarRelacionamentos();
        const relacionamentos = response.results || response;
        const total = relacionamentos.length;
        
        if (total === 0) {
            showNotification('Não há relacionamentos para remover', 'info');
            return;
        }
        
        // Limpar tabela de relacionamentos
        for (const rel of relacionamentos) {
            await api.deletarRelacionamento(rel.id);
        }
        
        showNotification(`${total} relacionamentos removidos completamente`, 'success');
        renderizarArvore();
        loadDashboard();
        updateStatusBar(`Todas as ${total} conexões foram limpas`);
        
    } catch (error) {
        console.error('Erro ao limpar todas as conexões:', error);
        showNotification('Erro ao limpar conexões', 'error');
    }
}

// Gerar relacionamentos automáticos
async function gerarRelacionamentosAutomaticos() {
    try {
        showNotification('Analisando dados para gerar relacionamentos...', 'info');
        
        let novosRelacionamentos = 0;
        
        // Obter dados da API
        const pfResponse = await api.listarPessoasFisicas();
        const pessoasFisicas = pfResponse.results || pfResponse;
        
        const pjResponse = await api.listarPessoasJuridicas();
        const pessoasJuridicas = pjResponse.results || pjResponse;
        
        const relResponse = await api.listarRelacionamentos();
        const relacionamentosExistentes = relResponse.results || relResponse;
        
        // Analisar relacionamentos potenciais (implementação simplificada)
        // Buscar nomes/CPF comuns entre pessoas físicas
        for (let i = 0; i < pessoasFisicas.length; i++) {
            for (let j = i + 1; j < pessoasFisicas.length; j++) {
                const pf1 = pessoasFisicas[i];
                const pf2 = pessoasFisicas[j];
                
                // Verificar se já existe relacionamento
                const jaExiste = relacionamentosExistentes.some(rel => 
                    (rel.pessoa_origem_id === pf1.id && rel.pessoa_destino_id === pf2.id) ||
                    (rel.pessoa_origem_id === pf2.id && rel.pessoa_destino_id === pf1.id)
                );
                
                // Heurística: mesmo sobrenome
                if (!jaExiste && pf1.nome && pf2.nome) {
                    const sobrenome1 = pf1.nome.split(' ').pop();
                    const sobrenome2 = pf2.nome.split(' ').pop();
                    
                    if (sobrenome1.toLowerCase() === sobrenome2.toLowerCase() && sobrenome1.length > 3) {
                        await api.criarRelacionamento({
                            pessoa_origem_id: pf1.id,
                            pessoa_destino_id: pf2.id,
                            tipo_origem: 'fisica',
                            tipo_destino: 'fisica',
                            tipo_relacionamento: 'parente',
                            descricao: `Possível parentesco pelo sobrenome "${sobrenome1}"`,
                            automatico: true
                        });
                        novosRelacionamentos++;
                    }
                }
            }
        }
        
        if (novosRelacionamentos > 0) {
            showNotification(`${novosRelacionamentos} relacionamentos automáticos criados!`, 'success');
            renderizarArvore();
            loadDashboard();
        } else {
            showNotification('Nenhum novo relacionamento automático encontrado', 'info');
        }
        
        updateStatusBar(`Análise automática completada: ${novosRelacionamentos} novos relacionamentos`);
        
    } catch (error) {
        console.error('Erro ao gerar relacionamentos automáticos:', error);
        showNotification('Erro ao gerar relacionamentos automáticos', 'error');
    }
}

// Buscar pessoa por GOA com relacionamentos automáticos
async function buscarPorGOAComRelacionamentos(goa) {
    // Buscar em pessoas físicas
    let resultado = null;
    const pf = await api.listarPessoasFisicas(1, goa);
    const pessoasFisicas = pf.results || pf;
    
    if (pessoasFisicas && pessoasFisicas.length > 0) {
        resultado = { pessoa: pessoasFisicas[0], tipo: 'fisica' };
    } else {
        // Buscar em pessoas jurídicas
        const pj = await api.listarPessoasJuridicas(1, goa);
        const pessoasJuridicas = pj.results || pj;
        if (pessoasJuridicas && pessoasJuridicas.length > 0) {
            resultado = { pessoa: pessoasJuridicas[0], tipo: 'juridica' };
        }
    }
    
    if (resultado) {
        // Destacar na árvore
        destacarPessoaNaArvore(`${resultado.tipo}_${resultado.pessoa.id}`);
        
        // Mostrar relacionamentos da API
        const relResponse = await api.listarRelacionamentos();
        const relacionamentos = relResponse.results || relResponse;
        const relacionamentosAuto = relacionamentos.filter(rel => 
            (rel.pessoa_origem_id === resultado.pessoa.id && rel.tipo_origem === resultado.tipo) ||
            (rel.pessoa_destino_id === resultado.pessoa.id && rel.tipo_destino === resultado.tipo)
        );
        
        if (relacionamentosAuto.length > 0) {
            let detalhesRelacionamentos = '<div class="mt-3"><h6>Relacionamentos Detectados:</h6><ul class="list-unstyled">';
            
            relacionamentosAuto.forEach(rel => {
                const pessoa = rel.tipo_destino === 'fisica' ? rel.pessoa_destino_nome : rel.pessoa_destino_razao_social;
                const confianca = rel.confianca || 100;
                const corBadge = confianca >= 90 ? 'success' : confianca >= 70 ? 'warning' : 'info';
                
                detalhesRelacionamentos += `
                    <li class="mb-2">
                        <span class="badge bg-${corBadge}">${confianca}%</span>
                        <strong>${rel.tipo_relacionamento}</strong>: ${pessoa}
                        <br><small class="text-muted">${rel.descricao}</small>
                    </li>
                `;
            });
            
            detalhesRelacionamentos += '</ul></div>';
            
            // Adicionar aos resultados do GOA
            const resultadoDiv = document.getElementById('resultado-goa');
            if (resultadoDiv) {
                resultadoDiv.innerHTML += detalhesRelacionamentos;
            }
        }
    }
}

// Obter cor do relacionamento
function getRelationshipColor(tipo) {
    const cores = {
        'pai': '#dc3545',      // Vermelho para pai
        'mae': '#e83e8c',      // Rosa para mãe  
        'irmao': '#fd7e14',    // Laranja para irmão
        'parente': '#ffc107',  // Amarelo para parente
        'socio': '#28a745',    // Verde para sócio
        'empresarial': '#17a2b8', // Azul para empresarial
        'profissional': '#6f42c1', // Roxo para profissional
        'familiar': '#20c997'   // Verde claro para familiar genérico
    };
    
    return cores[tipo] || '#6c757d'; // Cinza para outros
}

// Obter largura da linha do relacionamento
function getRelationshipWidth(tipo) {
    const larguras = {
        'pai': 3,
        'mae': 3,
        'irmao': 2.5,
        'socio': 2.5,
        'empresarial': 2,
        'parente': 1.5
    };
    
    return larguras[tipo] || 2;
}

// Obter label do relacionamento
function getRelationshipLabel(tipo) {
    const labels = {
        'pai': '👨 PAI',
        'mae': '👩 MÃE', 
        'irmao': '👦 IRMÃO',
        'filho': '👶 FILHO',
        'parente': '👥 PARENTE',
        'socio': '🤝 SÓCIO',
        'empresarial': '🏢 EMPRESA',
        'profissional': '💼 TRABALHO',
        'familiar': '👪 FAMÍLIA',
        'conjuge': '💑 CÔNJUGE',
        'endereco': '🏠 ENDEREÇO',
        'telefone': '📞 TELEFONE'
    };
    
    return labels[tipo] || `🔗 ${tipo.toUpperCase()}`;
}

// Exportar relacionamentos
async function exportarRelacionamentos() {
    try {
        const response = await api.listarRelacionamentos();
        const relacionamentos = response.results || response;
        let lista = 'LISTA DE RELACIONAMENTOS\n';
        lista += '========================\n\n';

        relacionamentos.forEach((rel, index) => {
            const origemInfo = obterInfoPessoa(rel.pessoa_origem_id, rel.tipo_origem);
            const destinoInfo = obterInfoPessoa(rel.pessoa_destino_id, rel.tipo_destino);
            
            lista += `${index + 1}. ${origemInfo.nome} → ${destinoInfo.nome}\n`;
            lista += `   Tipo: ${rel.tipo_relacionamento}\n`;
            lista += `   Origem: ${origemInfo.documento} (${rel.tipo_origem === 'fisica' ? 'PF' : 'PJ'})\n`;
            lista += `   Destino: ${destinoInfo.documento} (${rel.tipo_destino === 'fisica' ? 'PF' : 'PJ'})\n`;
            lista += `   Descrição: ${rel.descricao || 'Sem descrição'}\n\n`;
        });

        // Criar arquivo para download
        const blob = new Blob([lista], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `relacionamentos_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showNotification('Lista de relacionamentos exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar relacionamentos:', error);
        showNotification('Erro ao exportar relacionamentos', 'error');
    }
}

// NOVA FUNÇÃO: Analisar todos os dados automaticamente
function analisarTodosOsDados() {
    // Confirmação com o usuário
    if (!confirm('🧠 Esta função irá analisar TODOS os dados cadastrados e criar relacionamentos automáticos baseados em:\n\n' +
                 '• Relações familiares (pai, mãe, irmãos, sobrenomes)\n' +
                 '• Vínculos empresariais (mesmo CNPJ, sócios)\n' +
                 '• Endereços similares\n' +
                 '• Telefones compartilhados\n\n' +
                 'Os relacionamentos automáticos existentes serão substituídos. Continuar?')) {
        return;
    }
    
    try {
        showNotification('🔍 Iniciando análise automática completa...', 'info');
        
        // Mostrar indicador de progresso
        const progressContainer = document.createElement('div');
        progressContainer.innerHTML = `
            <div class="alert alert-info d-flex align-items-center" id="progress-analise">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>Analisando todos os dados cadastrados... Isso pode levar alguns segundos.</span>
            </div>
        `;
        
        const arvoreContainer = document.getElementById('arvore-container');
        arvoreContainer.insertBefore(progressContainer, arvoreContainer.firstChild);
        
        // Executar análise automática (com pequeno delay para UI)
        setTimeout(async () => {
            // Análise simplificada: chamar função que já foi migrada
            await gerarRelacionamentosAutomaticos();
            
            // Remover indicador de progresso
            const progressElement = document.getElementById('progress-analise');
            if (progressElement) {
                progressElement.parentElement.remove();
            }
            
            // Atualizar árvore
            renderizarArvore();
            loadDashboard();
            updateStatusBar(`Análise automática completada`);
        }, 500);
        
    } catch (error) {
        console.error('Erro ao executar análise automática:', error);
        showNotification('Erro ao executar análise automática', 'error');
        
        // Remover indicador de progresso em caso de erro
        const progressElement = document.getElementById('progress-analise');
        if (progressElement) {
            progressElement.parentElement.remove();
        }
    }
}

// Mostrar resumo da análise
function mostrarResumoAnalise(relacionamentos) {
    const tipos = {};
    
    relacionamentos.forEach(rel => {
        if (!tipos[rel.tipo]) {
            tipos[rel.tipo] = 0;
        }
        tipos[rel.tipo]++;
    });
    
    let resumoHtml = '<h6>📊 Resumo da Análise Automática:</h6><ul class="list-unstyled">';
    
    Object.entries(tipos).forEach(([tipo, quantidade]) => {
        const icone = getTipoIcon(tipo);
        const label = getTipoLabel(tipo);
        resumoHtml += `<li><span class="badge bg-primary me-2">${quantidade}</span>${icone} ${label}</li>`;
    });
    
    resumoHtml += '</ul>';
    
    // Mostrar modal com resumo
    const modalEl = document.getElementById('modalDetalhes');
    const existingModal = bootstrap.Modal.getInstance(modalEl);
    if (existingModal) {
        existingModal.hide();
    }
    
    setTimeout(() => {
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
        
        modalTitle.innerHTML = '<i class="fas fa-brain me-2"></i>Resultado da Análise Automática';
        modalBody.innerHTML = `
            <div class="text-center mb-3">
                <h5>✅ Análise Completa Finalizada</h5>
                <p class="text-muted">Todos os dados foram processados e os relacionamentos foram identificados automaticamente.</p>
            </div>
            ${resumoHtml}
            <div class="text-center mt-4">
                <button class="btn btn-primary" onclick="fecharModal()">
                    <i class="fas fa-check me-1"></i>Entendi
                </button>
            </div>
        `;
        
        // Usar sistema robusto de modal
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.show();
        } else {
            modalInstance = new bootstrap.Modal(modalEl);
            modalInstance.show();
        }
    }, 100);
}

// Funções auxiliares para o resumo
function getTipoIcon(tipo) {
    const icons = {
        'pai': '<i class="fas fa-male text-blue"></i>',
        'mae': '<i class="fas fa-female text-pink"></i>',
        'irmao': '<i class="fas fa-user-friends text-green"></i>',
        'parente': '<i class="fas fa-users text-purple"></i>',
        'empresarial': '<i class="fas fa-building text-orange"></i>',
        'socio': '<i class="fas fa-handshake text-brown"></i>',
        'endereco': '<i class="fas fa-map-marker-alt text-red"></i>',
        'telefone': '<i class="fas fa-phone text-cyan"></i>'
    };
    return icons[tipo] || '<i class="fas fa-link"></i>';
}

function getTipoLabel(tipo) {
    const labels = {
        'pai': 'Relacionamentos Paterno',
        'mae': 'Relacionamentos Materno',
        'irmao': 'Relacionamentos Fraterno',
        'parente': 'Relacionamentos de Parentesco',
        'empresarial': 'Vínculos Empresariais',
        'socio': 'Sociedades/Parcerias',
        'endereco': 'Mesmo Endereço',
        'telefone': 'Telefones Compartilhados'
    };
    return labels[tipo] || 'Outros Relacionamentos';
}

// SISTEMA DE EXPANSÃO DE VÍNCULOS - SEMPRE EXPANDIDO
let vinculosExpandidos = new Set(); // Armazena IDs dos nós expandidos
let modoExpansaoCompleta = true; // SEMPRE TRUE - Mostrar todas as ligações

// Expandir todos os vínculos (agora sempre ativo)
function expandirTodosVinculos() {
    showNotification('📈 Todas as ligações já estão sempre visíveis!', 'info');
    
    // Forçar re-renderização para garantir que tudo está visível
    modoExpansaoCompleta = true;
    renderizarArvore();
}

// Recolher todos os vínculos (desabilitado - sempre expandido agora)
function recolherTodosVinculos() {
    showNotification('📌 Sistema configurado para sempre mostrar todas as ligações. Use os botões individuais para criar novas ligações.', 'info');
}

// Alternar expansão de vínculo específico (ao clicar no nó)
function toggleVinculoNode(pessoaId, tipoPessoa) {
    const nodeId = `${tipoPessoa}_${pessoaId}`;
    
    if (vinculosExpandidos.has(nodeId)) {
        vinculosExpandidos.delete(nodeId);
        showNotification(`📉 Vínculos recolhidos`, 'info');
    } else {
        vinculosExpandidos.add(nodeId);
        showNotification(`📈 Vínculos expandidos`, 'info');
    }
    
    renderizarArvore();
}

// Verificar se um nó deve mostrar vínculos expandidos
function deveExpandirVinculos(pessoaId, tipoPessoa) {
    const nodeId = `${tipoPessoa}_${pessoaId}`;
    return modoExpansaoCompleta || vinculosExpandidos.has(nodeId);
}

// Obter relacionamentos expandidos para uma pessoa
async function obterRelacionamentosExpandidos(pessoaId, tipoPessoa) {
    if (!deveExpandirVinculos(pessoaId, tipoPessoa)) {
        return [];
    }
    
    const response = await api.listarRelacionamentos();
    const relacionamentos = response.results || response;
    const relacionamentosExpandidos = [];
    
    relacionamentos.forEach(rel => {
        if ((rel.pessoa_origem_id == pessoaId && rel.tipo_origem === tipoPessoa) ||
            (rel.pessoa_destino_id == pessoaId && rel.tipo_destino === tipoPessoa)) {
            
            // Adicionar informações do relacionamento expandido
            relacionamentosExpandidos.push({
                id: rel.id,
                tipo: rel.tipo_relacionamento,
                descricao: rel.descricao,
                confianca: rel.confianca || 100,
                automatico: rel.automatico || false,
                origem: {
                    id: rel.pessoa_origem_id,
                    tipo: rel.tipo_origem
                },
                destino: {
                    id: rel.pessoa_destino_id,
                    tipo: rel.tipo_destino
                }
            });
        }
    });
    
    return relacionamentosExpandidos;
}

// SISTEMA DE BUSCA AVANÇADA NA ÁRVORE
async function buscarPessoaNaArvore() {
    const termo = document.getElementById('busca-arvore').value.trim();
    const resultadosDiv = document.getElementById('resultados-busca-arvore');
    
    if (!termo) {
        resultadosDiv.innerHTML = '<div class="alert alert-info">Digite algo para buscar</div>';
        return;
    }
    
    if (termo.length < 2) {
        resultadosDiv.innerHTML = '<div class="alert alert-warning">Digite pelo menos 2 caracteres</div>';
        return;
    }
    
    // Mostrar loading
    resultadosDiv.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Buscando...</div>';
    
    // Buscar em pessoas físicas e jurídicas
    const pfResponse = await api.listarPessoasFisicas();
    const pessoasFisicas = pfResponse.results || pfResponse;
    
    const pjResponse = await api.listarPessoasJuridicas();
    const pessoasJuridicas = pjResponse.results || pjResponse;
    
    const resultados = [];
    
    // Buscar em pessoas físicas
    pessoasFisicas.forEach(pessoa => {
        if (matchPessoaFisica(pessoa, termo)) {
            resultados.push({
                pessoa: pessoa,
                tipo: 'fisica',
                table: 'pessoa_fisica'
            });
        }
    });
    
    // Buscar em pessoas jurídicas
    pessoasJuridicas.forEach(pessoa => {
        if (matchPessoaJuridica(pessoa, termo)) {
            resultados.push({
                pessoa: pessoa,
                tipo: 'juridica',
                table: 'pessoa_juridica'
            });
        }
    });
    
    // Mostrar resultados
    setTimeout(() => {
        mostrarResultadosBusca(resultados, termo);
        atualizarEstatisticasArvore();
    }, 500);
}

// Verificar match em pessoa física
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

// Verificar match em pessoa jurídica
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

// Mostrar resultados da busca
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
            ${resultados.length} pessoa(s) encontrada(s) para "<strong>${termo}</strong>"
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
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <strong>GOA:</strong> ${pessoa.goa || 'Não definido'}<br>
                                    <strong>${tipo === 'fisica' ? 'CPF' : 'CNPJ'}:</strong> 
                                    ${tipo === 'fisica' 
                                        ? (formatUtils.formatCPF(pessoa.cpf) || '-')
                                        : (formatUtils.formatCNPJ(pessoa.cnpj) || '-')
                                    }
                                </small>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">
                                    ${tipo === 'fisica' 
                                        ? `<strong>Ocupação:</strong> ${pessoa.ocupacao || '-'}<br><strong>Telefone:</strong> ${formatUtils.formatPhone(pessoa.telefone1) || '-'}`
                                        : `<strong>Cidade:</strong> ${pessoa.cidade || '-'}<br><strong>Telefone:</strong> ${formatUtils.formatPhone(pessoa.telefone1) || '-'}`
                                    }
                                </small>
                            </div>
                        </div>
                    </div>
                    <span class="badge bg-${tipo === 'fisica' ? 'info' : 'success'} rounded-pill">
                        ${tipo === 'fisica' ? 'PF' : 'PJ'}
                    </span>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-primary me-2" onclick="verDetalhes('${resultado.table}', '${pessoa.id}')">
                        <i class="fas fa-eye me-1"></i>Ver Detalhes
                    </button>
                    <button class="btn btn-sm btn-info me-2" onclick="localizarEExpandirNaArvore('${pessoa.id}', '${tipo}')">
                        <i class="fas fa-crosshairs me-1"></i>Localizar na Árvore
                    </button>
                    <button class="btn btn-sm btn-success" onclick="localizarEExpandirNaArvore('${pessoa.id}', '${tipo}')">
                        <i class="fas fa-link me-1"></i>Criar Ligações
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultadosDiv.innerHTML = html;
}

// Atualizar estatísticas da árvore
async function atualizarEstatisticasArvore() {
    const pfResponse = await api.listarPessoasFisicas();
    const pessoasFisicas = pfResponse.results || pfResponse;
    
    const pjResponse = await api.listarPessoasJuridicas();
    const pessoasJuridicas = pjResponse.results || pjResponse;
    
    const relResponse = await api.listarRelacionamentos();
    const relacionamentos = relResponse.results || relResponse;
    
    const totalPessoas = pessoasFisicas.length + pessoasJuridicas.length;
    const totalRelacionamentos = relacionamentos.length;
    
    document.getElementById('total-pessoas-arvore').textContent = totalPessoas;
    document.getElementById('total-relacionamentos-arvore').textContent = totalRelacionamentos;
}

// Localizar e expandir automaticamente na árvore
function localizarEExpandirNaArvore(pessoaId, tipoPessoa) {
    try {
        console.log('🎯 Localizando e criando ligações automáticas para:', pessoaId, tipoPessoa);
        
        // 1. Criar relacionamentos automáticos para esta pessoa específica
        const novosRelacionamentos = criarRelacionamentosParaPessoa(pessoaId, tipoPessoa);
        
        // 2. Expandir vínculos da pessoa
        const nodeId = `${tipoPessoa}_${pessoaId}`;
        if (!vinculosExpandidos.has(nodeId)) {
            vinculosExpandidos.add(nodeId);
        }
        
        // 3. Forçar modo de expansão completa temporariamente
        modoExpansaoCompleta = true;
        
        // 4. Regenerar árvore com vínculos expandidos
        renderizarArvore();
        
        // 5. Aguardar renderização e destacar o nó
        setTimeout(() => {
            destacarPessoaNaArvore(nodeId);
        }, 1000);
        
        // 6. Mostrar resultado
        if (novosRelacionamentos > 0) {
            showNotification(`📈 ${novosRelacionamentos} nova(s) ligação(ões) criada(s) automaticamente!`, 'success');
        } else {
            showNotification('📈 Vínculos expandidos! (Nenhuma nova ligação encontrada)', 'info');
        }
        
        // 7. Atualizar estatísticas
        atualizarEstatisticasArvore();
        
    } catch (error) {
        console.error('❌ Erro ao localizar e expandir na árvore:', error);
        showNotification('Erro ao localizar pessoa na árvore', 'error');
    }
}

// Função melhorada de busca por GOA na árvore
async function buscarPorGOANaArvore(goa) {
    try {
        console.log('🔍 Buscando GOA na árvore:', goa);
        
        // Buscar pessoa pelo GOA
        const pfResponse = await api.listarPessoasFisicas(1, goa);
        const pessoasFisicas = pfResponse.results || pfResponse;
        
        const pjResponse = await api.listarPessoasJuridicas(1, goa);
        const pessoasJuridicas = pjResponse.results || pjResponse;
        
        let pessoaEncontrada = null;
        let tipoPessoa = null;
        
        // Buscar em pessoas físicas
        for (let pessoa of pessoasFisicas) {
            if (pessoa.goa && pessoa.goa.toUpperCase() === goa.toUpperCase()) {
                pessoaEncontrada = pessoa;
                tipoPessoa = 'fisica';
                break;
            }
        }
        
        // Se não encontrou, buscar em pessoas jurídicas
        if (!pessoaEncontrada) {
            for (let pessoa of pessoasJuridicas) {
                if (pessoa.goa && pessoa.goa.toUpperCase() === goa.toUpperCase()) {
                    pessoaEncontrada = pessoa;
                    tipoPessoa = 'juridica';
                    break;
                }
            }
        }
        
        if (pessoaEncontrada) {
            // Localizar e expandir automaticamente
            localizarEExpandirNaArvore(pessoaEncontrada.id, tipoPessoa);
            showNotification(`✅ GOA encontrado: ${pessoaEncontrada.nome || pessoaEncontrada.razao_social}`, 'success');
        } else {
            showNotification(`❌ GOA "${goa}" não encontrado`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao buscar GOA na árvore:', error);
        showNotification('Erro na busca por GOA', 'error');
    }
}

// Função para buscar e expandir automaticamente por GOA
function buscarEExpandirPorGOA() {
    const goa = document.getElementById('busca-goa').value.trim();
    if (!goa) {
        showNotification('Por favor, digite um GOA para buscar', 'warning');
        return;
    }
    
    showNotification('🔍 Buscando e expandindo vínculos...', 'info');
    buscarPorGOANaArvore(goa);
}

// Event listener para busca com Enter
document.addEventListener('DOMContentLoaded', function() {
    const buscaInput = document.getElementById('busca-arvore');
    if (buscaInput) {
        buscaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarPessoaNaArvore();
            }
        });
    }
});

// Função para alternar tela cheia
let telaCheia = false;

function toggleTelaCheia() {
    const container = document.getElementById('arvore-container');
    const card = container.closest('.card');
    const botao = document.querySelector('button[onclick="toggleTelaCheia()"]');
    
    if (!telaCheia) {
        // Entrar em tela cheia
        telaCheia = true;
        
        // Estilos para tela cheia
        card.style.position = 'fixed';
        card.style.top = '0';
        card.style.left = '0';
        card.style.width = '100vw';
        card.style.height = '100vh';
        card.style.zIndex = '9999';
        card.style.margin = '0';
        card.style.borderRadius = '0';
        
        container.style.height = 'calc(100vh - 120px)';
        container.style.border = 'none';
        
        // Atualizar botão
        botao.innerHTML = '<i class="fas fa-compress me-1"></i>Sair Tela Cheia';
        botao.title = 'Sair da tela cheia';
        
        // Adicionar ESC listener
        document.addEventListener('keydown', escapeTelaCheia);
        
        // Re-renderizar árvore para novo tamanho
        setTimeout(() => {
            renderizarArvore();
        }, 300);
        
        showNotification('🖥️ Árvore expandida para tela cheia! Pressione ESC para sair.', 'info');
        
    } else {
        // Sair da tela cheia
        sairTelaCheia();
    }
}

function sairTelaCheia() {
    const container = document.getElementById('arvore-container');
    const card = container.closest('.card');
    const botao = document.querySelector('button[onclick="toggleTelaCheia()"]');
    
    telaCheia = false;
    
    // Remover estilos de tela cheia
    card.style.position = '';
    card.style.top = '';
    card.style.left = '';
    card.style.width = '';
    card.style.height = '';
    card.style.zIndex = '';
    card.style.margin = '';
    card.style.borderRadius = '';
    
    container.style.height = '600px';
    container.style.border = '1px solid #ddd';
    
    // Atualizar botão
    if (botao) {
        botao.innerHTML = '<i class="fas fa-expand me-1"></i>Tela Cheia';
        botao.title = 'Expandir árvore para tela cheia';
    }
    
    // Remover ESC listener
    document.removeEventListener('keydown', escapeTelaCheia);
    
    // Re-renderizar árvore para novo tamanho
    setTimeout(() => {
        renderizarArvore();
    }, 300);
    
    showNotification('📺 Árvore retornada ao tamanho normal', 'info');
}

// Função para sair com ESC
function escapeTelaCheia(event) {
    if (event.key === 'Escape' && telaCheia) {
        sairTelaCheia();
    }
}

// Melhorar a função de renderização para sempre mostrar todos os vínculos
function inicializarArvoreExpandida() {
    // Forçar modo de expansão completa sempre ativo
    modoExpansaoCompleta = true;
    
    // Limpar controles antigos
    vinculosExpandidos.clear();
    
    // Criar relacionamentos automáticos na inicialização
    criarRelacionamentosAutomaticosFamilia();
    
    // Renderizar árvore
    renderizarArvore();
    
    console.log('🌳 Árvore inicializada com TODAS as ligações sempre visíveis');
    showNotification('🌳 Árvore carregada com todas as ligações visíveis!', 'success');
}
