/**
 * Sistema de Auto-Cadastro por Documentos
 * Processa documentos automaticamente e extrai informações para cadastro
 */

// Configurar event listeners para upload de documentos
function setupDocumentUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    
    if (!dropZone || !fileUpload) return;

    // Prevenir comportamento padrão do navegador
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Destacar zona de drop quando arrastar arquivo
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Processar arquivos quando soltar
    dropZone.addEventListener('drop', handleDrop, false);

    // Processar arquivos quando selecionar
    fileUpload.addEventListener('change', handleFiles, false);
}

// Prevenir comportamentos padrão
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Destacar zona de drop
function highlight(e) {
    const dropZone = document.getElementById('drop-zone');
    dropZone.classList.add('bg-light');
    dropZone.style.borderColor = '#28a745';
}

// Remover destaque
function unhighlight(e) {
    const dropZone = document.getElementById('drop-zone');
    dropZone.classList.remove('bg-light');
    dropZone.style.borderColor = '#007bff';
}

// Processar arquivos soltos
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

// Processar arquivos selecionados
function handleFiles(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    showProcessingState();
    
    files.forEach((file, index) => {
        setTimeout(() => {
            processDocument(file, index, files.length);
        }, index * 1000); // Processar um por vez com delay
    });
}

// Mostrar estado de processamento
function showProcessingState() {
    document.getElementById('drop-content').style.display = 'none';
    document.getElementById('processing-content').style.display = 'block';
}

// Voltar ao estado normal
function hideProcessingState() {
    document.getElementById('drop-content').style.display = 'block';
    document.getElementById('processing-content').style.display = 'none';
    
    // Limpar input file
    document.getElementById('file-upload').value = '';
}

// Processar documento individual
async function processDocument(file, index, total) {
    try {
        updateProgress((index / total) * 100);
        updateStatusBar(`Processando arquivo ${index + 1} de ${total}: ${file.name}`);
        
        let extractedText = '';
        
        // Processar baseado no tipo de arquivo
        if (file.type.startsWith('image/')) {
            extractedText = await processImageFile(file);
        } else if (file.type === 'text/plain') {
            extractedText = await processTextFile(file);
        } else if (file.type === 'application/pdf') {
            extractedText = await processPdfFile(file);
        } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            extractedText = await processWordFile(file);
        } else {
            showNotification(`Tipo de arquivo não suportado: ${file.name}`, 'warning');
            return;
        }
        
        if (extractedText.trim()) {
            const dadosExtraidos = extractDataFromText(extractedText);
            if (dadosExtraidos) {
                // Cadastrar automaticamente sem modal
                cadastrarAutomaticamente(dadosExtraidos, file.name);
            } else {
                showNotification(`❌ Nenhum dado relevante encontrado em: ${file.name}`, 'warning');
            }
        } else {
            showNotification(`❌ Não foi possível extrair texto de: ${file.name}`, 'error');
        }
        
        // Se é o último arquivo, esconder processamento
        if (index === total - 1) {
            setTimeout(hideProcessingState, 1000);
        }
        
    } catch (error) {
        console.error('Erro ao processar documento:', error);
        showNotification(`Erro ao processar: ${file.name}`, 'error');
        if (index === total - 1) {
            setTimeout(hideProcessingState, 1000);
        }
    }
}

// Atualizar barra de progresso
function updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

// Processar arquivo de imagem (simulação de OCR)
async function processImageFile(file) {
    return new Promise((resolve) => {
        // Simulação de OCR - em um caso real, usaria uma biblioteca como Tesseract.js
        setTimeout(() => {
            showNotification('OCR simulado - Em produção, use Tesseract.js ou API de OCR', 'info');
            // Texto simulado para demonstração
            resolve(`
                Nome: João Silva Santos
                CPF: 123.456.789-01
                RG: 12.345.678-9
                Data de Nascimento: 15/05/1985
                Nome da Mãe: Maria Silva Santos
                Endereço: Rua das Flores, 123 - Centro - São Paulo/SP
                Telefone: (11) 99988-7766
            `);
        }, 2000);
    });
}

