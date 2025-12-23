/**
 * Sistema de Formulários - Cadastro e Listagem
 * Gerencia formulários de pessoa física e jurídica
 */

// Variáveis globais
// editingRecord está declarado em main.js

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    console.log(`📢 [${type.toUpperCase()}] ${message}`);
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    // Definir cor baseada no tipo com melhor contraste
    const colors = {
        success: {bg: '#10b981', text: '#ffffff'},
        error: {bg: '#ef4444', text: '#ffffff'}, 
        warning: {bg: '#f59e0b', text: '#000000'},
        info: {bg: '#3b82f6', text: '#ffffff'}
    };
    
    const colorScheme = colors[type] || colors.info;
    notification.style.backgroundColor = colorScheme.bg;
    
    // Garantir que a cor do texto seja sempre visível com contraste perfeito
    notification.style.color = colorScheme.text;
    notification.style.fontWeight = '700';
    notification.style.textShadow = type === 'warning' ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2em;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
    
    // Permitir fechar clicando
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Função para atualizar barra de status (se existir)
function updateStatusBar(message) {
    console.log(`📊 Status: ${message}`);
    
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
    }
}

// Função para carregar dashboard (se existir)
function loadDashboard() {
    console.log('🏠 Carregando dashboard...');
    
    try {
        // Verificar se existe função específica do dashboard
        if (typeof loadMainDashboard === 'function') {
            loadMainDashboard();
            return;
        }
        
        // Atualizar contadores se existirem elementos
        const pfCount = document.getElementById('pf-count');
        const pjCount = document.getElementById('pj-count');
        
        if (pfCount && typeof db !== 'undefined') {
            pfCount.textContent = db.count('pessoa_fisica');
        }
        
        if (pjCount && typeof db !== 'undefined') {
            pjCount.textContent = db.count('pessoa_juridica');
        }
        
        console.log('✅ Dashboard atualizado');
        
    } catch (error) {
        console.warn('⚠️ Erro ao carregar dashboard:', error);
    }
}

// Função para validar CPF
function validarCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto < 2 ? 0 : resto;
    
    // Verifica o primeiro dígito
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;
    
    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto < 2 ? 0 : resto;
    
    // Verifica o segundo dígito
    return parseInt(cpf.charAt(10)) === digitoVerificador2;
}

// Função para validar CNPJ
function validarCNPJ(cnpj) {
    if (!cnpj) return false;
    
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Calcula o primeiro dígito verificador
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
    
    // Calcula o segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos.charAt(1));
}

// Função para aplicar máscaras nos campos
function applyMasks() {
    console.log('🎭 Aplicando máscaras nos campos...');
    
    try {
        // Máscara para CPF
        document.querySelectorAll('input[id*="cpf"]').forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    this.value = value;
                }
            });
        });
        
        // Máscara para CNPJ
        document.querySelectorAll('input[id*="cnpj"]').forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length <= 14) {
                    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    this.value = value;
                }
            });
        });
        
        // Máscara para telefone
        document.querySelectorAll('input[id*="telefone"]').forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    if (value.length === 11) {
                        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                    } else if (value.length === 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                    } else if (value.length >= 6) {
                        value = value.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
                    } else if (value.length >= 2) {
                        value = value.replace(/(\d{2})(\d+)/, '($1) $2');
                    }
                    this.value = value;
                }
            });
        });
        
        console.log('✅ Máscaras aplicadas com sucesso');
        
    } catch (error) {
        console.warn('⚠️ Erro ao aplicar máscaras:', error);
    }
}

// Funções auxiliares para evitar erros
// showSection está implementada em main.js

function fecharModalSimples() {
    console.log('🔒 Fechando modal...');
    // Fechar qualquer modal Bootstrap aberto
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        const modalInstance = bootstrap?.Modal?.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    });
}

function buscarPorGOANaArvore(goa) {
    console.log(`🔍 Buscando GOA na árvore: ${goa}`);
    // Esta função será implementada pelo sistema principal
    if (typeof window.buscarPorGOANaArvore === 'function') {
        window.buscarPorGOANaArvore(goa);
    }
}

// Funções para gerar CPF e CNPJ válidos nos formulários
function gerarCPFValido() {
    let cpf = '';
    
    // Gerar os 9 primeiros dígitos
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10);
    }
    
    // Calcular primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto < 2 ? 0 : resto;
    cpf += dv1;
    
    // Calcular segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let dv2 = resto < 2 ? 0 : resto;
    cpf += dv2;
    
    return cpf;
}

function gerarCNPJValido() {
    let cnpj = '';
    
    // Gerar os 12 primeiros dígitos
    for (let i = 0; i < 8; i++) {
        cnpj += Math.floor(Math.random() * 10);
    }
    cnpj += '0001'; // Matriz
    
    // Calcular primeiro dígito verificador
    let soma = 0;
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
        soma += parseInt(cnpj.charAt(i)) * pesos1[i];
    }
    let resto = soma % 11;
    let dv1 = resto < 2 ? 0 : 11 - resto;
    cnpj += dv1;
    
    // Calcular segundo dígito verificador
    soma = 0;
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
        soma += parseInt(cnpj.charAt(i)) * pesos2[i];
    }
    resto = soma % 11;
    let dv2 = resto < 2 ? 0 : 11 - resto;
    cnpj += dv2;
    
    return cnpj;
}

function formatarCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCNPJ(cnpj) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function gerarCPFParaFormulario(campoId) {
    const cpf = gerarCPFValido();
    const cpfFormatado = formatarCPF(cpf);
    const campo = document.getElementById(campoId);
    
    if (campo) {
        campo.value = cpfFormatado;
        console.log(`✅ CPF gerado para ${campoId}: ${cpfFormatado}`);
        showNotification('✅ CPF válido gerado automaticamente!', 'success');
        
        // Aplicar máscara se existir
        if (typeof applyMasks === 'function') {
            applyMasks();
        }
    }
}

function gerarCNPJParaFormulario(campoId) {
    const cnpj = gerarCNPJValido();
    const cnpjFormatado = formatarCNPJ(cnpj);
    const campo = document.getElementById(campoId);
    
    if (campo) {
        campo.value = cnpjFormatado;
        console.log(`✅ CNPJ gerado para ${campoId}: ${cnpjFormatado}`);
        showNotification('✅ CNPJ válido gerado automaticamente!', 'success');
        
        // Aplicar máscara se existir
        if (typeof applyMasks === 'function') {
            applyMasks();
        }
    }
}

