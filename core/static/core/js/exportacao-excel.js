/**
 * Sistema de Exportação Excel Melhorado
 * Cabeçalhos bem formatados e dados organizados
 */

// Função para exportar dados em Excel REAL com colunas separadas
function exportarDadosExcel(tipo) {
    try {
        showNotification('📊 Preparando exportação Excel com colunas separadas...', 'info');
        
        let dados, nomeArquivo, cabecalhos;
        
        if (tipo === 'pessoa_fisica' || tipo === 'todas_fisicas') {
            dados = db.getAll('pessoa_fisica');
            nomeArquivo = `pessoas_fisicas_${new Date().toISOString().split('T')[0]}.xlsx`;
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
                'Telefone 3',
                'Telefone 4',
                'Telefone 5',
                'Email 1',
                'Email 2',
                'CEP',
                'Endereço 1',
                'Endereço 2',
                'Endereço 3',
                'Endereço 4',
                'Endereço 5',
                'Observações Gerais',
                'Data de Cadastro',
                'Status'
            ];
        } else if (tipo === 'pessoa_juridica' || tipo === 'todas_juridicas') {
            dados = db.getAll('pessoa_juridica');
            nomeArquivo = `pessoas_juridicas_${new Date().toISOString().split('T')[0]}.xlsx`;
            cabecalhos = [
                'Razão Social',
                'Nome Fantasia',
                'CNPJ',
                'Inscrição Estadual',
                'Inscrição Municipal',
                'Data de Abertura',
                'Data Situação',
                'Porte Empresa',
                'Natureza Jurídica',
                'Atividade Principal',
                'Atividade Secundária',
                'Capital Social',
                'Situação',
                'Motivo Situação',
                'GOA',
                'Telefone 1',
                'Telefone 2',
                'Telefone 3',
                'Telefone 4',
                'Telefone 5',
                'Email 1',
                'Email 2',
                'Site/Homepage',
                'CEP',
                'Endereço Completo',
                'Número',
                'Complemento',
                'Bairro',
                'Cidade',
                'UF',
                'País',
                'Observações Gerais',
                'Data de Cadastro',
                'Status Cadastral'
            ];
        } else {
            // Exportar todos os dados
            const pessoasFisicas = db.getAll('pessoa_fisica');
            const pessoasJuridicas = db.getAll('pessoa_juridica');
            
            exportarDadosCompletos(pessoasFisicas, pessoasJuridicas);
            return;
        }
        
        // Verificar se há dados
        if (!dados || dados.length === 0) {
            showNotification('⚠️ Nenhum dado encontrado para exportar', 'warning');
            return;
        }
        
        // Gerar Excel REAL com colunas separadas
        gerarExcelComColunas(dados, cabecalhos, nomeArquivo, tipo);
        
        showNotification(`✅ ${dados.length} registros exportados em Excel com colunas separadas!`, 'success');
        
    } catch (error) {
        console.error('Erro na exportação:', error);
        showNotification('❌ Erro ao exportar dados: ' + error.message, 'error');
    }
}

