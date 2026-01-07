/**
 * Sistema de Interface Interativa
 * Implementa controles avançados, menu contextual e interações do usuário
 */

class InterfaceManager {
    constructor() {
        this.menuAtivo = null;
        this.noSelecionado = null;
        this.dragAtivo = false;
        this.zoomAtual = 1;
        this.modoEdicao = false;
        
        console.log('🖱️ InterfaceManager inicializado');
    }
    
    // ✅ Função do plano: mostrarMenuNoSimples() - menu contextual completo
    mostrarMenuNoSimples(no, event) {
        console.log(`📋 Mostrando menu para: ${no.nome || no.razao_social}`);
        
        // Fechar menu anterior se existir
        this.esconderMenu();
        
        const menu = document.createElement('div');
        menu.className = 'menu-no-contexto';
        menu.style.cssText = `
            position: fixed;
            left: ${event.pageX + 10}px;
            top: ${event.pageY - 10}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 200px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        `;
        
        // Opções do menu conforme especificado no plano
        const opcoes = [
            { 
                icone: '👁️', 
                texto: 'Ver Detalhes', 
                acao: () => this.verDetalhes(no),
                classe: 'menu-item'
            },
            { 
                icone: '🔗', 
                texto: 'Criar Novo Vínculo', 
                acao: () => this.criarNovoVinculoSimples(no),
                classe: 'menu-item'
            },
            { 
                icone: '📷', 
                texto: 'Adicionar Foto', 
                acao: () => this.adicionarFotoSimples(no),
                classe: 'menu-item'
            },
            { 
                icone: '🎨', 
                texto: 'Personalizar Cor', 
                acao: () => this.personalizarCorSimples(no),
                classe: 'menu-item'
            },
            { 
                icone: '➕', 
                texto: 'Expandir Vínculos', 
                acao: () => this.toggleExpansaoNoSimples(no),
                classe: 'menu-item'
            },
            { 
                icone: '🔄', 
                texto: 'Criar Vínculos Automáticos', 
                acao: () => this.criarVinculosAutomaticos(no),
                classe: 'menu-item'
            },
            { 
                icone: '❌', 
                texto: 'Remover da Árvore', 
                acao: () => this.removerVinculosPessoa(no),
                classe: 'menu-item menu-item-danger'
            }
        ];
        
        // Criar HTML do menu
        menu.innerHTML = opcoes.map(opcao => `
            <div class="${opcao.classe}" data-acao="${opcao.texto}">
                <span class="menu-icone">${opcao.icone}</span>
                <span class="menu-texto">${opcao.texto}</span>
            </div>
        `).join('');
        
        // CSS interno para o menu
        const style = document.createElement('style');
        style.textContent = `
            .menu-item {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
            }
            .menu-item:hover {
                background-color: #f8f9fa;
            }
            .menu-item:last-child {
                border-bottom: none;
            }
            .menu-item-danger {
                color: #dc3545;
            }
            .menu-item-danger:hover {
                background-color: #fff5f5;
            }
            .menu-icone {
                font-size: 16px;
                width: 20px;
                text-align: center;
            }
            .menu-texto {
                font-size: 14px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
        
        // Event listeners para cada opção
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.menu-item');
            if (item) {
                const opcao = opcoes.find(o => o.texto === item.dataset.acao);
                if (opcao) {
                    opcao.acao();
                    this.esconderMenu();
                }
            }
        });
        
        // Adicionar ao DOM
        document.body.appendChild(menu);
        this.menuAtivo = menu;
        
        // Fechar ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', this.esconderMenu.bind(this), { once: true });
        }, 100);
    }
    
    // ✅ Função do plano: toggleExpansaoNoSimples()
    async toggleExpansaoNoSimples(no) {
        const nodeId = `${no.tipo}_${no.id}`;
        
        console.log(`🔄 Toggle expansão para: ${no.nome || no.razao_social}`);
        
        // Verificar estado atual
        if (window.nosExpandidos && window.nosExpandidos.has(nodeId)) {
            // Recolher vínculos
            window.nosExpandidos.delete(nodeId);
            showNotification(`📁 Vínculos de ${no.nome || no.razao_social} recolhidos`, 'info');
        } else {
            // Expandir vínculos
            if (!window.nosExpandidos) window.nosExpandidos = new Set();
            window.nosExpandidos.add(nodeId);
            
            // Carregar relacionamentos automáticos se necessário
            console.log(`🔗 Carregando relacionamentos para ${no.nome || no.razao_social}...`);
            const novosRelacionamentos = await window.RelacionamentoManager.criarRelacionamentosParaPessoa(no.id, no.tipo);
            
            if (novosRelacionamentos > 0) {
                showNotification(`📂 ${novosRelacionamentos} novos vínculos encontrados para ${no.nome || no.razao_social}!`, 'success');
            } else {
                showNotification(`📂 Vínculos de ${no.nome || no.razao_social} expandidos`, 'info');
            }
        }
        
        // Re-renderizar árvore
        if (window.ArvoreCore) {
            await window.ArvoreCore.renderizarArvoreInterativa();
        } else if (typeof renderizarArvoreInterativa === 'function') {
            await renderizarArvoreInterativa();
        }
    }
    
    // ✅ Função do plano: criarNovoVinculoSimples()
    async criarNovoVinculoSimples(no) {
        console.log(`🔗 Criando novo vínculo para: ${no.nome || no.razao_social}`);
        
        try {
            // Criar modal de busca de pessoa destino
            const modal = await this.criarModalBuscaPessoa(no);
            
            // Mostrar modal
            document.body.appendChild(modal);
            
            // Focar no campo de busca
            const campoBusca = modal.querySelector('.busca-pessoa-input');
            if (campoBusca) {
                campoBusca.focus();
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar modal de vínculo:', error);
            showNotification('❌ Erro ao abrir formulário de vínculo', 'error');
        }
    }
    
    // ✅ Função do plano: personalizarCorSimples()
    personalizarCorSimples(no) {
        console.log(`🎨 Personalizando cor para: ${no.nome || no.razao_social}`);
        
        const modal = document.createElement('div');
        modal.className = 'modal-personalizar-cor';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
                <h4>🎨 Personalizar Cor - ${no.nome || no.razao_social}</h4>
                
                <div style="margin: 15px 0;">
                    <label>Cor do nó:</label>
                    <input type="color" id="cor-no" value="#4facfe" style="width: 100%; height: 40px; margin-top: 5px;">
                </div>
                
                <div style="margin: 15px 0;">
                    <label>Cores predefinidas:</label>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <div class="cor-preset" data-cor="#4facfe" style="width: 30px; height: 30px; background: #4facfe; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        <div class="cor-preset" data-cor="#43e97b" style="width: 30px; height: 30px; background: #43e97b; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        <div class="cor-preset" data-cor="#ff6b6b" style="width: 30px; height: 30px; background: #ff6b6b; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        <div class="cor-preset" data-cor="#feca57" style="width: 30px; height: 30px; background: #feca57; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        <div class="cor-preset" data-cor="#8c7ae6" style="width: 30px; height: 30px; background: #8c7ae6; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                        <div class="cor-preset" data-cor="#00d2d3" style="width: 30px; height: 30px; background: #00d2d3; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button id="cancelar-cor" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancelar</button>
                    <button id="aplicar-cor" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Aplicar</button>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.querySelector('#cancelar-cor').addEventListener('click', () => modal.remove());
        modal.querySelector('#aplicar-cor').addEventListener('click', () => {
            const cor = modal.querySelector('#cor-no').value;
            this.aplicarCorPersonalizadaNo(no, cor);
            modal.remove();
        });
        
        // Cores predefinidas
        modal.querySelectorAll('.cor-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const cor = preset.dataset.cor;
                modal.querySelector('#cor-no').value = cor;
            });
        });
        
        document.body.appendChild(modal);
    }
    
    // ✅ Função do plano: adicionarFotoSimples()
    adicionarFotoSimples(no) {
        console.log(`📷 Adicionando foto para: ${no.nome || no.razao_social}`);
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.processarFotoNo(no, event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        
        input.click();
    }
    
    // ✅ Função do plano: adicionarNovaPessoa()
    adicionarNovaPessoa(pessoaBase = {}) {
        console.log('👤 Abrindo formulário para nova pessoa...');
        
        const modal = document.createElement('div');
        modal.className = 'modal-nova-pessoa';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; width: 400px; max-height: 80vh; overflow-y: auto;">
                <h4>👤 Adicionar Nova Pessoa</h4>
                
                <div style="margin: 15px 0;">
                    <label>Tipo:</label>
                    <select id="tipo-pessoa" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="fisica">Pessoa Física</option>
                        <option value="juridica">Pessoa Jurídica</option>
                    </select>
                </div>
                
                <div id="campos-pessoa-fisica">
                    <div style="margin: 15px 0;">
                        <label>Nome completo:</label>
                        <input type="text" id="nome" style="width: 100%; padding: 8px; margin-top: 5px;" 
                               placeholder="Nome completo da pessoa" value="${pessoaBase.nome || ''}">
                    </div>
                    <div style="margin: 15px 0;">
                        <label>CPF:</label>
                        <input type="text" id="cpf" style="width: 100%; padding: 8px; margin-top: 5px;" 
                               placeholder="000.000.000-00" maxlength="14">
                    </div>
                </div>
                
                <div id="campos-pessoa-juridica" style="display: none;">
                    <div style="margin: 15px 0;">
                        <label>Razão Social:</label>
                        <input type="text" id="razao-social" style="width: 100%; padding: 8px; margin-top: 5px;" 
                               placeholder="Razão social da empresa">
                    </div>
                    <div style="margin: 15px 0;">
                        <label>CNPJ:</label>
                        <input type="text" id="cnpj" style="width: 100%; padding: 8px; margin-top: 5px;" 
                               placeholder="00.000.000/0000-00" maxlength="18">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button id="cancelar-pessoa" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancelar</button>
                    <button id="salvar-pessoa" style="padding: 8px 16px; border: none; background: #28a745; color: white; border-radius: 4px; cursor: pointer;">Salvar</button>
                </div>
            </div>
        `;
        
        // Event listeners
        const tipoPessoa = modal.querySelector('#tipo-pessoa');
        const camposFisica = modal.querySelector('#campos-pessoa-fisica');
        const camposJuridica = modal.querySelector('#campos-pessoa-juridica');
        
        tipoPessoa.addEventListener('change', () => {
            if (tipoPessoa.value === 'fisica') {
                camposFisica.style.display = 'block';
                camposJuridica.style.display = 'none';
            } else {
                camposFisica.style.display = 'none';
                camposJuridica.style.display = 'block';
            }
        });
        
        modal.querySelector('#cancelar-pessoa').addEventListener('click', () => modal.remove());
        modal.querySelector('#salvar-pessoa').addEventListener('click', () => {
            this.salvarNovaPessoa(modal);
        });
        
        document.body.appendChild(modal);
    }
    