// Carregar formulário de pessoa física
function loadFormPessoaFisica() {
    const formContainer = document.getElementById('form-container-pf');
    if (!formContainer) return;

    formContainer.innerHTML = `
        <div class="row">
            <div class="col-md-2 mb-3">
                <label for="pf-goa" class="form-label">GOA</label>
                <input type="text" class="form-control" id="pf-goa" placeholder="Digite qualquer código GOA">
                <div class="form-text">
                    <small class="text-success">Campo livre - Digite qualquer código</small>
                    <div id="pf-goa-status" class="mt-1"></div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <label for="pf-nome" class="form-label">Nome Completo *</label>
                <input type="text" class="form-control" id="pf-nome" required>
            </div>
            <div class="col-md-2 mb-3">
                <label for="pf-cpf" class="form-label">CPF *</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="pf-cpf" required maxlength="14" placeholder="000.000.000-00">
                    <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCPFParaFormulario('pf-cpf')" title="Gerar CPF válido">
                        <i class="fas fa-magic"></i>
                    </button>
                </div>
                <small class="text-muted">Clique no botão para gerar um CPF válido</small>
            </div>
            <div class="col-md-2 mb-3">
                <label for="pf-rg" class="form-label">RG</label>
                <input type="text" class="form-control" id="pf-rg">
            </div>
        </div>

        <div class="row">
            <div class="col-md-3 mb-3">
                <label for="pf-nascimento" class="form-label">Data de Nascimento</label>
                <input type="date" class="form-control" id="pf-nascimento">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pf-mae" class="form-label">Nome da Mãe</label>
                <input type="text" class="form-control" id="pf-mae">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pf-pai" class="form-label">Nome do Pai</label>
                <input type="text" class="form-control" id="pf-pai">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pf-naturalidade" class="form-label">Naturalidade</label>
                <input type="text" class="form-control" id="pf-naturalidade" placeholder="Cidade, UF">
            </div>
        </div>

        <div class="row">
            <div class="col-md-3 mb-3">
                <label for="pf-sexo" class="form-label">Sexo</label>
                <select class="form-select" id="pf-sexo">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>
            <div class="col-md-3 mb-3">
                <label for="pf-estado-civil" class="form-label">Estado Civil</label>
                <select class="form-select" id="pf-estado-civil">
                    <option value="">Selecione...</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                </select>
            </div>
            <div class="col-md-3 mb-3">
                <label for="pf-telefone1" class="form-label">Telefone 1</label>
                <input type="text" class="form-control" id="pf-telefone1" placeholder="(00) 00000-0000">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pf-telefone2" class="form-label">Telefone 2</label>
                <input type="text" class="form-control" id="pf-telefone2" placeholder="(00) 00000-0000">
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pf-ocupacao" class="form-label">Ocupação</label>
                <input type="text" class="form-control" id="pf-ocupacao">
            </div>
            <div class="col-md-6 mb-3">
                <label for="pf-vinculo" class="form-label">Vínculo</label>
                <input type="text" class="form-control" id="pf-vinculo">
            </div>
        </div>

        <div class="row">
            <div class="col-md-12 mb-3">
                <label class="form-label">Filhos</label>
                <div id="filhos-container">
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho1-nome" placeholder="Nome do filho 1">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho1-cpf" placeholder="CPF do filho 1" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho2-nome" placeholder="Nome do filho 2">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho2-cpf" placeholder="CPF do filho 2" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho3-nome" placeholder="Nome do filho 3">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho3-cpf" placeholder="CPF do filho 3" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho4-nome" placeholder="Nome do filho 4">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho4-cpf" placeholder="CPF do filho 4" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho5-nome" placeholder="Nome do filho 5">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-filho5-cpf" placeholder="CPF do filho 5" maxlength="14">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3">Irmãos</h5>
        <div class="row">
            <div class="col-12 mb-3">
                <label class="form-label">Irmãos</label>
                <div id="irmaos-container">
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao1-nome" placeholder="Nome do irmão 1">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao1-cpf" placeholder="CPF do irmão 1" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao2-nome" placeholder="Nome do irmão 2">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao2-cpf" placeholder="CPF do irmão 2" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao3-nome" placeholder="Nome do irmão 3">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao3-cpf" placeholder="CPF do irmão 3" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao4-nome" placeholder="Nome do irmão 4">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao4-cpf" placeholder="CPF do irmão 4" maxlength="14">
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao5-nome" placeholder="Nome do irmão 5">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="pf-irmao5-cpf" placeholder="CPF do irmão 5" maxlength="14">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3">Endereços</h5>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pf-endereco1" class="form-label">Endereço 1</label>
                <input type="text" class="form-control" id="pf-endereco1">
            </div>
            <div class="col-md-6 mb-3">
                <label for="pf-endereco2" class="form-label">Endereço 2</label>
                <input type="text" class="form-control" id="pf-endereco2">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pf-endereco3" class="form-label">Endereço 3</label>
                <input type="text" class="form-control" id="pf-endereco3">
            </div>
            <div class="col-md-6 mb-3">
                <label for="pf-endereco4" class="form-label">Endereço 4</label>
                <input type="text" class="form-control" id="pf-endereco4">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pf-endereco5" class="form-label">Endereço 5</label>
                <input type="text" class="form-control" id="pf-endereco5">
            </div>
            <div class="col-md-6 mb-3">
                <label for="pf-endereco6" class="form-label">Endereço 6</label>
                <input type="text" class="form-control" id="pf-endereco6">
            </div>
        </div>

        <h5 class="mt-4 mb-3">Informações Empresariais</h5>
        <div class="row mb-3">
            <div class="col-md-2">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="pf-possui-empresa">
                    <label class="form-check-label" for="pf-possui-empresa">
                        Possui Empresa
                    </label>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 1 -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 1</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa1-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa1-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa1-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa1-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa1-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa1-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa1-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa1-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa1-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa1-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa1-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa1-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa1-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa1-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa1-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa1-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa1-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 2 -->
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 2</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa2-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa2-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa2-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa2-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa2-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa2-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa2-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa2-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa2-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa2-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa2-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa2-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa2-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa2-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa2-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa2-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa2-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 3 -->
        <div class="card mb-4">
            <div class="card-header bg-warning text-dark">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 3</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa3-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa3-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa3-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa3-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa3-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa3-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa3-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa3-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa3-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa3-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa3-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa3-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa3-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa3-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa3-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa3-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa3-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 4 -->
        <div class="card mb-4">
            <div class="card-header bg-info text-white">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 4</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa4-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa4-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa4-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa4-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa4-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa4-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa4-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa4-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa4-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa4-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa4-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa4-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa4-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa4-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa4-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa4-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa4-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 5 -->
        <div class="card mb-4">
            <div class="card-header bg-secondary text-white">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 5</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa5-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa5-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa5-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa5-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa5-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa5-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa5-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa5-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa5-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa5-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa5-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa5-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa5-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa5-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa5-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa5-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa5-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 6 -->
        <div class="card mb-4">
            <div class="card-header bg-dark text-white">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 6</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa6-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa6-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa6-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa6-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa6-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa6-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa6-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa6-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa6-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa6-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa6-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa6-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa6-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa6-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa6-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa6-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa6-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 7 -->
        <div class="card mb-4">
            <div class="card-header bg-danger text-white">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 7</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa7-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa7-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa7-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa7-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa7-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa7-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa7-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa7-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa7-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa7-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa7-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa7-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa7-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa7-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa7-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa7-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa7-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EMPRESA 8 -->
        <div class="card mb-4">
            <div class="card-header" style="background-color: #6f42c1; color: white;">
                <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresa 8</h6>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="pf-empresa8-razao" class="form-label">Razão Social</label>
                        <input type="text" class="form-control" id="pf-empresa8-razao">
                    </div>
                    <div class="col-md-4">
                        <label for="pf-empresa8-cnpj" class="form-label">CNPJ</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="pf-empresa8-cnpj" placeholder="00.000.000/0000-00">
                            <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pf-empresa8-cnpj')">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <label for="pf-empresa8-participacao" class="form-label">Participação</label>
                        <select class="form-select" id="pf-empresa8-participacao">
                            <option value="">Selecione...</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="25%">25%</option>
                            <option value="33%">33%</option>
                            <option value="75%">75%</option>
                        </select>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label for="pf-empresa8-endereco" class="form-label">Endereço</label>
                        <input type="text" class="form-control" id="pf-empresa8-endereco">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa8-socio1-nome" class="form-label">Sócio 1 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa8-socio1-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa8-socio1-cpf" class="form-label">Sócio 1 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa8-socio1-cpf" maxlength="14">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <label for="pf-empresa8-socio2-nome" class="form-label">Sócio 2 - Nome</label>
                        <input type="text" class="form-control" id="pf-empresa8-socio2-nome">
                    </div>
                    <div class="col-md-6">
                        <label for="pf-empresa8-socio2-cpf" class="form-label">Sócio 2 - CPF</label>
                        <input type="text" class="form-control" id="pf-empresa8-socio2-cpf" maxlength="14">
                    </div>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3">Informações Veiculares</h5>
        <div class="row">
            <div class="col-md-2 mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="pf-possui-veiculos">
                    <label class="form-check-label" for="pf-possui-veiculos">
                        Possui Veículos
                    </label>
                </div>
            </div>
            <div class="col-md-2 mb-3">
                <label for="pf-placa" class="form-label">Placa</label>
                <input type="text" class="form-control" id="pf-placa" placeholder="ABC1234">
            </div>
            <div class="col-md-4 mb-3">
                <label for="pf-marca-modelo" class="form-label">Marca/Modelo</label>
                <input type="text" class="form-control" id="pf-marca-modelo">
            </div>
            <div class="col-md-2 mb-3">
                <label for="pf-ano" class="form-label">Ano</label>
                <input type="number" class="form-control" id="pf-ano" min="1900" max="2030">
            </div>
            <div class="col-md-2 mb-3">
                <label for="pf-cor" class="form-label">Cor</label>
                <input type="text" class="form-control" id="pf-cor">
            </div>
        </div>

        <div class="row">
            <div class="col-12 mb-3">
                <label for="pf-observacoes" class="form-label">Observações</label>
                <textarea class="form-control" id="pf-observacoes" rows="4"></textarea>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <button type="submit" class="btn btn-primary me-2">
                    <i class="fas fa-save me-1"></i>Salvar
                </button>
                <button type="button" class="btn btn-secondary me-2" onclick="clearFormPF()">
                    <i class="fas fa-times me-1"></i>Limpar
                </button>
                <button type="button" class="btn btn-info" onclick="showSection('listar-pf')">
                    <i class="fas fa-list me-1"></i>Ver Lista
                </button>
            </div>
        </div>
    `;

    // Aplicar máscaras
    applyMasks();
    
    // GOA agora é livre - sem validação em tempo real
    const goaInput = document.getElementById('pf-goa');
    if (goaInput) {
        goaInput.addEventListener('input', function() {
            const statusDiv = document.getElementById('pf-goa-status');
            if (statusDiv) {
                statusDiv.innerHTML = '<small class="text-success"><i class="fas fa-check me-1"></i>Código aceito</small>';
            }
        });
    }
}