// Processar arquivo de texto
async function processTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Processar arquivo PDF (simulação)
async function processPdfFile(file) {
    return new Promise((resolve) => {
        // Em um caso real, usaria PDF.js ou similar
        setTimeout(() => {
            showNotification('PDF simulado - Em produção, use PDF.js', 'info');
            resolve(`
                CERTIDÃO DE NASCIMENTO
                
                Nome: Maria Silva Santos
                Data de Nascimento: 20/03/1990
                Local: São Paulo, SP
                Nome do Pai: João Silva Santos  
                Nome da Mãe: Ana Silva Santos
                CPF: 987.654.321-00
                
                Cartório: 1º Ofício de Registro Civil
                Livro: 123 Folha: 45
            `);
        }, 3000);
    });
}

// Processar arquivo Word (simulação)
async function processWordFile(file) {
    return new Promise((resolve) => {
        // Em um caso real, usaria uma biblioteca para ler DOC/DOCX
        setTimeout(() => {
            showNotification('DOC/DOCX simulado - Em produção, use biblioteca específica', 'info');
            resolve(`
                CONTRATO SOCIAL
                
                Razão Social: Tech Solutions Ltda
                Nome Fantasia: TechSol  
                CNPJ: 98.765.432/0001-98
                
                Sócios:
                - João Silva Santos - CPF: 123.456.789-01 - 50%
                - Maria Silva Santos - CPF: 987.654.321-00 - 50%
                
                Capital Social: R$ 100.000,00
                Endereço: Av. Paulista, 1000 - Bela Vista - São Paulo/SP
                Telefone: (11) 4455-6677
            `);
        }, 2500);
    });
}

// Extrair dados estruturados do texto
function extractDataFromText(text) {
    const dadosExtraidos = {
        tipo: null, // 'fisica' ou 'juridica'
        dados: {}
    };
    
    // Normalizar texto
    const textoLimpo = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Detectar tipo de documento/pessoa
    if (textoLimpo.includes('razao social') || 
        textoLimpo.includes('cnpj') || 
        textoLimpo.includes('contrato social') ||
        textoLimpo.includes('pessoa juridica')) {
        dadosExtraidos.tipo = 'juridica';
        extractJuridicaData(text, dadosExtraidos.dados);
    } else {
        dadosExtraidos.tipo = 'fisica';
        extractFisicaData(text, dadosExtraidos.dados);
    }
    
    // Verificar se encontrou dados suficientes
    const temDados = Object.keys(dadosExtraidos.dados).length > 0;
    
    return temDados ? dadosExtraidos : null;
}

