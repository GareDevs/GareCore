/**
 * Sistema de Backup Automático
 * Realiza backups diários dos dados do sistema
 */

class BackupManager {
    constructor() {
        this.backupInterval = null;
        this.maxBackups = 30; // Manter 30 backups (1 mês)
        this.backupKey = 'system_backups';
        this.lastBackupKey = 'last_backup_date';
        this.isEnabled = localStorage.getItem('backup_enabled') !== 'false';
        
        console.log('🔄 Sistema de backup inicializado');
        this.init();
    }

    init() {
        // Verificar se precisa fazer backup imediatamente
        this.checkAndCreateBackup();
        
        // Configurar backup automático a cada hora
        this.setupAutomaticBackup();
        
        // Limpar backups antigos na inicialização
        this.cleanOldBackups();
    }

    setupAutomaticBackup() {
        // Limpar interval anterior se existir
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }

        // Verificar a cada 1 hora se precisa fazer backup
        this.backupInterval = setInterval(() => {
            if (this.isEnabled) {
                this.checkAndCreateBackup();
            }
        }, 60 * 60 * 1000); // 1 hora em milliseconds

        console.log('⏰ Backup automático configurado (verificação a cada hora)');
    }

    checkAndCreateBackup() {
        const today = new Date().toDateString();
        const lastBackup = localStorage.getItem(this.lastBackupKey);

        console.log('🔍 Verificando necessidade de backup:', {
            hoje: today,
            ultimoBackup: lastBackup,
            habilitado: this.isEnabled
        });

        if (!this.isEnabled) {
            console.log('⏸️ Backup desabilitado pelo usuário');
            return;
        }

        if (lastBackup !== today) {
            console.log('📦 Criando backup diário...');
            this.createBackup()
                .then(() => {
                    localStorage.setItem(this.lastBackupKey, today);
                    console.log('✅ Backup diário criado com sucesso');
                    this.showBackupNotification('✅ Backup diário criado automaticamente!', 'success');
                })
                .catch(error => {
                    console.error('❌ Erro ao criar backup diário:', error);
                    this.showBackupNotification('❌ Erro ao criar backup automático', 'error');
                });
        } else {
            console.log('ℹ️ Backup já realizado hoje');
        }
    }

    async createBackup(isManual = false) {
        try {
            const timestamp = new Date().toISOString();
            const dateStr = new Date().toLocaleDateString('pt-BR');
            const timeStr = new Date().toLocaleTimeString('pt-BR');

            // Coletar todos os dados do sistema
            const backupData = {
                metadata: {
                    version: '1.0',
                    created: timestamp,
                    date: dateStr,
                    time: timeStr,
                    type: isManual ? 'manual' : 'automatic',
                    browser: navigator.userAgent,
                    hostname: window.location.hostname
                },
                data: {
                    pessoa_fisica: this.getTableData('pessoa_fisica'),
                    pessoa_juridica: this.getTableData('pessoa_juridica'),
                    fotos: this.getTableData('fotos'),
                    relacionamentos: this.getTableData('relacionamentos')
                },
                settings: {
                    theme: localStorage.getItem('theme'),
                    backup_enabled: localStorage.getItem('backup_enabled'),
                    admin_2fa_secret: localStorage.getItem('admin_2fa_secret') ? '[PROTEGIDO]' : null,
                    last_login: localStorage.getItem('last_login')
                },
                statistics: {
                    total_pessoas_fisicas: this.getTableData('pessoa_fisica').length,
                    total_pessoas_juridicas: this.getTableData('pessoa_juridica').length,
                    total_fotos: this.getTableData('fotos').length,
                    total_relacionamentos: this.getTableData('relacionamentos').length,
                    backup_size_bytes: 0 // Será calculado abaixo
                }
            };

            // Calcular tamanho do backup
            const backupJson = JSON.stringify(backupData);
            backupData.statistics.backup_size_bytes = backupJson.length;
            backupData.statistics.backup_size_mb = (backupJson.length / (1024 * 1024)).toFixed(2);

            // Salvar backup
            const backupId = `backup_${Date.now()}`;
            const backups = this.getAllBackups();
            
            backups[backupId] = backupData;
            
            localStorage.setItem(this.backupKey, JSON.stringify(backups));

            console.log(`📦 Backup criado: ${backupId}`, {
                tamanho: `${backupData.statistics.backup_size_mb} MB`,
                pessoas_fisicas: backupData.statistics.total_pessoas_fisicas,
                pessoas_juridicas: backupData.statistics.total_pessoas_juridicas,
                fotos: backupData.statistics.total_fotos,
                relacionamentos: backupData.statistics.total_relacionamentos
            });

            // Limpar backups antigos após criar novo
            this.cleanOldBackups();

            return {
                success: true,
                backupId: backupId,
                data: backupData
            };

        } catch (error) {
            console.error('❌ Erro ao criar backup:', error);
            throw error;
        }
    }

    getTableData(tableName) {
        try {
            if (typeof db !== 'undefined' && db.getAll) {
                return db.getAll(tableName) || [];
            } else {
                // Fallback: ler diretamente do localStorage
                const data = JSON.parse(localStorage.getItem('local_database_data') || '{}');
                return data[tableName] || [];
            }
        } catch (error) {
            console.warn(`⚠️ Erro ao obter dados da tabela ${tableName}:`, error);
            return [];
        }
    }

    getAllBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey);
            return backups ? JSON.parse(backups) : {};
        } catch (error) {
            console.error('❌ Erro ao carregar backups:', error);
            return {};
        }
    }

    cleanOldBackups() {
        try {
            const backups = this.getAllBackups();
            const backupList = Object.entries(backups);

            // Ordenar por data de criação (mais recente primeiro)
            backupList.sort((a, b) => {
                const timestampA = new Date(a[1].metadata.created).getTime();
                const timestampB = new Date(b[1].metadata.created).getTime();
                return timestampB - timestampA;
            });

            // Manter apenas os últimos N backups
            const backupsToKeep = backupList.slice(0, this.maxBackups);
            const backupsToDelete = backupList.slice(this.maxBackups);

            if (backupsToDelete.length > 0) {
                console.log(`🗑️ Removendo ${backupsToDelete.length} backups antigos...`);
                
                const cleanedBackups = {};
                backupsToKeep.forEach(([id, data]) => {
                    cleanedBackups[id] = data;
                });

                localStorage.setItem(this.backupKey, JSON.stringify(cleanedBackups));
                
                console.log(`✅ Limpeza concluída. Mantidos ${backupsToKeep.length} backups.`);
            }
        } catch (error) {
            console.error('❌ Erro na limpeza de backups:', error);
        }
    }

    async restoreBackup(backupId) {
        try {
            const backups = this.getAllBackups();
            const backupData = backups[backupId];

            if (!backupData) {
                throw new Error('Backup não encontrado');
            }

            console.log('🔄 Restaurando backup:', backupId);

            // Restaurar dados das tabelas
            if (typeof db !== 'undefined' && db.data) {
                // Usar o objeto db se disponível
                db.data.pessoa_fisica = backupData.data.pessoa_fisica || [];
                db.data.pessoa_juridica = backupData.data.pessoa_juridica || [];
                db.data.fotos = backupData.data.fotos || [];
                db.data.relacionamentos = backupData.data.relacionamentos || [];
                db.saveToStorage();
            } else {
                // Fallback: salvar diretamente no localStorage
                const currentData = {
                    pessoa_fisica: backupData.data.pessoa_fisica || [],
                    pessoa_juridica: backupData.data.pessoa_juridica || [],
                    fotos: backupData.data.fotos || [],
                    relacionamentos: backupData.data.relacionamentos || []
                };
                localStorage.setItem('local_database_data', JSON.stringify(currentData));
            }

            // Restaurar configurações (exceto senhas)
            if (backupData.settings.theme) {
                localStorage.setItem('theme', backupData.settings.theme);
            }

            console.log('✅ Backup restaurado com sucesso');
            
            // Recarregar a página para atualizar a interface
            if (confirm('Backup restaurado! Recarregar a página para ver as alterações?')) {
                window.location.reload();
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Erro ao restaurar backup:', error);
            throw error;
        }
    }

    deleteBackup(backupId) {
        try {
            const backups = this.getAllBackups();
            
            if (backups[backupId]) {
                delete backups[backupId];
                localStorage.setItem(this.backupKey, JSON.stringify(backups));
                console.log(`🗑️ Backup removido: ${backupId}`);
                return { success: true };
            } else {
                throw new Error('Backup não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao deletar backup:', error);
            throw error;
        }
    }

    exportBackup(backupId) {
        try {
            const backups = this.getAllBackups();
            const backupData = backups[backupId];

            if (!backupData) {
                throw new Error('Backup não encontrado');
            }

            // Criar arquivo para download
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_sistema_${backupData.metadata.date.replace(/\//g, '-')}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);

            console.log('💾 Backup exportado:', link.download);
            this.showBackupNotification('📥 Backup baixado com sucesso!', 'success');

            return { success: true, filename: link.download };

        } catch (error) {
            console.error('❌ Erro ao exportar backup:', error);
            throw error;
        }
    }

    enableAutoBackup() {
        this.isEnabled = true;
        localStorage.setItem('backup_enabled', 'true');
        this.setupAutomaticBackup();
        console.log('✅ Backup automático habilitado');
        this.showBackupNotification('✅ Backup automático habilitado!', 'success');
    }

    disableAutoBackup() {
        this.isEnabled = false;
        localStorage.setItem('backup_enabled', 'false');
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        console.log('⏸️ Backup automático desabilitado');
        this.showBackupNotification('⏸️ Backup automático desabilitado', 'warning');
    }

    getBackupStatus() {
        const backups = this.getAllBackups();
        const backupCount = Object.keys(backups).length;
        const lastBackup = localStorage.getItem(this.lastBackupKey);
        const today = new Date().toDateString();
        
        return {
            enabled: this.isEnabled,
            count: backupCount,
            lastBackup: lastBackup,
            needsBackupToday: lastBackup !== today,
            maxBackups: this.maxBackups
        };
    }

    showBackupNotification(message, type = 'info') {
        // Tentar usar a função de notificação do sistema se existir
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }

        // Fallback: notificação simples
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Criar instância global do gerenciador de backup
let backupManager;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para o sistema de banco carregar
    setTimeout(() => {
        backupManager = new BackupManager();
        console.log('📦 Sistema de backup automático ativo');
    }, 2000);
});

// Expor funções globais para uso na interface
window.createManualBackup = function() {
    if (backupManager) {
        return backupManager.createBackup(true);
    }
    console.error('❌ Sistema de backup não inicializado');
};

window.getBackupStatus = function() {
    if (backupManager) {
        return backupManager.getBackupStatus();
    }
    return { enabled: false, count: 0 };
};

window.toggleAutoBackup = function() {
    if (backupManager) {
        if (backupManager.isEnabled) {
            backupManager.disableAutoBackup();
        } else {
            backupManager.enableAutoBackup();
        }
        return backupManager.isEnabled;
    }
    return false;
};