// Carregar formulário de pessoa jurídica
function loadFormPessoaJuridica() {
    const formContainer = document.getElementById('form-container-pj');
    if (!formContainer) return;

    formContainer.innerHTML = `
        <div class="row">
            <div class="col-md-5 mb-3">
                <label for="pj-razao-social" class="form-label">Razão Social *</label>
                <input type="text" class="form-control" id="pj-razao-social" required>
            </div>
            <div class="col-md-5 mb-3">
                <label for="pj-nome-fantasia" class="form-label">Nome Fantasia</label>
                <input type="text" class="form-control" id="pj-nome-fantasia">
            </div>
            <div class="col-md-2 mb-3">
                <label for="pj-goa" class="form-label">GOA</label>
                <input type="text" class="form-control" id="pj-goa" placeholder="Digite qualquer código GOA">
                <div class="form-text">
                    <small class="text-success">Campo livre - Digite qualquer código</small>
                </div>
                <div id="pj-goa-status" class="mt-1"></div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-4 mb-3">
                <label for="pj-cnpj" class="form-label">CNPJ *</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="pj-cnpj" required maxlength="18" placeholder="00.000.000/0000-00">
                    <button class="btn btn-outline-success btn-sm" type="button" onclick="gerarCNPJParaFormulario('pj-cnpj')" title="Gerar CNPJ válido">
                        <i class="fas fa-magic"></i>
                    </button>
                </div>
                <small class="text-muted">Clique no botão para gerar um CNPJ válido</small>
            </div>
            <div class="col-md-4 mb-3">
                <label for="pj-situacao" class="form-label">Situação</label>
                <select class="form-select" id="pj-situacao">
                    <option value="">Selecione...</option>
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                    <option value="Suspensa">Suspensa</option>
                    <option value="Baixada">Baixada</option>
                </select>
            </div>
            <div class="col-md-4 mb-3">
                <label for="pj-tipo" class="form-label">Tipo de Empresa</label>
                <input type="text" class="form-control" id="pj-tipo" placeholder="Ltda, S.A., MEI...">
            </div>
        </div>

        <div class="row">
            <div class="col-md-4 mb-3">
                <label for="pj-data-abertura" class="form-label">Data de Abertura</label>
                <input type="date" class="form-control" id="pj-data-abertura">
            </div>
            <div class="col-md-4 mb-3">
                <label for="pj-capital-social" class="form-label">Capital Social</label>
                <input type="number" class="form-control" id="pj-capital-social" placeholder="0.00" step="0.01">
            </div>
            <div class="col-md-4 mb-3">
                <label for="pj-cidade" class="form-label">Cidade</label>
                <input type="text" class="form-control" id="pj-cidade">
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pj-porte" class="form-label">Porte da Empresa</label>
                <input type="text" class="form-control" id="pj-porte" placeholder="ME, EPP, MEI, LTDA, S.A...">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pj-data-fechamento" class="form-label">Data de Fechamento</label>
                <input type="date" class="form-control" id="pj-data-fechamento">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pj-data-situacao-cadastral" class="form-label">Data Situação Cadastral</label>
                <input type="date" class="form-control" id="pj-data-situacao-cadastral">
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pj-cnae" class="form-label">CNAE Principal</label>
                <input type="text" class="form-control" id="pj-cnae" placeholder="Ex: 62.01-5-01">
            </div>
            <div class="col-md-6 mb-3">
                <label for="pj-email" class="form-label">E-mail</label>
                <input type="email" class="form-control" id="pj-email" placeholder="email@empresa.com.br">
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="pj-endereco" class="form-label">Logradouro / Endereço</label>
                <input type="text" class="form-control" id="pj-endereco">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pj-cep" class="form-label">CEP</label>
                <input type="text" class="form-control" id="pj-cep" placeholder="00000-000">
            </div>
            <div class="col-md-3 mb-3">
                <label for="pj-telefone1" class="form-label">Telefone 1</label>
                <input type="text" class="form-control" id="pj-telefone1" placeholder="(00) 00000-0000">
            </div>
        </div>

        <div class="row">
            <div class="col-md-3 mb-3">
                <label for="pj-telefone2" class="form-label">Telefone 2</label>
                <input type="text" class="form-control" id="pj-telefone2" placeholder="(00) 00000-0000">
            </div>
        </div>

        <h5 class="mt-4 mb-3">Informações de Filial</h5>
        <div class="row">
            <div class="col-md-2 mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="pj-possui-filial">
                    <label class="form-check-label" for="pj-possui-filial">
                        Possui Filial
                    </label>
                </div>
            </div>
            <div class="col-md-5 mb-3">
                <label for="pj-endereco-filial" class="form-label">Endereço da Filial</label>
                <input type="text" class="form-control" id="pj-endereco-filial">
            </div>
            <div class="col-md-5 mb-3">
                <label for="pj-cidade-filial" class="form-label">Cidade da Filial</label>
                <input type="text" class="form-control" id="pj-cidade-filial">
            </div>
        </div>

        <h5 class="mt-4 mb-3">Informações Fiscais (Simples Nacional / MEI)</h5>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label for="pj-simples-situacao" class="form-label">Situação Simples Nacional</label>
                <select class="form-select" id="pj-simples-situacao">
                    <option value="">Selecione...</option>
                    <option value="Nao Optante">Não Optante</option>
                    <option value="Optante">Optante</option>
                    <option value="Excluida">Excluída</option>
                </select>
            </div>
            <div class="col-md-4 mb-3">
                <label for="pj-data-opcao-simples" class="form-label">Data Opção Simples</label>
                <input type="date" class="form-control" id="pj-data-opcao-simples">
            </div>
            <div class="col-md-4 mb-3">
                <label for="pj-data-exclusao-simples" class="form-label">Data Exclusão Simples</label>
                <input type="date" class="form-control" id="pj-data-exclusao-simples">
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-3">
                <div class="form-check mt-4">
                    <input class="form-check-input" type="checkbox" id="pj-mei">
                    <label class="form-check-label" for="pj-mei">
                        Empresa MEI
                    </label>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3">Sócios da Empresa</h5>
        <div id="socios-container">
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio1-nome" class="form-label">Nome do Sócio 1</label>
                    <input type="text" class="form-control" id="pj-socio1-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio1-cpf" class="form-label">CPF do Sócio 1</label>
                    <input type="text" class="form-control" id="pj-socio1-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio2-nome" class="form-label">Nome do Sócio 2</label>
                    <input type="text" class="form-control" id="pj-socio2-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio2-cpf" class="form-label">CPF do Sócio 2</label>
                    <input type="text" class="form-control" id="pj-socio2-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio3-nome" class="form-label">Nome do Sócio 3</label>
                    <input type="text" class="form-control" id="pj-socio3-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio3-cpf" class="form-label">CPF do Sócio 3</label>
                    <input type="text" class="form-control" id="pj-socio3-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio4-nome" class="form-label">Nome do Sócio 4</label>
                    <input type="text" class="form-control" id="pj-socio4-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio4-cpf" class="form-label">CPF do Sócio 4</label>
                    <input type="text" class="form-control" id="pj-socio4-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio5-nome" class="form-label">Nome do Sócio 5</label>
                    <input type="text" class="form-control" id="pj-socio5-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio5-cpf" class="form-label">CPF do Sócio 5</label>
                    <input type="text" class="form-control" id="pj-socio5-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio6-nome" class="form-label">Nome do Sócio 6</label>
                    <input type="text" class="form-control" id="pj-socio6-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio6-cpf" class="form-label">CPF do Sócio 6</label>
                    <input type="text" class="form-control" id="pj-socio6-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio7-nome" class="form-label">Nome do Sócio 7</label>
                    <input type="text" class="form-control" id="pj-socio7-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio7-cpf" class="form-label">CPF do Sócio 7</label>
                    <input type="text" class="form-control" id="pj-socio7-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label for="pj-socio8-nome" class="form-label">Nome do Sócio 8</label>
                    <input type="text" class="form-control" id="pj-socio8-nome" placeholder="Nome completo do sócio">
                </div>
                <div class="col-md-6">
                    <label for="pj-socio8-cpf" class="form-label">CPF do Sócio 8</label>
                    <input type="text" class="form-control" id="pj-socio8-cpf" placeholder="000.000.000-00" maxlength="14">
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12 mb-3">
                <label for="pj-observacoes" class="form-label">Observações</label>
                <textarea class="form-control" id="pj-observacoes" rows="4"></textarea>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <button type="submit" class="btn btn-primary me-2">
                    <i class="fas fa-save me-1"></i>Salvar
                </button>
                <button type="button" class="btn btn-secondary me-2" onclick="clearFormPJ()">
                    <i class="fas fa-times me-1"></i>Limpar
                </button>
                <button type="button" class="btn btn-info" onclick="showSection('listar-pj')">
                    <i class="fas fa-list me-1"></i>Ver Lista
                </button>
            </div>
        </div>
    `;

    // Aplicar máscaras
    applyMasks();
    
    // GOA agora é livre - sem validação em tempo real
    const goaInput = document.getElementById('pj-goa');
    if (goaInput) {
        goaInput.addEventListener('input', function() {
            const statusDiv = document.getElementById('pj-goa-status');
            if (statusDiv) {
                statusDiv.innerHTML = '<small class="text-success"><i class="fas fa-check me-1"></i>Código aceito</small>';
            }
        });
    }
    
    // Configurar evento de submit
    formContainer.addEventListener('submit', function(e) {
        e.preventDefault();
        salvarPessoaJuridica();
    });
}

