/**
 * Utilitários Mínimos de Formulários - Funções Compartilhadas
 * Mantém apenas funções reutilizáveis necessárias
 */

// ============================================
// NOTIFICAÇÕES
// ============================================

function showNotification(message, type = 'info') {
    console.log(`📢 [${type.toUpperCase()}] ${message}`);
    
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
    
    const colors = {
        success: {bg: '#10b981', text: '#ffffff'},
        error: {bg: '#ef4444', text: '#ffffff'}, 
        warning: {bg: '#f59e0b', text: '#000000'},
        info: {bg: '#3b82f6', text: '#ffffff'}
    };
    
    const colorScheme = colors[type] || colors.info;
    notification.style.backgroundColor = colorScheme.bg;
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
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
    
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// ============================================
// VALIDAÇÕES
// ============================================

function validarCPF(cpf) {
    if (!cpf) return false;
    
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto < 2 ? 0 : resto;
    
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto < 2 ? 0 : resto;
    
    return parseInt(cpf.charAt(10)) === digitoVerificador2;
}

function validarCNPJ(cnpj) {
    if (!cnpj) return false;
    
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
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

function validateGOAFormat(goa) {
    if (!goa) return true;
    return /^[A-Za-z0-9_-]{3,}$/.test(goa);
}

function validarGoaEmTempoReal(input, statusElementId) {
    const valor = input.value.trim();
    const statusDiv = document.getElementById(statusElementId);
    
    if (!statusDiv) return;
    
    if (!valor) {
        statusDiv.innerHTML = '';
        return;
    }
    
    if (!validateGOAFormat(valor)) {
        statusDiv.innerHTML = '<small class="text-danger"><i class="fas fa-times me-1"></i>Formato inválido</small>';
        return;
    }
    
    statusDiv.innerHTML = '<small class="text-success"><i class="fas fa-check me-1"></i>Código aceito</small>';
}

// ============================================
// MÁSCARAS E FORMATAÇÃO
// ============================================

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

function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function gerarCPFValido() {
    let cpf = '';
    
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10);
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto < 2 ? 0 : resto;
    cpf += dv1;
    
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
    
    for (let i = 0; i < 8; i++) {
        cnpj += Math.floor(Math.random() * 10);
    }
    cnpj += '0001';
    
    let soma = 0;
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
        soma += parseInt(cnpj.charAt(i)) * pesos1[i];
    }
    let resto = soma % 11;
    let dv1 = resto < 2 ? 0 : 11 - resto;
    cnpj += dv1;
    
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

function gerarCPFParaFormulario(campoId) {
    const cpf = gerarCPFValido();
    const cpfFormatado = formatarCPF(cpf);
    const campo = document.getElementById(campoId);
    
    if (campo) {
        campo.value = cpfFormatado;
        console.log(`✅ CPF gerado para ${campoId}: ${cpfFormatado}`);
        showNotification('✅ CPF válido gerado automaticamente!', 'success');
        
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
        
        if (typeof applyMasks === 'function') {
            applyMasks();
        }
    }
}

// ============================================
// NAVEGAÇÃO E BUSCA
// ============================================

function buscarPorGOANaArvore(goa) {
    console.log(`🔍 Buscando GOA na árvore: ${goa}`);
    if (typeof window.buscarPorGOANaArvore === 'function') {
        window.buscarPorGOANaArvore(goa);
    }
}

// ============================================
// MODAIS
// ============================================

function fecharModalSimples() {
    console.log('🔒 Fechando modal...');
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        const modalInstance = bootstrap?.Modal?.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    });
}

function fecharModal() {
    fecharModalSimples();
}

function fecharModalSeguro() {
    console.log('🔒 Fechando modal com segurança...');
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const modalInstance = bootstrap?.Modal?.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
        
        // Remover backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    });
}

function abrirModalDetalhes(table, pessoa) {
    const modal = document.getElementById('modalDetalhes');
    if (!modal) {
        console.warn('⚠️ Modal detalhes não encontrado');
        return;
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', function removerBackdrop() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        modal.removeEventListener('hidden.bs.modal', removerBackdrop);
    });
}

// ============================================
// LIMPEZA DE FORMULÁRIOS
// ============================================

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
}

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
}

// ============================================
// NAVEGAÇÃO ENTRE SEÇÕES
// ============================================

function showSection(sectionId) {
    if (typeof window.showSection === 'function') {
        window.showSection(sectionId);
    } else {
        console.warn('⚠️ showSection não definida em main.js');
    }
}

// ============================================
// STATUS BAR (Para compatibilidade)
// ============================================

function updateStatusBar(message) {
    console.log(`📊 Status: ${message}`);
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        statusBar.textContent = message;
    }
}
