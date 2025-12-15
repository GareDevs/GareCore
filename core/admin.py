from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    Pessoa, PessoaFisica, PessoaJuridica, Endereco,
    ContatoEmpresa, SocioEmpresa, Relacionamento, Foto, Usuario
)

"""
admin.site.register(Pessoa)
admin.site.register(PessoaFisica)
admin.site.register(PessoaJuridica)
admin.site.register(Endereco)
admin.site.register(ContatoEmpresa)
admin.site.register(SocioEmpresa)
"""

# ========================
# Inlines
# ========================

class EnderecoInline(admin.TabularInline):
    model = Endereco
    extra = 1
    fields = ('tipo_endereco', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'principal')
    readonly_fields = ('created_at', 'updated_at')


class ContatoEmpresaInline(admin.TabularInline):
    model = ContatoEmpresa
    extra = 1
    fields = ('tipo', 'valor', 'principal')


class SocioEmpresaInline(admin.TabularInline):
    model = SocioEmpresa
    extra = 1
    fk_name = 'empresa'
    fields = ('nome_socio', 'cpf_cnpj', 'participacao_percentual', 'qualificacao', 'data_entrada', 'suspeita_obito')
    autocomplete_fields = ['pessoa']


class FotoInline(admin.TabularInline):
    model = Foto
    extra = 1
    fields = ('nome_arquivo', 'url_arquivo', 'descricao', 'status')
    readonly_fields = ('tamanho_arquivo',)


class RelacionamentoOrigemInline(admin.TabularInline):
    model = Relacionamento
    fk_name = 'pessoa_origem'
    extra = 0
    fields = ('pessoa_destino', 'tipo_destino', 'tipo_relacionamento', 'participacao', 'confiabilidade')
    autocomplete_fields = ['pessoa_destino']
    verbose_name = "Relacionamento de saída"
    verbose_name_plural = "Relacionamentos de saída"


class RelacionamentoDestinoInline(admin.TabularInline):
    model = Relacionamento
    fk_name = 'pessoa_destino'
    extra = 0
    fields = ('pessoa_origem', 'tipo_origem', 'tipo_relacionamento', 'participacao', 'confiabilidade')
    autocomplete_fields = ['pessoa_origem']
    verbose_name = "Relacionamento de entrada"
    verbose_name_plural = "Relacionamentos de entrada"