// Salvar pessoa física
function salvarPessoaFisica() {
    try {
        const goa = document.getElementById('pf-goa').value.trim();
        
        // GOA é agora livre - sem validações ou restrições
        console.log('✨ GOA aceito (PF):', goa || '(vazio)');
        
        const formData = {
            goa: goa,
            nome: document.getElementById('pf-nome').value,
            cpf: document.getElementById('pf-cpf').value.replace(/\D/g, ''),
            rg: document.getElementById('pf-rg').value,
            nascimento: document.getElementById('pf-nascimento').value,
            mae: document.getElementById('pf-mae').value,
            pai: document.getElementById('pf-pai').value,
            filhos: {
                filho1: {
                    nome: document.getElementById('pf-filho1-nome').value,
                    cpf: document.getElementById('pf-filho1-cpf').value
                },
                filho2: {
                    nome: document.getElementById('pf-filho2-nome').value,
                    cpf: document.getElementById('pf-filho2-cpf').value
                },
                filho3: {
                    nome: document.getElementById('pf-filho3-nome').value,
                    cpf: document.getElementById('pf-filho3-cpf').value
                },
                filho4: {
                    nome: document.getElementById('pf-filho4-nome').value,
                    cpf: document.getElementById('pf-filho4-cpf').value
                },
                filho5: {
                    nome: document.getElementById('pf-filho5-nome').value,
                    cpf: document.getElementById('pf-filho5-cpf').value
                }
            },
            irmaos: {
                irmao1: {
                    nome: document.getElementById('pf-irmao1-nome').value,
                    cpf: document.getElementById('pf-irmao1-cpf').value
                },
                irmao2: {
                    nome: document.getElementById('pf-irmao2-nome').value,
                    cpf: document.getElementById('pf-irmao2-cpf').value
                },
                irmao3: {
                    nome: document.getElementById('pf-irmao3-nome').value,
                    cpf: document.getElementById('pf-irmao3-cpf').value
                },
                irmao4: {
                    nome: document.getElementById('pf-irmao4-nome').value,
                    cpf: document.getElementById('pf-irmao4-cpf').value
                },
                irmao5: {
                    nome: document.getElementById('pf-irmao5-nome').value,
                    cpf: document.getElementById('pf-irmao5-cpf').value
                }
            },
            naturalidade: document.getElementById('pf-naturalidade').value,
            sexo: document.getElementById('pf-sexo').value,
            estado_civil: document.getElementById('pf-estado-civil').value,
            telefone1: document.getElementById('pf-telefone1').value,
            telefone2: document.getElementById('pf-telefone2').value,
            ocupacao: document.getElementById('pf-ocupacao').value,
            vinculo: document.getElementById('pf-vinculo').value,
            endereco1: document.getElementById('pf-endereco1').value,
            endereco2: document.getElementById('pf-endereco2').value,
            endereco3: document.getElementById('pf-endereco3').value,
            endereco4: document.getElementById('pf-endereco4').value,
            endereco5: document.getElementById('pf-endereco5').value,
            endereco6: document.getElementById('pf-endereco6').value,
            possui_empresa: document.getElementById('pf-possui-empresa').checked,
            empresas: {
                empresa1: {
                    razao_social: document.getElementById('pf-empresa1-razao').value,
                    cnpj: document.getElementById('pf-empresa1-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa1-participacao').value,
                    endereco: document.getElementById('pf-empresa1-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa1-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa1-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa1-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa1-socio2-cpf').value
                        }
                    }
                },
                empresa2: {
                    razao_social: document.getElementById('pf-empresa2-razao').value,
                    cnpj: document.getElementById('pf-empresa2-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa2-participacao').value,
                    endereco: document.getElementById('pf-empresa2-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa2-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa2-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa2-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa2-socio2-cpf').value
                        }
                    }
                },
                empresa3: {
                    razao_social: document.getElementById('pf-empresa3-razao').value,
                    cnpj: document.getElementById('pf-empresa3-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa3-participacao').value,
                    endereco: document.getElementById('pf-empresa3-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa3-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa3-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa3-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa3-socio2-cpf').value
                        }
                    }
                },
                empresa4: {
                    razao_social: document.getElementById('pf-empresa4-razao').value,
                    cnpj: document.getElementById('pf-empresa4-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa4-participacao').value,
                    endereco: document.getElementById('pf-empresa4-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa4-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa4-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa4-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa4-socio2-cpf').value
                        }
                    }
                },
                empresa5: {
                    razao_social: document.getElementById('pf-empresa5-razao').value,
                    cnpj: document.getElementById('pf-empresa5-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa5-participacao').value,
                    endereco: document.getElementById('pf-empresa5-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa5-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa5-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa5-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa5-socio2-cpf').value
                        }
                    }
                },
                empresa6: {
                    razao_social: document.getElementById('pf-empresa6-razao').value,
                    cnpj: document.getElementById('pf-empresa6-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa6-participacao').value,
                    endereco: document.getElementById('pf-empresa6-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa6-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa6-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa6-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa6-socio2-cpf').value
                        }
                    }
                },
                empresa7: {
                    razao_social: document.getElementById('pf-empresa7-razao').value,
                    cnpj: document.getElementById('pf-empresa7-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa7-participacao').value,
                    endereco: document.getElementById('pf-empresa7-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa7-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa7-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa7-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa7-socio2-cpf').value
                        }
                    }
                },
                empresa8: {
                    razao_social: document.getElementById('pf-empresa8-razao').value,
                    cnpj: document.getElementById('pf-empresa8-cnpj').value.replace(/\D/g, ''),
                    participacao: document.getElementById('pf-empresa8-participacao').value,
                    endereco: document.getElementById('pf-empresa8-endereco').value,
                    socios: {
                        socio1: {
                            nome: document.getElementById('pf-empresa8-socio1-nome').value,
                            cpf: document.getElementById('pf-empresa8-socio1-cpf').value
                        },
                        socio2: {
                            nome: document.getElementById('pf-empresa8-socio2-nome').value,
                            cpf: document.getElementById('pf-empresa8-socio2-cpf').value
                        }
                    }
                }
            },
            observacoes: document.getElementById('pf-observacoes').value,
            possui_veiculos: document.getElementById('pf-possui-veiculos').checked,
            placa: document.getElementById('pf-placa').value,
            marca_modelo: document.getElementById('pf-marca-modelo').value,
            ano: parseInt(document.getElementById('pf-ano').value) || null,
            cor: document.getElementById('pf-cor').value
        };

        // Validar CPF - Aceitar qualquer CPF com 11 dígitos (incluindo CPFs reais)
        if (formData.cpf) {
            const cpfLimpo = formData.cpf.replace(/\D/g, '');
            if (cpfLimpo.length !== 11) {
                showNotification('❌ CPF deve ter 11 dígitos!', 'error');
                return;
            }
            
            // Verificar se todos os dígitos são iguais
            if (/^(\d)\1{10}$/.test(cpfLimpo)) {
                showNotification('❌ CPF inválido! Todos os dígitos não podem ser iguais.', 'error');
                return;
            }
            
            // Validação matemática opcional - aceita qualquer CPF que não seja óbvio
            if (!validarCPF(formData.cpf)) {
                console.log('⚠️ CPF não passou na validação matemática, mas será aceito:', formData.cpf);
                console.log('ℹ️ Muitos CPFs reais podem não passar na validação rigorosa devido a variações regionais');
            }
        }

        // Validar CNPJ da empresa - Aceitar qualquer CNPJ com 14 dígitos
        if (formData.cnpj_empresa) {
            const cnpjLimpo = formData.cnpj_empresa.replace(/\D/g, '');
            if (cnpjLimpo.length !== 14) {
                showNotification('❌ CNPJ da empresa deve ter 14 dígitos!', 'error');
                return;
            }
            
            if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
                showNotification('❌ CNPJ da empresa inválido! Todos os dígitos não podem ser iguais.', 'error');
                return;
            }
            
            if (!validarCNPJ(formData.cnpj_empresa)) {
                console.log('⚠️ CNPJ da empresa não passou na validação matemática, mas será aceito:', formData.cnpj_empresa);
            }
        }

        if (editingRecord && editingRecord.table === 'pessoa_fisica') {
            // Atualizar registro existente
            db.update('pessoa_fisica', editingRecord.id, formData);
            showNotification('Pessoa física atualizada com sucesso!', 'success');
            editingRecord = null;
        } else {
            // Validar se há dados mínimos preenchidos (evita salvar formulários vazios)
            const dadosMinimos = formData.nome && formData.nome.trim() !== '';
            
            if (!dadosMinimos) {
                showNotification('❌ Preencha pelo menos o nome antes de salvar!', 'warning');
                console.log('⚠️ Tentativa de salvar formulário vazio rejeitada');
                return;
            }
            
            // Inserir novo registro
            console.log('💾 Tentando salvar pessoa física:', formData);
            
            if (typeof db === 'undefined') {
                console.error('❌ Objeto db não está definido!');
                console.log('🔍 Verificando objetos disponíveis:', typeof LocalDatabase, typeof window.db);
                showNotification('Erro: Sistema de banco de dados não carregado', 'error');
                return;
            }
            
            console.log('🗄️ Objeto db disponível:', db);
            console.log('🗄️ Tabela pessoa_fisica existe?', db.data?.pessoa_fisica);
            
            const result = db.insert('pessoa_fisica', formData);
            console.log('✅ Pessoa física salva:', result);
            console.log('📊 Estado atual da tabela:', db.getAll('pessoa_fisica'));
            showNotification('Pessoa física cadastrada com sucesso!', 'success');
        }

        clearFormPF();
        loadDashboard();
        updateStatusBar('Pessoa física salva');
    } catch (error) {
        console.error('Erro ao salvar pessoa física:', error);
        showNotification('Erro ao salvar pessoa física', 'error');
    }
}