// Gerar Excel REAL com colunas separadas usando SheetJS
function gerarExcelComColunas(dados, cabecalhos, nomeArquivo, tipo) {
    try {
        console.log('📊 Gerando Excel com colunas separadas...');
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // Criar dados para a planilha
        const dadosParaPlanilha = [];
        
        // LINHA 1: Título do Sistema
        dadosParaPlanilha.push(['SISTEMA DESKTOP - BANCO DE DADOS DE PESSOAS E EMPRESAS']);
        dadosParaPlanilha.push([]); // Linha em branco
        
        // LINHA 3: Informações da exportação
        dadosParaPlanilha.push(['Exportação realizada em:', new Date().toLocaleString('pt-BR')]);
        dadosParaPlanilha.push(['Tipo de dados:', tipo === 'pessoa_fisica' ? 'Pessoas Físicas' : 'Pessoas Jurídicas']);
        dadosParaPlanilha.push(['Total de registros:', dados.length]);
        dadosParaPlanilha.push([]); // Linha em branco
        
        // LINHA 7: Cabeçalhos das colunas
        dadosParaPlanilha.push(cabecalhos);
        
        // LINHAS 8+: Dados
        dados.forEach(item => {
            const linha = cabecalhos.map(cabecalho => {
                const campo = mapearCampoParaExportacao(cabecalho, tipo);
                let valor = item[campo] || '';
                
                // Formatação especial
                if (campo === 'data_cadastro' && valor) {
                    valor = new Date(valor).toLocaleString('pt-BR');
                }
                
                return valor;
            });
            dadosParaPlanilha.push(linha);
        });
        
        // Criar worksheet
        const ws = XLSX.utils.aoa_to_sheet(dadosParaPlanilha);
        
        // Estilizar cabeçalho (linha 7, índice 6)
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + '7'; // Linha dos cabeçalhos
            if (!ws[address]) continue;
            ws[address].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        
        // Ajustar largura das colunas
        const colWidths = cabecalhos.map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;
        
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, tipo === 'pessoa_fisica' ? 'Pessoas Físicas' : 'Pessoas Jurídicas');
        
        // Gerar arquivo Excel
        XLSX.writeFile(wb, nomeArquivo);
        
        console.log(`✅ Arquivo Excel ${nomeArquivo} gerado com colunas separadas!`);
        
    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        showNotification('❌ Erro ao gerar Excel: ' + error.message, 'error');
    }
}

// Gerar CSV com formatação adequada (FUNÇÃO ANTIGA - MANTIDA COMO BACKUP)
function gerarCSVBemFormatado(dados, cabecalhos, tipo) {
    let csv = '';
    
    // === PRIMEIRA LINHA: CABEÇALHOS DAS COLUNAS ===
    csv += cabecalhos.join(',') + '\n';
    
    // === LINHAS DE DADOS - CADA CAMPO EM SUA COLUNA ===
    dados.forEach(item => {
        const linha = cabecalhos.map(cabecalho => {
            const campo = mapearCampoParaExportacao(cabecalho, tipo);
            let valor = item[campo] || '';
            
            // Formatação especial para data
            if (campo === 'data_cadastro' && valor) {
                try {
                    valor = new Date(valor).toLocaleDateString('pt-BR');
                } catch (e) {
                    valor = String(valor);
                }
            }
            
            // Converter para string e limpar
            valor = String(valor).trim();
            
            // Se contém vírgula, aspas ou quebra de linha, envolver em aspas
            if (valor.includes(',') || valor.includes('"') || valor.includes('\n') || valor.includes('\r')) {
                // Escapar aspas duplicando-as
                valor = valor.replace(/"/g, '""');
                return `"${valor}"`;
            }
            
            return valor;
        });
        
        csv += linha.join(',') + '\n';
    });
    
    return csv;
}

// Mapear cabeçalho para campo do banco
function mapearCampoParaExportacao(cabecalho, tipo) {
    const mapeamento = {
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
            'Telefone 3': 'telefone3',
            'Telefone 4': 'telefone4',
            'Telefone 5': 'telefone5',
            'Email 1': 'email',
            'Email 2': 'email2',
            'CEP': 'cep',
            'Endereço 1': 'endereco1',
            'Endereço 2': 'endereco2',
            'Endereço 3': 'endereco3',
            'Endereço 4': 'endereco4',
            'Endereço 5': 'endereco5',
            'Observações Gerais': 'observacoes',
            'Data de Cadastro': 'data_cadastro',
            'Status': 'status'
        },
        pessoa_juridica: {
            'Razão Social': 'razao_social',
            'Nome Fantasia': 'nome_fantasia',
            'CNPJ': 'cnpj',
            'Inscrição Estadual': 'inscricao_estadual',
            'Inscrição Municipal': 'inscricao_municipal',
            'Data de Abertura': 'data_abertura',
            'Data Situação': 'data_situacao',
            'Porte Empresa': 'porte',
            'Natureza Jurídica': 'natureza_juridica',
            'Atividade Principal': 'atividade_principal',
            'Atividade Secundária': 'atividade_secundaria',
            'Capital Social': 'capital_social',
            'Situação': 'situacao',
            'Motivo Situação': 'motivo_situacao',
            'GOA': 'goa',
            'Telefone 1': 'telefone1',
            'Telefone 2': 'telefone2',
            'Telefone 3': 'telefone3',
            'Telefone 4': 'telefone4',
            'Telefone 5': 'telefone5',
            'Email 1': 'email',
            'Email 2': 'email2',
            'Site/Homepage': 'site',
            'CEP': 'cep',
            'Endereço Completo': 'endereco_completo',
            'Número': 'numero',
            'Complemento': 'complemento',
            'Bairro': 'bairro',
            'Cidade': 'cidade',
            'UF': 'uf',
            'País': 'pais',
            'Observações Gerais': 'observacoes',
            'Data de Cadastro': 'data_cadastro',
            'Status Cadastral': 'status'
        }
    };
    
    return mapeamento[tipo]?.[cabecalho] || cabecalho.toLowerCase().replace(/\s+/g, '_');
}