    // ✅ Função do plano: removerVinculosPessoa()
    async removerVinculosPessoa(pessoa) {
        const confirmacao = confirm(`❌ Tem certeza que deseja remover "${pessoa.nome || pessoa.razao_social}" e todos os seus vínculos da árvore?`);
        
        if (!confirmacao) return;
        
        console.log(`🗑️ Removendo vínculos de: ${pessoa.nome || pessoa.razao_social}`);
        
        try {
            // Obter relacionamentos da pessoa
            const relacionamentos = await window.DataCache.getRelacionamentos();
            const relacionamentosPessoa = relacionamentos.filter(rel => 
                (rel.pessoa_origem_id == pessoa.id && rel.tipo_origem === pessoa.tipo) ||
                (rel.pessoa_destino_id == pessoa.id && rel.tipo_destino === pessoa.tipo)
            );
            
            console.log(`🔗 Encontrados ${relacionamentosPessoa.length} relacionamentos para remover`);
            
            // Remover relacionamentos
            let removidos = 0;
            for (const rel of relacionamentosPessoa) {
                try {
                    await api.deletarRelacionamento(rel.id);
                    removidos++;
                } catch (error) {
                    console.error(`❌ Erro ao remover relacionamento ${rel.id}:`, error);
                }
            }
            
            // Invalidar cache
            window.DataCache.invalidateRelacionamentos();
            
            showNotification(`✅ ${removidos} vínculos removidos para ${pessoa.nome || pessoa.razao_social}`, 'success');
            
            // Re-renderizar árvore
            if (window.ArvoreCore) {
                await window.ArvoreCore.renderizarArvoreInterativa();
            }
            
        } catch (error) {
            console.error('❌ Erro ao remover vínculos:', error);
            showNotification('❌ Erro ao remover vínculos da pessoa', 'error');
        }
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    esconderMenu() {
        if (this.menuAtivo) {
            this.menuAtivo.remove();
            this.menuAtivo = null;
        }
    }
    
    async criarModalBuscaPessoa(noPrincipal) {
        const modal = document.createElement('div');
        modal.className = 'modal-busca-pessoa';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; width: 500px; max-height: 600px;">
                <h4>🔗 Criar Vínculo para ${noPrincipal.nome || noPrincipal.razao_social}</h4>
                
                <div style="margin: 15px 0;">
                    <label>Buscar pessoa destino:</label>
                    <input type="text" class="busca-pessoa-input" 
                           style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;"
                           placeholder="Digite nome, CPF, CNPJ ou GOA...">
                </div>
                
                <div id="resultados-busca-modal" style="max-height: 200px; overflow-y: auto; margin: 15px 0;"></div>
                
                <div id="form-relacionamento" style="display: none;">
                    <div style="margin: 15px 0;">
                        <label>Tipo de relacionamento:</label>
                        <select id="tipo-relacionamento" style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="parente">👥 Parente</option>
                            <option value="pai">👨 Pai</option>
                            <option value="mae">👩 Mãe</option>
                            <option value="irmao">👦 Irmão(ã)</option>
                            <option value="filho">👶 Filho(a)</option>
                            <option value="socio">🤝 Sócio</option>
                            <option value="endereco">🏠 Mesmo Endereço</option>
                            <option value="telefone">📞 Mesmo Telefone</option>
                            <option value="outros">🔗 Outro</option>
                        </select>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label>Descrição (opcional):</label>
                        <textarea id="descricao-relacionamento" 
                                  style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;"
                                  rows="3" placeholder="Descrição adicional do relacionamento..."></textarea>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button id="cancelar-vinculo" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancelar</button>
                    <button id="criar-vinculo" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer; display: none;">Criar Vínculo</button>
                </div>
            </div>
        `;
        
        // Configurar busca de pessoa
        this.configurarBuscaPessoaModal(modal, noPrincipal);
        
        return modal;
    }
    
    configurarBuscaPessoaModal(modal, noPrincipal) {
        const campoBusca = modal.querySelector('.busca-pessoa-input');
        const resultados = modal.querySelector('#resultados-busca-modal');
        const formRelacionamento = modal.querySelector('#form-relacionamento');
        const botaoCriar = modal.querySelector('#criar-vinculo');
        
        let pessoaSelecionada = null;
        let timeoutBusca = null;
        
        // Busca com debounce
        campoBusca.addEventListener('input', () => {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(async () => {
                const termo = campoBusca.value.trim();
                if (termo.length < 2) {
                    resultados.innerHTML = '';
                    return;
                }
                
                await this.buscarPessasParaVinculo(termo, resultados, noPrincipal, (pessoa) => {
                    pessoaSelecionada = pessoa;
                    formRelacionamento.style.display = 'block';
                    botaoCriar.style.display = 'inline-block';
                });
            }, 300);
        });
        
        // Cancelar
        modal.querySelector('#cancelar-vinculo').addEventListener('click', () => modal.remove());
        
        // Criar vínculo
        botaoCriar.addEventListener('click', async () => {
            if (!pessoaSelecionada) return;
            
            const tipo = modal.querySelector('#tipo-relacionamento').value;
            const descricao = modal.querySelector('#descricao-relacionamento').value;
            
            await this.executarCriacaoVinculo(noPrincipal, pessoaSelecionada, tipo, descricao);
            modal.remove();
        });
    }
    
    async buscarPessasParaVinculo(termo, container, noPrincipal, callback) {
        try {
            const pessoa = await window.BuscaInteligente.buscarPessoaPorTermo(termo);
            
            if (!pessoa) {
                container.innerHTML = '<div style="padding: 10px; color: #666;">Nenhuma pessoa encontrada</div>';
                return;
            }
            
            // Evitar vincular pessoa com ela mesma
            if (pessoa.id === noPrincipal.id && pessoa.tipo === noPrincipal.tipo) {
                container.innerHTML = '<div style="padding: 10px; color: #666;">Não é possível criar vínculo com a própria pessoa</div>';
                return;
            }
            
            container.innerHTML = `
                <div class="resultado-busca-modal" style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; background: #f8f9fa;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 20px;">${pessoa.tipo === 'fisica' ? '👤' : '🏢'}</div>
                        <div>
                            <div style="font-weight: bold;">${pessoa.nome_display}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${pessoa.tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'} • Score: ${pessoa.score}/100
                            </div>
                            ${pessoa.cpf ? `<div style="font-size: 12px; color: #666;">CPF: ${pessoa.cpf}</div>` : ''}
                            ${pessoa.cnpj ? `<div style="font-size: 12px; color: #666;">CNPJ: ${pessoa.cnpj}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            container.querySelector('.resultado-busca-modal').addEventListener('click', () => {
                callback(pessoa);
            });
            
        } catch (error) {
            container.innerHTML = '<div style="padding: 10px; color: #dc3545;">Erro na busca</div>';
        }
    }
    
    async executarCriacaoVinculo(origem, destino, tipo, descricao) {
        try {
            const resultado = await window.RelacionamentoManager.criarRelacionamento({
                pessoa_origem_id: origem.id,
                pessoa_destino_id: destino.id,
                tipo_origem: origem.tipo,
                tipo_destino: destino.tipo,
                tipo_relacionamento: tipo,
                descricao: descricao || `Vínculo ${tipo} entre ${origem.nome || origem.razao_social} e ${destino.nome_display}`,
                automatico: false
            });
            
            if (resultado.sucesso) {
                showNotification(`✅ Vínculo ${tipo} criado entre ${origem.nome || origem.razao_social} e ${destino.nome_display}!`, 'success');
                
                // Re-renderizar árvore
                if (window.ArvoreCore) {
                    await window.ArvoreCore.renderizarArvoreInterativa();
                }
            } else {
                showNotification(`❌ Erro: ${resultado.motivo || resultado.erro}`, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar vínculo:', error);
            showNotification('❌ Erro ao criar vínculo', 'error');
        }
    }
    
    aplicarCorPersonalizadaNo(no, cor) {
        console.log(`🎨 Aplicando cor ${cor} ao nó ${no.id}`);
        
        try {
            // Salvar cor personalizada
            const coresPersonalizadas = JSON.parse(localStorage.getItem('arvore_cores_personalizadas') || '{}');
            coresPersonalizadas[`${no.tipo}_${no.id}`] = cor;
            localStorage.setItem('arvore_cores_personalizadas', JSON.stringify(coresPersonalizadas));
            
            // Aplicar cor no SVG atual
            const svg = d3.select('#arvore-container svg');
            const node = svg.select(`[data-node-id="${no.tipo}_${no.id}"] circle`);
            
            if (!node.empty()) {
                node.style('fill', cor);
            }
            
            showNotification(`🎨 Cor aplicada a ${no.nome || no.razao_social}`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao aplicar cor:', error);
            showNotification('❌ Erro ao aplicar cor personalizada', 'error');
        }
    }
    
    processarFotoNo(no, fotoBase64) {
        console.log(`📷 Processando foto para: ${no.nome || no.razao_social}`);
        
        try {
            // Salvar foto
            const fotosPersonalizadas = JSON.parse(localStorage.getItem('arvore_fotos_personalizadas') || '{}');
            fotosPersonalizadas[`${no.tipo}_${no.id}`] = fotoBase64;
            localStorage.setItem('arvore_fotos_personalizadas', JSON.stringify(fotosPersonalizadas));
            
            showNotification(`📷 Foto adicionada a ${no.nome || no.razao_social}`, 'success');
            
            // Re-renderizar se possível
            if (window.ArvoreCore) {
                window.ArvoreCore.renderizarArvoreInterativa();
            }
            
        } catch (error) {
            console.error('❌ Erro ao processar foto:', error);
            showNotification('❌ Erro ao adicionar foto', 'error');
        }
    }
    
    async criarVinculosAutomaticos(no) {
        console.log(`🔄 Criando vínculos automáticos para: ${no.nome || no.razao_social}`);
        
        try {
            const novosVinculos = await window.RelacionamentoManager.criarRelacionamentosParaPessoa(no.id, no.tipo);
            
            if (novosVinculos > 0) {
                showNotification(`✅ ${novosVinculos} novos vínculos automáticos criados!`, 'success');
                
                // Re-renderizar árvore
                if (window.ArvoreCore) {
                    await window.ArvoreCore.renderizarArvoreInterativa();
                }
            } else {
                showNotification(`ℹ️ Nenhum novo vínculo automático encontrado para ${no.nome || no.razao_social}`, 'info');
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar vínculos automáticos:', error);
            showNotification('❌ Erro ao criar vínculos automáticos', 'error');
        }
    }
    
    verDetalhes(no) {
        console.log(`👁️ Mostrando detalhes de: ${no.nome || no.razao_social}`);
        
        // Se existe função global, usar
        if (typeof mostrarInfoPessoa === 'function') {
            mostrarInfoPessoa(no);
        } else {
            // Modal simples com detalhes
            const modal = document.createElement('div');
            modal.className = 'modal-detalhes';
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            `;
            
            const detalhes = no.tipo === 'fisica' 
                ? this.gerarDetalhesPersona(no)
                : this.gerarDetalhesEmpresa(no);
            
            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; width: 400px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4>${no.tipo === 'fisica' ? '👤' : '🏢'} Detalhes</h4>
                        <button onclick="this.closest('.modal-detalhes').remove()" 
                                style="border: none; background: none; font-size: 20px; cursor: pointer;">&times;</button>
                    </div>
                    ${detalhes}
                </div>
            `;
            
            document.body.appendChild(modal);
        }
    }
    
    gerarDetalhesPersona(pessoa) {
        return `
            <div>
                <p><strong>Nome:</strong> ${pessoa.nome || 'Não informado'}</p>
                <p><strong>CPF:</strong> ${pessoa.cpf || 'Não informado'}</p>
                <p><strong>GOA:</strong> ${pessoa.goa || 'Não informado'}</p>
                ${pessoa.telefone1 ? `<p><strong>Telefone:</strong> ${pessoa.telefone1}</p>` : ''}
                ${pessoa.endereco1 ? `<p><strong>Endereço:</strong> ${pessoa.endereco1}</p>` : ''}
                ${pessoa.email ? `<p><strong>Email:</strong> ${pessoa.email}</p>` : ''}
            </div>
        `;
    }
    
    gerarDetalhesEmpresa(empresa) {
        return `
            <div>
                <p><strong>Razão Social:</strong> ${empresa.razao_social || 'Não informado'}</p>
                <p><strong>CNPJ:</strong> ${empresa.cnpj || 'Não informado'}</p>
                ${empresa.nome_fantasia ? `<p><strong>Nome Fantasia:</strong> ${empresa.nome_fantasia}</p>` : ''}
                ${empresa.endereco ? `<p><strong>Endereço:</strong> ${empresa.endereco}</p>` : ''}
                ${empresa.telefone ? `<p><strong>Telefone:</strong> ${empresa.telefone}</p>` : ''}
            </div>
        `;
    }
    
    async salvarNovaPessoa(modal) {
        const tipo = modal.querySelector('#tipo-pessoa').value;
        
        try {
            let dados;
            
            if (tipo === 'fisica') {
                dados = {
                    nome: modal.querySelector('#nome').value,
                    cpf: modal.querySelector('#cpf').value
                };
                
                if (!dados.nome.trim()) {
                    alert('Nome é obrigatório');
                    return;
                }
                
                // Criar pessoa física
                const resultado = await api.criarPessoaFisica(dados);
                showNotification(`✅ Pessoa física ${dados.nome} criada!`, 'success');
                
            } else {
                dados = {
                    razao_social: modal.querySelector('#razao-social').value,
                    cnpj: modal.querySelector('#cnpj').value
                };
                
                if (!dados.razao_social.trim()) {
                    alert('Razão social é obrigatória');
                    return;
                }
                
                // Criar pessoa jurídica
                const resultado = await api.criarPessoaJuridica(dados);
                showNotification(`✅ Empresa ${dados.razao_social} criada!`, 'success');
            }
            
            // Invalidar cache e re-renderizar
            window.DataCache.invalidatePessoas(tipo);
            
            if (window.ArvoreCore) {
                await window.ArvoreCore.renderizarArvoreInterativa();
            }
            
            modal.remove();
            
        } catch (error) {
            console.error('❌ Erro ao criar pessoa:', error);
            alert('Erro ao criar pessoa: ' + error.message);
        }
    }
}

// Instância global
if (!window.InterfaceManager) {
    window.InterfaceManager = new InterfaceManager();
}

console.log('✅ Módulo InterfaceManager carregado');