/**
 * Sistema Principal - Aplicação Desktop de Banco de Dados
 * Gerencia navegação, dashboard e funcionalidades principais
 */

// Estado da aplicação
let currentSection = 'dashboard';
let editingRecord = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicação Desktop iniciada');
    
    // Carregar qualquer seção que já esteja visível (para acesso direto via URL)
    loadVisibleSections();
    
    // Carregar dashboard inicial (se não estiver em outra página)
    const currentVisibleSection = document.querySelector('.section:not([style*="display: none"])');
    if (!currentVisibleSection || currentVisibleSection.id === 'dashboard') {
        loadDashboard();
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Mostrar seção inicial
    showSection('dashboard');
});

// Carregar qualquer seção que esteja visível (para URLs diretas)
function loadVisibleSections() {
    console.log('🔄 Verificando seções visíveis...');
    document.querySelectorAll('.section[data-load-function]').forEach(section => {
        // Verifica se a seção está visível (não tem display none inline ou do CSS)
        const isVisible = section.offsetParent !== null;
        if (isVisible) {
            const funcName = section.getAttribute('data-load-function');
            const sectionId = section.id;
            console.log(`📍 Seção visível encontrada: ${sectionId}, chamando: ${funcName}`);
            
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                    console.log(`✅ ${funcName} chamada com sucesso`);
                } catch (error) {
                    console.error(`❌ Erro ao chamar ${funcName}:`, error);
                }
            } else {
                console.error(`❌ Função ${funcName} não encontrada`);
            }
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners para navegação
    document.querySelectorAll('[onclick*="showSection"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('onclick').match(/showSection\('([^']+)'\)/)[1];
            showSection(section);
        });
    });

    // Event listener para busca GOA no dashboard
    const buscaGoaDashboard = document.getElementById('busca-goa-dashboard');
    if (buscaGoaDashboard) {
        buscaGoaDashboard.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarGoaDashboard();
            }
        });
    }

    // Event listeners para pesquisa
    document.getElementById('search-pf')?.addEventListener('input', function() {
        searchPessoasFisicas(this.value);
    });

    document.getElementById('search-pj')?.addEventListener('input', function() {
        searchPessoasJuridicas(this.value);
    });

    // Event listeners para formulários
    setupFormListeners();
    
    // Event listeners para upload de fotos
    setupPhotoListeners();
    
    // Event listeners para relacionamentos
    setupRelationshipListeners();

    // Controles da janela desktop
    setupDesktopControls();
    
    // Sistema de upload de documentos
    setupDocumentUpload();
}

// Função para fechar modal de forma segura (importada do forms.js)
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

// Controles da janela desktop
function setupDesktopControls() {
    document.querySelector('.btn-close-app')?.addEventListener('click', function() {
        if (confirm('Deseja realmente fechar a aplicação?')) {
            window.close();
        }
    });

    document.querySelector('.btn-minimize')?.addEventListener('click', function() {
        // Em um ambiente desktop real, isso minimizaria a janela
        console.log('Minimizar janela');
    });

    document.querySelector('.btn-maximize')?.addEventListener('click', function() {
        // Em um ambiente desktop real, isso maximizaria a janela
        console.log('Maximizar janela');
    });
}


// Atualizar navegação ativa
function updateActiveNavigation(sectionName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Mapear seções para links de navegação
    const sectionMap = {
        'dashboard': 'dashboard',
        'cadastro-pf': 'cadastro',
        'cadastro-pj': 'cadastro',
        'listar-pf': 'consultar',
        'listar-pj': 'consultar',
        'fotos': 'fotos',
        'arvore': 'arvore'
    };

    const targetNav = sectionMap[sectionName];
    if (targetNav) {
        document.querySelector(`[onclick*="${sectionName}"]`)?.classList.add('active');
    }
}

// Carregar dados específicos da seção
function loadSectionData(sectionName) {
    console.log(`🔄 loadSectionData chamada para: ${sectionName}`);
    
    // Primeiro tenta usar o atributo data-load-function
    const section = document.getElementById(sectionName);
    if (section && section.hasAttribute('data-load-function')) {
        const funcName = section.getAttribute('data-load-function');
        console.log(`📍 Chamando função: ${funcName}`);
        
        if (typeof window[funcName] === 'function') {
            try {
                window[funcName]();
                console.log(`✅ ${funcName} chamada com sucesso`);
                return;
            } catch (error) {
                console.error(`❌ Erro ao chamar ${funcName}:`, error);
            }
        } else {
            console.error(`❌ Função ${funcName} não encontrada`);
        }
    }
    
    // Fallback para switch anterior (compatibilidade)
    switch(sectionName) {
        case 'dashboard':
            console.log('📊 Carregando dashboard...');
            loadDashboard();
            break;
        case 'cadastro-pf':
            console.log('👤 Carregando formulário de Pessoa Física...');
            if (typeof loadFormPessoaFisica === 'function') {
                loadFormPessoaFisica();
                console.log('✅ loadFormPessoaFisica chamada');
            } else {
                console.error('❌ loadFormPessoaFisica não encontrada');
            }
            break;
        case 'cadastro-pj':
            console.log('🏢 Carregando formulário de Pessoa Jurídica...');
            if (typeof loadFormPessoaJuridica === 'function') {
                loadFormPessoaJuridica();
                console.log('✅ loadFormPessoaJuridica chamada');
            } else {
                console.error('❌ loadFormPessoaJuridica não encontrada');
            }
            break;
        case 'listar-pf':
            loadListaPessoasFisicas();
            break;
        case 'listar-pj':
            loadListaPessoasJuridicas();
            break;
        case 'fotos':
            loadGerenciadorFotos();
            break;
        case 'arvore':
            loadArvoreRelacionamentos();
            break;
    }
}

