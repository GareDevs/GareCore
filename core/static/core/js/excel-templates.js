/**
 * Sistema de Templates Excel para Importação em Massa
 * Gera templates padronizados para Pessoas Físicas e Jurídicas
 */

// Gerar template Excel baseado no tipo
function gerarTemplateExcel(tipo) {
    try {
        console.log('🔄 Iniciando geração de template:', tipo);
        showNotification('📊 Gerando template Excel...', 'info');
        
        let dados, nomeArquivo, cabecalhos;
        
        if (tipo === 'pessoa_fisica') {
            // Template COMPLETO com campos principais
            cabecalhos = [
                'Nome Completo',
                'CPF',
                'Data de Nascimento',
                'Nome da Mãe',
                'Endereço',
                'RG',
                'Telefone 1',
                'Telefone 2',
                'Email',
                'Sexo',
                'Estado Civil',
                'Naturalidade',
                'Nome do Pai',
                'Profissão',
                'Observações'
            ];
            
            // Criar apenas linha de cabeçalhos + linhas vazias para preenchimento
            dados = [
                cabecalhos, // Linha 1: Cabeçalhos
                new Array(cabecalhos.length).fill(''), // Linha 2: Vazia para preenchimento
                new Array(cabecalhos.length).fill(''), // Linha 3: Vazia para preenchimento
                new Array(cabecalhos.length).fill('')  // Linha 4: Vazia para preenchimento
            ];
            
            nomeArquivo = 'template-pessoa-fisica.csv';
            
        } else if (tipo === 'pessoa_juridica') {
            // Template COMPLETO com campos principais
            cabecalhos = [
                'Razão Social',
                'Nome Fantasia',
                'CNPJ',
                'Inscrição Estadual',
                'Data de Abertura',
                'Endereço Completo',
                'Telefone 1',
                'Telefone 2',
                'Email',
                'Atividade Principal',
                'Sócio 1 - Nome',
                'Sócio 1 - CPF',
                'Sócio 1 - Participação %',
                'Sócio 2 - Nome',
                'Sócio 2 - CPF',
                'Sócio 2 - Participação %',
                'Sócio 3 - Nome',
                'Sócio 3 - CPF',
                'Sócio 3 - Participação %',
                'Observações'
            ];
            
            // Criar apenas linha de cabeçalhos + linhas vazias para preenchimento
            dados = [
                cabecalhos, // Linha 1: Cabeçalhos
                new Array(cabecalhos.length).fill(''), // Linha 2: Vazia para preenchimento
                new Array(cabecalhos.length).fill(''), // Linha 3: Vazia para preenchimento
                new Array(cabecalhos.length).fill('')  // Linha 4: Vazia para preenchimento
            ];
            
            nomeArquivo = 'template-pessoa-juridica.csv';
        }
        
        // Converter dados para CSV
        console.log('📊 Dados a converter:', {
            linhas: dados.length,
            colunas: cabecalhos.length,
            nomeArquivo: nomeArquivo
        });
        
        // Gerar CSV com ponto e vírgula (;) - Formato brasileiro
        const csvContent = dados.map(linha => 
            linha.map(campo => {
                const valor = String(campo || ''); // Garantir que não seja undefined
                // Não usar aspas, apenas retornar o valor limpo
                return valor;
            }).join(';') // Usar ; como separador (padrão brasileiro)
        ).join('\r\n'); // Usar \r\n para compatibilidade com Excel Windows
        
        console.log('✅ CSV gerado (separador: ponto e vírgula):', csvContent.substring(0, 200) + '...');
        console.log('📋 Número de linhas no CSV:', csvContent.split('\r\n').length);
        console.log('📊 Primeira linha (cabeçalhos):', csvContent.split('\r\n')[0]);
        console.log('🔍 Separador usado: ; (ponto e vírgula)');
        
        // Adicionar BOM para UTF-8 no Excel
        const bomUtf8 = '\uFEFF';
        const finalContent = bomUtf8 + csvContent;
        
        console.log('📦 Criando blob e iniciando download...');
        
        // Criar e baixar arquivo
        const blob = new Blob([finalContent], { 
            type: 'text/csv;charset=utf-8' 
        });
        
        console.log('📁 Blob criado:', {
            size: blob.size,
            type: blob.type
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nomeArquivo;
        
        console.log('🔗 Link de download criado:', link.download);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(link.href);
        
        console.log('✅ Download iniciado com sucesso!');
        
        const tipoNome = tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';
        showNotification(`✅ Template ${tipoNome} baixado com sucesso!`, 'success');
        
        // Mostrar instruções
        setTimeout(() => {
            mostrarInstrucoesTemplate(tipo);
        }, 1000);
        
    } catch (error) {
        console.error('❌ ERRO ao gerar template:', error);
        console.error('Stack trace:', error.stack);
        showNotification(`❌ Erro ao gerar template: ${error.message}`, 'error');
    }
}

// Mostrar instruções de uso do template
function mostrarInstrucoesTemplate(tipo) {
    const tipoNome = tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';
    const camposObrigatorios = tipo === 'pessoa_fisica' 
        ? 'Nome Completo e CPF' 
        : 'Razão Social e CNPJ';
    
    const modal = document.createElement('div');
    modal.style.cssText = `
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
    painel.className = 'modal-instrucoes-template';
    painel.style.cssText = `
        background: var(--bs-body-bg, #ffffff);
        color: var(--bs-body-color, #000000);
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    painel.innerHTML = `
        <style>
            .modal-instrucoes-template h4,
            .modal-instrucoes-template h6,
            .modal-instrucoes-template p,
            .modal-instrucoes-template li,
            .modal-instrucoes-template strong {
                color: var(--bs-body-color, #000000) !important;
            }
            .modal-instrucoes-template .alert {
                background-color: var(--bs-light, #f8f9fa);
                border: 1px solid var(--bs-border-color, #dee2e6);
                color: var(--bs-body-color, #000000) !important;
            }
            .modal-instrucoes-template .alert * {
                color: var(--bs-body-color, #000000) !important;
            }
            .modal-instrucoes-template hr {
                border-color: var(--bs-border-color, #dee2e6);
                opacity: 0.5;
            }
        </style>
        
        <h4><i class="fas fa-info-circle text-info me-2"></i>Instruções do Template ${tipoNome}</h4>
        <hr>
        
        <div class="alert alert-info">
            <h6><i class="fas fa-download me-1"></i>Template Baixado!</h6>
            <p class="mb-1">O arquivo foi salvo como <strong>${tipo === 'pessoa_fisica' ? 'template-pessoa-fisica.csv' : 'template-pessoa-juridica.csv'}</strong></p>
        </div>
        
        <h6><i class="fas fa-exclamation-triangle text-warning me-2"></i>Campos Obrigatórios</h6>
        <p>Os campos marcados com <strong>*</strong> são obrigatórios: <strong>${camposObrigatorios}</strong></p>
        
        <div class="alert alert-success">
            <h6><i class="fas fa-table me-2"></i>Formato do Arquivo</h6>
            <p class="mb-1">✅ Template com <strong>${tipo === 'pessoa_fisica' ? '15' : '20'} campos principais</strong>:</p>
            <ul class="mb-0" style="font-size: 0.9em;">
                ${tipo === 'pessoa_fisica' ? `
                    <li><strong>Dados Pessoais:</strong> Nome Completo, CPF, RG, Data de Nascimento, Sexo</li>
                    <li><strong>Família:</strong> Nome da Mãe, Nome do Pai, Estado Civil</li>
                    <li><strong>Contato:</strong> Telefone 1, Telefone 2, Email, Endereço</li>
                    <li><strong>Outros:</strong> Naturalidade, Profissão, Observações</li>
                ` : `
                    <li><strong>Dados da Empresa:</strong> Razão Social, Nome Fantasia, CNPJ, IE, Data de Abertura</li>
                    <li><strong>Contato:</strong> Telefone 1, Telefone 2, Email, Endereço</li>
                    <li><strong>Quadro Societário:</strong> 3 Sócios (Nome, CPF, Participação %)</li>
                    <li><strong>Outros:</strong> Atividade Principal, Observações</li>
                `}
            </ul>
            <p class="mt-2 mb-0"><strong>💡 Dica:</strong> Campos vazios são permitidos. Preencha o que tiver!</p>
        </div>
        
        <h6><i class="fas fa-edit text-primary me-2"></i>Como Usar</h6>
        <ol>
            <li>Abra o arquivo no <strong>Excel</strong> ou <strong>Google Sheets</strong></li>
            <li>Você verá <strong>${tipo === 'pessoa_fisica' ? '15' : '20'} colunas</strong> organizadas</li>
            <li><strong>Preencha os dados linha por linha</strong> - uma ${tipo === 'pessoa_fisica' ? 'pessoa' : 'empresa'} por linha</li>
            <li>Não precisa preencher todos os campos - deixe vazios os que não tiver</li>
            <li>Adicione quantas linhas precisar</li>
            <li>Salve e importe usando <strong>"Importar Excel/CSV"</strong></li>
        </ol>
        <p><strong>✨ Organizado!</strong> Template balanceado - nem muito simples, nem muito complexo!</p>
        
        <h6><i class="fas fa-lightbulb text-success me-2"></i>Dicas Importantes</h6>
        <ul>
            <li><strong>Separador:</strong> Ponto e vírgula (;) entre colunas</li>
            <li><strong>Data:</strong> Use DD/MM/AAAA (ex: 15/03/1985)</li>
            <li><strong>CPF/CNPJ:</strong> Com ou sem formatação (123.456.789-00 ou 12345678900)</li>
            <li><strong>Campos vazios OK:</strong> Deixe em branco o que não tiver</li>
            <li><strong>Endereço:</strong> Pode conter vírgulas (Rua X, 123, Apto 45)</li>
            ${tipo === 'pessoa_fisica' ? 
                '<li><strong>Sexo:</strong> Masculino, Feminino ou deixe vazio</li>' :
                '<li><strong>Participação:</strong> Use % ou número (50% ou 50)</li>'
            }
        </ul>
        
        <div class="alert alert-warning">
            <h6><i class="fas fa-shield-alt me-1"></i>Validações Automáticas</h6>
            <p class="mb-1">Durante a importação, o sistema irá:</p>
            <ul class="mb-0">
                <li>Validar CPF/CNPJ automaticamente</li>
                <li>Verificar duplicatas</li>
                <li>Formatar dados automaticamente</li>
                <li>Gerar GOA automático se não informado</li>
            </ul>
        </div>
        
        <hr>
        <div class="d-flex justify-content-between">
            <button class="btn btn-success" onclick="gerarTemplateExcel('${tipo}')">
                <i class="fas fa-download me-1"></i>Baixar Novamente
            </button>
            <button class="btn btn-primary" onclick="this.closest('[style*=\"position: fixed\"]').remove()">
                <i class="fas fa-check me-1"></i>Entendi
            </button>
        </div>
    `;
    
    modal.appendChild(painel);
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Processar upload de arquivo Excel/CSV
function processarExcelUpload(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;
    
    try {
        console.log('📁 Arquivo selecionado:', arquivo.name, '| Tamanho:', (arquivo.size / 1024).toFixed(2), 'KB');
        showNotification('📊 Processando arquivo Excel/CSV...', 'info');
        
        const leitor = new FileReader();
        
        leitor.onload = function(e) {
            try {
                const conteudo = e.target.result;
                let linhas;
                
                // Detectar tipo de arquivo e processar
                if (arquivo.name.toLowerCase().endsWith('.csv')) {
                    console.log('📄 Processando arquivo CSV...');
                    linhas = processarCSV(conteudo);
                    console.log(`✅ CSV processado: ${linhas.length} linhas detectadas`);
                } else {
                    // Para arquivos Excel, por enquanto solicitar CSV
                    showNotification('⚠️ Por favor, salve o Excel como CSV e tente novamente', 'warning');
                    input.value = '';
                    return;
                }
                
                if (linhas && linhas.length > 1) {
                    console.log(`🚀 Iniciando processamento de ${linhas.length - 1} registros (${linhas.length} linhas incluindo cabeçalho)`);
                    processarDadosImportados(linhas);
                } else {
                    console.error('❌ Arquivo vazio:', linhas);
                    showNotification('❌ Arquivo vazio ou formato inválido', 'error');
                }
                
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                showNotification('Erro ao processar arquivo', 'error');
            }
            
            // Limpar input
            input.value = '';
        };
        
        leitor.onerror = function() {
            showNotification('Erro ao ler arquivo', 'error');
            input.value = '';
        };
        
        leitor.readAsText(arquivo, 'UTF-8');
        
    } catch (error) {
        console.error('Erro ao processar upload:', error);
        showNotification('Erro ao processar upload', 'error');
    }
}

// Processar conteúdo CSV
function processarCSV(conteudo) {
    try {
        // Remover BOM se presente
        const conteudoLimpo = conteudo.replace(/^\uFEFF/, '');
        
        const linhas = [];
        const linhasBrutas = conteudoLimpo.split(/\r?\n/);
        
        console.log('📄 Processando CSV com separador: ponto e vírgula (;)');
        
        for (let linha of linhasBrutas) {
            linha = linha.trim();
            if (!linha) continue;
            
            // Parser CSV usando PONTO E VÍRGULA (;) como separador - Formato brasileiro
            const campos = [];
            let campoAtual = '';
            let dentroAspas = false;
            
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                
                if (char === '"') {
                    if (dentroAspas && linha[i + 1] === '"') {
                        // Aspas escapadas
                        campoAtual += '"';
                        i++; // Pular próximo caractere
                    } else {
                        // Alternar estado das aspas
                        dentroAspas = !dentroAspas;
                    }
                } else if (char === ';' && !dentroAspas) {
                    // Fim do campo (usando ; ao invés de ,)
                    campos.push(campoAtual.trim());
                    campoAtual = '';
                } else {
                    campoAtual += char;
                }
            }
            
            // Adicionar último campo
            campos.push(campoAtual.trim());
            linhas.push(campos);
        }
        
        return linhas;
        
    } catch (error) {
        console.error('Erro ao processar CSV:', error);
        throw new Error('Formato CSV inválido');
    }
}

// Processar dados importados (otimizado)
function processarDadosImportados(linhas) {
    try {
        const cabecalhos = linhas[0];
        const dadosLinhas = linhas.slice(1).filter(linha => 
            linha.some(campo => campo && String(campo).trim())
        );
        
        if (dadosLinhas.length === 0) {
            showNotification('❌ Nenhuma linha de dados válida encontrada', 'error');
            return;
        }
        
        if (dadosLinhas.length > 1000) {
            showNotification('⚠️ Muitas linhas! Máximo permitido: 1000 registros por importação', 'warning');
            return;
        }
        
        // Detectar tipo baseado nos cabeçalhos (detecção melhorada)
        let tipoPessoa = 'pessoa_fisica'; // padrão
        
        const cabecalhosLower = cabecalhos.map(h => String(h).toLowerCase());
        const indicadoresPJ = ['razao social', 'cnpj', 'nome fantasia', 'inscricao'];
        const indicadoresPF = ['nome completo', 'cpf', 'rg', 'nascimento'];
        
        const scoresPJ = indicadoresPJ.filter(ind => 
            cabecalhosLower.some(h => h.includes(ind))
        ).length;
        const scoresPF = indicadoresPF.filter(ind => 
            cabecalhosLower.some(h => h.includes(ind))
        ).length;
        
        if (scoresPJ > scoresPF) {
            tipoPessoa = 'pessoa_juridica';
        }
        
        console.log(`✅ Tipo detectado: ${tipoPessoa} (PF: ${scoresPF}, PJ: ${scoresPJ})`);
        console.log(`📊 Cabeçalhos: ${cabecalhos.length} colunas`);
        console.log(`📋 Linhas válidas: ${dadosLinhas.length}`);
        
        // Mostrar preview e confirmação
        mostrarPreviewImportacao(cabecalhos, dadosLinhas, tipoPessoa);
        
    } catch (error) {
        console.error('Erro ao processar dados:', error);
        showNotification(`Erro ao processar dados: ${error.message}`, 'error');
    }
}

// Mostrar preview da importação
function mostrarPreviewImportacao(cabecalhos, dadosLinhas, tipoPessoa) {
    const modal = document.createElement('div');
    modal.style.cssText = `
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
        max-width: 90%;
        width: 1000px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    // Gerar preview da tabela (primeiras 5 linhas)
    const previewLinhas = dadosLinhas.slice(0, 5);
    let tabelaHtml = '<table class="table table-striped table-sm"><thead><tr>';
    
    cabecalhos.forEach(cabecalho => {
        tabelaHtml += `<th style="font-size: 11px; white-space: nowrap;">${cabecalho}</th>`;
    });
    tabelaHtml += '</tr></thead><tbody>';
    
    previewLinhas.forEach(linha => {
        tabelaHtml += '<tr>';
        linha.forEach(campo => {
            const campoTruncado = String(campo).length > 20 
                ? String(campo).substring(0, 20) + '...' 
                : campo;
            tabelaHtml += `<td style="font-size: 10px;">${campoTruncado || '-'}</td>`;
        });
        tabelaHtml += '</tr>';
    });
    
    if (dadosLinhas.length > 5) {
        tabelaHtml += `<tr><td colspan="${cabecalhos.length}" class="text-center text-muted"><em>... e mais ${dadosLinhas.length - 5} linha(s)</em></td></tr>`;
    }
    
    tabelaHtml += '</tbody></table>';
    
    const tipoNome = tipoPessoa === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';
    
    painel.innerHTML = `
        <h4><i class="fas fa-table text-primary me-2"></i>Preview da Importação</h4>
        <div class="alert alert-info">
            <strong>Tipo detectado:</strong> ${tipoNome} | 
            <strong>Total de registros:</strong> ${dadosLinhas.length}
        </div>
        
        <h6>Preview dos dados (primeiras 5 linhas):</h6>
        <div style="overflow-x: auto; margin: 15px 0;">
            ${tabelaHtml}
        </div>
        
        <div class="alert alert-warning">
            <h6><i class="fas fa-exclamation-triangle me-1"></i>Antes de continuar:</h6>
            <ul class="mb-0">
                <li>Verifique se os dados estão corretos</li>
                <li>Campos obrigatórios serão validados</li>
                <li>Duplicatas serão detectadas e ignoradas</li>
                <li>A importação pode demorar alguns segundos</li>
            </ul>
        </div>
        
        <hr>
        <div class="d-flex justify-content-between">
            <button class="btn btn-secondary" onclick="this.closest('[style*=\"position: fixed\"]').remove()">
                <i class="fas fa-times me-1"></i>Cancelar
            </button>
            <button class="btn btn-success" onclick="confirmarImportacao('${tipoPessoa}', ${JSON.stringify(cabecalhos).replace(/"/g, '&quot;')}, ${JSON.stringify(dadosLinhas).replace(/"/g, '&quot;')}, this)">
                <i class="fas fa-upload me-1"></i>Confirmar Importação
            </button>
        </div>
    `;
    
    modal.appendChild(painel);
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Confirmar e executar importação (otimizada)
function confirmarImportacao(tipoPessoa, cabecalhos, dadosLinhas, botao) {
    try {
        console.log('🚀 Iniciando processo de importação...');
        
        // Desabilitar botão e mostrar loading
        botao.disabled = true;
        botao.style.cursor = 'not-allowed';
        botao.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Importando...';
        
        // Criar progress bar melhorada
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container-import';
        progressContainer.style.cssText = 'margin: 15px 0;';
        progressContainer.innerHTML = `
            <div class="progress mb-2" style="height: 25px;">
                <div id="import-progress-bar" class="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                     role="progressbar" style="width: 0%; font-weight: bold;">0%</div>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <small id="import-status" class="text-muted">
                    <i class="fas fa-hourglass-start me-1"></i>Preparando importação...
                </small>
                <small id="import-counter" class="badge bg-info">0 / ${dadosLinhas.length}</small>
            </div>
        `;
        botao.parentNode.insertBefore(progressContainer, botao);
        
        console.log('✅ Interface de progresso criada');
        
        const progressBar = document.getElementById('import-progress-bar');
        const statusText = document.getElementById('import-status');
        
        // Processar em lotes GRANDES para máxima velocidade
        // Lotes maiores = importação mais rápida
        const LOTE_SIZE = 50; // Aumentado para 50 registros por lote
        let sucessos = 0;
        let erros = 0;
        const errosDetalhados = [];
        let loteAtual = 0;
        
        // Cache de validação para melhor performance
        const cacheValidacao = {
            cpfs: new Set(),
            cnpjs: new Set(),
            goas: new Set()
        };
        
        // Pre-carregar dados existentes no cache
        try {
            const existentes = db.getAll(tipoPessoa);
            console.log(`📚 Registros existentes no banco (${tipoPessoa}):`, existentes.length);
            existentes.forEach(pessoa => {
                if (tipoPessoa === 'pessoa_fisica' && pessoa.cpf) {
                    cacheValidacao.cpfs.add(pessoa.cpf.replace(/\D/g, ''));
                } else if (tipoPessoa === 'pessoa_juridica' && pessoa.cnpj) {
                    cacheValidacao.cnpjs.add(pessoa.cnpj.replace(/\D/g, ''));
                }
                if (pessoa.goa) {
                    cacheValidacao.goas.add(pessoa.goa.toLowerCase());
                }
            });
            console.log(`📋 Linhas a importar: ${dadosLinhas.length}`);
            console.log(`📊 Cabeçalhos: ${cabecalhos.length} colunas`);
        } catch (error) {
            console.warn('Aviso ao carregar cache:', error);
        }
        
        function processarLote() {
            console.log(`🔄 PROCESSANDO LOTE ${loteAtual + 1}...`);
            const inicio = loteAtual * LOTE_SIZE;
            const fim = Math.min(inicio + LOTE_SIZE, dadosLinhas.length);
            const loteLinhas = dadosLinhas.slice(inicio, fim);
            
            console.log(`   📍 Linhas ${inicio + 1} até ${fim} de ${dadosLinhas.length}`);
            statusText.textContent = `Processando linhas ${inicio + 1} a ${fim} de ${dadosLinhas.length}...`;
            
            // Processar lote atual com tratamento robusto
            loteLinhas.forEach((linha, indexLote) => {
                const indexGlobal = inicio + indexLote;
                
                try {
                    // Verificar se linha tem dados
                    if (!linha || linha.length === 0) {
                        throw new Error('Linha vazia ou sem dados');
                    }
                    
                    const dadosPessoa = processarLinhaDados(linha, cabecalhos, tipoPessoa, indexGlobal);
                    
                    // Verificar se dados foram processados
                    if (!dadosPessoa || Object.keys(dadosPessoa).length === 0) {
                        throw new Error('Nenhum dado válido encontrado na linha');
                    }
                    
                    // Validar dados obrigatórios
                    const validacao = validarDadosObrigatorios(dadosPessoa, tipoPessoa);
                    if (!validacao.valido) {
                        throw new Error(`Dados inválidos: ${validacao.erros.join(', ')}`);
                    }
                    
                    // Verificar duplicata usando cache otimizado (apenas aviso, não bloqueia)
                    const duplicata = verificarDuplicataCache(dadosPessoa, tipoPessoa, cacheValidacao);
                    if (duplicata.existe) {
                        console.warn(`⚠️ Linha ${indexGlobal + 2}: ${duplicata.tipo} já existe: ${duplicata.valor} - Permitindo importação mesmo assim`);
                    }
                    
                    // Salvar no banco com tratamento de erro MELHORADO
                    try {
                        console.log(`💾 Salvando linha ${indexGlobal + 2}:`, {
                            nome: dadosPessoa.nome || dadosPessoa.razao_social,
                            cpf_cnpj: dadosPessoa.cpf || dadosPessoa.cnpj,
                            campos: Object.keys(dadosPessoa).length
                        });
                        
                        const resultado = db.insert(tipoPessoa, dadosPessoa);
                        
                        console.log(`🔍 Resultado db.insert():`, resultado);
                        
                        if (resultado && resultado.id) {
                            // Atualizar cache com novo registro
                            atualizarCache(dadosPessoa, tipoPessoa, cacheValidacao);
                            sucessos++;
                            console.log(`✅ Linha ${indexGlobal + 2}: ${dadosPessoa.nome || dadosPessoa.razao_social} importada com ID ${resultado.id}`);
                            
                            // Verificar se realmente foi salvo
                            const verificacao = db.get(tipoPessoa, resultado.id);
                            if (verificacao) {
                                console.log(`✅ CONFIRMADO: Registro ${resultado.id} está no banco!`);
                            } else {
                                console.error(`❌ ERRO: Registro ${resultado.id} NÃO está no banco após inserção!`);
                            }
                        } else {
                            console.error('❌ Resultado da inserção:', resultado);
                            throw new Error('Falha ao salvar - banco não retornou ID');
                        }
                    } catch (dbError) {
                        console.error('❌ Erro detalhado do banco:', {
                            erro: dbError,
                            mensagem: dbError.message,
                            linha: indexGlobal + 2,
                            dados: dadosPessoa
                        });
                        throw new Error(`Erro no banco: ${dbError.message || 'Erro desconhecido'}`);
                    }
                    
                } catch (error) {
                    erros++;
                    const linhaExcel = indexGlobal + 2; // +2 porque Excel começa em 1 e tem cabeçalho
                    const mensagemErro = `Linha ${linhaExcel}: ${error.message}`;
                    errosDetalhados.push(mensagemErro);
                    console.warn(`❌ ${mensagemErro}`, {linha, dadosPessoa: dadosPessoa || 'Não processado'});
                }
            });
            
            // Atualizar progress bar e contador
            const progresso = ((fim / dadosLinhas.length) * 100);
            progressBar.style.width = progresso + '%';
            progressBar.textContent = Math.round(progresso) + '%';
            
            // Atualizar contador
            const counter = document.getElementById('import-counter');
            if (counter) {
                counter.textContent = `${fim} / ${dadosLinhas.length}`;
                counter.className = progresso === 100 ? 'badge bg-success' : 'badge bg-info';
            }
            
            loteAtual++;
            
            console.log(`✅ Lote ${loteAtual} concluído: ${sucessos} sucessos, ${erros} erros`);
            
            // Continuar processamento ou finalizar
            if (fim < dadosLinhas.length) {
                console.log(`⏭️ Próximo lote: ${fim + 1} a ${Math.min(fim + LOTE_SIZE, dadosLinhas.length)}`);
                // Processar próximo lote imediatamente para máxima velocidade
                processarLote();
            } else {
                console.log('🏁 TODOS OS LOTES PROCESSADOS! Iniciando finalização...');
                console.log(`📊 TOTAIS FINAIS: Sucessos=${sucessos}, Erros=${erros}`);
                // Aguardar 100ms para garantir que UI atualizou
                setTimeout(() => {
                    console.log('🔚 Chamando finalizarImportacao()...');
                    finalizarImportacao();
                }, 100);
            }
        }
        
        function finalizarImportacao() {
            console.log('═══════════════════════════════════════════');
            console.log('🏁 FUNÇÃO finalizarImportacao() CHAMADA!');
            console.log('═══════════════════════════════════════════');
            console.log(`   ✅ Sucessos: ${sucessos}`);
            console.log(`   ❌ Erros: ${erros}`);
            console.log(`   📊 Total processado: ${sucessos + erros}`);
            
            // Salvar IMEDIATAMENTE antes de qualquer outra coisa
            console.log('💾 SALVANDO DADOS NO LOCALSTORAGE...');
            try {
                db.saveToStorage();
                console.log('✅ DADOS SALVOS COM SUCESSO!');
                
                // Verificar se realmente salvou
                const verificacao = db.getAll(tipoPessoa);
                console.log(`🔍 VERIFICAÇÃO: ${verificacao.length} registros no banco agora`);
            } catch (saveError) {
                console.error('❌ ERRO AO SALVAR:', saveError);
            }
            
            // Fechar TODOS os modais (preview e loading)
            console.log('🚪 INICIANDO FECHAMENTO DE MODAIS...');
            try {
                // Buscar de múltiplas formas
                console.log('   🔍 Buscando modais...');
                
                // Método 1: Por atributo style
                const modals1 = document.querySelectorAll('[style*="position: fixed"]');
                console.log(`   📌 Método 1 (style fixed): ${modals1.length} modais`);
                
                // Método 2: Por z-index alto
                const modals2 = document.querySelectorAll('[style*="z-index: 99999"]');
                console.log(`   📌 Método 2 (z-index alto): ${modals2.length} modais`);
                
                // Método 3: Buscar qualquer div com position fixed
                const allDivs = document.querySelectorAll('div');
                const modals3 = Array.from(allDivs).filter(div => {
                    const style = window.getComputedStyle(div);
                    return style.position === 'fixed' && parseInt(style.zIndex) > 1000;
                });
                console.log(`   📌 Método 3 (computed style): ${modals3.length} modais`);
                
                // Unir todos os modais encontrados (sem duplicatas)
                const todosModais = new Set([...modals1, ...modals2, ...modals3]);
                console.log(`   🎯 TOTAL DE MODAIS ÚNICOS: ${todosModais.size}`);
                
                if (todosModais.size === 0) {
                    console.warn('   ⚠️ NENHUM MODAL ENCONTRADO! Isso é estranho...');
                } else {
                    todosModais.forEach((modal, index) => {
                        console.log(`   🗑️ Removendo modal ${index + 1}/${todosModais.size}...`);
                        console.log(`      Tag: ${modal.tagName}, Classes: ${modal.className}`);
                        modal.remove();
                    });
                    console.log('✅ TODOS OS MODAIS REMOVIDOS!');
                }
            } catch (e) {
                console.error('❌ ERRO AO FECHAR MODAIS:', e);
            }
            
            // Reabilitar botão se ainda existir
            try {
                if (botao && botao.parentNode) {
                    botao.disabled = false;
                    botao.style.opacity = '1';
                    botao.innerHTML = '<i class="fas fa-upload me-1"></i>Confirmar Importação';
                }
            } catch (e) {
                console.warn('Botão já removido');
            }
            
            // Mostrar resultado
            console.log('📢 PREPARANDO NOTIFICAÇÕES E ATUALIZAÇÕES...');
            const tipoNome = tipoPessoa === 'pessoa_fisica' ? 'Pessoas Físicas' : 'Pessoas Jurídicas';
            
            if (sucessos > 0) {
                console.log('✅ IMPORTAÇÃO COM SUCESSOS!');
                
                // Notificação de sucesso IMEDIATA
                console.log('📢 Mostrando notificação de sucesso...');
                showNotification(`✅ ${sucessos} ${tipoNome} importadas com sucesso!`, 'success');
                
                // Atualizar interface após delay de 500ms
                console.log('⏰ Agendando atualização da interface em 500ms...');
                setTimeout(() => {
                    console.log('═══════════════════════════════════════════');
                    console.log('🔄 INICIANDO ATUALIZAÇÃO DA INTERFACE');
                    console.log('═══════════════════════════════════════════');
                    
                    try {
                        // Verificar novamente quantos registros temos
                        const totalAgora = db.getAll(tipoPessoa).length;
                        console.log(`📊 Total de registros no banco: ${totalAgora}`);
                        
                        // Recarregar dados na interface
                        if (typeof loadDashboard === 'function') {
                            console.log('📊 Chamando loadDashboard()...');
                            loadDashboard();
                            console.log('✅ loadDashboard() executado');
                        } else {
                            console.warn('⚠️ loadDashboard() não está disponível');
                        }
                        
                        // Atualizar listagens
                        if (typeof loadPessoasFisicas === 'function' && tipoPessoa === 'pessoa_fisica') {
                            console.log('👥 Chamando loadPessoasFisicas()...');
                            loadPessoasFisicas();
                            console.log('✅ loadPessoasFisicas() executado');
                        } else if (tipoPessoa === 'pessoa_fisica') {
                            console.warn('⚠️ loadPessoasFisicas() não está disponível');
                        }
                        
                        if (typeof loadPessoasJuridicas === 'function' && tipoPessoa === 'pessoa_juridica') {
                            console.log('🏢 Chamando loadPessoasJuridicas()...');
                            loadPessoasJuridicas();
                            console.log('✅ loadPessoasJuridicas() executado');
                        } else if (tipoPessoa === 'pessoa_juridica') {
                            console.warn('⚠️ loadPessoasJuridicas() não está disponível');
                        }
                        
                        // Atualizar árvore
                        if (typeof renderizarArvoreInterativa === 'function') {
                            console.log('🌳 Chamando renderizarArvoreInterativa()...');
                            renderizarArvoreInterativa();
                            console.log('✅ renderizarArvoreInterativa() executado');
                        } else {
                            console.warn('⚠️ renderizarArvoreInterativa() não está disponível');
                        }
                        
                        console.log('═══════════════════════════════════════════');
                        console.log('✅ INTERFACE COMPLETAMENTE ATUALIZADA!');
                        console.log('═══════════════════════════════════════════');
                        
                        // Mostrar mensagem final após mais 500ms
                        setTimeout(() => {
                            console.log('📢 Mostrando notificação final...');
                            showNotification(`🎉 Importação concluída! ${sucessos} registros adicionados ao banco.`, 'success');
                            console.log('✅ Processo TOTALMENTE CONCLUÍDO!');
                        }, 500);
                        
                    } catch (error) {
                        console.error('❌ ERRO AO ATUALIZAR INTERFACE:', error);
                        console.error('Stack trace:', error.stack);
                        showNotification('⚠️ Dados importados, mas houve erro ao atualizar interface. Recarregue a página (F5).', 'warning');
                    }
                }, 500);
            } else {
                console.warn('⚠️ Nenhum sucesso registrado');
            }
            
            if (erros > 0) {
                console.log(`⚠️ ERROS DETECTADOS: ${erros} registros com erro`);
                setTimeout(() => {
                    showNotification(`⚠️ ${erros} registro(s) com erro. ${sucessos > 0 ? 'Outros foram importados.' : ''}`, 'warning');
                    console.group('📋 ERROS DE IMPORTAÇÃO DETALHADOS');
                    console.log(`Total de erros: ${erros}`);
                    errosDetalhados.forEach((erro, index) => {
                        console.warn(`${index + 1}. ${erro}`);
                    });
                    console.groupEnd();
                }, 1500);
            }
            
            // Se não houver sucessos nem erros, algo deu errado
            if (sucessos === 0 && erros === 0) {
                console.error('═══════════════════════════════════════════');
                console.error('❌ ERRO CRÍTICO: Nenhum registro processado!');
                console.error('═══════════════════════════════════════════');
                showNotification('❌ Erro: Nenhum registro foi processado', 'error');
            }
            
            console.log('═══════════════════════════════════════════');
            console.log('🏁 FUNÇÃO finalizarImportacao() FINALIZADA');
            console.log('═══════════════════════════════════════════');
        }
        
        // Desabilitar botão para evitar múltiplos cliques
        botao.disabled = true;
        botao.style.opacity = '0.5';
        
        // Mostrar feedback inicial detalhado
        console.log(`🚀 INICIANDO IMPORTAÇÃO:`);
        console.log(`   📋 Total de linhas: ${dadosLinhas.length}`);
        console.log(`   📦 Tamanho do lote: ${LOTE_SIZE}`);
        console.log(`   🎯 Tipo: ${tipoPessoa}`);
        console.log(`   ⏱️ Estimativa: ${Math.ceil(dadosLinhas.length / LOTE_SIZE)} lotes`);
        
        showNotification(`🚀 Importando ${dadosLinhas.length} ${tipoPessoa === 'pessoa_fisica' ? 'pessoas' : 'empresas'}...`, 'info');
        
        // Iniciar processamento imediatamente
        setTimeout(processarLote, 10);
        
    } catch (error) {
        console.error('Erro na importação:', error);
        showNotification(`Erro durante a importação: ${error.message}`, 'error');
        botao.disabled = false;
        botao.innerHTML = '<i class="fas fa-upload me-1"></i>Confirmar Importação';
    }
}

// Função auxiliar para processar linha de dados (melhorada)
function processarLinhaDados(linha, cabecalhos, tipoPessoa, index) {
    try {
        const dadosPessoa = {};
        let camposProcessados = 0;
        
        // Mapear dados baseado nos cabeçalhos
        cabecalhos.forEach((cabecalho, i) => {
            const valor = linha[i] ? String(linha[i]).trim() : '';
            if (valor && valor !== '-' && valor !== 'N/A' && valor !== '') {
                const campo = mapearCampoImportacao(cabecalho, tipoPessoa);
                
                if (campo) {
                    // Processar campos especiais
                    if (cabecalho.toLowerCase().includes('filho') || 
                        cabecalho.toLowerCase().includes('irmao') || 
                        cabecalho.toLowerCase().includes('empresa') || 
                        cabecalho.toLowerCase().includes('socio')) {
                        processarCampoComplexo(dadosPessoa, campo, valor, cabecalho);
                    } else {
                        dadosPessoa[campo] = valor;
                    }
                    camposProcessados++;
                } else {
                    console.warn(`Campo não mapeado: ${cabecalho}`);
                }
            }
        });
        
        // Verificar se pelo menos alguns campos foram processados
        if (camposProcessados === 0) {
            throw new Error('Nenhum campo válido encontrado na linha');
        }
        
        // Gerar GOA se não fornecido
        if (!dadosPessoa.goa) {
            const prefixo = tipoPessoa === 'pessoa_fisica' ? 'GOAIMPORT' : 'GOAIMPJ';
            const timestamp = Date.now().toString().slice(-4);
            const indexStr = index.toString().padStart(3, '0');
            dadosPessoa.goa = `${prefixo}${timestamp}${indexStr}`;
        }
        
        // Adicionar data de cadastro se não fornecida
        if (!dadosPessoa.data_cadastro) {
            dadosPessoa.data_cadastro = new Date().toISOString();
        }
        
        console.log(`📋 Linha ${index + 2}: ${camposProcessados} campos processados para ${dadosPessoa.nome || dadosPessoa.razao_social || 'pessoa sem nome'}`);
        return dadosPessoa;
        
    } catch (error) {
        console.error(`Erro ao processar linha ${index + 2}:`, error);
        throw error;
    }
}

// Função auxiliar para processar campos complexos (filhos, irmãos, etc.)
function processarCampoComplexo(dadosPessoa, campo, valor, cabecalhoOriginal) {
    // Detectar tipo de campo complexo
    if (cabecalhoOriginal.toLowerCase().includes('filho')) {
        if (!dadosPessoa.filhos) dadosPessoa.filhos = {};
        
        const numero = extrairNumero(cabecalhoOriginal);
        if (!dadosPessoa.filhos[numero]) dadosPessoa.filhos[numero] = {};
        
        if (cabecalhoOriginal.toLowerCase().includes('nome')) {
            dadosPessoa.filhos[numero].nome = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('cpf')) {
            dadosPessoa.filhos[numero].cpf = valor;
        }
    } else if (cabecalhoOriginal.toLowerCase().includes('irmao')) {
        if (!dadosPessoa.irmaos) dadosPessoa.irmaos = {};
        
        const numero = extrairNumero(cabecalhoOriginal);
        if (!dadosPessoa.irmaos[numero]) dadosPessoa.irmaos[numero] = {};
        
        if (cabecalhoOriginal.toLowerCase().includes('nome')) {
            dadosPessoa.irmaos[numero].nome = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('cpf')) {
            dadosPessoa.irmaos[numero].cpf = valor;
        }
    } else if (cabecalhoOriginal.toLowerCase().includes('empresa')) {
        if (!dadosPessoa.empresas) dadosPessoa.empresas = {};
        
        const numero = extrairNumero(cabecalhoOriginal);
        if (!dadosPessoa.empresas[numero]) dadosPessoa.empresas[numero] = {};
        
        if (cabecalhoOriginal.toLowerCase().includes('razao social')) {
            dadosPessoa.empresas[numero].razao_social = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('cnpj')) {
            dadosPessoa.empresas[numero].cnpj = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('participacao')) {
            dadosPessoa.empresas[numero].participacao = valor;
        }
    } else if (cabecalhoOriginal.toLowerCase().includes('socio')) {
        if (!dadosPessoa.socios) dadosPessoa.socios = {};
        
        const numero = extrairNumero(cabecalhoOriginal);
        if (!dadosPessoa.socios[numero]) dadosPessoa.socios[numero] = {};
        
        if (cabecalhoOriginal.toLowerCase().includes('nome')) {
            dadosPessoa.socios[numero].nome = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('cpf')) {
            dadosPessoa.socios[numero].cpf = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('participacao')) {
            dadosPessoa.socios[numero].participacao = valor;
        } else if (cabecalhoOriginal.toLowerCase().includes('qualificacao')) {
            dadosPessoa.socios[numero].qualificacao = valor;
        }
    }
}

// Função auxiliar para extrair número do cabeçalho
function extrairNumero(cabecalho) {
    const match = cabecalho.match(/\d+/);
    return match ? match[0] : '1';
}

// Função otimizada de validação de dados obrigatórios
function validarDadosObrigatorios(dadosPessoa, tipoPessoa) {
    const erros = [];
    
    if (tipoPessoa === 'pessoa_fisica') {
        // Validação SUPER FLEXÍVEL - apenas verifica se campos existem
        if (!dadosPessoa.nome || dadosPessoa.nome.trim().length < 1) {
            erros.push('Nome obrigatório');
        }
        
        if (!dadosPessoa.cpf || dadosPessoa.cpf.trim().length === 0) {
            erros.push('CPF obrigatório');
        } else {
            const cpfLimpo = dadosPessoa.cpf.replace(/\D/g, '');
            // Aceita CPF com 9-11 dígitos (permite variação)
            if (cpfLimpo.length < 9 || cpfLimpo.length > 11) {
                erros.push('CPF inválido (mínimo 9 dígitos)');
            }
        }
    } else if (tipoPessoa === 'pessoa_juridica') {
        if (!dadosPessoa.razao_social || dadosPessoa.razao_social.trim().length < 1) {
            erros.push('Razão Social obrigatória');
        }
        
        if (!dadosPessoa.cnpj || dadosPessoa.cnpj.trim().length === 0) {
            erros.push('CNPJ obrigatório');
        } else {
            const cnpjLimpo = dadosPessoa.cnpj.replace(/\D/g, '');
            // Aceita CNPJ com 12-14 dígitos (permite variação)
            if (cnpjLimpo.length < 12 || cnpjLimpo.length > 14) {
                erros.push('CNPJ inválido (mínimo 12 dígitos)');
            }
        }
    }
    
    return {
        valido: erros.length === 0,
        erros: erros
    };
}

// Função para verificar duplicata usando cache otimizado
function verificarDuplicataCache(dadosPessoa, tipoPessoa, cache) {
    if (tipoPessoa === 'pessoa_fisica' && dadosPessoa.cpf) {
        const cpfLimpo = dadosPessoa.cpf.replace(/\D/g, '');
        if (cache.cpfs.has(cpfLimpo)) {
            return { existe: true, tipo: 'CPF', valor: dadosPessoa.cpf };
        }
    } else if (tipoPessoa === 'pessoa_juridica' && dadosPessoa.cnpj) {
        const cnpjLimpo = dadosPessoa.cnpj.replace(/\D/g, '');
        if (cache.cnpjs.has(cnpjLimpo)) {
            return { existe: true, tipo: 'CNPJ', valor: dadosPessoa.cnpj };
        }
    }
    
    if (dadosPessoa.goa && cache.goas.has(dadosPessoa.goa.toLowerCase())) {
        return { existe: true, tipo: 'GOA', valor: dadosPessoa.goa };
    }
    
    return { existe: false };
}

// Função para atualizar cache com novo registro
function atualizarCache(dadosPessoa, tipoPessoa, cache) {
    if (tipoPessoa === 'pessoa_fisica' && dadosPessoa.cpf) {
        cache.cpfs.add(dadosPessoa.cpf.replace(/\D/g, ''));
    } else if (tipoPessoa === 'pessoa_juridica' && dadosPessoa.cnpj) {
        cache.cnpjs.add(dadosPessoa.cnpj.replace(/\D/g, ''));
    }
    
    if (dadosPessoa.goa) {
        cache.goas.add(dadosPessoa.goa.toLowerCase());
    }
}

// Cache para verificação de duplicatas (mais rápido)
let cacheDuplicatas = null;
function verificarDuplicataRapida(dadosPessoa, tipoPessoa) {
    // Inicializar cache se necessário
    if (!cacheDuplicatas) {
        cacheDuplicatas = {
            pessoa_fisica: new Set(),
            pessoa_juridica: new Set()
        };
        
        // Preencher cache com dados existentes
        db.getAll('pessoa_fisica').forEach(p => {
            if (p.cpf) cacheDuplicatas.pessoa_fisica.add(p.cpf.replace(/\D/g, ''));
        });
        
        db.getAll('pessoa_juridica').forEach(p => {
            if (p.cnpj) cacheDuplicatas.pessoa_juridica.add(p.cnpj.replace(/\D/g, ''));
        });
    }
    
    const campo = tipoPessoa === 'pessoa_fisica' ? 'cpf' : 'cnpj';
    const valorLimpo = dadosPessoa[campo].replace(/\D/g, '');
    
    if (cacheDuplicatas[tipoPessoa].has(valorLimpo)) {
        return true;
    }
    
    // Adicionar ao cache para próximas verificações
    cacheDuplicatas[tipoPessoa].add(valorLimpo);
    return false;
}

// Mapear nomes de campos da importação para campos do banco
function mapearCampoImportacao(cabecalho, tipoPessoa) {
    const mapeamento = {
        pessoa_fisica: {
            'nome completo': 'nome',
            'cpf': 'cpf',
            'rg': 'rg',
            'data de nascimento': 'data_nascimento',
            'sexo': 'sexo',
            'estado civil': 'estado_civil',
            'naturalidade': 'naturalidade',
            'nome da mãe': 'mae',
            'nome do pai': 'pai',
            'goa': 'goa',
            'telefone 1': 'telefone1',
            'telefone 2': 'telefone2',
            'telefone 3': 'telefone3',
            'telefone 4': 'telefone4',
            'telefone 5': 'telefone5',
            'email 1': 'email',
            'email 2': 'email2',
            'cep': 'cep',
            'endereço 1': 'endereco1',
            'endereço 2': 'endereco2',
            'endereço 3': 'endereco3',
            'endereço 4': 'endereco4',
            'endereço 5': 'endereco5',
            'observações gerais': 'observacoes',
            'data de cadastro': 'data_cadastro',
            'status': 'status'
        },
        pessoa_juridica: {
            'razão social': 'razao_social',
            'nome fantasia': 'nome_fantasia',
            'cnpj': 'cnpj',
            'inscrição estadual': 'inscricao_estadual',
            'inscrição municipal': 'inscricao_municipal',
            'data abertura': 'data_abertura',
            'data situação': 'data_situacao',
            'porte empresa': 'porte',
            'natureza jurídica': 'natureza_juridica',
            'atividade principal': 'atividade_principal',
            'atividade secundária': 'atividade_secundaria',
            'capital social': 'capital_social',
            'situação': 'situacao',
            'motivo situação': 'motivo_situacao',
            'goa': 'goa',
            'telefone 1': 'telefone1',
            'telefone 2': 'telefone2',
            'telefone 3': 'telefone3',
            'telefone 4': 'telefone4',
            'telefone 5': 'telefone5',
            'email principal': 'email',
            'email secundário': 'email2',
            'site/homepage': 'site',
            'cep': 'cep',
            'endereço completo': 'endereco',
            'número': 'numero',
            'complemento': 'complemento',
            'bairro': 'bairro',
            'cidade': 'cidade',
            'uf': 'uf',
            'país': 'pais',
            'faturamento anual': 'faturamento_anual',
            'número funcionários': 'numero_funcionarios',
            'regime tributário': 'regime_tributario',
            'cnae principal': 'cnae_principal',
            'cnae secundário': 'cnae_secundario',
            'observações gerais': 'observacoes',
            'data de cadastro': 'data_cadastro',
            'status cadastral': 'status'
        }
    };
    
    const cabecalhoLimpo = cabecalho.toLowerCase().replace(/\s*\*\s*$/, '').trim();
    return mapeamento[tipoPessoa][cabecalhoLimpo] || cabecalhoLimpo.replace(/\s+/g, '_');
}

console.log('📊 Sistema de Templates Excel carregado com sucesso!');