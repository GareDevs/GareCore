from django_filters import rest_framework as filters
from core.models import PessoaFisica, PessoaJuridica


class PessoaFisicaFilter(filters.FilterSet):
    """Filtros avançados para PF"""
    
    nome = filters.CharFilter(field_name='nome', lookup_expr='icontains')
    cpf = filters.CharFilter(field_name='cpf', lookup_expr='exact')
    idade_min = filters.NumberFilter(field_name='idade', lookup_expr='gte')
    idade_max = filters.NumberFilter(field_name='idade', lookup_expr='lte')
    estado_civil = filters.CharFilter(field_name='estado_civil', lookup_expr='iexact')
    criado_apos = filters.DateTimeFilter(field_name='pessoa__created_at', lookup_expr='gte')
    
    class Meta:
        model = PessoaFisica
        fields = ['sexo', 'suspeita_obito', 'possui_veiculos']


class PessoaJuridicaFilter(filters.FilterSet):
    """Filtros avançados para PJ"""
    
    razao_social = filters.CharFilter(field_name='razao_social', lookup_expr='icontains')
    cnpj = filters.CharFilter(field_name='cnpj', lookup_expr='exact')
    porte = filters.CharFilter(field_name='porte_empresa', lookup_expr='iexact')
    situacao = filters.CharFilter(field_name='situacao_cadastral', lookup_expr='iexact')
    
    class Meta:
        model = PessoaJuridica
        fields = ['mei', 'optante_simples', 'possui_filial']