// Exportar dados completos (todas as pessoas) em Excel com múltiplas abas
function exportarDadosCompletos(pessoasFisicas, pessoasJuridicas) {
    try {
        const nomeArquivo = `dados_completos_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        showNotification('📊 Gerando Excel completo com múltiplas abas...', 'info');
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // === ABA 1: PESSOAS FÍSICAS ===
        if (pessoasFisicas.length > 0) {
            const cabecalhosPF = ['Nome Completo', 'CPF', 'RG', 'Data de Nascimento', 'Sexo', 'Estado Civil', 'Nome da Mãe', 'Nome do Pai', 'GOA', 'Telefone 1', 'Email 1', 'Endereço 1', 'Observações Gerais'];
            
            const dadosPF = [];
            dadosPF.push(['PESSOAS FÍSICAS']);
            dadosPF.push([]);
            dadosPF.push(['Total de registros:', pessoasFisicas.length]);
            dadosPF.push([]);
            dadosPF.push(cabecalhosPF);
            
            pessoasFisicas.forEach(pessoa => {
                const linha = cabecalhosPF.map(cabecalho => {
                    const campo = mapearCampoParaExportacao(cabecalho, 'pessoa_fisica');
                    return pessoa[campo] || '';
                });
                dadosPF.push(linha);
            });
            
            const wsPF = XLSX.utils.aoa_to_sheet(dadosPF);
            wsPF['!cols'] = cabecalhosPF.map(() => ({ wch: 20 }));
            XLSX.utils.book_append_sheet(wb, wsPF, 'Pessoas Físicas');
        }
        
        // === ABA 2: PESSOAS JURÍDICAS ===
        if (pessoasJuridicas.length > 0) {
            const cabecalhosPJ = ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Inscrição Estadual', 'Data de Abertura', 'Porte Empresa', 'Natureza Jurídica', 'Atividade Principal', 'GOA', 'Telefone 1', 'Email 1', 'Endereço Completo', 'Observações Gerais'];
            
            const dadosPJ = [];
            dadosPJ.push(['PESSOAS JURÍDICAS']);
            dadosPJ.push([]);
            dadosPJ.push(['Total de registros:', pessoasJuridicas.length]);
            dadosPJ.push([]);
            dadosPJ.push(cabecalhosPJ);
            
            pessoasJuridicas.forEach(empresa => {
                const linha = cabecalhosPJ.map(cabecalho => {
                    const campo = mapearCampoParaExportacao(cabecalho, 'pessoa_juridica');
                    return empresa[campo] || '';
                });
                dadosPJ.push(linha);
            });
            
            const wsPJ = XLSX.utils.aoa_to_sheet(dadosPJ);
            wsPJ['!cols'] = cabecalhosPJ.map(() => ({ wch: 20 }));
            XLSX.utils.book_append_sheet(wb, wsPJ, 'Pessoas Jurídicas');
        }
        
        // Gerar arquivo
        XLSX.writeFile(wb, nomeArquivo);
        
        showNotification(`✅ Excel completo exportado: ${pessoasFisicas.length + pessoasJuridicas.length} registros em múltiplas abas!`, 'success');
        
        return;
        
        // === CÓDIGO ANTIGO CSV (REMOVIDO) ===
        const nomeArquivoCSV = `dados_completos_${new Date().toISOString().split('T')[0]}.csv`;
        
        let csv = '';
        
        // === CABEÇALHO PRINCIPAL ===
        csv += `"=== SISTEMA DESKTOP - EXPORTAÇÃO COMPLETA ==="\n`;
        csv += `"Exportação realizada em: ${new Date().toLocaleString('pt-BR')}"\n`;
        csv += `"Pessoas Físicas: ${pessoasFisicas.length} registros"\n`;
        csv += `"Pessoas Jurídicas: ${pessoasJuridicas.length} registros"\n`;
        csv += `"Total Geral: ${pessoasFisicas.length + pessoasJuridicas.length} registros"\n`;
        csv += `""\n\n`;
        
        // === PESSOAS FÍSICAS ===
        if (pessoasFisicas.length > 0) {
            csv += `"=== PESSOAS FÍSICAS (${pessoasFisicas.length} registros) ==="\n`;
            const cabecalhosPF = ['Nome Completo', 'CPF', 'RG', 'Data de Nascimento', 'Sexo', 'Estado Civil', 'Nome da Mãe', 'Nome do Pai', 'GOA', 'Telefone 1', 'Email 1', 'Endereço 1', 'Observações Gerais'];
            csv += cabecalhosPF.map(h => `"${h}"`).join(',') + '\n';
            
            pessoasFisicas.forEach(pessoa => {
                const linha = cabecalhosPF.map(cabecalho => {
                    const campo = mapearCampoParaExportacao(cabecalho, 'pessoa_fisica');
                    let valor = pessoa[campo] || '';
                    valor = String(valor).replace(/"/g, '""');
                    return `"${valor}"`;
                });
                csv += linha.join(',') + '\n';
            });
            
            csv += `"\n\n`;
        }
        
        // === PESSOAS JURÍDICAS ===
        if (pessoasJuridicas.length > 0) {
            csv += `"=== PESSOAS JURÍDICAS (${pessoasJuridicas.length} registros) ==="\n`;
            const cabecalhosPJ = ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Inscrição Estadual', 'Data de Abertura', 'Porte Empresa', 'Natureza Jurídica', 'Atividade Principal', 'GOA', 'Telefone 1', 'Email 1', 'Endereço Completo', 'Observações Gerais'];
            csv += cabecalhosPJ.map(h => `"${h}"`).join(',') + '\n';
            
            pessoasJuridicas.forEach(empresa => {
                const linha = cabecalhosPJ.map(cabecalho => {
                    const campo = mapearCampoParaExportacao(cabecalho, 'pessoa_juridica');
                    let valor = empresa[campo] || '';
                    valor = String(valor).replace(/"/g, '""');
                    return `"${valor}"`;
                });
                csv += linha.join(',') + '\n';
            });
        }
        
        // === RODAPÉ ===
        csv += `"\n--- EXPORTAÇÃO COMPLETA FINALIZADA ---"\n`;
        csv += `"Data: ${new Date().toLocaleString('pt-BR')}"\n`;
        
        // Fazer download
        baixarArquivo(csv, nomeArquivo, 'text/csv');
        
        showNotification(`✅ Exportação completa: ${pessoasFisicas.length + pessoasJuridicas.length} registros exportados!`, 'success');
        
    } catch (error) {
        console.error('Erro na exportação completa:', error);
        showNotification('❌ Erro ao exportar dados completos: ' + error.message, 'error');
    }
}

// Função para fazer download do arquivo
function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
    const blob = new Blob(['\uFEFF' + conteudo], { type: tipoMime + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log(`📁 Arquivo ${nomeArquivo} baixado com sucesso`);
}