// Salvar pessoa jurídica
function salvarPessoaJuridica() {
    try {
        const goa = document.getElementById('pj-goa').value.trim();
        
        // GOA é agora livre - sem validações ou restrições
        console.log('✨ GOA aceito (PJ):', goa || '(vazio)');

        const formData = {
            goa: goa,
            razao_social: document.getElementById('pj-razao-social').value,
            nome_fantasia: document.getElementById('pj-nome-fantasia').value,
            cnpj: document.getElementById('pj-cnpj').value.replace(/\D/g, ''),
            situacao: document.getElementById('pj-situacao').value,
            tipo: document.getElementById('pj-tipo').value,
            data_abertura: document.getElementById('pj-data-abertura').value,
            capital_social: parseFloat(document.getElementById('pj-capital-social').value) || 0,
            cidade: document.getElementById('pj-cidade').value,
            // Novos campos relacionados ao XLS / Receita
            porte_empresa: document.getElementById('pj-porte')?.value || '',
            data_fechamento: document.getElementById('pj-data-fechamento')?.value || '',
            data_situacao_cadastral: document.getElementById('pj-data-situacao-cadastral')?.value || '',
            cnae_principal: document.getElementById('pj-cnae')?.value || '',
            email: document.getElementById('pj-email')?.value || '',
            cep: document.getElementById('pj-cep')?.value || '',
            telefone1: document.getElementById('pj-telefone1')?.value || '',
            telefone2: document.getElementById('pj-telefone2')?.value || '',
            situacao_simples_nacional: document.getElementById('pj-simples-situacao')?.value || '',
            data_opcao_simples: document.getElementById('pj-data-opcao-simples')?.value || '',
            data_exclusao_simples: document.getElementById('pj-data-exclusao-simples')?.value || '',
            mei: document.getElementById('pj-mei')?.checked || false,
            // Endereço principal
            endereco: document.getElementById('pj-endereco').value,
            possui_filial: document.getElementById('pj-possui-filial').checked,
            endereco_filial: document.getElementById('pj-endereco-filial').value,
            cidade_filial: document.getElementById('pj-cidade-filial').value,
            socios: {
                socio1: {
                    nome: document.getElementById('pj-socio1-nome').value,
                    cpf: document.getElementById('pj-socio1-cpf').value
                },
                socio2: {
                    nome: document.getElementById('pj-socio2-nome').value,
                    cpf: document.getElementById('pj-socio2-cpf').value
                },
                socio3: {
                    nome: document.getElementById('pj-socio3-nome').value,
                    cpf: document.getElementById('pj-socio3-cpf').value
                },
                socio4: {
                    nome: document.getElementById('pj-socio4-nome').value,
                    cpf: document.getElementById('pj-socio4-cpf').value
                },
                socio5: {
                    nome: document.getElementById('pj-socio5-nome').value,
                    cpf: document.getElementById('pj-socio5-cpf').value
                },
                socio6: {
                    nome: document.getElementById('pj-socio6-nome').value,
                    cpf: document.getElementById('pj-socio6-cpf').value
                },
                socio7: {
                    nome: document.getElementById('pj-socio7-nome').value,
                    cpf: document.getElementById('pj-socio7-cpf').value
                },
                socio8: {
                    nome: document.getElementById('pj-socio8-nome').value,
                    cpf: document.getElementById('pj-socio8-cpf').value
                }
            },
            observacoes: document.getElementById('pj-observacoes').value
        };

        // Validar CNPJ - Aceitar qualquer CNPJ com 14 dígitos (incluindo CNPJs reais)
        if (formData.cnpj) {
            const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
            if (cnpjLimpo.length !== 14) {
                showNotification('❌ CNPJ deve ter 14 dígitos!', 'error');
                return;
            }
            
            // Verificar se todos os dígitos são iguais
            if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
                showNotification('❌ CNPJ inválido! Todos os dígitos não podem ser iguais.', 'error');
                return;
            }
            
            // Validação matemática opcional - aceita qualquer CNPJ que não seja óbvio
            if (!validarCNPJ(formData.cnpj)) {
                console.log('⚠️ CNPJ não passou na validação matemática, mas será aceito:', formData.cnpj);
                console.log('ℹ️ Muitos CNPJs reais podem não passar na validação rigorosa devido a variações regionais');
            }
        }

        if (editingRecord && editingRecord.table === 'pessoa_juridica') {
            // Atualizar registro existente
            db.update('pessoa_juridica', editingRecord.id, formData);
            showNotification('Pessoa jurídica atualizada com sucesso!', 'success');
            editingRecord = null;
        } else {
            // Validar se há dados mínimos preenchidos (evita salvar formulários vazios)
            const dadosMinimos = formData.razao_social && formData.razao_social.trim() !== '';
            
            if (!dadosMinimos) {
                showNotification('❌ Preencha pelo menos a razão social antes de salvar!', 'warning');
                console.log('⚠️ Tentativa de salvar formulário vazio rejeitada');
                return;
            }
            
            // Inserir novo registro
            console.log('💾 Tentando salvar pessoa jurídica:', formData);
            
            if (typeof db === 'undefined') {
                console.error('❌ Objeto db não está definido!');
                console.log('🔍 Verificando objetos disponíveis:', typeof LocalDatabase, typeof window.db);
                showNotification('Erro: Sistema de banco de dados não carregado', 'error');
                return;
            }
            
            console.log('🗄️ Objeto db disponível:', db);
            console.log('🗄️ Tabela pessoa_juridica existe?', db.data?.pessoa_juridica);
            
            const result = db.insert('pessoa_juridica', formData);
            console.log('✅ Pessoa jurídica salva:', result);
            console.log('📊 Estado atual da tabela:', db.getAll('pessoa_juridica'));
            showNotification('Pessoa jurídica cadastrada com sucesso!', 'success');
        }

        clearFormPJ();
        loadDashboard();
        updateStatusBar('Pessoa jurídica salva');
    } catch (error) {
        console.error('Erro ao salvar pessoa jurídica:', error);
        showNotification('Erro ao salvar pessoa jurídica', 'error');
    }
}

// Limpar formulário PF
function clearFormPF() {
    const form = document.getElementById('form-pessoa-fisica');
    if (form) {
        form.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        });
    }
    editingRecord = null;
}

// Limpar formulário PJ
function clearFormPJ() {
    const form = document.getElementById('form-pessoa-juridica');
    if (form) {
        form.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        });
    }
    editingRecord = null;
}

// Carregar lista de pessoas físicas
function loadListaPessoasFisicas() {
    const container = document.getElementById('tabela-pf');
    if (!container) return;

    try {
        const pessoas = db.getAll('pessoa_fisica');
        container.innerHTML = '';

        if (pessoas.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma pessoa física cadastrada</td></tr>';
            return;
        }

        pessoas.forEach(pessoa => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pessoa.nome || '-'}</td>
                <td>${formatUtils.formatCPF(pessoa.cpf) || '-'}</td>
                <td>${pessoa.rg || '-'}</td>
                <td>${pessoa.telefone1 || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="verDetalhes('pessoa_fisica', '${pessoa.id}')" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="editarPessoa('pessoa_fisica', '${pessoa.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluirPessoa('pessoa_fisica', '${pessoa.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            container.appendChild(row);
        });

        updateStatusBar(`${pessoas.length} pessoas físicas listadas`);
    } catch (error) {
        console.error('Erro ao listar pessoas físicas:', error);
        container.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar dados</td></tr>';
    }
}

// Carregar lista de pessoas jurídicas  
function loadListaPessoasJuridicas() {
    const container = document.getElementById('tabela-pj');
    if (!container) return;

    try {
        const pessoas = db.getAll('pessoa_juridica');
        container.innerHTML = '';

        if (pessoas.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma pessoa jurídica cadastrada</td></tr>';
            return;
        }

        pessoas.forEach(pessoa => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pessoa.razao_social || '-'}</td>
                <td>${pessoa.nome_fantasia || '-'}</td>
                <td>${formatUtils.formatCNPJ(pessoa.cnpj) || '-'}</td>
                <td><span class="badge bg-${pessoa.situacao === 'Ativa' ? 'success' : 'warning'}">${pessoa.situacao || 'N/A'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="verDetalhes('pessoa_juridica', '${pessoa.id}')" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="editarPessoa('pessoa_juridica', '${pessoa.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluirPessoa('pessoa_juridica', '${pessoa.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            container.appendChild(row);
        });

        updateStatusBar(`${pessoas.length} pessoas jurídicas listadas`);
    } catch (error) {
        console.error('Erro ao listar pessoas jurídicas:', error);
        container.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar dados</td></tr>';
    }
}