// Extrair dados de pessoa física - VERSÃO MELHORADA
function extractFisicaData(text, dados) {
    console.log('🔍 Extraindo dados de pessoa física do texto...');
    
    // Padrões de regex APRIMORADOS para extrair informações
    const patterns = {
        // NOME - múltiplos padrões
        nome: [
            /(?:nome completo[:\s]*|nome[:\s]*|requerente[:\s]*|identificação[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{2,60})/i,
            /^\s*([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{5,60})\s*$/m,
            /NOME:\s*([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{2,60})/i
        ],
        
        // CPF - múltiplos formatos
        cpf: [
            /(\d{3}\.\d{3}\.\d{3}-\d{2})/,
            /(\d{11})/,
            /CPF[:\s]*(\d{3}\.?\d{3}\.?\d{3}[-\.]?\d{2})/i
        ],
        
        // RG - múltiplos formatos
        rg: [
            /(?:rg[:\s]*|identidade[:\s]*|doc\s*identidade[:\s]*)(\d{1,2}\.?\d{3}\.?\d{3}[-\.]?\w{1,2})/i,
            /(\d{1,2}\.\d{3}\.\d{3}[-\.]?\w{1,2})/
        ],
        
        // DATA DE NASCIMENTO
        nascimento: [
            /(?:nascimento[:\s]*|nascido[:\s]*|data[:\s]*nasc[:\s]*|dt[:\s]*nasc[:\s]*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
            /(?:nasceu em[:\s]*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
        ],
        
        // FILIAÇÃO
        mae: [
            /(?:mae[:\s]*|mãe[:\s]*|m\.e[:\s]*|nome da m[aã]e[:\s]*|filiação materna[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{3,60})/i,
            /(?:filho\(a\) de[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{3,60})\s*(?:e|,)/i
        ],
        
        pai: [
            /(?:pai[:\s]*|nome do pai[:\s]*|filiação paterna[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{3,60})/i,
            /(?:e[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{3,60})$/m
        ],
        
        // TELEFONES - múltiplos formatos
        telefone: [
            /(\(?(?:0?11|0?\d{2})\)?\s?\d{4,5}[-\s]?\d{4})/,
            /(?:telefone[:\s]*|tel[:\s]*|fone[:\s]*|celular[:\s]*)(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/i,
            /(\(?\d{2}\)?\s?9\d{4}[-\s]?\d{4})/
        ],
        
        // ENDEREÇOS COMPLETOS - padrões avançados
        endereco: [
            /(?:endereço[:\s]*|enderecos?[:\s]*|rua[:\s]*|av[:\s]*|avenida[:\s]*|alameda[:\s]*|travessa[:\s]*|praça[:\s]*)([^\n]{10,150})/i,
            /(?:residência[:\s]*|reside em[:\s]*|domiciliado[:\s]*)([^\n]{10,150})/i,
            /(?:logradouro[:\s]*)([^\n]{10,150})/i
        ],
        
        // CIDADE E ESTADO
        cidade: [
            /(?:cidade[:\s]*|município[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s\-]{2,50})/i,
            /([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s\-]{2,30})\s*[-\/]\s*[A-Z]{2}$/m
        ],
        
        estado: [
            /(?:estado[:\s]*|uf[:\s]*)([A-Z]{2})/i,
            /[A-Za-záéíóúâêôàçãõ\s\-]+\s*[-\/]\s*([A-Z]{2})$/m
        ],
        
        // CEP
        cep: [
            /(\d{5}[-\.]?\d{3})/,
            /(?:cep[:\s]*)(\d{5}[-\.]?\d{3})/i
        ],
        
        // IRMÃOS/FAMÍLIA
        irmaos: [
            /(?:irmãos?[:\s]*|irmãs?[:\s]*|irm[aã]os?[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s,&]{3,200})/i,
            /(?:família[:\s]*|parentes[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s,&]{3,200})/i
        ],
        
        // ESTADO CIVIL
        estado_civil: [
            /(?:estado civil[:\s]*|civil[:\s]*)(solteiro|casado|divorciado|viúvo|separado|união estável)/i
        ],
        
        // PROFISSÃO/OCUPAÇÃO
        ocupacao: [
            /(?:profissão[:\s]*|ocupação[:\s]*|trabalha[:\s]*como[:\s]*)([A-Za-záéíóúâêôàçãõ\s]{3,50})/i
        ]
    };
    
    // Processar cada padrão
    Object.keys(patterns).forEach(campo => {
        const padroes = Array.isArray(patterns[campo]) ? patterns[campo] : [patterns[campo]];
        
        for (let padrao of padroes) {
            const match = text.match(padrao);
            if (match && match[1] && match[1].trim().length > 0) {
                dados[campo] = match[1].trim();
                console.log(`✅ ${campo}: ${dados[campo]}`);
                break; // Usar a primeira correspondência válida
            }
        }
    });
    
    // LIMPEZAS E VALIDAÇÕES ESPECÍFICAS
    if (dados.nome) {
        dados.nome = dados.nome
            .replace(/^(nome|sr|sra|senhor|senhora|requerente)[:\s]*/i, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    
    if (dados.endereco) {
        // Limpar e formatar endereço
        dados.endereco = dados.endereco
            .replace(/^(endereço|rua|av|avenida|alameda)[:\s]*/i, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    
    if (dados.nascimento) {
        dados.nascimento = convertToISODate(dados.nascimento);
    }
    
    if (dados.cpf) {
        dados.cpf = dados.cpf.replace(/\D/g, ''); // Apenas números
        if (dados.cpf.length !== 11) {
            delete dados.cpf; // Remover se inválido
        }
    }
    
    if (dados.telefone) {
        dados.telefone = dados.telefone.replace(/\D/g, ''); // Apenas números
    }
    
    // Log dos dados extraídos
    console.log('📋 Dados extraídos para pessoa física:', dados);
}

// Extrair dados de pessoa jurídica - VERSÃO MELHORADA
function extractJuridicaData(text, dados) {
    console.log('🔍 Extraindo dados de pessoa jurídica do texto...');
    
    const patterns = {
        // RAZÃO SOCIAL - múltiplos padrões
        razao_social: [
            /(?:razão social[:\s]*|denominação[:\s]*|empresa[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s&\-\.\d]{3,100})/i,
            /^\s*([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s&\-\.\d]{5,100}\s*(?:LTDA|S\.A\.|EIRELI|ME|EPP))/m
        ],
        
        // NOME FANTASIA
        nome_fantasia: [
            /(?:nome fantasia[:\s]*|fantasia[:\s]*|nome comercial[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s&\-\.]{3,80})/i
        ],
        
        // CNPJ - múltiplos formatos
        cnpj: [
            /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/,
            /(\d{14})/,
            /CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}[-\.]?\d{2})/i
        ],
        
        // TELEFONES
        telefone1: [
            /(?:telefone[:\s]*|tel[:\s]*|fone[:\s]*|contato[:\s]*)(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/i,
            /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/
        ],
        
        // ENDEREÇO SEDE
        endereco: [
            /(?:endereço[:\s]*|sede[:\s]*|estabelecido[:\s]*em[:\s]*|rua[:\s]*|av[:\s]*|avenida[:\s]*)([^\n]{10,150})/i,
            /(?:localizada[:\s]*em[:\s]*|sediada[:\s]*em[:\s]*)([^\n]{10,150})/i
        ],
        
        // CIDADE E ESTADO
        cidade: [
            /(?:cidade[:\s]*|município[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s\-]{2,50})/i,
            /([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s\-]{2,30})\s*[-\/]\s*[A-Z]{2}$/m
        ],
        
        estado: [
            /[A-Za-záéíóúâêôàçãõ\s\-]+\s*[-\/]\s*([A-Z]{2})$/m
        ],
        
        // CAPITAL SOCIAL
        capital_social: [
            /(?:capital\s*social[:\s]*|capital[:\s]*)r\$?\s?([\d\.,]+)/i,
            /(?:valor do capital[:\s]*)r\$?\s?([\d\.,]+)/i
        ],
        
        // SÓCIOS
        socio1: [
            /(?:sócio[:\s]*|sócios[:\s]*|administrador[:\s]*|diretor[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{3,60})/i
        ],
        
        socio2: [
            /(?:sócio\s*2[:\s]*|segundo sócio[:\s]*)([A-ZÁÉÍÓÚÂÊÔÀÇÃÕ][A-Za-záéíóúâêôàçãõ\s]{3,60})/i
        ],
        
        // DATA DE ABERTURA
        data_abertura: [
            /(?:abertura[:\s]*|constituição[:\s]*|fundação[:\s]*|constituída em[:\s]*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
        ],
        
        // ATIVIDADE PRINCIPAL
        atividade_principal: [
            /(?:atividade principal[:\s]*|objeto social[:\s]*|ramo[:\s]*)([A-Za-záéíóúâêôàçãõ\s\-,]{5,100})/i
        ]
    };
    
    // Processar cada padrão
    Object.keys(patterns).forEach(campo => {
        const padroes = Array.isArray(patterns[campo]) ? patterns[campo] : [patterns[campo]];
        
        for (let padrao of padroes) {
            const match = text.match(padrao);
            if (match && match[1] && match[1].trim().length > 0) {
                dados[campo] = match[1].trim();
                console.log(`✅ ${campo}: ${dados[campo]}`);
                break;
            }
        }
    });
    
    // DETECTAR SITUAÇÃO DA EMPRESA
    const textoLower = text.toLowerCase();
    if (textoLower.includes('ativa') || textoLower.includes('em funcionamento')) {
        dados.situacao = 'Ativa';
    } else if (textoLower.includes('suspensa') || textoLower.includes('suspensão')) {
        dados.situacao = 'Suspensa';
    } else if (textoLower.includes('baixada') || textoLower.includes('encerrada')) {
        dados.situacao = 'Baixada';
    } else if (textoLower.includes('inapta')) {
        dados.situacao = 'Inapta';
    }
    
    // DETECTAR TIPO DE EMPRESA
    if (textoLower.includes('ltda') || textoLower.includes('limitada')) {
        dados.tipo = 'LTDA';
    } else if (textoLower.includes('s.a.') || textoLower.includes('s/a') || textoLower.includes('sociedade anônima')) {
        dados.tipo = 'S.A.';
    } else if (textoLower.includes('eireli')) {
        dados.tipo = 'EIRELI';
    } else if (textoLower.includes(' me ') || textoLower.includes('microempresa')) {
        dados.tipo = 'ME';
    } else if (textoLower.includes('epp') || textoLower.includes('pequeno porte')) {
        dados.tipo = 'EPP';
    }
    
    // LIMPEZAS ESPECÍFICAS
    if (dados.cnpj) {
        dados.cnpj = dados.cnpj.replace(/\D/g, ''); // Apenas números
        if (dados.cnpj.length !== 14) {
            delete dados.cnpj;
        }
    }
    
    if (dados.capital_social) {
        dados.capital_social = parseFloat(dados.capital_social.replace(/[^\d,]/g, '').replace(',', '.'));
    }
    
    if (dados.data_abertura) {
        dados.data_abertura = convertToISODate(dados.data_abertura);
    }
    
    console.log('📋 Dados extraídos para pessoa jurídica:', dados);
}

// Converter data para formato ISO
function convertToISODate(dateString) {
    const parts = dateString.replace(/[-\.]/g, '/').split('/');
    
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Assumir que anos com 2 dígitos são 19xx se >= 30, senão 20xx
        const fullYear = year.length === 2 ? 
            (parseInt(year) >= 30 ? '19' + year : '20' + year) : year;
        
        return `${fullYear}-${month}-${day}`;
    }
    
    return dateString;
}

// Cadastrar automaticamente sem modal
function cadastrarAutomaticamente(dadosExtraidos, nomeArquivo) {
    try {
        const tipo = dadosExtraidos.tipo;
        const dados = dadosExtraidos.dados;
        
        if (tipo === 'fisica') {
            // Gerar GOA automático
            const goa = gerarGoaAutomatico('GOAINV');
            
            const formData = {
                goa: goa,
                nome: dados.nome || 'Nome extraído do documento',
                cpf: dados.cpf?.replace(/\D/g, '') || '',
                rg: dados.rg || '',
                nascimento: dados.nascimento || '',
                mae: dados.mae || '',
                pai: dados.pai || '',
                irmaos: dados.irmaos || '',
                naturalidade: '',
                sexo: '',
                estado_civil: '',
                telefone1: dados.telefone || '',
                telefone2: '',
                ocupacao: '',
                vinculo: '',
                endereco1: dados.endereco || '',
                endereco2: '', endereco3: '', endereco4: '', endereco5: '', endereco6: '',
                possui_empresa: false,
                razao_social: '',
                cnpj_empresa: '',
                participacao_empresa: '',
                observacoes: `Auto-cadastro de documento: ${nomeArquivo} em ${new Date().toLocaleString('pt-BR')}`,
                possui_veiculos: false,
                placa: '', marca_modelo: '', ano: null, cor: ''
            };
            
            const novaPessoa = db.insert('pessoa_fisica', formData);
            showNotification(`✅ Pessoa física cadastrada: ${dados.nome} (${goa})`, 'success');
            
            // Processar fotos se houver no documento
            processarFotosDoDocumento(nomeArquivo, novaPessoa.id, 'fisica');
            
        } else {
            // Pessoa Jurídica
            const goa = gerarGoaAutomatico('GOACOM');
            
            const formData = {
                goa: goa,
                razao_social: dados.razao_social || 'Empresa extraída do documento',
                nome_fantasia: dados.nome_fantasia || '',
                cnpj: dados.cnpj?.replace(/\D/g, '') || '',
                tipo: '',
                telefone1: dados.telefone1 || '',
                telefone2: '',
                cnae_principal: '',
                situacao: dados.situacao || 'Ativa',
                data_abertura: '',
                data_fechamento: '',
                quantidade_socios: dados.socio1 ? 1 : 0,
                socio1: dados.socio1 || '',
                socio2: '', socio3: '', socio4: '', socio5: '',
                capital_social: parseFloat(dados.capital_social?.replace(/\D/g, '')) || 0,
                endereco: dados.endereco || '',
                cidade: ''
            };
            
            const novaEmpresa = db.insert('pessoa_juridica', formData);
            showNotification(`✅ Empresa cadastrada: ${dados.razao_social} (${goa})`, 'success');
            
            // Processar fotos se houver no documento
            processarFotosDoDocumento(nomeArquivo, novaEmpresa.id, 'juridica');
        }
        
        // Atualizar dashboard
        loadDashboard();
        updateStatusBar(`Auto-cadastro concluído: ${nomeArquivo}`);
        
    } catch (error) {
        console.error('Erro no cadastro automático:', error);
        showNotification('❌ Erro no cadastro automático', 'error');
    }
}

// Gerar GOA automático
function gerarGoaAutomatico(prefixo) {
    let contador = 1;
    let goa;
    
    do {
        goa = `${prefixo}${contador.toString().padStart(3, '0')}`;
        contador++;
    } while (db.goaExists(goa));
    
    return goa;
}

// Processar fotos do documento
function processarFotosDoDocumento(nomeArquivo, pessoaId, tipoPessoa) {
    // Simular extração de fotos do documento
    const fotosFicticias = [
        'https://via.placeholder.com/300x400/007bff/ffffff?text=Documento+1',
        'https://via.placeholder.com/300x400/28a745/ffffff?text=Foto+Documento'
    ];
    
    fotosFicticias.forEach((urlFoto, index) => {
        const fotoData = {
            pessoa_id: pessoaId,
            tipo_pessoa: tipoPessoa,
            url_foto: urlFoto,
            descricao: `Foto extraída do documento: ${nomeArquivo} (${index + 1})`,
            data_upload: new Date().toISOString()
        };
        
        db.insert('fotos', fotoData);
    });
    
    showNotification(`📸 ${fotosFicticias.length} fotos adicionadas automaticamente`, 'info');
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

// Mostrar modal de confirmação dos dados extraídos (REMOVIDO - agora é direto)
function showConfirmationModal_OLD(dadosExtraidos, nomeArquivo) {
    fecharModalSeguro(); // Fechar qualquer modal aberto
    
    setTimeout(() => {
        const modalEl = document.getElementById('modalDetalhes');
        const modalTitle = document.querySelector('#modalDetalhes .modal-title');
        const modalBody = document.getElementById('modal-body-content');
        
        modalTitle.innerHTML = `<i class="fas fa-magic me-2"></i>Auto-Cadastro: ${nomeArquivo}`;
        
        const tipo = dadosExtraidos.tipo;
        const dados = dadosExtraidos.dados;
    
    let content = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Dados extraídos automaticamente do documento.</strong><br>
            Revise as informações antes de confirmar o cadastro.
        </div>
        
        <form id="form-confirmacao-auto">
            <input type="hidden" id="auto-tipo" value="${tipo}">
        `;
        
        if (tipo === 'fisica') {
            content += `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nome Completo</label>
                    <input type="text" class="form-control" id="auto-nome" value="${dados.nome || ''}" required>
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">CPF</label>
                    <input type="text" class="form-control" id="auto-cpf" value="${dados.cpf || ''}">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">RG</label>
                    <input type="text" class="form-control" id="auto-rg" value="${dados.rg || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-3 mb-3">
                    <label class="form-label">Data Nascimento</label>
                    <input type="date" class="form-control" id="auto-nascimento" value="${dados.nascimento || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Nome da Mãe</label>
                    <input type="text" class="form-control" id="auto-mae" value="${dados.mae || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Nome do Pai</label>
                    <input type="text" class="form-control" id="auto-pai" value="${dados.pai || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label">Telefone</label>
                    <input type="text" class="form-control" id="auto-telefone" value="${dados.telefone || ''}">
                </div>
                <div class="col-md-8 mb-3">
                    <label class="form-label">Endereço</label>
                    <input type="text" class="form-control" id="auto-endereco" value="${dados.endereco || ''}">
                </div>
            </div>
        `;
        } else {
            content += `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Razão Social</label>
                    <input type="text" class="form-control" id="auto-razao-social" value="${dados.razao_social || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nome Fantasia</label>
                    <input type="text" class="form-control" id="auto-nome-fantasia" value="${dados.nome_fantasia || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label">CNPJ</label>
                    <input type="text" class="form-control" id="auto-cnpj" value="${dados.cnpj || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Telefone</label>
                    <input type="text" class="form-control" id="auto-telefone1" value="${dados.telefone1 || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Situação</label>
                    <select class="form-select" id="auto-situacao">
                        <option value="">Selecione...</option>
                        <option value="Ativa" ${dados.situacao === 'Ativa' ? 'selected' : ''}>Ativa</option>
                        <option value="Suspensa" ${dados.situacao === 'Suspensa' ? 'selected' : ''}>Suspensa</option>
                        <option value="Inapta" ${dados.situacao === 'Inapta' ? 'selected' : ''}>Inapta</option>
                        <option value="Baixada" ${dados.situacao === 'Baixada' ? 'selected' : ''}>Baixada</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8 mb-3">
                    <label class="form-label">Endereço</label>
                    <input type="text" class="form-control" id="auto-endereco" value="${dados.endereco || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Capital Social</label>
                    <input type="text" class="form-control" id="auto-capital-social" value="${dados.capital_social || ''}">
                </div>
            </div>
            ${dados.socio1 ? `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Sócio 1</label>
                    <input type="text" class="form-control" id="auto-socio1" value="${dados.socio1}">
                </div>
            </div>
            ` : ''}
            `;
        }
        
        content += `
        </form>
        <hr>
        <div class="text-center">
            <button class="btn btn-success me-2" onclick="confirmarAutoCadastro()">
                <i class="fas fa-check me-1"></i>Confirmar Cadastro
            </button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="fas fa-times me-1"></i>Cancelar
            </button>
        </div>
        `;
        
        modalBody.innerHTML = content;
        
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

// Confirmar auto-cadastro
function confirmarAutoCadastro() {
    try {
        const tipo = document.getElementById('auto-tipo').value;
        
        if (tipo === 'fisica') {
            confirmarCadastroFisica();
        } else {
            confirmarCadastroJuridica();
        }
        
    } catch (error) {
        console.error('Erro ao confirmar auto-cadastro:', error);
        showNotification('Erro ao confirmar cadastro automático', 'error');
    }
}

// Confirmar cadastro de pessoa física
function confirmarCadastroFisica() {
    const dadosFormulario = {
        goa: '', // Será preenchido manualmente depois
        nome: document.getElementById('auto-nome').value,
        cpf: document.getElementById('auto-cpf').value.replace(/\D/g, ''),
        rg: document.getElementById('auto-rg').value,
        nascimento: document.getElementById('auto-nascimento').value,
        mae: document.getElementById('auto-mae').value,
        pai: document.getElementById('auto-pai').value,
        telefone1: document.getElementById('auto-telefone').value,
        endereco1: document.getElementById('auto-endereco').value,
        // Campos padrão vazios
        naturalidade: '',
        sexo: '',
        estado_civil: '',
        telefone2: '',
        ocupacao: '',
        vinculo: '',
        endereco2: '', endereco3: '', endereco4: '', endereco5: '', endereco6: '',
        possui_empresa: false,
        razao_social: '',
        cnpj_empresa: '',
        participacao_empresa: '',
        observacoes: `Cadastro automático via documento em ${formatUtils.formatDateTime(new Date().toISOString())}`,
        possui_veiculos: false,
        placa: '',
        marca_modelo: '',
        ano: null,
        cor: ''
    };
    
    // Validar CPF se informado
    if (dadosFormulario.cpf && !validarCPF(dadosFormulario.cpf)) {
        showNotification('CPF extraído está inválido. Corrija antes de prosseguir.', 'error');
        return;
    }
    
    const novaPessoa = db.insert('pessoa_fisica', dadosFormulario);
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
    modal.hide();
    
    showNotification('Pessoa física cadastrada automaticamente com sucesso!', 'success');
    loadDashboard();
    
    // Oferecer para editar
    setTimeout(() => {
        if (confirm('Cadastro criado! Deseja editar para adicionar mais informações (GOA, telefones, endereços adicionais)?')) {
            editarPessoa('pessoa_fisica', novaPessoa.id);
        }
    }, 1000);
}

// Confirmar cadastro de pessoa jurídica
function confirmarCadastroJuridica() {
    const dadosFormulario = {
        goa: '', // Será preenchido manualmente depois
        razao_social: document.getElementById('auto-razao-social').value,
        nome_fantasia: document.getElementById('auto-nome-fantasia').value,
        cnpj: document.getElementById('auto-cnpj').value.replace(/\D/g, ''),
        telefone1: document.getElementById('auto-telefone1').value,
        situacao: document.getElementById('auto-situacao').value,
        endereco: document.getElementById('auto-endereco').value,
        capital_social: parseFloat(document.getElementById('auto-capital-social').value?.replace(/\D/g, '') || '0'),
        // Campos padrão vazios
        tipo: '',
        telefone2: '',
        cnae_principal: '',
        data_abertura: '',
        data_fechamento: '',
        quantidade_socios: 0,
        socio1: document.getElementById('auto-socio1')?.value || '',
        socio2: '', socio3: '', socio4: '', socio5: '',
        cidade: ''
    };
    
    // Validar CNPJ se informado
    if (dadosFormulario.cnpj && !validarCNPJ(dadosFormulario.cnpj)) {
        showNotification('CNPJ extraído está inválido. Corrija antes de prosseguir.', 'error');
        return;
    }
    
    const novaEmpresa = db.insert('pessoa_juridica', dadosFormulario);
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
    modal.hide();
    
    showNotification('Pessoa jurídica cadastrada automaticamente com sucesso!', 'success');
    loadDashboard();
    
    // Oferecer para editar
    setTimeout(() => {
        if (confirm('Cadastro criado! Deseja editar para adicionar mais informações (GOA, CNAE, sócios, datas)?')) {
            editarPessoa('pessoa_juridica', novaEmpresa.id);
        }
    }, 1000);
}