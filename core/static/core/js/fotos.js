/**
 * Sistema de Gerenciamento de Fotos
 * Permite upload, visualização e associação de fotos com pessoas
 */

// Configurar event listeners para fotos
function setupPhotoListeners() {
    // Event listener para mudança do tipo de pessoa
    const tipoPessoaSelect = document.getElementById('tipo-pessoa-foto');
    if (tipoPessoaSelect) {
        tipoPessoaSelect.addEventListener('change', function() {
            loadPessoasParaFoto(this.value);
        });
    }

    // Event listener para o formulário de upload
    const formUpload = document.getElementById('form-upload-foto');
    if (formUpload) {
        formUpload.addEventListener('submit', function(e) {
            e.preventDefault();
            uploadFoto();
        });
    }

    // Event listener para preview da imagem
    const arquivoFoto = document.getElementById('arquivo-foto');
    if (arquivoFoto) {
        arquivoFoto.addEventListener('change', function(e) {
            previewImage(e.target.files[0]);
        });
    }
}

// Preview da imagem selecionada
function previewImage(file) {
    const previewContainer = document.getElementById('preview-container');
    const previewImg = document.getElementById('preview-image');
    
    if (!file) {
        previewContainer.style.display = 'none';
        return;
    }

    // Validar se é imagem
    if (!file.type.startsWith('image/')) {
        previewContainer.style.display = 'none';
        showNotification('❌ Por favor, selecione apenas arquivos de imagem', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewContainer.style.display = 'block';
        
        // Mostrar informações do arquivo
        const fileInfo = `
            <small class="text-muted d-block mt-2">
                📁 ${file.name} | 
                📏 ${(file.size / 1024 / 1024).toFixed(2)} MB | 
                🖼️ ${file.type}
            </small>
        `;
        
        const existingInfo = previewContainer.querySelector('.file-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        previewContainer.insertAdjacentHTML('beforeend', `<div class="file-info">${fileInfo}</div>`);
    };
    
    reader.readAsDataURL(file);
}

// Carregar gerenciador de fotos - VERSÃO CORRIGIDA
function loadGerenciadorFotos() {
    console.log('📸 Carregando gerenciador de fotos...');
    
    // Resetar formulário
    const form = document.getElementById('form-upload-foto');
    if (form) {
        form.reset();
    }
    
    // Resetar preview
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    // Configurar selects
    const tipoSelect = document.getElementById('tipo-pessoa-foto');
    const pessoaSelect = document.getElementById('pessoa-foto');
    
    if (tipoSelect && pessoaSelect) {
        // Resetar e desabilitar select de pessoa
        pessoaSelect.innerHTML = '<option value="">Selecione primeiro o tipo de pessoa...</option>';
        pessoaSelect.disabled = true;
        
        // Resetar tipo
        tipoSelect.value = '';
        
        // Event listener para mudança de tipo
        tipoSelect.onchange = function() {
            const tipoSelecionado = this.value;
            console.log('🔄 Tipo selecionado:', tipoSelecionado);
            loadPessoasParaFoto(tipoSelecionado);
        };
    }
    
    // Carregar galeria
    loadGaleriaFotos();
    
    updateStatusBar('Gerenciador de fotos carregado');
    console.log('✅ Gerenciador de fotos carregado com sucesso');
}

// Carregar pessoas para associar com fotos - VERSÃO CORRIGIDA
function loadPessoasParaFoto(tipo) {
    console.log('🔍 Carregando pessoas para fotos, tipo:', tipo);
    
    const pessoaSelect = document.getElementById('pessoa-foto');
    if (!pessoaSelect) {
        console.error('❌ Elemento pessoa-foto não encontrado');
        return;
    }

    // Limpar e resetar select
    pessoaSelect.innerHTML = '';
    pessoaSelect.disabled = false;

    if (!tipo) {
        pessoaSelect.innerHTML = '<option value="">Selecione primeiro o tipo de pessoa...</option>';
        pessoaSelect.disabled = true;
        return;
    }

    try {
        // Mostrar loading
        pessoaSelect.innerHTML = '<option value="">Carregando pessoas...</option>';
        
        const apiEndpoint = tipo === 'fisica' ? 'pessoas-fisicas' : 'pessoas-juridicas';
        api.get(`/${apiEndpoint}/`).then(response => {
            const pessoas = response.results || [];

            // Limpar e adicionar opção padrão
            pessoaSelect.innerHTML = '<option value="">Selecione uma pessoa...</option>';

            if (pessoas.length === 0) {
                pessoaSelect.innerHTML = '<option value="">Nenhuma pessoa encontrada</option>';
            pessoaSelect.disabled = true;
            return;
        }

        // Ordenar pessoas por nome
        pessoas.sort((a, b) => {
            const nomeA = (a.nome || a.razao_social || '').toLowerCase();
            const nomeB = (b.nome || b.razao_social || '').toLowerCase();
            return nomeA.localeCompare(nomeB);
        });

        // Adicionar pessoas ao select
        pessoas.forEach((pessoa, index) => {
            const option = document.createElement('option');
            option.value = pessoa.id;
            
            let texto = '';
            if (tipo === 'fisica') {
                const nome = pessoa.nome || 'Nome não informado';
                const cpf = pessoa.cpf ? formatUtils.formatCPF(pessoa.cpf) : 'CPF não informado';
                const goa = pessoa.goa ? `[${pessoa.goa}]` : '';
                texto = `${nome} - ${cpf} ${goa}`;
            } else {
                const razao = pessoa.razao_social || 'Razão social não informada';
                const cnpj = pessoa.cnpj ? formatUtils.formatCNPJ(pessoa.cnpj) : 'CNPJ não informado';
                const goa = pessoa.goa ? `[${pessoa.goa}]` : '';
                texto = `${razao} - ${cnpj} ${goa}`;
            }
            
            option.textContent = texto;
            option.title = texto; // Tooltip para nomes longos
            pessoaSelect.appendChild(option);
        });
        // Habilitar select
        pessoaSelect.disabled = false;
        
        console.log(`✅ ${pessoas.length} pessoas carregadas para associação com fotos`);
        showNotification(`${pessoas.length} ${tipo === 'fisica' ? 'pessoas físicas' : 'pessoas jurídicas'} carregadas`, 'success');
        }).catch(error => {
            console.error('❌ Erro ao carregar pessoas para fotos:', error);
            pessoaSelect.innerHTML = '<option value="">Erro ao carregar pessoas</option>';
            pessoaSelect.disabled = true;
            showNotification('Erro ao carregar lista de pessoas', 'error');
        });
    } catch (error) {
        console.error('❌ Erro ao carregar pessoas para fotos:', error);
        pessoaSelect.innerHTML = '<option value="">Erro ao carregar pessoas</option>';
        pessoaSelect.disabled = true;
        showNotification('Erro ao carregar lista de pessoas', 'error');
    }
}

// Upload de foto - VERSÃO COM ARQUIVOS LOCAIS
function uploadFoto() {
    try {
        const tipoPessoa = document.getElementById('tipo-pessoa-foto').value;
        const pessoaId = document.getElementById('pessoa-foto').value;
        const arquivoFoto = document.getElementById('arquivo-foto').files[0];
        const descricao = document.getElementById('descricao-foto').value;

        if (!tipoPessoa || !pessoaId || !arquivoFoto) {
            showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        // Validar tipo de arquivo
        if (!arquivoFoto.type.startsWith('image/')) {
            showNotification('❌ Por favor, selecione apenas arquivos de imagem', 'error');
            return;
        }

        // Validar tamanho (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (arquivoFoto.size > maxSize) {
            showNotification('❌ A imagem deve ter no máximo 5MB', 'error');
            return;
        }

        // Mostrar indicador de carregamento
        const btnSubmit = document.querySelector('#form-upload-foto button[type="submit"]');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processando imagem...';
        btnSubmit.disabled = true;

        // Converter imagem para base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            
            const fotoData = {
                pessoa_id: pessoaId,
                tipo_pessoa: tipoPessoa,
                url_foto: base64Image,
                nome_arquivo: arquivoFoto.name,
                tipo_arquivo: arquivoFoto.type,
                tamanho_arquivo: arquivoFoto.size,
                descricao: descricao || 'Sem descrição',
                data_upload: new Date().toISOString(),
                status: 'ativa'
            };

            // Salvar no banco
            // Fazer upload via API
            const formData = new FormData();
            formData.append('pessoa_id', pessoaId);
            formData.append('arquivo', arquivo);
            formData.append('descricao', descricao);
            
            fetch('/api/fotos/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            }).then(response => {
                if (!response.ok) throw new Error('Erro ao upload');
                return response.json();
            }).then(data => {
                showNotification('✅ Foto enviada com sucesso!', 'success');
                
                // Limpar formulário
                document.getElementById('form-upload-foto').reset();
                document.getElementById('preview-container').style.display = 'none';
                loadPessoasParaFoto(); // Resetar seleção
                loadGaleriaFotos(); // Atualizar galeria
            }).catch(error => {
                console.error('Erro ao salvar foto:', error);
                showNotification('❌ Erro ao salvar a foto no banco de dados', 'error');
            });
            
            // Restaurar botão
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
}

// Validar URL de imagem - VERSÃO MELHORADA
function validateImageUrl(url) {
    // Verificar se é uma URL válida
    try {
        new URL(url);
    } catch (_) {
        return {
            valid: false,
            message: 'URL inválida. Certifique-se de incluir http:// ou https://'
        };
    }

    // Verificar se é uma URL de imagem
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
    const isDirectImageUrl = imageExtensions.test(url);
    
    // Permitir URLs de serviços conhecidos mesmo sem extensão
    const knownImageHosts = [
        'imgur.com',
        'i.imgur.com',
        'drive.google.com',
        'dropbox.com',
        'unsplash.com',
        'images.unsplash.com',
        'pixabay.com',
        'pexels.com',
        'picsum.photos',
        'via.placeholder.com'
    ];
    
    const hostname = new URL(url).hostname.toLowerCase();
    const isKnownImageHost = knownImageHosts.some(host => hostname.includes(host));
    
    if (!isDirectImageUrl && !isKnownImageHost) {
        return {
            valid: false,
            message: 'URL deve ser de uma imagem (jpg, png, gif, etc.) ou de um serviço conhecido de imagens'
        };
    }

    return { valid: true };
}

// Testar se a imagem carrega corretamente
function testImageLoad(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Timeout de 10 segundos
        const timeout = setTimeout(() => {
            reject(new Error('Timeout - a imagem não carregou em 10 segundos'));
        }, 10000);
        
        img.onload = () => {
            clearTimeout(timeout);
            resolve();
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Não foi possível carregar a imagem. Verifique se a URL está correta e acessível'));
        };
        
        img.src = url;
    });
}