// Editar pessoa
function editarPessoa(table, id) {
    const pessoa = db.getById(table, id);
    if (!pessoa) {
        showNotification('Registro não encontrado', 'error');
        return;
    }

    editingRecord = { table, id };

    if (table === 'pessoa_fisica') {
        showSection('cadastro-pf');
        setTimeout(() => {
            // Preencher formulário com dados existentes
            document.getElementById('pf-goa').value = pessoa.goa || '';
            document.getElementById('pf-nome').value = pessoa.nome || '';
            document.getElementById('pf-cpf').value = formatUtils.formatCPF(pessoa.cpf) || '';
            document.getElementById('pf-rg').value = pessoa.rg || '';
            document.getElementById('pf-nascimento').value = pessoa.nascimento || '';
            document.getElementById('pf-mae').value = pessoa.mae || '';
            document.getElementById('pf-pai').value = pessoa.pai || '';
            // Preencher campos de filhos estruturados
            if (pessoa.filhos && typeof pessoa.filhos === 'object') {
                document.getElementById('pf-filho1-nome').value = pessoa.filhos.filho1?.nome || '';
                document.getElementById('pf-filho1-cpf').value = pessoa.filhos.filho1?.cpf || '';
                document.getElementById('pf-filho2-nome').value = pessoa.filhos.filho2?.nome || '';
                document.getElementById('pf-filho2-cpf').value = pessoa.filhos.filho2?.cpf || '';
                document.getElementById('pf-filho3-nome').value = pessoa.filhos.filho3?.nome || '';
                document.getElementById('pf-filho3-cpf').value = pessoa.filhos.filho3?.cpf || '';
                document.getElementById('pf-filho4-nome').value = pessoa.filhos.filho4?.nome || '';
                document.getElementById('pf-filho4-cpf').value = pessoa.filhos.filho4?.cpf || '';
                document.getElementById('pf-filho5-nome').value = pessoa.filhos.filho5?.nome || '';
                document.getElementById('pf-filho5-cpf').value = pessoa.filhos.filho5?.cpf || '';
            } else {
                // Compatibility with old text format
                document.getElementById('pf-filho1-nome').value = pessoa.filhos || '';
            }
            
            // Preencher campos de irmãos estruturados
            if (pessoa.irmaos && typeof pessoa.irmaos === 'object') {
                document.getElementById('pf-irmao1-nome').value = pessoa.irmaos.irmao1?.nome || '';
                document.getElementById('pf-irmao1-cpf').value = pessoa.irmaos.irmao1?.cpf || '';
                document.getElementById('pf-irmao2-nome').value = pessoa.irmaos.irmao2?.nome || '';
                document.getElementById('pf-irmao2-cpf').value = pessoa.irmaos.irmao2?.cpf || '';
                document.getElementById('pf-irmao3-nome').value = pessoa.irmaos.irmao3?.nome || '';
                document.getElementById('pf-irmao3-cpf').value = pessoa.irmaos.irmao3?.cpf || '';
                document.getElementById('pf-irmao4-nome').value = pessoa.irmaos.irmao4?.nome || '';
                document.getElementById('pf-irmao4-cpf').value = pessoa.irmaos.irmao4?.cpf || '';
                document.getElementById('pf-irmao5-nome').value = pessoa.irmaos.irmao5?.nome || '';
                document.getElementById('pf-irmao5-cpf').value = pessoa.irmaos.irmao5?.cpf || '';
            }
            
            document.getElementById('pf-naturalidade').value = pessoa.naturalidade || '';
            document.getElementById('pf-sexo').value = pessoa.sexo || '';
            document.getElementById('pf-estado-civil').value = pessoa.estado_civil || '';
            document.getElementById('pf-telefone1').value = pessoa.telefone1 || '';
            document.getElementById('pf-telefone2').value = pessoa.telefone2 || '';
            document.getElementById('pf-ocupacao').value = pessoa.ocupacao || '';
            document.getElementById('pf-vinculo').value = pessoa.vinculo || '';
            document.getElementById('pf-endereco1').value = pessoa.endereco1 || '';
            document.getElementById('pf-endereco2').value = pessoa.endereco2 || '';
            document.getElementById('pf-endereco3').value = pessoa.endereco3 || '';
            document.getElementById('pf-endereco4').value = pessoa.endereco4 || '';
            document.getElementById('pf-endereco5').value = pessoa.endereco5 || '';
            document.getElementById('pf-endereco6').value = pessoa.endereco6 || '';
            document.getElementById('pf-possui-empresa').checked = pessoa.possui_empresa || false;
            
            // Preencher campos das 8 empresas estruturadas
            if (pessoa.empresas && typeof pessoa.empresas === 'object') {
                // Empresa 1
                document.getElementById('pf-empresa1-razao').value = pessoa.empresas.empresa1?.razao_social || '';
                document.getElementById('pf-empresa1-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa1?.cnpj) || '';
                document.getElementById('pf-empresa1-participacao').value = pessoa.empresas.empresa1?.participacao || '';
                document.getElementById('pf-empresa1-endereco').value = pessoa.empresas.empresa1?.endereco || '';
                document.getElementById('pf-empresa1-socio1-nome').value = pessoa.empresas.empresa1?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa1-socio1-cpf').value = pessoa.empresas.empresa1?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa1-socio2-nome').value = pessoa.empresas.empresa1?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa1-socio2-cpf').value = pessoa.empresas.empresa1?.socios?.socio2?.cpf || '';
                
                // Empresa 2
                document.getElementById('pf-empresa2-razao').value = pessoa.empresas.empresa2?.razao_social || '';
                document.getElementById('pf-empresa2-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa2?.cnpj) || '';
                document.getElementById('pf-empresa2-participacao').value = pessoa.empresas.empresa2?.participacao || '';
                document.getElementById('pf-empresa2-endereco').value = pessoa.empresas.empresa2?.endereco || '';
                document.getElementById('pf-empresa2-socio1-nome').value = pessoa.empresas.empresa2?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa2-socio1-cpf').value = pessoa.empresas.empresa2?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa2-socio2-nome').value = pessoa.empresas.empresa2?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa2-socio2-cpf').value = pessoa.empresas.empresa2?.socios?.socio2?.cpf || '';
                
                // Empresa 3
                document.getElementById('pf-empresa3-razao').value = pessoa.empresas.empresa3?.razao_social || '';
                document.getElementById('pf-empresa3-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa3?.cnpj) || '';
                document.getElementById('pf-empresa3-participacao').value = pessoa.empresas.empresa3?.participacao || '';
                document.getElementById('pf-empresa3-endereco').value = pessoa.empresas.empresa3?.endereco || '';
                document.getElementById('pf-empresa3-socio1-nome').value = pessoa.empresas.empresa3?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa3-socio1-cpf').value = pessoa.empresas.empresa3?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa3-socio2-nome').value = pessoa.empresas.empresa3?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa3-socio2-cpf').value = pessoa.empresas.empresa3?.socios?.socio2?.cpf || '';
                
                // Empresa 4
                document.getElementById('pf-empresa4-razao').value = pessoa.empresas.empresa4?.razao_social || '';
                document.getElementById('pf-empresa4-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa4?.cnpj) || '';
                document.getElementById('pf-empresa4-participacao').value = pessoa.empresas.empresa4?.participacao || '';
                document.getElementById('pf-empresa4-endereco').value = pessoa.empresas.empresa4?.endereco || '';
                document.getElementById('pf-empresa4-socio1-nome').value = pessoa.empresas.empresa4?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa4-socio1-cpf').value = pessoa.empresas.empresa4?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa4-socio2-nome').value = pessoa.empresas.empresa4?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa4-socio2-cpf').value = pessoa.empresas.empresa4?.socios?.socio2?.cpf || '';
                
                // Empresa 5
                document.getElementById('pf-empresa5-razao').value = pessoa.empresas.empresa5?.razao_social || '';
                document.getElementById('pf-empresa5-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa5?.cnpj) || '';
                document.getElementById('pf-empresa5-participacao').value = pessoa.empresas.empresa5?.participacao || '';
                document.getElementById('pf-empresa5-endereco').value = pessoa.empresas.empresa5?.endereco || '';
                document.getElementById('pf-empresa5-socio1-nome').value = pessoa.empresas.empresa5?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa5-socio1-cpf').value = pessoa.empresas.empresa5?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa5-socio2-nome').value = pessoa.empresas.empresa5?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa5-socio2-cpf').value = pessoa.empresas.empresa5?.socios?.socio2?.cpf || '';
                
                // Empresa 6
                document.getElementById('pf-empresa6-razao').value = pessoa.empresas.empresa6?.razao_social || '';
                document.getElementById('pf-empresa6-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa6?.cnpj) || '';
                document.getElementById('pf-empresa6-participacao').value = pessoa.empresas.empresa6?.participacao || '';
                document.getElementById('pf-empresa6-endereco').value = pessoa.empresas.empresa6?.endereco || '';
                document.getElementById('pf-empresa6-socio1-nome').value = pessoa.empresas.empresa6?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa6-socio1-cpf').value = pessoa.empresas.empresa6?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa6-socio2-nome').value = pessoa.empresas.empresa6?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa6-socio2-cpf').value = pessoa.empresas.empresa6?.socios?.socio2?.cpf || '';
                
                // Empresa 7
                document.getElementById('pf-empresa7-razao').value = pessoa.empresas.empresa7?.razao_social || '';
                document.getElementById('pf-empresa7-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa7?.cnpj) || '';
                document.getElementById('pf-empresa7-participacao').value = pessoa.empresas.empresa7?.participacao || '';
                document.getElementById('pf-empresa7-endereco').value = pessoa.empresas.empresa7?.endereco || '';
                document.getElementById('pf-empresa7-socio1-nome').value = pessoa.empresas.empresa7?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa7-socio1-cpf').value = pessoa.empresas.empresa7?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa7-socio2-nome').value = pessoa.empresas.empresa7?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa7-socio2-cpf').value = pessoa.empresas.empresa7?.socios?.socio2?.cpf || '';
                
                // Empresa 8
                document.getElementById('pf-empresa8-razao').value = pessoa.empresas.empresa8?.razao_social || '';
                document.getElementById('pf-empresa8-cnpj').value = formatUtils.formatCNPJ(pessoa.empresas.empresa8?.cnpj) || '';
                document.getElementById('pf-empresa8-participacao').value = pessoa.empresas.empresa8?.participacao || '';
                document.getElementById('pf-empresa8-endereco').value = pessoa.empresas.empresa8?.endereco || '';
                document.getElementById('pf-empresa8-socio1-nome').value = pessoa.empresas.empresa8?.socios?.socio1?.nome || '';
                document.getElementById('pf-empresa8-socio1-cpf').value = pessoa.empresas.empresa8?.socios?.socio1?.cpf || '';
                document.getElementById('pf-empresa8-socio2-nome').value = pessoa.empresas.empresa8?.socios?.socio2?.nome || '';
                document.getElementById('pf-empresa8-socio2-cpf').value = pessoa.empresas.empresa8?.socios?.socio2?.cpf || '';
            } else {
                // Compatibility with old single enterprise format
                document.getElementById('pf-empresa1-razao').value = pessoa.razao_social || '';
                document.getElementById('pf-empresa1-cnpj').value = formatUtils.formatCNPJ(pessoa.cnpj_empresa) || '';
                document.getElementById('pf-empresa1-participacao').value = pessoa.participacao_empresa || '';
            }
            document.getElementById('pf-observacoes').value = pessoa.observacoes || '';
            document.getElementById('pf-possui-veiculos').checked = pessoa.possui_veiculos || false;
            document.getElementById('pf-placa').value = pessoa.placa || '';
            document.getElementById('pf-marca-modelo').value = pessoa.marca_modelo || '';
            document.getElementById('pf-ano').value = pessoa.ano || '';
            document.getElementById('pf-cor').value = pessoa.cor || '';
        }, 500);
    } else {
        showSection('cadastro-pj');
        setTimeout(() => {
            // Preencher formulário PJ
            document.getElementById('pj-goa').value = pessoa.goa || '';
            document.getElementById('pj-razao-social').value = pessoa.razao_social || '';
            document.getElementById('pj-nome-fantasia').value = pessoa.nome_fantasia || '';
            document.getElementById('pj-cnpj').value = formatUtils.formatCNPJ(pessoa.cnpj) || '';
            document.getElementById('pj-situacao').value = pessoa.situacao || '';
            document.getElementById('pj-tipo').value = pessoa.tipo || '';
            document.getElementById('pj-data-abertura').value = pessoa.data_abertura || '';
            document.getElementById('pj-capital-social').value = pessoa.capital_social || '';
            document.getElementById('pj-cidade').value = pessoa.cidade || '';
            document.getElementById('pj-porte').value = pessoa.porte_empresa || '';
            document.getElementById('pj-data-fechamento').value = pessoa.data_fechamento || '';
            document.getElementById('pj-data-situacao-cadastral').value = pessoa.data_situacao_cadastral || '';
            document.getElementById('pj-cnae').value = pessoa.cnae_principal || '';
            document.getElementById('pj-email').value = pessoa.email || '';
            document.getElementById('pj-endereco').value = pessoa.endereco || '';
            document.getElementById('pj-cep').value = pessoa.cep || '';
            document.getElementById('pj-telefone1').value = pessoa.telefone1 || '';
            document.getElementById('pj-telefone2').value = pessoa.telefone2 || '';
            document.getElementById('pj-possui-filial').checked = pessoa.possui_filial || false;
            document.getElementById('pj-endereco-filial').value = pessoa.endereco_filial || '';
            document.getElementById('pj-cidade-filial').value = pessoa.cidade_filial || '';
            document.getElementById('pj-simples-situacao').value = pessoa.situacao_simples_nacional || '';
            document.getElementById('pj-data-opcao-simples').value = pessoa.data_opcao_simples || '';
            document.getElementById('pj-data-exclusao-simples').value = pessoa.data_exclusao_simples || '';
            document.getElementById('pj-mei').checked = pessoa.mei || false;
            
            // Preencher campos de sócios estruturados
            if (pessoa.socios && typeof pessoa.socios === 'object') {
                document.getElementById('pj-socio1-nome').value = pessoa.socios.socio1?.nome || '';
                document.getElementById('pj-socio1-cpf').value = pessoa.socios.socio1?.cpf || '';
                document.getElementById('pj-socio2-nome').value = pessoa.socios.socio2?.nome || '';
                document.getElementById('pj-socio2-cpf').value = pessoa.socios.socio2?.cpf || '';
                document.getElementById('pj-socio3-nome').value = pessoa.socios.socio3?.nome || '';
                document.getElementById('pj-socio3-cpf').value = pessoa.socios.socio3?.cpf || '';
                document.getElementById('pj-socio4-nome').value = pessoa.socios.socio4?.nome || '';
                document.getElementById('pj-socio4-cpf').value = pessoa.socios.socio4?.cpf || '';
                document.getElementById('pj-socio5-nome').value = pessoa.socios.socio5?.nome || '';
                document.getElementById('pj-socio5-cpf').value = pessoa.socios.socio5?.cpf || '';
                document.getElementById('pj-socio6-nome').value = pessoa.socios.socio6?.nome || '';
                document.getElementById('pj-socio6-cpf').value = pessoa.socios.socio6?.cpf || '';
                document.getElementById('pj-socio7-nome').value = pessoa.socios.socio7?.nome || '';
                document.getElementById('pj-socio7-cpf').value = pessoa.socios.socio7?.cpf || '';
                document.getElementById('pj-socio8-nome').value = pessoa.socios.socio8?.nome || '';
                document.getElementById('pj-socio8-cpf').value = pessoa.socios.socio8?.cpf || '';
            }
            
            document.getElementById('pj-observacoes').value = pessoa.observacoes || '';
        }, 500);
    }
}