# ========================
# Admin Classes
# ========================
@admin.register(Pessoa)
class PessoaAdmin(admin.ModelAdmin):
    list_display = ('id', 'goa', 'tipo_display', 'nome_ou_razao', 'created_at')
    list_filter = ('tipo', 'created_at', 'updated_at')
    search_fields = ('goa', 'fisica__nome', 'fisica__cpf', 'juridica__razao_social', 'juridica__cnpj')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [EnderecoInline, ContatoEmpresaInline, FotoInline, SocioEmpresaInline,
               RelacionamentoOrigemInline, RelacionamentoDestinoInline]

    fieldsets = (
        ('Informações Básicas', {
            'fields': ('tipo', 'goa')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def tipo_display(self, obj):
        return obj.get_tipo_display()
    tipo_display.short_description = 'Tipo'

    def nome_ou_razao(self, obj):
        if obj.tipo == 'F' and hasattr(obj, 'fisica'):
            return obj.fisica.nome
        elif obj.tipo == 'J' and hasattr(obj, 'juridica'):
            return obj.juridica.razao_social
        return "-"
    nome_ou_razao.short_description = 'Nome / Razão Social'

@admin.register(PessoaFisica)
class PessoaFisicaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cpf', 'pessoa_goa', 'idade', 'suspeita_obito', 'possui_veiculos')
    list_filter = ('sexo', 'estado_civil', 'suspeita_obito', 'possui_veiculos', 'pessoa__created_at')
    search_fields = ('nome', 'cpf', 'rg', 'nome_mae', 'pessoa__goa')
    autocomplete_fields = ['pessoa']
    readonly_fields = ('idade',)

    fieldsets = (
        ('Dados Pessoais', {
            'fields': ('pessoa', 'nome', 'cpf', 'rg', 'nascimento', 'nome_mae', 'nome_pai',
                       'naturalidade', 'sexo', 'estado_civil', 'idade')
        }),
        ('Contato', {
            'fields': ('telefone1', 'telefone2', 'ocupacao', 'vinculo')
        }),
        ('Veículo', {
            'fields': ('possui_veiculos', 'placa', 'marca_modelo', 'ano_veiculo', 'cor_veiculo'),
        }),
        ('Outros', {
            'fields': ('qualificacao_socio', 'suspeita_obito', 'observacoes'),
        }),
    )

    def pessoa_goa(self, obj):
        return obj.pessoa.goa or "-"
    pessoa_goa.short_description = 'GOA'

@admin.register(PessoaJuridica)
class PessoaJuridicaAdmin(admin.ModelAdmin):
    list_display = ('razao_social', 'cnpj', 'pessoa_goa', 'situacao_cadastral', 'mei', 'optante_simples')
    list_filter = ('situacao_cadastral', 'mei', 'optante_simples', 'porte_empresa', 'possui_filial')
    search_fields = ('razao_social', 'nome_fantasia', 'cnpj', 'pessoa__goa')
    autocomplete_fields = ['pessoa']

    fieldsets = (
        ('Dados Empresariais', {
            'fields': ('pessoa', 'razao_social', 'nome_fantasia', 'cnpj')
        }),
        ('Situação', {
            'fields': ('situacao_cadastral', 'data_abertura', 'data_fechamento', 'mei',
                       'optante_simples', 'data_opcao_simples', 'data_exclusao_simples')
        }),
        ('Estrutura', {
            'fields': ('porte_empresa', 'capital_social', 'cnae_principal', 'cnae_descricao', 'possui_filial')
        }),
        ('Observações', {
            'fields': ('observacoes',)
        }),
    )

    def pessoa_goa(self, obj):
        return obj.pessoa.goa or "-"
    pessoa_goa.short_description = 'GOA'


@admin.register(Endereco)
class EnderecoAdmin(admin.ModelAdmin):
    list_display = ('pessoa_link', 'tipo_endereco', 'cidade', 'uf', 'cep', 'principal')
    list_filter = ('uf', 'cidade', 'tipo_endereco', 'principal')
    search_fields = ('logradouro', 'bairro', 'cidade', 'cep', 'pessoa__goa')
    autocomplete_fields = ['pessoa']

    
    def pessoa_link(self, obj):
        if obj.pessoa_id:
            url = f"/admin/core/pessoa/{obj.pessoa_id}/change/"
            nome = str(obj.pessoa)
            return format_html('<a href="{}">{}</a>', url, nome)
        return "-"
    pessoa_link.short_description = 'Pessoa'
    pessoa_link.admin_order_field = 'pessoa__goa'
    

@admin.register(ContatoEmpresa)
class ContatoEmpresaAdmin(admin.ModelAdmin):
    list_display = ('empresa_link', 'tipo', 'valor', 'principal')
    list_filter = ('tipo', 'principal')
    search_fields = ('valor', 'empresa__goa')
    autocomplete_fields = ['empresa']

    def empresa_link(self, obj):
        if obj.empresa_id:
            url = f"/admin/core/pessoa/{obj.empresa_id}/change/"
            return format_html('<a href="{}">{}</a>', url, obj.empresa)
        return "-"
    empresa_link.short_description = 'Empresa'

@admin.register(SocioEmpresa)
class SocioEmpresaAdmin(admin.ModelAdmin):
    list_display = ('nome_socio', 'cpf_cnpj', 'empresa_link', 'participacao_percentual', 'suspeita_obito')
    list_filter = ('suspeita_obito', 'qualificacao')
    search_fields = ('nome_socio', 'cpf_cnpj', 'empresa__goa')
    autocomplete_fields = ['empresa', 'pessoa']

    def empresa_link(self, obj):
        if obj.empresa_id:
            url = f"/admin/core/pessoa/{obj.empresa_id}/change/"
            return format_html('<a href="{}">{}</a>', url, obj.empresa)
        return "-"
    empresa_link.short_description = 'Empresa'

@admin.register(Relacionamento)
class RelacionamentoAdmin(admin.ModelAdmin):
    list_display = ('pessoa_origem_link', 'tipo_relacionamento', 'pessoa_destino_link', 'participacao', 'confiabilidade')
    list_filter = ('tipo_relacionamento', 'confiabilidade', 'eh_auto')
    search_fields = ('pessoa_origem__goa', 'pessoa_destino__goa', 'tipo_relacionamento')
    autocomplete_fields = ['pessoa_origem', 'pessoa_destino']

    def pessoa_origem_link(self, obj):
        url = f"/admin/core/pessoa/{obj.pessoa_origem_id}/change/"
        return format_html('<a href="{}">{}</a>', url, obj.pessoa_origem)
    pessoa_origem_link.short_description = 'Origem'

    def pessoa_destino_link(self, obj):
        url = f"/admin/core/pessoa/{obj.pessoa_destino_id}/change/"
        return format_html('<a href="{}">{}</a>', url, obj.pessoa_destino)
    pessoa_destino_link.short_description = 'Destino'

@admin.register(Foto)
class FotoAdmin(admin.ModelAdmin):
    list_display = ('pessoa_link', 'nome_arquivo', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('nome_arquivo', 'descricao', 'pessoa__goa')
    autocomplete_fields = ['pessoa']

    def pessoa_link(self, obj):
        if obj.pessoa_id:
            url = f"/admin/core/pessoa/{obj.pessoa_id}/change/"
            return format_html('<a href="{}">{}</a>', url, obj.pessoa)
        return "-"
    pessoa_link.short_description = 'Pessoa'

# ========================
# Usuario Custom Admin
# ========================
@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ('email', 'nome', 'role', 'ativo', 'criado_em')
    list_filter = ('role', 'ativo', 'is_staff', 'is_superuser')
    search_fields = ('email', 'nome')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('nome',)}),
        ('Permissões', {'fields': ('role', 'ativo', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas', {'fields': ('criado_em', 'atualizado_em')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nome', 'password1', 'password2', 'role', 'ativo'),
        }),
    )

    readonly_fields = ('criado_em', 'atualizado_em')




