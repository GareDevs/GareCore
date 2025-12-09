/**
 * Sistema de Banco de Dados Local para Aplicação Desktop
 * Utiliza localStorage para persistir dados offline
 */

class LocalDatabase {
    constructor() {
        this.data = {
            pessoa_fisica: [],
            pessoa_juridica: [],
            fotos: [],
            relacionamentos: []
        };
        this.counters = {
            pessoa_fisica: 1,
            pessoa_juridica: 1,
            fotos: 1,
            relacionamentos: 1
        };
        this.initializeDatabase();
    }

    // Inicializar banco de dados local
    initializeDatabase() {
        console.log('🔧 Inicializando banco de dados local...');
        
        try {
            // Carregar dados existentes ou criar estrutura inicial
            const savedData = localStorage.getItem('desktop_system_data');
            if (savedData) {
                console.log('📂 Carregando dados existentes...');
                const parsed = JSON.parse(savedData);
                this.data = {
                    pessoa_fisica: parsed.pessoa_fisica || [],
                    pessoa_juridica: parsed.pessoa_juridica || [],
                    fotos: parsed.fotos || [],
                    relacionamentos: parsed.relacionamentos || []
                };
                this.counters = parsed.counters || this.counters;
            } else {
                console.log('🆕 Criando nova estrutura de dados...');
                this.saveToStorage();
            }
            
            // Atualizar esquemas existentes para incluir GOA se necessário
            this.updateSchemasForGOA();
            
            console.log('✅ Banco de dados inicializado com sucesso');
            console.log('📊 Estado atual:', {
                pessoa_fisica: this.data.pessoa_fisica.length,
                pessoa_juridica: this.data.pessoa_juridica.length,
                fotos: this.data.fotos.length,
                relacionamentos: this.data.relacionamentos.length
            });
            
        } catch (error) {
            console.error('❌ Erro ao inicializar banco:', error);
            // Reset em caso de erro
            this.resetDatabase();
        }
    }
    