// Função para animar contagem de números
function animateCounter(elementId, finalValue, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const increment = (finalValue - startValue) / (duration / 16); // 60 FPS
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if ((increment > 0 && currentValue >= finalValue) || (increment < 0 && currentValue <= finalValue)) {
            element.textContent = finalValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, 16);
}

// Carregar dashboard principal
function loadMainDashboard() {
    try {
        const totalPF = db.count('pessoa_fisica');
        const totalPJ = db.count('pessoa_juridica');
        const totalFotos = db.count('fotos');
        const totalRelacionamentos = db.count('relacionamentos');

        // Animar contadores
        animateCounter('total-pf', totalPF, 800);
        animateCounter('total-pj', totalPJ, 1000);
        animateCounter('total-fotos', totalFotos, 1200);
        animateCounter('total-relacionamentos', totalRelacionamentos, 1400);
        
        // Atualizar labels com plural/singular correto
        setTimeout(() => {
            document.getElementById('label-pf').textContent = totalPF === 1 ? 'cadastrada' : 'cadastradas';
            document.getElementById('label-pj').textContent = totalPJ === 1 ? 'cadastrada' : 'cadastradas';
            document.getElementById('label-fotos').textContent = totalFotos === 1 ? 'arquivo' : 'arquivos';
            document.getElementById('label-relacionamentos').textContent = totalRelacionamentos === 1 ? 'vínculo' : 'vínculos';
        }, 500);
        
        console.log(`📊 Dashboard atualizado: ${totalPF} PF, ${totalPJ} PJ, ${totalFotos} fotos, ${totalRelacionamentos} vínculos`);
        console.log(`🎯 Elementos encontrados:`, {
            'total-pf': !!document.getElementById('total-pf'),
            'total-pj': !!document.getElementById('total-pj'),
            'total-fotos': !!document.getElementById('total-fotos'),
            'total-relacionamentos': !!document.getElementById('total-relacionamentos')
        });
        
        // Carregar pessoas recentes com fotos
        loadRecentPeopleWithPhotos();

        // Atualizar status do backup
        setTimeout(updateBackupStatus, 1000);

        // Atualizar status bar
        updateStatusBar(`Dashboard carregado - ${totalPF + totalPJ} pessoas cadastradas`);
        
        console.log('✅ Dashboard atualizado');
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dashboard', 'error');
    }
}