// Ver detalhes com sistema simplificado
function verDetalhes(table, id) {
    try {
        console.log(`🔍 Abrindo detalhes: ${table}, ID: ${id}`);
        
        const pessoa = db.getById(table, id);
        if (!pessoa) {
            showNotification('Registro não encontrado', 'error');
            return;
        }

        // Criar título e conteúdo
        const titulo = `<i class="fas fa-${table === 'pessoa_fisica' ? 'user' : 'building'} me-2"></i>Detalhes - ${table === 'pessoa_fisica' ? pessoa.nome : pessoa.razao_social}`;
        const conteudo = construirConteudoDetalhes(table, pessoa);
        
        // Usar sistema global
        abrirModalDetalhes(titulo, conteudo);

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        showNotification('Erro ao carregar detalhes', 'error');
    }
}

// Abrir modal de detalhes de forma segura
function abrirModalDetalhes(table, pessoa) {
    try {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
        
        if (!modalEl || !modalTitle || !modalBody) {
            showNotification('Erro: Elementos do modal não encontrados', 'error');
            return;
        }

        // Limpar conteúdo anterior
        modalBody.innerHTML = '';
        
        // Definir título
        modalTitle.innerHTML = `<i class="fas fa-${table === 'pessoa_fisica' ? 'user' : 'building'} me-2"></i>Detalhes - ${table === 'pessoa_fisica' ? pessoa.nome : pessoa.razao_social}`;
        
        // Construir conteúdo
        const content = construirConteudoDetalhes(table, pessoa);
        modalBody.innerHTML = content;
        
        // Verificar se já existe instância do modal
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        
        if (modalInstance) {
            // Se existe, usar a instância existente
            console.log('🔄 Reutilizando instância existente do modal');
            modalInstance.show();
        } else {
            // Se não existe, criar nova instância
            console.log('🆕 Criando nova instância do modal');
            modalInstance = new bootstrap.Modal(modalEl, {
                backdrop: true,
                keyboard: true,
                focus: true
            });
            modalInstance.show();
        }
        
        // Adicionar listener para limpeza quando o modal for fechado
        modalEl.addEventListener('hidden.bs.modal', function limparModal() {
            modalBody.innerHTML = '';
            modalTitle.innerHTML = 'Detalhes';
            modalEl.removeEventListener('hidden.bs.modal', limparModal);
            console.log('🗑️ Modal limpo após fechamento');
        }, { once: true });
        
        console.log('✅ Modal de detalhes aberto com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de detalhes:', error);
        showNotification('Erro ao abrir detalhes', 'error');
    }
}

