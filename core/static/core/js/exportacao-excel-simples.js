/**
 * Sistema de Exportação CSV Simples e Funcional
 * Gera colunas separadas corretamente
 */

// Função principal de exportação
function exportarDadosCSV(tipo) {
    try {
        console.log('🔄 Iniciando exportação CSV:', tipo);
        
        let dados, nomeArquivo, cabecalhos, tipoDado;
        
        if (tipo === 'pessoa_fisica') {
            dados = db.getAll('pessoa_fisica');
            nomeArquivo = `pessoas_fisicas_${new Date().toISOString().split('T')[0]}.csv`;
            tipoDado = 'pessoa_fisica';
            cabecalhos = [
                'Nome Completo',
                'CPF', 
                'RG',
                'Data de Nascimento',
                'Sexo',
                'Estado Civil',
                'Naturalidade',
                'Nome da Mãe',
                'Nome do Pai',
                'GOA',
                'Telefone 1',
                'Telefone 2', 
                'Email 1',
                'CEP',
                'Endereço 1',
                'Observações'
            ];
        } else if (tipo === 'pessoa_juridica') {
            dados = db.getAll('pessoa_juridica');
            nomeArquivo = `pessoas_juridicas_${new Date().toISOString().split('T')[0]}.csv`;
            tipoDado = 'pessoa_juridica';
            cabecalhos = [
                'Razão Social',
                'Nome Fantasia',
                'CNPJ',
                'Inscrição Estadual',
                'Data de Abertura',
                'Porte',
                'Natureza Jurídica',
                'Atividade Principal',
                'GOA',
                'Telefone 1',
                'Email 1',
                'CEP',
                'Endereço',
                'Cidade',
                'UF',
                'Observações'
            ];
        } else {
            // Exportar ambos
            const pf = db.getAll('pessoa_fisica');
            const pj = db.getAll('pessoa_juridica');
            
            if (pf.length > 0) exportarDadosCSV('pessoa_fisica');
            if (pj.length > 0) setTimeout(() => exportarDadosCSV('pessoa_juridica'), 300);
            
            showNotification(`✅ Exportação completa: ${pf.length + pj.length} registros!`, 'success');
            return;
        }
        
        // Verificar dados
        if (!dados || dados.length === 0) {
            showNotification('⚠️ Nenhum registro encontrado', 'warning');
            return;
        }
        
        console.log(`📊 Processando ${dados.length} registros...`);
        
        // Gerar CSV limpo
        const csv = gerarCSVLimpo(dados, cabecalhos, tipoDado);
        
        // Download
        baixarCSV(csv, nomeArquivo);
        
        showNotification(`✅ ${dados.length} registros exportados!`, 'success');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao exportar: ' + error.message, 'error');
    }
}

// Gerar CSV limpo com colunas separadas
function gerarCSVLimpo(dados, cabecalhos, tipo) {
    let linhas = [];
    
    // Linha 1: Cabeçalhos
    linhas.push(cabecalhos.join(','));
    
    // Linhas de dados
    dados.forEach(item => {
        const valores = cabecalhos.map(cabecalho => {
            const campo = mapearCampo(cabecalho, tipo);
            let valor = item[campo] || '';
            
            // Limpar e formatar
            valor = String(valor).trim();
            
            // Se contém vírgula ou aspas, envolver em aspas e escapar
            if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
                valor = '"' + valor.replace(/"/g, '""') + '"';
            }
            
            return valor;
        });
        
        linhas.push(valores.join(','));
    });
    
    return linhas.join('\n');
}

// Mapear cabeçalho para campo do banco
function mapearCampo(cabecalho, tipo) {
    const mapa = {
        pessoa_fisica: {
            'Nome Completo': 'nome',
            'CPF': 'cpf',
            'RG': 'rg',
            'Data de Nascimento': 'data_nascimento',
            'Sexo': 'sexo',
            'Estado Civil': 'estado_civil',
            'Naturalidade': 'naturalidade',
            'Nome da Mãe': 'mae',
            'Nome do Pai': 'pai',
            'GOA': 'goa',
            'Telefone 1': 'telefone1',
            'Telefone 2': 'telefone2',
            'Email 1': 'email',
            'CEP': 'cep',
            'Endereço 1': 'endereco1',
            'Observações': 'observacoes'
        },
        pessoa_juridica: {
            'Razão Social': 'razao_social',
            'Nome Fantasia': 'nome_fantasia',
            'CNPJ': 'cnpj',
            'Inscrição Estadual': 'inscricao_estadual',
            'Data de Abertura': 'data_abertura',
            'Porte': 'porte',
            'Natureza Jurídica': 'natureza_juridica',
            'Atividade Principal': 'atividade_principal',
            'GOA': 'goa',
            'Telefone 1': 'telefone1',
            'Email 1': 'email',
            'CEP': 'cep',
            'Endereço': 'endereco_completo',
            'Cidade': 'cidade',
            'UF': 'uf',
            'Observações': 'observacoes'
        }
    };
    
    return mapa[tipo]?.[cabecalho] || cabecalho.toLowerCase();
}

// Download do CSV
function baixarCSV(conteudo, nomeArquivo) {
    // Adicionar BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log(`✅ Arquivo ${nomeArquivo} baixado`);
}