// Atualizar status do backup no dashboard
function updateBackupStatus() {
    try {
        const alertElement = document.getElementById('backup-status-alert');
        const statusText = document.getElementById('backup-status-text');
        
        if (!alertElement || !statusText) return;

        // Verificar se o sistema de backup está disponível
        if (typeof backupManager !== 'undefined' && backupManager) {
            const status = backupManager.getBackupStatus();
            
            alertElement.style.display = 'block';
            
            if (status.enabled) {
                alertElement.className = 'alert alert-success';
                
                if (status.needsBackupToday) {
                    statusText.innerHTML = `✅ Ativo - Próximo backup hoje (${status.count} backups salvos)`;
                } else {
                    statusText.innerHTML = `✅ Ativo - Backup de hoje concluído (${status.count} backups salvos)`;
                }
            } else {
                alertElement.className = 'alert alert-warning';
                statusText.innerHTML = `⚠️ Desabilitado - Backups automáticos estão desativados (${status.count} backups salvos)`;
            }
            
            console.log('📦 Status do backup atualizado:', status);
        } else {
            // Sistema de backup não carregado ainda
            alertElement.style.display = 'block';
            alertElement.className = 'alert alert-info';
            statusText.innerHTML = '🔄 Inicializando sistema de backup automático...';
            
            // Tentar novamente em alguns segundos
            setTimeout(updateBackupStatus, 3000);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status do backup:', error);
    }
}

// Carregar pessoas recentes com fotos para o dashboard
function loadRecentPeopleWithPhotos() {
    try {
        const container = document.getElementById('recent-people-container');
        const countEl = document.getElementById('recent-count');
        
        if (!container) return;
        
        // Buscar pessoas físicas e jurídicas mais recentes
        const pessoasFisicas = db.getAll('pessoa_fisica').slice(-6); // últimas 6
        const pessoasJuridicas = db.getAll('pessoa_juridica').slice(-4); // últimas 4
        const todasFotos = db.getAll('fotos');
        
        const todasPessoas = [];
        
        // Adicionar pessoas físicas
        pessoasFisicas.forEach(pessoa => {
            const foto = todasFotos.find(f => f.pessoa_id === pessoa.id && f.tipo_pessoa === 'fisica');
            todasPessoas.push({
                ...pessoa,
                tipo: 'fisica',
                foto: foto ? foto.url_foto : null
            });
        });
        
        // Adicionar pessoas jurídicas
        pessoasJuridicas.forEach(pessoa => {
            const foto = todasFotos.find(f => f.pessoa_id === pessoa.id && f.tipo_pessoa === 'juridica');
            todasPessoas.push({
                ...pessoa,
                tipo: 'juridica',
                foto: foto ? foto.url_foto : null
            });
        });
        
        // Ordenar por data de criação (mais recentes primeiro)
        todasPessoas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Limitar a 8 pessoas
        const pessoasRecentes = todasPessoas.slice(0, 8);
        
        countEl.textContent = pessoasRecentes.length;
        
        if (pessoasRecentes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h6 class="text-muted">Nenhuma pessoa cadastrada ainda</h6>
                    <p class="text-muted">Comece cadastrando pessoas físicas ou jurídicas</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="row">';
        
        pessoasRecentes.forEach(pessoa => {
            const nome = pessoa.tipo === 'fisica' ? pessoa.nome : pessoa.razao_social;
            const documento = pessoa.tipo === 'fisica' ? 
                formatUtils.formatCPF(pessoa.cpf) : 
                formatUtils.formatCNPJ(pessoa.cnpj);
            const goa = pessoa.goa || '-';
            const icon = pessoa.tipo === 'fisica' ? 'user' : 'building';
            const tipoLabel = pessoa.tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';
            
            html += `
                <div class="col-md-3 col-sm-6 mb-4">
                    <div class="card person-card">
                        <div class="card-body text-center">
                            ${pessoa.foto ? `
                                <img src="${pessoa.foto}" alt="Foto de ${nome}" class="person-avatar">
                            ` : `
                                <div class="person-avatar d-flex align-items-center justify-content-center" style="background: var(--medium-blue); border: 3px solid var(--accent-blue);">
                                    <i class="fas fa-${icon} fa-2x" style="color: var(--accent-blue);"></i>
                                </div>
                            `}
                            
                            <div class="person-name">${nome}</div>
                            <div class="person-details">
                                <span class="badge bg-${pessoa.tipo === 'fisica' ? 'primary' : 'success'} mb-1">${tipoLabel}</span><br>
                                <small class="text-muted">${documento}</small><br>
                                <small class="text-muted">GOA: ${goa}</small>
                            </div>
                            
                            <div class="d-flex gap-1 justify-content-center mt-3">
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="verDetalhes('${pessoa.tipo === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica'}', '${pessoa.id}')"
                                        title="Ver Detalhes">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="editarPessoa('${pessoa.tipo === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica'}', '${pessoa.id}')"
                                        title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${pessoa.foto ? `
                                    <button class="btn btn-sm btn-outline-info" 
                                            onclick="showSection('fotos'); setTimeout(() => visualizarFoto('${todasFotos.find(f => f.pessoa_id === pessoa.id)?.id}'), 500);"
                                            title="Ver Foto">
                                        <i class="fas fa-image"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar pessoas recentes:', error);
        document.getElementById('recent-people-container').innerHTML = `
            <div class="text-center py-3">
                <span class="text-danger">Erro ao carregar pessoas recentes</span>
            </div>
        `;
    }
}

// Carregar dados iniciais
function loadInitialData() {
    // Verificar se há dados de exemplo para inserir
    if (db.count('pessoa_fisica') === 0 && db.count('pessoa_juridica') === 0) {
        insertSampleData();
    }
}

// Inserir dados de exemplo
function insertSampleData() {
    try {
        // Exemplo de pessoa física
        db.insert('pessoa_fisica', {
            goa: 'GOAINV001',
            nome: 'João Silva Santos',
            cpf: '12345678901',
            rg: '123456789',
            nascimento: '1985-05-15',
            mae: 'Maria Silva Santos',
            pai: 'José Santos',
            naturalidade: 'São Paulo, SP',
            sexo: 'Masculino',
            estado_civil: 'Casado(a)',
            telefone1: '11999887766',
            telefone2: '1133445566',
            ocupacao: 'Advogado',
            vinculo: 'Sócio',
            endereco1: 'Rua das Flores, 123 - Centro',
            possui_empresa: true,
            razao_social: 'Silva & Santos Advocacia Ltda',
            cnpj_empresa: '12345678000195',
            participacao_empresa: '50%',
            observacoes: 'Cliente desde 2020',
            possui_veiculos: true,
            placa: 'ABC1234',
            marca_modelo: 'Honda Civic',
            ano: 2020,
            cor: 'Preto'
        });

        // Exemplo de pessoa jurídica
        db.insert('pessoa_juridica', {
            goa: 'GOACOM001',
            razao_social: 'Tech Solutions Ltda',
            nome_fantasia: 'TechSol',
            cnpj: '98765432000198',
            tipo: 'Ltda',
            telefone1: '1144556677',
            telefone2: '11998877665',
            cnae_principal: '6201-5/00',
            situacao: 'Ativa',
            data_abertura: '2018-03-10',
            quantidade_socios: 2,
            socio1: 'João Silva Santos',
            socio2: 'Maria Oliveira',
            capital_social: 100000,
            endereco: 'Av. Paulista, 1000 - Bela Vista',
            cidade: 'São Paulo'
        });

        // Adicionar mais exemplos para demonstrar relacionamentos
        db.insert('pessoa_fisica', {
            goa: 'GOAFAM002',
            nome: 'Maria Silva Santos',
            cpf: '98765432100',
            rg: '987654321',
            nascimento: '1990-03-20',
            mae: 'Ana Silva Santos',
            pai: 'João Silva Santos',
            irmaos: 'Carlos Silva Santos, Pedro Silva Santos',
            telefone1: '11988776655',
            ocupacao: 'Médica',
            vinculo: 'Filha',
            endereco1: 'Rua das Rosas, 456 - Centro',
            possui_empresa: true,
            razao_social: 'Silva & Santos Advocacia Ltda',
            cnpj_empresa: '12345678000195',
            participacao_empresa: '50%'
        });
        
        db.insert('pessoa_fisica', {
            goa: 'GOADEN003', 
            nome: 'Carlos Silva Santos',
            cpf: '11122233344',
            rg: '111222333',
            nascimento: '1988-07-15',
            mae: 'Ana Silva Santos',
            pai: 'João Silva Santos',
            irmaos: 'Maria Silva Santos, Pedro Silva Santos',
            telefone1: '11977665544',
            ocupacao: 'Engenheiro'
        });
        
        console.log('Dados de exemplo inseridos');
        updateStatusBar('Dados de exemplo carregados');
        loadDashboard();
    } catch (error) {
        console.error('Erro ao inserir dados de exemplo:', error);
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Atualizar barra de status
function updateStatusBar(message) {
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        const statusText = statusBar.querySelector('.status-text') || document.createElement('span');
        statusText.className = 'status-text';
        statusText.textContent = message;
        
        if (!statusBar.querySelector('.status-text')) {
            statusBar.appendChild(statusText);
        }

        // Adicionar timestamp
        const timestamp = statusBar.querySelector('.timestamp') || document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('pt-BR');
        
        if (!statusBar.querySelector('.timestamp')) {
            statusBar.appendChild(timestamp);
        }
    }
}

// Função para download de backup
function downloadBackup() {
    try {
        const data = db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showNotification('Backup exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        showNotification('Erro ao exportar backup', 'error');
    }
}

// Função para importar backup
function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const success = db.importData(e.target.result);
            if (success) {
                showNotification('Backup importado com sucesso!', 'success');
                loadDashboard();
                loadSectionData(currentSection);
            } else {
                showNotification('Erro ao importar backup', 'error');
            }
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            showNotification('Arquivo de backup inválido', 'error');
        }
    };
    reader.readAsText(file);
}

// Validação de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Validação de CNPJ
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validar primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validar segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
}

// Buscar GOA no dashboard
function buscarGoaDashboard() {
    const goaInput = document.getElementById('busca-goa-dashboard');
    
    if (!goaInput) return;
    
    const goa = goaInput.value.trim();
    
    if (!goa) {
        showNotification('Digite um GOA para buscar', 'warning');
        return;
    }
    
    try {
        // Verificar se é busca por prefixo ou GOA completo
        let resultados = [];
        
        if (goa.length === 6 && goa.startsWith('GOA')) {
            // Busca por prefixo
            resultados = db.searchByGOAPrefix(goa);
        } else {
            // Busca por GOA específico
            const resultado = db.searchByGOA(goa);
            if (resultado) {
                resultados = [resultado];
            }
        }
        
        if (resultados.length > 0) {
            if (resultados.length === 1) {
                // Mostrar resultado único
                const resultado = resultados[0];
            const pessoa = resultado.pessoa;
            const tipo = resultado.tipo;
            
            // Mostrar modal com detalhes usando sistema simplificado
            const titulo = `<i class="fas fa-${tipo === 'fisica' ? 'user' : 'building'} me-2"></i>Encontrado por GOA: ${pessoa.goa}`;
            
            let conteudo = `
                <div class="alert alert-success">
                    <h5><strong>${tipo === 'fisica' ? pessoa.nome : pessoa.razao_social}</strong></h5>
                    <p class="mb-2">
                        <span class="badge bg-primary me-2">${pessoa.goa}</span>
                        <span class="badge bg-${tipo === 'fisica' ? 'info' : 'success'}">${tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                    </p>
                </div>
            `;
            

            
            if (tipo === 'fisica') {
                conteudo += `
                    <div class="row">
                        <div class="col-md-6"><strong>CPF:</strong> ${formatUtils.formatCPF(pessoa.cpf) || '-'}</div>
                        <div class="col-md-6"><strong>RG:</strong> ${pessoa.rg || '-'}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6"><strong>Telefone:</strong> ${formatUtils.formatPhone(pessoa.telefone1) || '-'}</div>
                        <div class="col-md-6"><strong>Ocupação:</strong> ${pessoa.ocupacao || '-'}</div>
                    </div>
                `;
            } else {
                conteudo += `
                    <div class="row">
                        <div class="col-md-6"><strong>CNPJ:</strong> ${formatUtils.formatCNPJ(pessoa.cnpj) || '-'}</div>
                        <div class="col-md-6"><strong>Situação:</strong> ${pessoa.situacao || '-'}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6"><strong>Telefone:</strong> ${formatUtils.formatPhone(pessoa.telefone1) || '-'}</div>
                        <div class="col-md-6"><strong>Cidade:</strong> ${pessoa.cidade || '-'}</div>
                    </div>
                `;
            }
            
            conteudo += `
                <hr>
                <div class="text-center">
                    <button class="btn btn-primary me-2" onclick="fecharModalSimples(); setTimeout(() => editarPessoa('${resultado.table}', '${pessoa.id}'), 300);">
                        <i class="fas fa-edit me-1"></i>Editar
                    </button>
                    <button class="btn btn-info me-2" onclick="fecharModalSimples(); setTimeout(() => { showSection('arvore'); buscarPorGOANaArvore('${pessoa.goa}'); }, 300);">
                        <i class="fas fa-project-diagram me-1"></i>Ver na Árvore
                    </button>
                    <button class="btn btn-secondary" onclick="fecharModalSimples();">
                        <i class="fas fa-times me-1"></i>Fechar
                    </button>
                </div>
            `;
            
            // Usar sistema global
            abrirModalDetalhes(titulo, conteudo);
            
            // Limpar campo de busca
            goaInput.value = '';
            
                showNotification(`GOA encontrado: ${pessoa.goa}`, 'success');
            } else {
                // Mostrar múltiplos resultados
                showModalResultadosMultiplos(resultados, goa);
            }
        } else {
            showNotification(`GOA ou prefixo "${goa}" não encontrado`, 'error');
        }
    } catch (error) {
        console.error('Erro ao buscar GOA:', error);
        showNotification('Erro na busca por GOA', 'error');
    }
}

// Mostrar modal com múltiplos resultados
function showModalResultadosMultiplos(resultados, termoBusca) {
    fecharModalSeguro(); // Fechar qualquer modal aberto
    
    setTimeout(() => {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
    
    modalTitle.innerHTML = `<i class="fas fa-list me-2"></i>Resultados para "${termoBusca}" (${resultados.length} encontrados)`;
    

    
    resultados.forEach((resultado, index) => {
        const pessoa = resultado.pessoa;
        const tipo = resultado.tipo;
        
        conteudo += `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            <i class="fas fa-${tipo === 'fisica' ? 'user' : 'building'} me-2"></i>
                            ${tipo === 'fisica' ? pessoa.nome : pessoa.razao_social}
                            <span class="badge bg-primary ms-2">${pessoa.goa}</span>
                        </h6>
                        <small class="text-muted">
                            ${tipo === 'fisica' ? 
                                `CPF: ${formatUtils.formatCPF(pessoa.cpf)} • ${pessoa.telefone1 || 'Sem telefone'}` : 
                                `CNPJ: ${formatUtils.formatCNPJ(pessoa.cnpj)} • ${pessoa.situacao || 'Situação não informada'}`
                            }
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarPessoa('${resultado.table}', '${pessoa.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="showSection('arvore'); setTimeout(() => buscarPorGOANaArvore('${pessoa.goa}'), 500);">
                            <i class="fas fa-project-diagram"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    
        modalBody.innerHTML = content;
        
        // Usar sistema robusto de modal
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.show();
        } else {
            modalInstance = new bootstrap.Modal(modalEl);
            modalInstance.show();
        }
        
        // Limpar campo de busca
        document.getElementById('busca-goa-dashboard').value = '';
        
        showNotification(`${resultados.length} resultados encontrados para "${termoBusca}"`, 'success');
    }, 100);
}

// Filtrar por prefixo
function filtrarPorPrefixo(prefixo) {
    const input = document.getElementById('busca-goa-dashboard');
    if (input) {
        input.value = prefixo;
        buscarGoaDashboard();
    }
}

// Buscar por GOA na árvore (função auxiliar)
function buscarPorGOANaArvore(goa) {
    const buscaGoaArvore = document.getElementById('busca-goa');
    if (buscaGoaArvore) {
        buscaGoaArvore.value = goa;
        buscarPorGOA();
    }
}

// Verificação de autenticação
function checkAuthentication() {
    // Verificar nova estrutura de sessão
    const sessionAuth = sessionStorage.getItem('userSession') || localStorage.getItem('userSession');

    if (!sessionAuth) {
        // Verificar estrutura antiga para compatibilidade
        const oldSessionAuth = sessionStorage.getItem('authData') || localStorage.getItem('authData');

        if (!oldSessionAuth) {
            // Correção: Criar sessão temporária para desenvolvimento/demonstração
            console.log('Criando sessão temporária para desenvolvimento...');
            const mockAuth = {
                user: { username: 'demo', role: 'admin' },
                timestamp: Date.now()
            };
            sessionStorage.setItem('authData', JSON.stringify(mockAuth));
            displayUserInfo(mockAuth.user);
            return true;
        }

        try {
            const authData = JSON.parse(oldSessionAuth);
            if (Date.now() - authData.timestamp > 24 * 60 * 60 * 1000) {
                sessionStorage.removeItem('authData');
                localStorage.removeItem('authData');
                window.location.href = 'login.html';
                return false;
            }
            displayUserInfo(authData.user);
            return true;
        } catch (error) {
            window.location.href = 'login.html';
            return false;
        }
    }

    try {
        const sessionData = JSON.parse(sessionAuth);

        // Verificar se não expirou (24 horas)
        if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
            sessionStorage.removeItem('userSession');
            localStorage.removeItem('userSession');
            window.location.href = 'login.html';
            return false;
        }

        // Usuário autenticado, mostrar informações
        displayUserInfo(sessionData.user);

        // Verificar se é admin e mostrar painel administrativo
        if (sessionData.user.isAdmin || sessionData.user.username === 'admin') {
            showAdminPanel();
        }

        return true;

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Mostrar informações do usuário
function displayUserInfo(user) {
    try {
        // Atualizar header com informações do usuário
        const userInfo = document.createElement('div');
        userInfo.className = 'd-flex align-items-center me-3';
        userInfo.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    ${user.picture ? `<img src="${user.picture}" class="rounded-circle me-2" width="24" height="24">` : '<i class="fas fa-user me-2"></i>'}
                    ${user.name || user.username}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><h6 class="dropdown-header">
                        <i class="fas fa-${user.method === 'google' ? 'google' : 'user'} me-2"></i>
                        ${user.name || user.username}
                    </h6></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><span class="dropdown-item-text small text-muted">
                        Login: ${new Date(user.loginTime).toLocaleString('pt-BR')}
                    </span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()">
                        <i class="fas fa-sign-out-alt me-2"></i>Sair
                    </a></li>
                </ul>
            </div>
        `;

        // Inserir antes do botão de tema
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            themeButton.parentNode.insertBefore(userInfo, themeButton);
        }

    } catch (error) {
        console.error('Erro ao exibir informações do usuário:', error);
    }
}

// Mostrar painel administrativo
function showAdminPanel() {
    // Adicionar botão admin no dropdown do usuário
    const userDropdown = document.querySelector('.dropdown-menu');
    if (userDropdown && !document.querySelector('.admin-panel-btn')) {
        const adminItem = document.createElement('li');
        adminItem.innerHTML = `
            <a class="dropdown-item admin-panel-btn" href="#" onclick="openAdminPanel()">
                <i class="fas fa-users-cog me-2 text-warning"></i>
                <span class="text-warning">Painel Admin</span>
            </a>
        `;

        // Inserir antes do divisor de logout
        const lastDivider = userDropdown.querySelector('hr:last-of-type');
        if (lastDivider) {
            lastDivider.parentNode.insertBefore(adminItem, lastDivider);
        }
    }

    console.log('Usuário administrativo detectado - Painel habilitado');
}

// Abrir painel administrativo
function openAdminPanel() {
    const adminModalHtml = `
        <div class="modal fade" id="adminModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                    <div class="modal-header" style="background: var(--dark-blue); border-bottom: 1px solid var(--border-color);">
                        <h5 class="modal-title text-warning">
                            <i class="fas fa-users-cog me-2"></i>
                            Painel Administrativo
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-3" style="background: var(--medium-blue); border: 1px solid var(--border-color);">
                                    <div class="card-body">
                                        <h6 class="text-info">
                                            <i class="fas fa-users me-2"></i>
                                            Gerenciar Usuários
                                        </h6>
                                        <p class="small text-muted mb-3">
                                            Visualizar e gerenciar usuários do sistema
                                        </p>
                                        <button class="btn btn-info btn-sm" onclick="loadUserManagement()">
                                            <i class="fas fa-list me-1"></i>
                                            Ver Usuários
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-3" style="background: var(--medium-blue); border: 1px solid var(--border-color);">
                                    <div class="card-body">
                                        <h6 class="text-success">
                                            <i class="fas fa-database me-2"></i>
                                            Backup de Dados
                                        </h6>
                                        <p class="small text-muted mb-3">
                                            Exportar e importar dados do sistema
                                        </p>
                                        <div class="btn-group me-2" role="group">
                                            <button class="btn btn-success btn-sm" onclick="exportData()">
                                                <i class="fas fa-download me-1"></i>
                                                Backup JSON
                                            </button>
                                            <button class="btn btn-outline-success btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                                <i class="fas fa-table"></i>
                                            </button>
                                            <ul class="dropdown-menu">
                                                <li><h6 class="dropdown-header">Exportar CSV/Excel</h6></li>
                                                <li><a class="dropdown-item" href="#" onclick="exportarDadosCSV('pessoa_fisica'); return false;">
                                                    <i class="fas fa-user me-2"></i>Pessoas Físicas
                                                </a></li>
                                                <li><a class="dropdown-item" href="#" onclick="exportarDadosCSV('pessoa_juridica'); return false;">
                                                    <i class="fas fa-building me-2"></i>Pessoas Jurídicas
                                                </a></li>
                                                <li><hr class="dropdown-divider"></li>
                                                <li><a class="dropdown-item" href="#" onclick="exportarDadosCSV('completo'); return false;">
                                                    <i class="fas fa-database me-2"></i>Todos os Dados
                                                </a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="userManagementArea" style="display: none;">
                            <hr style="border-color: var(--border-color);">
                            <h6 class="text-warning mb-3">
                                <i class="fas fa-users me-2"></i>
                                Usuários Cadastrados
                            </h6>
                            <div id="usersList"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente se houver
    const existingModal = document.getElementById('adminModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Adicionar ao DOM
    document.body.insertAdjacentHTML('beforeend', adminModalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    modal.show();
}

// Carregar gerenciamento de usuários
function loadUserManagement() {
    const userManagementArea = document.getElementById('userManagementArea');
    const usersList = document.getElementById('usersList');

    // Carregar solicitações pendentes e usuários aprovados
    const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');

    let usersHtml = `
        <!-- Solicitações Pendentes -->
        <div class="mb-4">
            <h6 class="text-warning mb-3">
                <i class="fas fa-clock me-2"></i>
                Solicitações Pendentes (${pendingRequests.length})
            </h6>

            ${pendingRequests.length === 0 ?
                '<p class="text-muted">Nenhuma solicitação pendente.</p>' :
                `<div class="table-responsive">
                    <table class="table table-dark table-sm">
                        <thead>
                            <tr style="background: var(--dark-blue);">
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>E-mail</th>
                                <th>Depto</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingRequests.map(req => `
                                <tr>
                                    <td>
                                        <i class="fas fa-user-clock me-2 text-warning"></i>
                                        ${req.fullName}
                                    </td>
                                    <td><code>${req.username}</code></td>
                                    <td class="small">${req.email}</td>
                                    <td class="small">${req.department}</td>
                                    <td class="small text-muted">
                                        ${new Date(req.requestDate).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td>
                                        <button class="btn btn-success btn-xs me-1" onclick="approveUser('${req.id}')" title="Aprovar usuário">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-info btn-xs me-1" onclick="viewRequest('${req.id}')" title="Ver detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-danger btn-xs" onclick="rejectUser('${req.id}')" title="Rejeitar">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>

        <!-- Usuários Aprovados -->
        <div>
            <h6 class="text-success mb-3">
                <i class="fas fa-users me-2"></i>
                Usuários Aprovados (${approvedUsers.length})
            </h6>

            ${approvedUsers.length === 0 ?
                '<p class="text-muted">Nenhum usuário aprovado ainda.</p>' :
                `<div class="table-responsive">
                    <table class="table table-dark table-sm">
                        <thead>
                            <tr style="background: var(--dark-blue);">
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>E-mail</th>
                                <th>2FA</th>
                                <th>Aprovado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${approvedUsers.map(user => `
                                <tr>
                                    <td>
                                        <i class="fas fa-user-check me-2 text-success"></i>
                                        ${user.fullName}
                                    </td>
                                    <td><code>${user.username}</code></td>
                                    <td class="small">${user.email}</td>
                                    <td>
                                        <span class="badge ${user.twoFactorSecret ? 'bg-success' : 'bg-warning'}">
                                            ${user.twoFactorSecret ? 'Configurado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td class="small text-muted">
                                        ${new Date(user.approvedDate).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td>
                                        <button class="btn btn-info btn-xs me-1" onclick="viewUser('${user.username}')" title="Ver detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${!user.twoFactorSecret ?
                                            `<button class="btn btn-warning btn-xs me-1" onclick="resetTwoFactor('${user.username}')" title="Resetar 2FA">
                                                <i class="fas fa-mobile-alt"></i>
                                            </button>` : ''
                                        }
                                        <button class="btn btn-danger btn-xs" onclick="deleteUser('${user.username}')" title="Excluir usuário">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>
    `;

    usersList.innerHTML = usersHtml;
    userManagementArea.style.display = 'block';
}

// Aprovar usuário
function approveUser(requestId) {
    const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');

    const requestIndex = pendingRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
        alert('Solicitação não encontrada!');
        return;
    }

    const request = pendingRequests[requestIndex];

    if (confirm(`Aprovar acesso para "${request.fullName}" (${request.username})?`)) {
        const approvedUser = {
            username: request.username,
            fullName: request.fullName,
            email: request.email,
            department: request.department,
            passwordHash: request.passwordHash,
            requestDate: request.requestDate,
            approvedDate: new Date().toISOString(),
            approvedBy: 'admin',
            twoFactorSecret: null,
            status: 'active'
        };

        approvedUsers.push(approvedUser);
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));

        pendingRequests.splice(requestIndex, 1);
        localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

        alert(`Usuário "${request.fullName}" aprovado com sucesso!\nEle deve configurar o 2FA no primeiro login.`);

        loadUserManagement();
    }
}

// Rejeitar usuário
function rejectUser(requestId) {
    const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    const requestIndex = pendingRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
        alert('Solicitação não encontrada!');
        return;
    }

    const request = pendingRequests[requestIndex];

    if (confirm(`Rejeitar solicitação de "${request.fullName}"?\n\nEsta ação não pode ser desfeita.`)) {
        pendingRequests.splice(requestIndex, 1);
        localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

        alert(`Solicitação de "${request.fullName}" foi rejeitada.`);

        loadUserManagement();
    }
}

// Ver detalhes da solicitação
function viewRequest(requestId) {
    const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    const request = pendingRequests.find(req => req.id === requestId);

    if (!request) {
        alert('Solicitação não encontrada!');
        return;
    }

    alert(`Detalhes da Solicitação\n\n` +
          `Nome: ${request.fullName}\n` +
          `Usuário: ${request.username}\n` +
          `E-mail: ${request.email}\n` +
          `Departamento: ${request.department}\n` +
          `Data: ${new Date(request.requestDate).toLocaleString('pt-BR')}\n\n` +
          `Justificativa:\n${request.justification}`);
}

// Ver detalhes do usuário
function viewUser(username) {
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
    const user = approvedUsers.find(u => u.username === username);

    if (!user) {
        alert('Usuário não encontrado!');
        return;
    }

    alert(`Detalhes do Usuário\n\n` +
          `Nome: ${user.fullName}\n` +
          `Usuário: ${user.username}\n` +
          `E-mail: ${user.email}\n` +
          `Departamento: ${user.department}\n` +
          `Aprovado em: ${new Date(user.approvedDate).toLocaleString('pt-BR')}\n` +
          `Aprovado por: ${user.approvedBy}\n` +
          `2FA: ${user.twoFactorSecret ? 'Configurado' : 'Não configurado'}\n` +
          `Status: ${user.status === 'active' ? 'Ativo' : 'Inativo'}\n` +
          `Senha: [PROTEGIDA - Não visível por segurança]`);
}

// Resetar 2FA do usuário
function resetTwoFactor(username) {
    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
    const userIndex = approvedUsers.findIndex(u => u.username === username);

    if (userIndex === -1) {
        alert('Usuário não encontrado!');
        return;
    }

    if (confirm(`Resetar configuração 2FA de "${approvedUsers[userIndex].fullName}"?\n\nO usuário precisará configurar novamente.`)) {
        approvedUsers[userIndex].twoFactorSecret = null;
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));

        alert(`2FA resetado! O usuário deve configurar novamente no próximo login.`);

        loadUserManagement();
    }
}

// Excluir usuário
function deleteUser(username) {
    if (username === 'admin') {
        alert('Não é possível excluir o usuário administrativo!');
        return;
    }

    const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
    const userIndex = approvedUsers.findIndex(u => u.username === username);

    if (userIndex === -1) {
        alert('Usuário não encontrado!');
        return;
    }

    const user = approvedUsers[userIndex];

    if (confirm(`Excluir permanentemente "${user.fullName}" (${user.username})?\n\nEsta ação não pode ser desfeita.`)) {
        approvedUsers.splice(userIndex, 1);
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));

        alert(`Usuário "${user.fullName}" foi excluído com sucesso!`);

        loadUserManagement();
    }
}

// Exportar dados
function exportData() {
    const data = {
        pessoas_fisicas: JSON.parse(localStorage.getItem('pessoas_fisicas') || '[]'),
        pessoas_juridicas: JSON.parse(localStorage.getItem('pessoas_juridicas') || '[]'),
        fotos: JSON.parse(localStorage.getItem('fotos') || '[]'),
        exported_at: new Date().toISOString(),
        system: 'Sistema Desktop - Banco de Dados'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Backup exportado com sucesso!');
}

// Função de logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        sessionStorage.removeItem('authData');
        localStorage.removeItem('authData');
        sessionStorage.removeItem('userSession');
        localStorage.removeItem('userSession');

        window.location.href = 'login.html';
    }
}

// Sistema de alternância de tema
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = body.getAttribute('data-theme');

    if (currentTheme === 'light') {
        body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.title = 'Tema Escuro';
        localStorage.setItem('theme', 'dark');
        showNotification('Tema escuro ativado', 'info');
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.title = 'Tema Claro';
        localStorage.setItem('theme', 'light');
        showNotification('Tema claro ativado', 'info');
    }
}

// Carregar tema salvo ao inicializar
document.addEventListener('DOMContentLoaded', function () {
    // PRIMEIRO: Verificar autenticação
    if (!checkAuthentication()) {
        return;
    }

    // SEGUNDO: Configurar tema
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    if (savedTheme === 'light') {
        body.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.title = 'Tema Claro';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.title = 'Tema Escuro';
    }

    // TERCEIRO: Notificação de boas-vindas
    setTimeout(() => {
        const authData = JSON.parse(sessionStorage.getItem('authData') || localStorage.getItem('authData') || '{}');
        if (authData && authData.user) {
            const loginMethod = authData.user.method === 'google' ? 'Google' : 'credenciais';
            showNotification(`Bem-vindo(a), ${authData.user.name || authData.user.username}! Login via ${loginMethod}`, 'success');
        }
    }, 1000);

    console.log('Usuário autenticado - aplicação carregada');
});

// Melhorar sistema de fotos - forçar carregamento
function forcarCarregamentoFotos() {
    const tipoSelect = document.getElementById('tipo-pessoa-foto');
    if (tipoSelect && tipoSelect.value) {
        loadPessoasParaFoto(tipoSelect.value);
    }
}

// Função para forçar fechamento de modal
function forcarFechamentoModal() {
    try {
        // Remover todos os modais ativos
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        });
                
        // Remover todos os backdrops
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.remove();
        });
                
        // Limpar body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
                
        // Destruir todas as instâncias
        document.querySelectorAll('.modal').forEach(modalEl => {
            const instance = bootstrap.Modal.getInstance(modalEl);
            if (instance) {
                instance.dispose();
            }
        });
                
        showNotification('🔓 Interface desbloqueada!', 'success');
        console.log('🆘 Travamento resolvido por função de emergência');
                
    } catch (error) {
        console.error('❌ Erro na função de emergência:', error);
        location.reload();
    }
}


function loadArvoreRelacionamentos() { 
    // Função implementada em arvore-interativa.js
    if (typeof inicializarArvoreInterativa === 'function') {
        inicializarArvoreInterativa();
    }
}