// Construir conteúdo dos detalhes
function construirConteudoDetalhes(table, pessoa) {
    if (table === 'pessoa_fisica') {
        return `
            <div class="card border-0">
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-3"><strong>GOA:</strong><br><span class="badge bg-primary fs-6">${pessoa.goa || '-'}</span></div>
                        <div class="col-md-9"><strong>Nome Completo:</strong><br>${pessoa.nome || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>CPF:</strong><br>${formatUtils.formatCPF(pessoa.cpf) || '-'}</div>
                        <div class="col-md-4"><strong>RG:</strong><br>${pessoa.rg || '-'}</div>
                        <div class="col-md-4"><strong>Nascimento:</strong><br>${formatUtils.formatDate(pessoa.nascimento) || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6"><strong>Mãe:</strong><br>${pessoa.mae || '-'}</div>
                        <div class="col-md-6"><strong>Pai:</strong><br>${pessoa.pai || '-'}</div>
                    </div>
                    
                    ${pessoa.filhos && (typeof pessoa.filhos === 'object' ? Object.values(pessoa.filhos).some(f => f.nome) : pessoa.filhos) ? `
                    <div class="row mb-3">
                        <div class="col-12"><strong>Filhos:</strong><br>
                        ${typeof pessoa.filhos === 'object' ? 
                            Object.values(pessoa.filhos).filter(f => f.nome).map(f => `${f.nome}${f.cpf ? ' (CPF: ' + formatUtils.formatCPF(f.cpf) + ')' : ''}`).join('<br>') 
                            : pessoa.filhos
                        }</div>
                    </div>` : ''}
                    
                    ${pessoa.irmaos && Object.values(pessoa.irmaos).some(i => i.nome) ? `
                    <div class="row mb-3">
                        <div class="col-12"><strong>Irmãos:</strong><br>
                        ${Object.values(pessoa.irmaos).filter(i => i.nome).map(i => `${i.nome}${i.cpf ? ' (CPF: ' + formatUtils.formatCPF(i.cpf) + ')' : ''}`).join('<br>')}
                        </div>
                    </div>` : ''}
                    
                    <div class="row mb-3">
                        <div class="col-md-6"><strong>Ocupação:</strong><br>${pessoa.ocupacao || '-'}</div>
                        <div class="col-md-6"><strong>Vínculo:</strong><br>${pessoa.vinculo || '-'}</div>
                    </div>
                    
                    ${pessoa.empresas && Object.values(pessoa.empresas).some(e => e.razao_social) ? `
                    <hr class="my-3">
                    <h6 class="text-primary"><i class="fas fa-building me-2"></i>Empresas Relacionadas</h6>
                    ${Object.values(pessoa.empresas).filter(e => e.razao_social).map((e, i) => `
                        <div class="card mb-2">
                            <div class="card-body py-2">
                                <strong>Empresa ${i + 1}:</strong> ${e.razao_social}<br>
                                <small class="text-muted">
                                    ${e.cnpj ? 'CNPJ: ' + formatUtils.formatCNPJ(e.cnpj) : ''}
                                    ${e.participacao ? ' | Participação: ' + e.participacao : ''}
                                    ${e.endereco ? ' | ' + e.endereco : ''}
                                    ${e.socios && (e.socios.socio1?.nome || e.socios.socio2?.nome) ? '<br>Sócios: ' + [e.socios.socio1?.nome, e.socios.socio2?.nome].filter(s => s).join(', ') : ''}
                                </small>
                            </div>
                        </div>
                    `).join('')}
                    </div>` : ''}
                    
                    ${pessoa.observacoes ? `
                    <hr class="my-4">
                    <div class="row mb-3">
                        <div class="col-12"><strong>Observações:</strong><br>
                            <div class="bg-secondary p-3 rounded text-light" style="max-height: 200px; overflow-y: auto;">${pessoa.observacoes}</div>
                        </div>
                    </div>` : ''}
                    
                    <div class="text-center mt-4 d-flex gap-2 justify-content-center flex-wrap">
                        <button class="btn btn-primary" onclick="fecharModalSimples(); setTimeout(() => editarPessoa('${table}', '${pessoa.id}'), 300);">
                            <i class="fas fa-edit me-1"></i>Editar
                        </button>
                        <button class="btn btn-info" onclick="fecharModalSimples(); setTimeout(() => { showSection('arvore'); buscarPorGOANaArvore('${pessoa.goa}'); }, 300);">
                            <i class="fas fa-project-diagram me-1"></i>Ver na Árvore
                        </button>
                        <button class="btn btn-success" onclick="fecharModalSimples(); setTimeout(() => showSection('fotos'), 300);">
                            <i class="fas fa-camera me-1"></i>Gerenciar Fotos
                        </button>
                        <button class="btn btn-secondary" onclick="fecharModalSimples();">
                            <i class="fas fa-times me-1"></i>Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="card border-0">
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-3"><strong>GOA:</strong><br><span class="badge bg-primary fs-6">${pessoa.goa || '-'}</span></div>
                        <div class="col-md-9"><strong>Razão Social:</strong><br>${pessoa.razao_social || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6"><strong>Nome Fantasia:</strong><br>${pessoa.nome_fantasia || '-'}</div>
                        <div class="col-md-6"><strong>CNPJ:</strong><br>${formatUtils.formatCNPJ(pessoa.cnpj) || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Situação:</strong><br>${pessoa.situacao || '-'}</div>
                        <div class="col-md-4"><strong>Tipo:</strong><br>${pessoa.tipo || '-'}</div>
                        <div class="col-md-4"><strong>Porte:</strong><br>${pessoa.porte_empresa || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Data Abertura:</strong><br>${formatUtils.formatDate(pessoa.data_abertura) || '-'}</div>
                        <div class="col-md-4"><strong>Data Fechamento:</strong><br>${formatUtils.formatDate(pessoa.data_fechamento) || '-'}</div>
                        <div class="col-md-4"><strong>Data Situação Cadastral:</strong><br>${formatUtils.formatDate(pessoa.data_situacao_cadastral) || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Capital Social:</strong><br>R$ ${pessoa.capital_social?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</div>
                        <div class="col-md-4"><strong>Cidade:</strong><br>${pessoa.cidade || '-'}</div>
                        <div class="col-md-4"><strong>CNAE Principal:</strong><br>${pessoa.cnae_principal || '-'}</div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-8"><strong>Endereço:</strong><br>${pessoa.endereco || '-'}</div>
                        <div class="col-md-4"><strong>CEP:</strong><br>${pessoa.cep || '-'}</div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6"><strong>E-mail:</strong><br>${pessoa.email || '-'}</div>
                        <div class="col-md-6"><strong>Telefones:</strong><br>${[pessoa.telefone1, pessoa.telefone2].filter(t => t).join(' / ') || '-'}</div>
                    </div>
                    
                    ${(pessoa.situacao_simples_nacional || pessoa.data_opcao_simples || pessoa.data_exclusao_simples || pessoa.mei) ? `
                    <hr class="my-3">
                    <h6 class="text-primary"><i class="fas fa-file-invoice-dollar me-2"></i>Simples Nacional / MEI</h6>
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>Situação Simples:</strong><br>${pessoa.situacao_simples_nacional || '-'}</div>
                        <div class="col-md-4"><strong>Data Opção:</strong><br>${formatUtils.formatDate(pessoa.data_opcao_simples) || '-'}</div>
                        <div class="col-md-4"><strong>Data Exclusão:</strong><br>${formatUtils.formatDate(pessoa.data_exclusao_simples) || '-'}</div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4"><strong>MEI:</strong><br>${pessoa.mei ? 'Sim' : 'Não'}</div>
                    </div>` : ''}

                    ${pessoa.possui_filial ? `
                    <hr class="my-3">
                    <h6 class="text-primary"><i class="fas fa-building me-2"></i>Informações de Filial</h6>
                    <div class="row mb-3">
                        <div class="col-md-6"><strong>Endereço da Filial:</strong><br>${pessoa.endereco_filial || '-'}</div>
                        <div class="col-md-6"><strong>Cidade da Filial:</strong><br>${pessoa.cidade_filial || '-'}</div>
                    </div>` : ''}
                    
                    ${pessoa.socios && Object.values(pessoa.socios).some(s => s.nome) ? `
                    <hr class="my-3">
                    <h6 class="text-primary"><i class="fas fa-users me-2"></i>Sócios da Empresa</h6>
                    <div class="row mb-3">
                        <div class="col-12">
                        ${Object.values(pessoa.socios).filter(s => s.nome).map(s => `• ${s.nome}${s.cpf ? ' (CPF: ' + formatUtils.formatCPF(s.cpf) + ')' : ''}`).join('<br>')}
                        </div>
                    </div>` : ''}
                    
                    <div class="text-center mt-4 d-flex gap-2 justify-content-center flex-wrap">
                        <button class="btn btn-primary" onclick="fecharModalSimples(); setTimeout(() => editarPessoa('${table}', '${pessoa.id}'), 300);">
                            <i class="fas fa-edit me-1"></i>Editar
                        </button>
                        <button class="btn btn-info" onclick="fecharModalSimples(); setTimeout(() => { showSection('arvore'); buscarPorGOANaArvore('${pessoa.goa}'); }, 300);">
                            <i class="fas fa-project-diagram me-1"></i>Ver na Árvore
                        </button>
                        <button class="btn btn-success" onclick="fecharModalSimples(); setTimeout(() => showSection('fotos'), 300);">
                            <i class="fas fa-camera me-1"></i>Gerenciar Fotos
                        </button>
                        <button class="btn btn-secondary" onclick="fecharModalSimples();">
                            <i class="fas fa-times me-1"></i>Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Fechar modal de forma segura e robusta
function fecharModal() {
    fecharModalSimples();
}

// Fechar modal com limpeza completa
function fecharModalSeguro() {
    try {
        const modalEl = document.getElementById('modalDetalhes');
        if (!modalEl) {
            console.log('⚠️ Modal não encontrado para fechamento');
            return;
        }

        // Verificar se existe instância ativa
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        
        if (modalInstance) {
            console.log('🔒 Fechando modal existente...');
            modalInstance.hide();
            
            // Aguardar fechamento completo e destruir instância
            modalEl.addEventListener('hidden.bs.modal', function destruirModal() {
                try {
                    modalInstance.dispose();
                    console.log('🗑️ Instância do modal destruída');
                } catch (error) {
                    console.warn('⚠️ Erro ao destruir modal:', error);
                }
                modalEl.removeEventListener('hidden.bs.modal', destruirModal);
            }, { once: true });
        } else {
            console.log('ℹ️ Nenhuma instância ativa do modal encontrada');
        }
        
        // Limpar backdrop se houver
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
            console.log('🗑️ Backdrop removido');
        }
        
        // Remover classes do body
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
    } catch (error) {
        console.error('❌ Erro ao fechar modal:', error);
        
        // Forçar limpeza em caso de erro
        try {
            const modalEl = document.getElementById('modalDetalhes');
            if (modalEl) {
                modalEl.style.display = 'none';
                modalEl.classList.remove('show');
                modalEl.setAttribute('aria-hidden', 'true');
                modalEl.removeAttribute('aria-modal');
            }
            
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
            
            console.log('🔧 Limpeza forçada do modal realizada');
        } catch (forceError) {
            console.error('❌ Erro na limpeza forçada:', forceError);
        }
    }
}

// Excluir pessoa
function excluirPessoa(table, id) {
    if (confirm('Deseja realmente excluir este registro?')) {
        try {
            db.delete(table, id);
            showNotification('Registro excluído com sucesso!', 'success');
            
            // Recarregar lista atual
            if (table === 'pessoa_fisica') {
                loadListaPessoasFisicas();
            } else {
                loadListaPessoasJuridicas();
            }
            
            loadDashboard();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showNotification('Erro ao excluir registro', 'error');
        }
    }
}

// Validar GOA em tempo real
function validarGoaEmTempoReal(input, statusElementId) {
    const statusDiv = document.getElementById(statusElementId);
    if (!statusDiv) return;
    
    const goa = input.value.trim().toUpperCase();
    input.value = goa; // Converter para maiúsculo
    
    if (!goa) {
        statusDiv.innerHTML = '';
        input.classList.remove('is-invalid', 'is-valid');
        return;
    }
    
    // Validar formato
    const formatoValido = db.validateGOAFormat(goa);
    
    if (!formatoValido.valid) {
        statusDiv.innerHTML = `<small class="text-danger"><i class="fas fa-times me-1"></i>${formatoValido.message}</small>`;
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return;
    }
    
    // Verificar duplicidade
    const jaExiste = db.goaExists(goa, editingRecord?.id, editingRecord?.table);
    
    if (jaExiste) {
        statusDiv.innerHTML = `<small class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i>GOA já existe no sistema</small>`;
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
    } else {
        statusDiv.innerHTML = `<small class="text-success"><i class="fas fa-check me-1"></i>${formatoValido.message}</small>`;
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }
}

// Configurar event listeners dos formulários
function setupFormListeners() {
    console.log('Form listeners configurados');
}