    // Salvar dados no localStorage
    saveToStorage() {
        try {
            const dataToSave = {
                ...this.data,
                counters: this.counters,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem('desktop_system_data', JSON.stringify(dataToSave));
            console.log('💾 Dados salvos no localStorage');
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            throw error;
        }
    }
    
    // Reset completo do banco
    resetDatabase() {
        console.log('🔄 Resetando banco de dados...');
        this.data = {
            pessoa_fisica: [],
            pessoa_juridica: [],
            fotos: [],
            relacionamentos: []
        };
        this.counters = {
            pessoa_fisica: 1,
            pessoa_juridica: 1,
            fotos: 1,
            relacionamentos: 1
        };
        this.saveToStorage();
        console.log('✅ Banco resetado com sucesso');
    }

    // Atualizar esquemas para incluir campo GOA
    updateSchemasForGOA() {
        try {
            console.log('🔄 Verificando esquemas para campo GOA...');
            
            let updated = false;
            
            // Verificar e atualizar registros de pessoa física
            if (this.data.pessoa_fisica) {
                this.data.pessoa_fisica.forEach(pessoa => {
                    if (!pessoa.hasOwnProperty('goa')) {
                        pessoa.goa = '';
                        updated = true;
                    }
                });
            }
            
            // Verificar e atualizar registros de pessoa jurídica
            if (this.data.pessoa_juridica) {
                this.data.pessoa_juridica.forEach(pessoa => {
                    if (!pessoa.hasOwnProperty('goa')) {
                        pessoa.goa = '';
                        updated = true;
                    }
                });
            }
            
            if (updated) {
                this.saveToStorage();
                console.log('✅ Esquemas atualizados para incluir campo GOA');
            } else {
                console.log('✅ Esquemas já possuem campo GOA');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar esquemas:', error);
        }
    }

    // Gerar novo ID
    generateId(table) {
        const newId = this.counters[table];
        this.counters[table]++;
        this.saveToStorage(); // Salvar mudança nos contadores
        return newId.toString();
    }

    // Inserir registro
    insert(table, data) {
        try {
            console.log(`💾 Inserindo registro na tabela ${table}:`, data);
            
            if (!this.data[table]) {
                console.error(`❌ Tabela ${table} não existe!`);
                throw new Error(`Tabela ${table} não encontrada`);
            }
            
            const newRecord = {
                id: this.generateId(table),
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.data[table].push(newRecord);
            this.saveToStorage(); // Salvar no localStorage
            
            console.log(`✅ Registro inserido com sucesso em ${table}:`, newRecord);
            console.log(`📊 Total de registros em ${table}:`, this.data[table].length);
            
            return newRecord;
        } catch (error) {
            console.error(`❌ Erro ao inserir em ${table}:`, error);
            throw error;
        }
    }

    // Buscar todos os registros
    getAll(table) {
        try {
            if (!this.data[table]) {
                console.warn(`⚠️ Tabela ${table} não existe, retornando array vazio`);
                return [];
            }
            console.log(`📋 Buscando todos os registros de ${table}: ${this.data[table].length} encontrados`);
            return [...this.data[table]]; // Retornar cópia do array
        } catch (error) {
            console.error(`❌ Erro ao buscar dados de ${table}:`, error);
            return [];
        }
    }

    // Buscar por ID
    getById(table, id) {
        try {
            if (!this.data[table]) {
                console.warn(`⚠️ Tabela ${table} não existe`);
                return null;
            }
            
            const record = this.data[table].find(record => record.id === id.toString());
            console.log(`🔍 Busca por ID ${id} em ${table}:`, record ? 'Encontrado' : 'Não encontrado');
            return record || null;
        } catch (error) {
            console.error(`❌ Erro ao buscar registro ${id} em ${table}:`, error);
            return null;
        }
    }

    // Atualizar registro
    update(table, id, data) {
        try {
            if (!this.data[table]) {
                throw new Error(`Tabela ${table} não encontrada`);
            }
            
            const index = this.data[table].findIndex(record => record.id === id.toString());
            
            if (index !== -1) {
                this.data[table][index] = {
                    ...this.data[table][index],
                    ...data,
                    updated_at: new Date().toISOString()
                };
                this.saveToStorage();
                console.log(`✅ Registro ${id} atualizado em ${table}:`, this.data[table][index]);
                return this.data[table][index];
            }
            return null;
        } catch (error) {
            console.error(`❌ Erro ao atualizar registro ${id} em ${table}:`, error);
            throw error;
        }
    }

    // Deletar registro
    delete(table, id) {
        try {
            if (!this.data[table]) {
                throw new Error(`Tabela ${table} não encontrada`);
            }
            
            const originalLength = this.data[table].length;
            this.data[table] = this.data[table].filter(record => record.id !== id.toString());
            this.saveToStorage();
            
            const wasDeleted = this.data[table].length < originalLength;
            console.log(`${wasDeleted ? '✅' : '⚠️'} Registro ${id} ${wasDeleted ? 'deletado' : 'não encontrado'} em ${table}`);
            return wasDeleted;
        } catch (error) {
            console.error(`❌ Erro ao deletar registro ${id} de ${table}:`, error);
            return false;
        }
    }

    // Buscar com filtro
    search(table, searchTerm, fields = []) {
        try {
            const records = this.getAll(table);
            if (!searchTerm) return records;

            return records.filter(record => {
                if (fields.length === 0) {
                    // Buscar em todos os campos de texto
                    return Object.values(record).some(value => 
                        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                    );
                } else {
                    // Buscar apenas nos campos especificados
                    return fields.some(field => 
                        record[field] && record[field].toString().toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }
            });
        } catch (error) {
            console.error(`Erro ao buscar em ${table}:`, error);
            return [];
        }
    }

    // Contar registros
    count(table) {
        return this.getAll(table).length;
    }

    // Limpar tabela
    clear(table) {
        try {
            if (!this.data[table]) {
                throw new Error(`Tabela ${table} não encontrada`);
            }
            
            this.data[table] = [];
            this.saveToStorage();
            console.log(`✅ Tabela ${table} limpa`);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao limpar tabela ${table}:`, error);
            return false;
        }
    }

    // Exportar dados para backup
    exportData() {
        try {
            const data = {
                pessoa_fisica: this.getAll('pessoa_fisica'),
                pessoa_juridica: this.getAll('pessoa_juridica'),
                fotos: this.getAll('fotos'),
                relacionamentos: this.getAll('relacionamentos'),
                counters: JSON.parse(localStorage.getItem('counters')),
                exported_at: new Date().toISOString()
            };
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            return null;
        }
    }

    // Importar dados de backup
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            localStorage.setItem('pessoa_fisica', JSON.stringify(data.pessoa_fisica || []));
            localStorage.setItem('pessoa_juridica', JSON.stringify(data.pessoa_juridica || []));
            localStorage.setItem('fotos', JSON.stringify(data.fotos || []));
            localStorage.setItem('relacionamentos', JSON.stringify(data.relacionamentos || []));
            localStorage.setItem('counters', JSON.stringify(data.counters || {
                pessoa_fisica: 1,
                pessoa_juridica: 1,
                fotos: 1,
                relacionamentos: 1
            }));

            console.log('Dados importados com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    // Buscar relacionamentos de uma pessoa
    getRelacionamentos(pessoaId, tipoPessoa) {
        try {
            const relacionamentos = this.getAll('relacionamentos');
            return relacionamentos.filter(rel => 
                (rel.pessoa_origem_id === pessoaId && rel.tipo_origem === tipoPessoa) ||
                (rel.pessoa_destino_id === pessoaId && rel.tipo_destino === tipoPessoa)
            );
        } catch (error) {
            console.error('Erro ao buscar relacionamentos:', error);
            return [];
        }
    }

    // Buscar fotos de uma pessoa
    getFotosPessoa(pessoaId, tipoPessoa) {
        try {
            const fotos = this.getAll('fotos');
            return fotos.filter(foto => 
                foto.pessoa_id === pessoaId && foto.tipo_pessoa === tipoPessoa
            );
        } catch (error) {
            console.error('Erro ao buscar fotos:', error);
            return [];
        }
    }

    // Buscar pessoa por GOA
    searchByGOA(goa) {
        try {
            if (!goa || goa.trim() === '') return null;
            
            goa = goa.trim().toLowerCase();
            
            // Buscar em pessoas físicas
            const pessoasFisicas = this.getAll('pessoa_fisica');
            const pfEncontrada = pessoasFisicas.find(pessoa => 
                pessoa.goa && pessoa.goa.toLowerCase() === goa
            );
            
            if (pfEncontrada) {
                return {
                    pessoa: pfEncontrada,
                    tipo: 'fisica',
                    table: 'pessoa_fisica'
                };
            }
            
            // Buscar em pessoas jurídicas
            const pessoasJuridicas = this.getAll('pessoa_juridica');
            const pjEncontrada = pessoasJuridicas.find(pessoa => 
                pessoa.goa && pessoa.goa.toLowerCase() === goa
            );
            
            if (pjEncontrada) {
                return {
                    pessoa: pjEncontrada,
                    tipo: 'juridica',
                    table: 'pessoa_juridica'
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao buscar por GOA:', error);
            return null;
        }
    }

    // Verificar se GOA já existe
    goaExists(goa, excludeId = null, excludeTable = null) {
        try {
            if (!goa || goa.trim() === '') return false;
            
            goa = goa.trim().toUpperCase(); // GOA sempre em maiúsculo
            
            // Verificar em pessoas físicas
            const pessoasFisicas = this.getAll('pessoa_fisica');
            const pfExists = pessoasFisicas.some(pessoa => 
                pessoa.goa && 
                pessoa.goa.toUpperCase() === goa &&
                !(excludeTable === 'pessoa_fisica' && pessoa.id === excludeId)
            );
            
            if (pfExists) return true;
            
            // Verificar em pessoas jurídicas
            const pessoasJuridicas = this.getAll('pessoa_juridica');
            const pjExists = pessoasJuridicas.some(pessoa => 
                pessoa.goa && 
                pessoa.goa.toUpperCase() === goa &&
                !(excludeTable === 'pessoa_juridica' && pessoa.id === excludeId)
            );
            
            return pjExists;
        } catch (error) {
            console.error('Erro ao verificar GOA:', error);
            return false;
        }
    }

    // NOVA FUNÇÃO: Verificar duplicidade de nomes
    nameExists(nome, tipo, excludeId = null) {
        try {
            const table = tipo === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica';
            const pessoas = this.getAll(table);
            const campo = tipo === 'fisica' ? 'nome' : 'razao_social';
            
            // Normalizar nome para comparação
            const nomeNormalizado = nome.toLowerCase().trim();
            
            for (let pessoa of pessoas) {
                if (pessoa.id === excludeId) continue;
                
                const pessoaNome = pessoa[campo];
                if (pessoaNome && pessoaNome.toLowerCase().trim() === nomeNormalizado) {
                    return {
                        exists: true,
                        pessoa: pessoa,
                        similaridade: 100
                    };
                }
            }
            
            // Verificar similaridade (nomes muito parecidos)
            for (let pessoa of pessoas) {
                if (pessoa.id === excludeId) continue;
                
                const pessoaNome = pessoa[campo];
                if (pessoaNome) {
                    const similaridade = this.calcularSimilaridade(nomeNormalizado, pessoaNome.toLowerCase().trim());
                    if (similaridade >= 85) { // 85% de similaridade
                        return {
                            exists: false,
                            similar: true,
                            pessoa: pessoa,
                            similaridade: similaridade
                        };
                    }
                }
            }
            
            return { exists: false, similar: false };
            
        } catch (error) {
            console.error('Erro ao verificar duplicidade de nome:', error);
            return { exists: false, similar: false };
        }
    }

    // Calcular similaridade entre strings (algoritmo Levenshtein simplificado)
    calcularSimilaridade(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 100;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return ((longer.length - editDistance) / longer.length) * 100;
    }

    // Algoritmo Levenshtein Distance
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Validar formato do GOA
    validateGOAFormat(goa) {
        try {
            if (!goa || goa.trim() === '') return { valid: true, message: '' }; // GOA opcional
            
            goa = goa.trim().toUpperCase();
            
            // Prefixos válidos e suas descrições
            const prefixosValidos = {
                'GOAINV': 'Investigação',
                'GOADEN': 'Denúncia', 
                'GOACIV': 'Processo Civil',
                'GOACRI': 'Processo Criminal',
                'GOAADM': 'Processo Administrativo',
                'GOAJUD': 'Judicial',
                'GOAEXT': 'Extrajudicial',
                'GOATRI': 'Tributário',
                'GOATRA': 'Trabalhista',
                'GOAFAM': 'Família',
                'GOACOM': 'Comercial',
                'GOAIMO': 'Imobiliário',
                'GOACON': 'Consumidor',
                'GOAENV': 'Ambiental',
                'GOACOR': 'Corporativo',
                'GOASEG': 'Seguros',
                'GOAPRE': 'Previdenciário',
                'GOAMED': 'Médico',
                'GOAEDU': 'Educacional',
                'GOATEC': 'Tecnologia',
                'GOAALT': 'Outros'
            };
            
            // Verificar se tem pelo menos 8 caracteres (GOAINV + número)
            if (goa.length < 8) {
                return { 
                    valid: false, 
                    message: 'GOA deve ter pelo menos 8 caracteres (ex: GOAINV001)' 
                };
            }
            
            // Extrair prefixo (primeiros 6 caracteres)
            const prefixo = goa.substring(0, 6);
            const numero = goa.substring(6);
            
            // Verificar se o prefixo é válido
            if (!prefixosValidos[prefixo]) {
                const prefixosDisponiveis = Object.keys(prefixosValidos).join(', ');
                return { 
                    valid: false, 
                    message: `Prefixo inválido. Use: ${prefixosDisponiveis}` 
                };
            }
            
            // Verificar se o número é válido (apenas dígitos)
            if (!/^\d+$/.test(numero)) {
                return { 
                    valid: false, 
                    message: 'Número do GOA deve conter apenas dígitos' 
                };
            }
            
            return { 
                valid: true, 
                message: `GOA válido: ${prefixosValidos[prefixo]} #${numero}`,
                prefixo: prefixo,
                numero: numero,
                descricao: prefixosValidos[prefixo]
            };
            
        } catch (error) {
            console.error('Erro ao validar formato GOA:', error);
            return { valid: false, message: 'Erro na validação do GOA' };
        }
    }

    // Buscar por prefixo GOA
    searchByGOAPrefix(prefixo) {
        try {
            prefixo = prefixo.trim().toUpperCase();
            
            const resultados = [];
            
            // Buscar em pessoas físicas
            const pessoasFisicas = this.getAll('pessoa_fisica');
            pessoasFisicas.forEach(pessoa => {
                if (pessoa.goa && pessoa.goa.toUpperCase().startsWith(prefixo)) {
                    resultados.push({
                        pessoa: pessoa,
                        tipo: 'fisica',
                        table: 'pessoa_fisica'
                    });
                }
            });
            
            // Buscar em pessoas jurídicas
            const pessoasJuridicas = this.getAll('pessoa_juridica');
            pessoasJuridicas.forEach(pessoa => {
                if (pessoa.goa && pessoa.goa.toUpperCase().startsWith(prefixo)) {
                    resultados.push({
                        pessoa: pessoa,
                        tipo: 'juridica',
                        table: 'pessoa_juridica'
                    });
                }
            });
            
            return resultados;
        } catch (error) {
            console.error('Erro ao buscar por prefixo GOA:', error);
            return [];
        }
    }

    // Encontrar relacionamentos automáticos baseados em dados
    findAutoRelationships(pessoaId, tipoPessoa) {
        try {
            const relacionamentosEncontrados = [];
            const pessoa = this.getById(tipoPessoa === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica', pessoaId);
            
            if (!pessoa) return relacionamentosEncontrados;
            
            // Buscar relacionamentos familiares (mesmo sobrenome)
            if (tipoPessoa === 'fisica' && pessoa.nome) {
                const sobrenome = this.extractSobrenome(pessoa.nome);
                if (sobrenome) {
                    this.findFamilyRelationships(pessoa, sobrenome, relacionamentosEncontrados);
                }
            }
            
            // Buscar relacionamentos empresariais (mesmo CNPJ)
            if (pessoa.cnpj_empresa || (tipoPessoa === 'juridica' && pessoa.cnpj)) {
                const cnpj = pessoa.cnpj_empresa || pessoa.cnpj;
                this.findBusinessRelationships(pessoa, cnpj, tipoPessoa, relacionamentosEncontrados);
            }
            
            // Buscar relacionamentos por sócios
            if (tipoPessoa === 'juridica') {
                this.findPartnershipRelationships(pessoa, relacionamentosEncontrados);
            }
            
            return relacionamentosEncontrados;
        } catch (error) {
            console.error('Erro ao encontrar relacionamentos automáticos:', error);
            return [];
        }
    }

    // Extrair sobrenome
    extractSobrenome(nomeCompleto) {
        const nomes = nomeCompleto.trim().split(' ');
        return nomes.length > 1 ? nomes[nomes.length - 1] : null;
    }

    // Encontrar relacionamentos familiares
    findFamilyRelationships(pessoa, sobrenome, relacionamentos) {
        const pessoasFisicas = this.getAll('pessoa_fisica');
        
        pessoasFisicas.forEach(outraPessoa => {
            if (outraPessoa.id !== pessoa.id && outraPessoa.nome) {
                
                // Verificar relacionamentos específicos (pai, mãe) - MAIS CONFIÁVEIS
                if (pessoa.pai && pessoa.pai.trim() && 
                    outraPessoa.nome.toLowerCase().includes(pessoa.pai.toLowerCase().trim())) {
                    relacionamentos.push({
                        tipo: 'pai',
                        pessoa_origem: pessoa,
                        pessoa_destino: outraPessoa,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Pai: ${pessoa.pai}`,
                        confianca: 95
                    });
                }
                
                if (pessoa.mae && pessoa.mae.trim() && 
                    outraPessoa.nome.toLowerCase().includes(pessoa.mae.toLowerCase().trim())) {
                    relacionamentos.push({
                        tipo: 'mae',
                        pessoa_origem: pessoa,
                        pessoa_destino: outraPessoa,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Mãe: ${pessoa.mae}`,
                        confianca: 95
                    });
                }
                
                // Verificar irmãos
                if (pessoa.irmaos && pessoa.irmaos.trim()) {
                    const listaIrmaos = pessoa.irmaos.split(',').map(i => i.trim().toLowerCase());
                    listaIrmaos.forEach(irmao => {
                        if (irmao && outraPessoa.nome.toLowerCase().includes(irmao)) {
                            relacionamentos.push({
                                tipo: 'irmao',
                                pessoa_origem: pessoa,
                                pessoa_destino: outraPessoa,
                                tipo_origem: 'fisica',
                                tipo_destino: 'fisica',
                                motivo: `Irmão: ${irmao}`,
                                confianca: 90
                            });
                        }
                    });
                }
                
                // Mesmo sobrenome - APENAS se não tiver outros relacionamentos mais específicos
                const outroSobrenome = this.extractSobrenome(outraPessoa.nome);
                const jaTemRelacionamento = relacionamentos.some(rel => 
                    rel.pessoa_destino.id === outraPessoa.id && rel.confianca > 80
                );
                
                if (outroSobrenome === sobrenome && !jaTemRelacionamento) {
                    relacionamentos.push({
                        tipo: 'parente',
                        pessoa_origem: pessoa,
                        pessoa_destino: outraPessoa,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Mesmo sobrenome: ${sobrenome}`,
                        confianca: 60
                    });
                }
            }
        });
    }

    // Encontrar relacionamentos empresariais
    findBusinessRelationships(pessoa, cnpj, tipoPessoa, relacionamentos) {
        if (!cnpj) return;
        
        // Buscar outras pessoas com mesmo CNPJ
        const pessoasFisicas = this.getAll('pessoa_fisica');
        const pessoasJuridicas = this.getAll('pessoa_juridica');
        
        pessoasFisicas.forEach(outraPessoa => {
            if (outraPessoa.id !== pessoa.id && outraPessoa.cnpj_empresa === cnpj) {
                relacionamentos.push({
                    tipo: 'empresarial',
                    pessoa_origem: pessoa,
                    pessoa_destino: outraPessoa,
                    tipo_origem: tipoPessoa,
                    tipo_destino: 'fisica',
                    motivo: `Mesmo CNPJ empresarial: ${cnpj}`,
                    confianca: 95
                });
            }
        });
        
        pessoasJuridicas.forEach(outraPessoa => {
            if (outraPessoa.id !== pessoa.id && outraPessoa.cnpj === cnpj) {
                relacionamentos.push({
                    tipo: 'empresarial',
                    pessoa_origem: pessoa,
                    pessoa_destino: outraPessoa,
                    tipo_origem: tipoPessoa,
                    tipo_destino: 'juridica',
                    motivo: `CNPJ da empresa: ${cnpj}`,
                    confianca: 100
                });
            }
        });
    }

    // Encontrar relacionamentos de sócios
    findPartnershipRelationships(empresa, relacionamentos) {
        const pessoasFisicas = this.getAll('pessoa_fisica');
        
        // Verificar cada sócio da empresa
        for (let i = 1; i <= 5; i++) {
            const socio = empresa[`socio${i}`];
            if (socio && socio.trim()) {
                pessoasFisicas.forEach(pessoa => {
                    if (pessoa.nome && pessoa.nome.toLowerCase().includes(socio.toLowerCase())) {
                        relacionamentos.push({
                            tipo: 'socio',
                            pessoa_origem: empresa,
                            pessoa_destino: pessoa,
                            tipo_origem: 'juridica',
                            tipo_destino: 'fisica',
                            motivo: `Sócio da empresa: ${socio}`,
                            confianca: 85
                        });
                    }
                });
            }
        }
    }

    // NOVA FUNÇÃO: Análise automática COMPLETA de todos os dados
    analyzeAllDataAndCreateRelationships() {
        try {
            console.log('🔍 Iniciando análise automática COMPLETA de todos os dados...');
            
            // Limpar relacionamentos automáticos existentes
            this.clearAutoRelationships();
            
            const todosPessoas = [];
            const pessoasFisicas = this.getAll('pessoa_fisica');
            const pessoasJuridicas = this.getAll('pessoa_juridica');
            
            // Preparar dados unificados
            pessoasFisicas.forEach(pessoa => {
                todosPessoas.push({
                    ...pessoa,
                    tipo: 'fisica',
                    tabela: 'pessoa_fisica'
                });
            });
            
            pessoasJuridicas.forEach(pessoa => {
                todosPessoas.push({
                    ...pessoa,
                    tipo: 'juridica',
                    tabela: 'pessoa_juridica'
                });
            });
            
            console.log(`📊 Analisando ${todosPessoas.length} registros (${pessoasFisicas.length} PF + ${pessoasJuridicas.length} PJ)`);
            
            let relacionamentosEncontrados = [];
            
            // Análise de cada pessoa contra todas as outras
            todosPessoas.forEach((pessoa, index) => {
                console.log(`🔍 Analisando pessoa ${index + 1}/${todosPessoas.length}: ${pessoa.tipo === 'fisica' ? pessoa.nome : pessoa.razao_social}`);
                
                // 1. RELACIONAMENTOS FAMILIARES (Pessoa Física)
                if (pessoa.tipo === 'fisica') {
                    relacionamentosEncontrados.push(...this.analyzeFamily(pessoa, todosPessoas));
                }
                
                // 2. RELACIONAMENTOS EMPRESARIAIS
                relacionamentosEncontrados.push(...this.analyzeBusiness(pessoa, todosPessoas));
                
                // 3. RELACIONAMENTOS POR ENDEREÇO
                relacionamentosEncontrados.push(...this.analyzeAddress(pessoa, todosPessoas));
                
                // 4. RELACIONAMENTOS POR TELEFONE
                relacionamentosEncontrados.push(...this.analyzePhone(pessoa, todosPessoas));
                
                // 5. RELACIONAMENTOS POR SÓCIOS
                if (pessoa.tipo === 'juridica') {
                    relacionamentosEncontrados.push(...this.analyzePartners(pessoa, todosPessoas));
                }
            });
            
            // Remover duplicatas e salvar relacionamentos
            relacionamentosEncontrados = this.removeDuplicateRelationships(relacionamentosEncontrados);
            
            console.log(`✅ Análise completa! ${relacionamentosEncontrados.length} relacionamentos encontrados.`);
            
            // Salvar todos os relacionamentos encontrados
            relacionamentosEncontrados.forEach(rel => {
                this.saveAutoRelationship(rel);
            });
            
            return {
                success: true,
                totalAnalisados: todosPessoas.length,
                relacionamentosEncontrados: relacionamentosEncontrados.length,
                relacionamentos: relacionamentosEncontrados
            };
            
        } catch (error) {
            console.error('❌ Erro na análise automática completa:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Analisar relacionamentos familiares
    analyzeFamily(pessoa, todasPessoas) {
        const relacionamentos = [];
        
        if (!pessoa.nome) return relacionamentos;
        
        todasPessoas.forEach(outra => {
            if (outra.id === pessoa.id || outra.tipo !== 'fisica' || !outra.nome) return;
            
            // 1. Relacionamento PAI
            if (pessoa.pai && pessoa.pai.trim()) {
                const nomePai = pessoa.pai.toLowerCase().trim();
                if (outra.nome.toLowerCase().includes(nomePai) || 
                    this.compareNames(nomePai, outra.nome.toLowerCase())) {
                    relacionamentos.push({
                        tipo: 'pai',
                        pessoa_origem: pessoa,
                        pessoa_destino: outra,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Pai identificado: "${pessoa.pai}" → "${outra.nome}"`,
                        confianca: 95,
                        automatico: true
                    });
                }
            }
            
            // 2. Relacionamento MÃE
            if (pessoa.mae && pessoa.mae.trim()) {
                const nomeMae = pessoa.mae.toLowerCase().trim();
                if (outra.nome.toLowerCase().includes(nomeMae) || 
                    this.compareNames(nomeMae, outra.nome.toLowerCase())) {
                    relacionamentos.push({
                        tipo: 'mae',
                        pessoa_origem: pessoa,
                        pessoa_destino: outra,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Mãe identificada: "${pessoa.mae}" → "${outra.nome}"`,
                        confianca: 95,
                        automatico: true
                    });
                }
            }
            
            // 3. Relacionamentos IRMÃOS
            if (pessoa.irmaos && pessoa.irmaos.trim()) {
                const listaIrmaos = pessoa.irmaos.split(',').map(i => i.trim().toLowerCase());
                listaIrmaos.forEach(irmao => {
                    if (irmao && (outra.nome.toLowerCase().includes(irmao) || 
                        this.compareNames(irmao, outra.nome.toLowerCase()))) {
                        relacionamentos.push({
                            tipo: 'irmao',
                            pessoa_origem: pessoa,
                            pessoa_destino: outra,
                            tipo_origem: 'fisica',
                            tipo_destino: 'fisica',
                            motivo: `Irmão identificado: "${irmao}" → "${outra.nome}"`,
                            confianca: 90,
                            automatico: true
                        });
                    }
                });
            }
            
            // 4. Mesmo sobrenome (relacionamento genérico de família)
            const sobrenomePessoa = this.extractSobrenome(pessoa.nome);
            const sobrenomeOutra = this.extractSobrenome(outra.nome);
            
            if (sobrenomePessoa && sobrenomeOutra && sobrenomePessoa === sobrenomeOutra) {
                // Só criar se não houver relacionamento mais específico
                const temRelacionamentoEspecifico = relacionamentos.some(rel => 
                    rel.pessoa_destino.id === outra.id && rel.confianca > 80
                );
                
                if (!temRelacionamentoEspecifico) {
                    relacionamentos.push({
                        tipo: 'parente',
                        pessoa_origem: pessoa,
                        pessoa_destino: outra,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Mesmo sobrenome: "${sobrenomePessoa}"`,
                        confianca: 60,
                        automatico: true
                    });
                }
            }
        });
        
        return relacionamentos;
    }
    
    // Analisar relacionamentos empresariais
    analyzeBusiness(pessoa, todasPessoas) {
        const relacionamentos = [];
        
        // CNPJ da pessoa física (empresa onde trabalha)
        if (pessoa.tipo === 'fisica' && pessoa.cnpj_empresa) {
            todasPessoas.forEach(outra => {
                if (outra.id === pessoa.id) return;
                
                // Pessoa física com mesmo CNPJ empresarial
                if (outra.tipo === 'fisica' && outra.cnpj_empresa === pessoa.cnpj_empresa) {
                    relacionamentos.push({
                        tipo: 'empresarial',
                        pessoa_origem: pessoa,
                        pessoa_destino: outra,
                        tipo_origem: 'fisica',
                        tipo_destino: 'fisica',
                        motivo: `Mesmo CNPJ empresarial: ${pessoa.cnpj_empresa}`,
                        confianca: 90,
                        automatico: true
                    });
                }
                
                // Pessoa jurídica com mesmo CNPJ
                if (outra.tipo === 'juridica' && outra.cnpj === pessoa.cnpj_empresa) {
                    relacionamentos.push({
                        tipo: 'empresarial',
                        pessoa_origem: pessoa,
                        pessoa_destino: outra,
                        tipo_origem: 'fisica',
                        tipo_destino: 'juridica',
                        motivo: `Trabalha na empresa: ${outra.razao_social}`,
                        confianca: 95,
                        automatico: true
                    });
                }
            });
        }
        
        return relacionamentos;
    }
    
    // Analisar relacionamentos por endereço
    analyzeAddress(pessoa, todasPessoas) {
        const relacionamentos = [];
        
        if (!pessoa.endereco || !pessoa.endereco.trim()) return relacionamentos;
        
        const enderecoPessoa = pessoa.endereco.toLowerCase().trim();
        
        todasPessoas.forEach(outra => {
            if (outra.id === pessoa.id || !outra.endereco || !outra.endereco.trim()) return;
            
            const enderecoOutra = outra.endereco.toLowerCase().trim();
            
            // Endereços muito similares ou iguais
            if (this.compareAddresses(enderecoPessoa, enderecoOutra)) {
                relacionamentos.push({
                    tipo: 'endereco',
                    pessoa_origem: pessoa,
                    pessoa_destino: outra,
                    tipo_origem: pessoa.tipo,
                    tipo_destino: outra.tipo,
                    motivo: `Mesmo endereço: ${pessoa.endereco}`,
                    confianca: 85,
                    automatico: true
                });
            }
        });
        
        return relacionamentos;
    }
    
    // Analisar relacionamentos por telefone
    analyzePhone(pessoa, todasPessoas) {
        const relacionamentos = [];
        
        const telefonesPessoa = [];
        if (pessoa.telefone1) telefonesPessoa.push(this.cleanPhone(pessoa.telefone1));
        if (pessoa.telefone2) telefonesPessoa.push(this.cleanPhone(pessoa.telefone2));
        
        if (telefonesPessoa.length === 0) return relacionamentos;
        
        todasPessoas.forEach(outra => {
            if (outra.id === pessoa.id) return;
            
            const telefonesOutra = [];
            if (outra.telefone1) telefonesOutra.push(this.cleanPhone(outra.telefone1));
            if (outra.telefone2) telefonesOutra.push(this.cleanPhone(outra.telefone2));
            
            telefonesPessoa.forEach(tel1 => {
                telefonesOutra.forEach(tel2 => {
                    if (tel1 === tel2) {
                        relacionamentos.push({
                            tipo: 'telefone',
                            pessoa_origem: pessoa,
                            pessoa_destino: outra,
                            tipo_origem: pessoa.tipo,
                            tipo_destino: outra.tipo,
                            motivo: `Mesmo telefone: ${formatUtils.formatPhone(tel1)}`,
                            confianca: 80,
                            automatico: true
                        });
                    }
                });
            });
        });
        
        return relacionamentos;
    }
    
    // Analisar relacionamentos de sócios
    analyzePartners(empresa, todasPessoas) {
        const relacionamentos = [];
        
        // Verificar cada sócio da empresa
        for (let i = 1; i <= 5; i++) {
            const socio = empresa[`socio${i}`];
            if (!socio || !socio.trim()) continue;
            
            const nomeSocio = socio.toLowerCase().trim();
            
            todasPessoas.forEach(pessoa => {
                if (pessoa.tipo !== 'fisica' || !pessoa.nome) return;
                
                if (pessoa.nome.toLowerCase().includes(nomeSocio) || 
                    this.compareNames(nomeSocio, pessoa.nome.toLowerCase())) {
                    relacionamentos.push({
                        tipo: 'socio',
                        pessoa_origem: empresa,
                        pessoa_destino: pessoa,
                        tipo_origem: 'juridica',
                        tipo_destino: 'fisica',
                        motivo: `Sócio ${i}: "${socio}" → "${pessoa.nome}"`,
                        confianca: 85,
                        automatico: true
                    });
                }
            });
        }
        
        return relacionamentos;
    }
    
    // Funções auxiliares
    compareNames(name1, name2) {
        // Remover acentos e caracteres especiais para comparação
        const clean1 = name1.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const clean2 = name2.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        // Verificar se pelo menos 70% das palavras coincidem
        const words1 = clean1.split(' ').filter(w => w.length > 2);
        const words2 = clean2.split(' ').filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return false;
        
        let matches = 0;
        words1.forEach(w1 => {
            if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
                matches++;
            }
        });
        
        return (matches / Math.max(words1.length, words2.length)) >= 0.7;
    }
    
    compareAddresses(addr1, addr2) {
        const clean1 = addr1.replace(/[^\w\s]/g, '').toLowerCase();
        const clean2 = addr2.replace(/[^\w\s]/g, '').toLowerCase();
        
        // Verificar se os endereços são muito similares
        const words1 = clean1.split(' ').filter(w => w.length > 2);
        const words2 = clean2.split(' ').filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return false;
        
        let matches = 0;
        words1.forEach(w1 => {
            if (words2.includes(w1)) matches++;
        });
        
        return (matches / Math.max(words1.length, words2.length)) >= 0.8;
    }
    
    cleanPhone(phone) {
        return phone.replace(/\D/g, '');
    }
    
    removeDuplicateRelationships(relacionamentos) {
        const unique = [];
        const keys = new Set();
        
        relacionamentos.forEach(rel => {
            const key = `${rel.pessoa_origem.id}_${rel.pessoa_destino.id}_${rel.tipo}`;
            if (!keys.has(key)) {
                keys.add(key);
                unique.push(rel);
            }
        });
        
        return unique;
    }
    
    saveAutoRelationship(rel) {
        const relacionamento = {
            id: this.generateId('relacionamentos'),
            pessoa_origem_id: rel.pessoa_origem.id,
            pessoa_origem_tipo: rel.tipo_origem,
            pessoa_destino_id: rel.pessoa_destino.id,
            pessoa_destino_tipo: rel.tipo_destino,
            tipo: rel.tipo,
            descricao: rel.motivo,
            confianca: rel.confianca,
            automatico: true,
            created_at: new Date().toISOString()
        };
        
        const relacionamentos = this.getAll('relacionamentos');
        relacionamentos.push(relacionamento);
        localStorage.setItem('relacionamentos', JSON.stringify(relacionamentos));
        
        return relacionamento;
    }
    
    clearAutoRelationships() {
        const relacionamentos = this.getAll('relacionamentos');
        const manuais = relacionamentos.filter(rel => !rel.automatico);
        localStorage.setItem('relacionamentos', JSON.stringify(manuais));
        console.log(`🗑️ ${relacionamentos.length - manuais.length} relacionamentos automáticos removidos`);
    }
}

// Instância global do banco de dados
const db = new LocalDatabase();

// Funções utilitárias para formatação
const formatUtils = {
    formatCPF(cpf) {
        if (!cpf) return '';
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    formatCNPJ(cnpj) {
        if (!cnpj) return '';
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },

    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    },

    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
    }
};