// Validar URL (função legada - mantida para compatibilidade)
function isValidUrl(string) {
    return validateImageUrl(string).valid;
}

// Carregar galeria de fotos
function loadGaleriaFotos() {
    const galeriaContainer = document.getElementById('galeria-fotos');
    if (!galeriaContainer) return;

    api.listarFotos().then(response => {
        const fotos = response.results || [];
        galeriaContainer.innerHTML = '';

        if (fotos.length === 0) {
            galeriaContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        <i class="fas fa-images fa-3x mb-3 d-block"></i>
                        <h5>Nenhuma foto encontrada</h5>
                        <p>Adicione fotos associando-as às pessoas cadastradas.</p>
                    </div>
                </div>
            `;
            return;
        }

        fotos.forEach(foto => {
            const pessoa = getPessoaInfo(foto.pessoa_id, foto.tipo_pessoa);
            const fotoCard = createFotoCard(foto, pessoa);
            galeriaContainer.appendChild(fotoCard);
        });

        updateStatusBar(`${fotos.length} fotos na galeria`);
    }).catch(error => {
        console.error('Erro ao carregar galeria:', error);
        showNotification('Erro ao carregar galeria de fotos', 'error');
    });
}

// Obter informações da pessoa
async function getPessoaInfo(pessoaId, tipoPessoa) {
    try {
        let pessoa;
        if (tipoPessoa === 'fisica') {
            pessoa = await api.get(`/pessoas-fisicas/${pessoaId}/`);
            return {
                nome: pessoa.nome,
                documento: formatUtils.formatCPF(pessoa.cpf),
                tipo: 'Pessoa Física'
            };
        } else {
            pessoa = await api.get(`/pessoas-juridicas/${pessoaId}/`);
            return {
                nome: pessoa.razao_social,
                documento: formatUtils.formatCNPJ(pessoa.cnpj),
                tipo: 'Pessoa Jurídica'
            };
        }
    } catch (error) {
        console.error('Erro ao obter informações da pessoa:', error);
        return { nome: 'Erro ao carregar', documento: '-', tipo: '-' };
    }
}

// Criar card de foto
function createFotoCard(foto, pessoa) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
    
    colDiv.innerHTML = `
        <div class="card h-100 foto-card">
            <div class="foto-container" style="height: 200px; overflow: hidden; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
                <img src="${foto.url_foto}" 
                     class="foto-thumb" 
                     style="max-width: 100%; max-height: 100%; object-fit: cover; cursor: pointer;"
                     onclick="visualizarFoto('${foto.id}')"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image fa-3x text-muted\\'></i><br><small class=\\'text-muted\\'>Erro ao carregar imagem</small>';"
                     alt="Foto de ${pessoa.nome}">
            </div>
            <div class="card-body p-2">
                <h6 class="card-title mb-1" style="font-size: 0.9rem;">${pessoa.nome}</h6>
                <p class="card-text mb-1">
                    <small class="text-muted">${pessoa.tipo}</small><br>
                    <small class="text-muted">${pessoa.documento}</small>
                </p>
                ${foto.descricao ? `<p class="card-text mb-2"><small>${foto.descricao}</small></p>` : ''}
                <small class="text-muted">
                    <i class="fas fa-calendar me-1"></i>
                    ${formatUtils.formatDateTime(foto.data_upload)}
                </small>
            </div>
            <div class="card-footer p-2 bg-light">
                <div class="btn-group w-100" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="visualizarFoto('${foto.id}')" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="editarFoto('${foto.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirFoto('${foto.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return colDiv;
}

// Visualizar foto em modal melhorado
function visualizarFoto(fotoId) {
    console.log('📸 Iniciando visualização da foto:', fotoId);
    
    api.obterFoto(fotoId).then(foto => {
        if (!foto) {
            showNotification('Foto não encontrada', 'error');
            return;
        }

        const pessoa = getPessoaInfo(foto.pessoa_id, foto.tipo_pessoa);
        
        // Criar modal customizado para visualização de foto
        criarModalVisualizacaoFoto(foto, pessoa);
    }).catch(err => {
        showNotification('Erro ao carregar foto: ' + err.message, 'error');
    });
}

// Função para lidar com carregamento bem-sucedido da imagem
function handleImageLoad(img) {
    const loading = document.getElementById('loading-image');
    if (loading) {
        loading.style.display = 'none';
    }
    img.style.display = 'block';
}

// Função para lidar com erro de carregamento da imagem
function handleImageLoadError(img, originalUrl) {
    const loading = document.getElementById('loading-image');
    if (loading) {
        loading.style.display = 'none';
    }
    
    img.style.display = 'none';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-warning';
    errorDiv.innerHTML = `
        <div class="text-center">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h6>Não foi possível carregar a imagem</h6>
            <p class="small">A imagem pode ter sido removida ou a URL pode estar incorreta.</p>
            <button class="btn btn-sm btn-outline-primary" onclick="window.open('${originalUrl}', '_blank')">
                <i class="fas fa-external-link-alt me-1"></i>Tentar abrir em nova aba
            </button>
        </div>
    `;
    
    img.parentNode.appendChild(errorDiv);
}

// Confirmar exclusão de foto
function confirmarExclusaoFoto(fotoId) {
    if (confirm('⚠️ Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.')) {
        excluirFoto(fotoId);
        fecharModal();
        loadGaleriaFotos(); // Atualizar galeria
    }
}

// Carregar imagem com timeout e fallback
function carregarImagemSegura(imageId, imagemUrl) {
    const loadingEl = document.getElementById(`loading-${imageId}`);
    const containerEl = document.getElementById(`image-container-${imageId}`);
    const errorEl = document.getElementById(`error-container-${imageId}`);
    const imgEl = document.getElementById(`main-image-${imageId}`);
    
    if (!loadingEl || !containerEl || !errorEl || !imgEl) {
        console.error('❌ Elementos da imagem não encontrados');
        return;
    }
    
    // Timeout de 10 segundos
    const timeout = setTimeout(() => {
        console.warn('⏰ Timeout no carregamento da imagem');
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-clock fa-2x mb-3"></i>
                <h6>Timeout no carregamento</h6>
                <p class="small">A imagem está demorando muito para carregar.</p>
            </div>
        `;
    }, 10000);
    
    imgEl.onload = function() {
        clearTimeout(timeout);
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';
        console.log('✅ Imagem carregada com sucesso');
    };
    
    imgEl.onerror = function() {
        clearTimeout(timeout);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        console.error('❌ Erro ao carregar imagem');
    };
    
    // Iniciar carregamento
    imgEl.src = imagemUrl;
}

// Função para recarregar imagem
function recarregarImagem(imageId, imagemUrl) {
    const errorEl = document.getElementById(`error-container-${imageId}`);
    const loadingEl = document.getElementById(`loading-${imageId}`);
    
    errorEl.style.display = 'none';
    loadingEl.style.display = 'flex';
    
    setTimeout(() => {
        carregarImagemSegura(imageId, imagemUrl);
    }, 500);
}

// Função para download da imagem
function downloadImagem(base64Data, nomeArquivo) {
    try {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('📥 Download iniciado!', 'success');
    } catch (error) {
        console.error('❌ Erro no download:', error);
        showNotification('Erro ao fazer download da imagem', 'error');
    }
}

// Editar foto
async function editarFoto(fotoId) {
    try {
        const foto = await api.get(`/fotos/${fotoId}/`);
        if (!foto) {
            showNotification('Foto não encontrada', 'error');
            return;
        }

        // Preencher formulário com dados da foto
        document.getElementById('tipo-pessoa-foto').value = foto.tipo_pessoa;
        loadPessoasParaFoto(foto.tipo_pessoa);
        
        // Aguardar carregamento das pessoas e selecionar
        setTimeout(() => {
            document.getElementById('pessoa-foto').value = foto.pessoa_id;
            document.getElementById('url-foto').value = foto.url_foto;
            document.getElementById('descricao-foto').value = foto.descricao || '';
        }, 100);

        // Configurar modo de edição
        editingPhoto = fotoId;
        
        // Alterar texto do botão
        const submitBtn = document.querySelector('#form-upload-foto button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Atualizar';
        }

        showNotification('Foto carregada para edição', 'info');
        
    } catch (error) {
        console.error('Erro ao editar foto:', error);
        showNotification('Erro ao carregar foto para edição', 'error');
    }
}

// Excluir foto
function excluirFoto(fotoId) {
    if (confirm('Deseja realmente excluir esta foto?')) {
        try {
            api.deletarFoto(fotoId).then(() => {
                showNotification('Foto deletada com sucesso!', 'success');
                loadGaleriaFotos();
            }).catch(err => {
                showNotification('Erro ao deletar foto: ' + err.message, 'error');
            });
            showNotification('Foto excluída com sucesso!', 'success');
            loadGaleriaFotos();
            loadDashboard();
            updateStatusBar('Foto excluída');
        } catch (error) {
            console.error('Erro ao excluir foto:', error);
            showNotification('Erro ao excluir foto', 'error');
        }
    }
}

// Buscar fotos por pessoa
async function buscarFotosPorPessoa(pessoaId, tipoPessoa) {
    try {
        const fotos = await api.get(`/fotos/?pessoa_id=${pessoaId}&tipo_pessoa=${tipoPessoa}`);
        return fotos;
    } catch (error) {
        console.error('Erro ao buscar fotos da pessoa:', error);
        return [];
    }
}

// Filtrar fotos na galeria
function filtrarFotos(filtro) {
    const galeriaContainer = document.getElementById('galeria-fotos');
    if (!galeriaContainer) return;

    const fotoCards = galeriaContainer.querySelectorAll('.foto-card');
    let visibleCount = 0;

    fotoCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        const isVisible = cardText.includes(filtro.toLowerCase());
        
        card.parentElement.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
    });

    updateStatusBar(`${visibleCount} fotos encontradas`);
}

// Exportar fotos (criar lista com URLs)
async function exportarListaFotos() {
    try {
        const fotos = await api.get('/fotos/');
        let lista = 'LISTA DE FOTOS\n';
        lista += '================\n\n';

        for (let index = 0; index < fotos.length; index++) {
            const foto = fotos[index];
            const pessoa = await getPessoaInfo(foto.pessoa_id, foto.tipo_pessoa);
            lista += `${index + 1}. ${pessoa.nome} (${pessoa.tipo})\n`;
            lista += `   Documento: ${pessoa.documento}\n`;
            lista += `   URL: ${foto.url_foto}\n`;
            lista += `   Descrição: ${foto.descricao || 'Sem descrição'}\n`;
            lista += `   Data: ${formatUtils.formatDateTime(foto.data_upload)}\n\n`;
        }

        // Criar arquivo para download
        const blob = new Blob([lista], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista_fotos_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showNotification('Lista de fotos exportada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar lista de fotos:', error);
        showNotification('Erro ao exportar lista de fotos', 'error');
    }
}

// Estatísticas de fotos
async function getEstatisticasFotos() {
    try {
        const fotos = await api.get('/fotos/');
        const stats = {
            total: fotos.length,
            pessoa_fisica: fotos.filter(f => f.tipo_pessoa === 'fisica').length,
            pessoa_juridica: fotos.filter(f => f.tipo_pessoa === 'juridica').length,
            com_descricao: fotos.filter(f => f.descricao && f.descricao.trim()).length,
            sem_descricao: fotos.filter(f => !f.descricao || !f.descricao.trim()).length
        };
        
        return stats;
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        return { total: 0, pessoa_fisica: 0, pessoa_juridica: 0, com_descricao: 0, sem_descricao: 0 };
    }
}

// Criar modal customizado para visualização aprimorada de fotos
function criarModalVisualizacaoFoto(foto, pessoa) {
    try {
        console.log('🖼️ Criando modal de visualização aprimorada para foto:', foto.id);
        
        // Remover modal existente se houver
        const modalExistente = document.getElementById('modal-foto-viewer');
        if (modalExistente) {
            modalExistente.remove();
        }
        
        // Criar novo modal
        const modalHtml = `
            <div class="modal fade" id="modal-foto-viewer" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl modal-dialog-centered">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title text-light">
                                <i class="fas fa-image me-2 text-primary"></i>
                                Visualização de Foto - ${pessoa.nome}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        <div class="modal-body p-0">
                            <div class="container-fluid">
                                <div class="row g-0">
                                    <!-- Área da Imagem -->
                                    <div class="col-lg-8 bg-black position-relative">
                                        <div id="foto-loading" class="d-flex justify-content-center align-items-center position-absolute w-100 h-100" style="min-height: 500px; z-index: 10;">
                                            <div class="text-center">
                                                <div class="spinner-border text-primary mb-3" role="status">
                                                    <span class="visually-hidden">Carregando...</span>
                                                </div>
                                                <p class="text-light">Carregando imagem...</p>
                                            </div>
                                        </div>
                                        
                                        <div id="foto-container" class="d-none position-relative">
                                            <img id="foto-principal" 
                                                 class="w-100" 
                                                 style="max-height: 70vh; object-fit: contain; cursor: zoom-in;"
                                                 alt="Foto de ${pessoa.nome}"
                                                 onclick="toggleZoom(this)">
                                            
                                            <!-- Controles de navegação -->
                                            <div class="position-absolute top-50 start-0 translate-middle-y ms-2">
                                                <button id="btn-prev-foto" class="btn btn-dark btn-sm rounded-circle" onclick="navegarFotos('prev')" title="Foto Anterior">
                                                    <i class="fas fa-chevron-left"></i>
                                                </button>
                                            </div>
                                            <div class="position-absolute top-50 end-0 translate-middle-y me-2">
                                                <button id="btn-next-foto" class="btn btn-dark btn-sm rounded-circle" onclick="navegarFotos('next')" title="Próxima Foto">
                                                    <i class="fas fa-chevron-right"></i>
                                                </button>
                                            </div>
                                            
                                            <!-- Contador de fotos -->
                                            <div class="position-absolute bottom-0 start-50 translate-middle-x mb-2">
                                                <span id="foto-counter" class="badge bg-dark bg-opacity-75 px-3 py-2">1 / 1</span>
                                            </div>
                                        </div>
                                        
                                        <div id="foto-error" class="d-none d-flex justify-content-center align-items-center" style="min-height: 500px;">
                                            <div class="text-center">
                                                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                                                <h6 class="text-light">Erro ao carregar imagem</h6>
                                                <p class="text-muted">A imagem pode estar corrompida ou inacessível.</p>
                                                <button class="btn btn-outline-primary" onclick="recarregarFotoAtual()">
                                                    <i class="fas fa-redo me-1"></i>Tentar Novamente
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Painel de Informações -->
                                    <div class="col-lg-4 bg-secondary">
                                        <div class="p-4">
                                            <!-- Informações da Pessoa -->
                                            <div class="mb-4">
                                                <h6 class="text-primary mb-3">
                                                    <i class="fas fa-user me-2"></i>Informações da Pessoa
                                                </h6>
                                                <div class="bg-dark rounded p-3">
                                                    <h6 class="text-light mb-2">${pessoa.nome}</h6>
                                                    <p class="text-muted mb-1">
                                                        <i class="fas fa-id-card me-2"></i>
                                                        ${pessoa.tipo} - ${pessoa.documento}
                                                    </p>
                                                    <button class="btn btn-outline-light btn-sm mt-2" onclick="verDetalhesPessoa('${foto.pessoa_id}', '${foto.tipo_pessoa}')">
                                                        <i class="fas fa-external-link-alt me-1"></i>Ver Detalhes
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <!-- Informações da Foto -->
                                            <div class="mb-4">
                                                <h6 class="text-primary mb-3">
                                                    <i class="fas fa-info-circle me-2"></i>Detalhes da Foto
                                                </h6>
                                                <div class="bg-dark rounded p-3">
                                                    <p class="text-light mb-2">
                                                        <i class="fas fa-file me-2 text-muted"></i>
                                                        <strong>Arquivo:</strong><br>
                                                        <span class="small text-muted">${foto.nome_arquivo || 'Sem nome'}</span>
                                                    </p>
                                                    
                                                    <p class="text-light mb-2">
                                                        <i class="fas fa-weight me-2 text-muted"></i>
                                                        <strong>Tamanho:</strong><br>
                                                        <span class="small text-muted">${foto.tamanho_arquivo ? (foto.tamanho_arquivo / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</span>
                                                    </p>
                                                    
                                                    <p class="text-light mb-2">
                                                        <i class="fas fa-calendar me-2 text-muted"></i>
                                                        <strong>Upload:</strong><br>
                                                        <span class="small text-muted">${formatUtils.formatDateTime(foto.data_upload)}</span>
                                                    </p>
                                                    
                                                    ${foto.descricao ? `
                                                    <p class="text-light mb-0">
                                                        <i class="fas fa-comment me-2 text-muted"></i>
                                                        <strong>Descrição:</strong><br>
                                                        <span class="small text-muted">${foto.descricao}</span>
                                                    </p>
                                                    ` : ''}
                                                </div>
                                            </div>
                                            
                                            <!-- Outras Fotos da Pessoa -->
                                            <div class="mb-4">
                                                <h6 class="text-primary mb-3">
                                                    <i class="fas fa-images me-2"></i>Outras Fotos
                                                    <span id="outras-fotos-count" class="badge bg-primary ms-2">0</span>
                                                </h6>
                                                <div id="outras-fotos-container" class="row g-2">
                                                    <!-- Miniaturas serão inseridas aqui -->
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer border-secondary justify-content-between">
                            <div class="d-flex gap-2">
                                <button class="btn btn-success" onclick="downloadFotoAtual()">
                                    <i class="fas fa-download me-1"></i>Download
                                </button>
                                <button class="btn btn-warning" onclick="editarFotoAtual()">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-danger" onclick="excluirFotoAtual()">
                                    <i class="fas fa-trash me-1"></i>Excluir
                                </button>
                                <button class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1"></i>Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Configurar dados globais
        window.fotoViewerData = {
            fotoAtual: foto,
            pessoaAtual: pessoa,
            todasFotos: buscarFotosDaPessoa(foto.pessoa_id, foto.tipo_pessoa),
            indiceAtual: 0
        };
        
        // Encontrar índice da foto atual
        window.fotoViewerData.indiceAtual = window.fotoViewerData.todasFotos.findIndex(f => f.id === foto.id);
        if (window.fotoViewerData.indiceAtual === -1) {
            window.fotoViewerData.indiceAtual = 0;
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modal-foto-viewer'));
        modal.show();
        
        // Carregar foto principal
        carregarFotoPrincipal();
        
        // Carregar outras fotos
        carregarOutrasFotos();
        
        // Cleanup ao fechar modal
        document.getElementById('modal-foto-viewer').addEventListener('hidden.bs.modal', function () {
            this.remove();
            window.fotoViewerData = null;
        });
        
        console.log('✅ Modal de visualização criado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao criar modal de visualização:', error);
        showNotification('Erro ao abrir visualização de foto', 'error');
    }
}

// Buscar todas as fotos de uma pessoa
async function buscarFotosDaPessoa(pessoaId, tipoPessoa) {
    try {
        const todasFotos = await api.get('/fotos/');
        return todasFotos.filter(foto => 
            foto.pessoa_id === pessoaId && foto.tipo_pessoa === tipoPessoa
        ).sort((a, b) => new Date(b.data_upload) - new Date(a.data_upload));
    } catch (error) {
        console.error('Erro ao buscar fotos da pessoa:', error);
        return [];
    }
}

// Carregar foto principal no viewer
function carregarFotoPrincipal() {
    const { fotoAtual, todasFotos, indiceAtual } = window.fotoViewerData;
    
    const loadingEl = document.getElementById('foto-loading');
    const containerEl = document.getElementById('foto-container');
    const errorEl = document.getElementById('foto-error');
    const imgEl = document.getElementById('foto-principal');
    const counterEl = document.getElementById('foto-counter');
    
    // Mostrar loading
    loadingEl.classList.remove('d-none');
    containerEl.classList.add('d-none');
    errorEl.classList.add('d-none');
    
    // Atualizar contador
    counterEl.textContent = `${indiceAtual + 1} / ${todasFotos.length}`;
    
    // Configurar navegação
    document.getElementById('btn-prev-foto').disabled = indiceAtual === 0;
    document.getElementById('btn-next-foto').disabled = indiceAtual === todasFotos.length - 1;
    
    // Carregar imagem
    imgEl.onload = function() {
        loadingEl.classList.add('d-none');
        containerEl.classList.remove('d-none');
    };
    
    imgEl.onerror = function() {
        loadingEl.classList.add('d-none');
        errorEl.classList.remove('d-none');
    };
    
    imgEl.src = fotoAtual.url_foto;
}

// Carregar outras fotos da pessoa como miniaturas
function carregarOutrasFotos() {
    const { todasFotos, indiceAtual } = window.fotoViewerData;
    const container = document.getElementById('outras-fotos-container');
    const countEl = document.getElementById('outras-fotos-count');
    
    const outrasfotos = todasFotos.filter((_, index) => index !== indiceAtual);
    countEl.textContent = outrasfotos.length;
    
    container.innerHTML = '';
    
    if (outrasfotos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted small py-3">Nenhuma outra foto encontrada</div>';
        return;
    }
    
    outrasfotos.slice(0, 6).forEach(foto => {
        const indiceOriginal = todasFotos.findIndex(f => f.id === foto.id);
        container.innerHTML += `
            <div class="col-6">
                <div class="position-relative">
                    <img src="${foto.url_foto}" 
                         class="img-fluid rounded cursor-pointer" 
                         style="aspect-ratio: 1; object-fit: cover; cursor: pointer;"
                         onclick="navegarParaFoto(${indiceOriginal})"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ddd%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2212%22>❌</text></svg>'"
                         title="${formatUtils.formatDateTime(foto.data_upload)}">
                    <div class="position-absolute top-0 end-0 m-1">
                        <span class="badge bg-primary bg-opacity-75 small">${indiceOriginal + 1}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (outrasfotos.length > 6) {
        container.innerHTML += `
            <div class="col-12 text-center">
                <small class="text-muted">+${outrasfotos.length - 6} fotos</small>
            </div>
        `;
    }
}

// Navegar entre fotos
function navegarFotos(direcao) {
    const { todasFotos, indiceAtual } = window.fotoViewerData;
    
    let novoIndice = indiceAtual;
    if (direcao === 'next' && indiceAtual < todasFotos.length - 1) {
        novoIndice = indiceAtual + 1;
    } else if (direcao === 'prev' && indiceAtual > 0) {
        novoIndice = indiceAtual - 1;
    }
    
    navegarParaFoto(novoIndice);
}

// Navegar para foto específica
function navegarParaFoto(novoIndice) {
    const { todasFotos } = window.fotoViewerData;
    
    if (novoIndice >= 0 && novoIndice < todasFotos.length) {
        window.fotoViewerData.indiceAtual = novoIndice;
        window.fotoViewerData.fotoAtual = todasFotos[novoIndice];
        
        carregarFotoPrincipal();
        carregarOutrasFotos();
    }
}

// Toggle zoom na imagem
function toggleZoom(img) {
    if (img.style.transform === 'scale(2)') {
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
        img.parentElement.style.overflow = 'hidden';
    } else {
        img.style.transform = 'scale(2)';
        img.style.cursor = 'zoom-out';
        img.parentElement.style.overflow = 'auto';
    }
}

// Recarregar foto atual
function recarregarFotoAtual() {
    carregarFotoPrincipal();
}

// Download da foto atual
function downloadFotoAtual() {
    const { fotoAtual } = window.fotoViewerData;
    downloadImagem(fotoAtual.url_foto, fotoAtual.nome_arquivo || 'foto.jpg');
}

// Editar foto atual
function editarFotoAtual() {
    const { fotoAtual } = window.fotoViewerData;
    const modal = bootstrap.Modal.getInstance(document.getElementById('modal-foto-viewer'));
    modal.hide();
    editarFoto(fotoAtual.id);
}

// Excluir foto atual
function excluirFotoAtual() {
    const { fotoAtual, todasFotos } = window.fotoViewerData;
    
    if (confirm('⚠️ Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.')) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modal-foto-viewer'));
        modal.hide();
        
        setTimeout(() => {
            excluirFoto(fotoAtual.id);
        }, 300);
    }
}

// Ver detalhes da pessoa
function verDetalhesPessoa(pessoaId, tipoPessoa) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('modal-foto-viewer'));
    modal.hide();
    
    setTimeout(() => {
        if (tipoPessoa === 'fisica') {
            visualizarPessoaFisica(pessoaId);
        } else {
            visualizarPessoaJuridica(pessoaId);
        }
    }, 300);
}

// Variável global para controle de edição de fotos
let editingPhoto = null;