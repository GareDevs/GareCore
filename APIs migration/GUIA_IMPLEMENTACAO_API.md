# Guia Prático de Implementação: database.js → Django API

Documento com **código pronto para produção** com implementações de views, serializers e utilitários.

---

## 1. STRUCTURE DOS ARQUIVOS

```
core/
├── api/
│   ├── __init__.py
│   ├── views/
│   │   ├── __init__.py
│   │   ├── pessoa.py
│   │   ├── foto.py
│   │   ├── relacionamento.py
│   │   ├── analise.py
│   │   └── administracao.py
│   ├── serializers/
│   │   ├── __init__.py
│   │   ├── pessoa.py
│   │   ├── foto.py
│   │   └── relacionamento.py
│   ├── filters.py
│   ├── utils.py
│   └── urls.py
├── models.py
├── views.py
└── urls.py
```

---

## 2. SERIALIZERS COM VALIDAÇÃO

### serializers/pessoa.py

```python
from rest_framework import serializers
from django.db import transaction
from core.models import Pessoa, PessoaFisica, PessoaJuridica, Endereco

class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = ['id', 'tipo_endereco', 'logradouro', 'numero', 'complemento',
                  'bairro', 'cidade', 'uf', 'cep', 'principal']


class PessoaFisicaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado com endereços aninhados"""
    pessoa = serializers.PrimaryKeyRelatedField(read_only=True)
    enderecos = EnderecoSerializer(many=True, read_only=True, source='pessoa.enderecos')
    goa = serializers.CharField(source='pessoa.goa', read_only=True)
    
    class Meta:
        model = PessoaFisica
        fields = '__all__'
        read_only_fields = ['pessoa']


class PessoaFisicaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização"""
    goa = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = PessoaFisica
        exclude = ['pessoa']
    
    def validate_cpf(self, value):
        """Validar CPF"""
        if not value:
            return value
        
        # Remove caracteres especiais
        cpf = value.replace('.', '').replace('-', '')
        
        if len(cpf) != 11 or not cpf.isdigit():
            raise serializers.ValidationError("CPF deve ter 11 dígitos")
        
        # Validação do dígito verificador
        if not self._validar_cpf(cpf):
            raise serializers.ValidationError("CPF inválido")
        
        return value
    
    def _validar_cpf(self, cpf):
        """Algoritmo de validação CPF"""
        # Remove CPFs conhecidos como inválidos
        if cpf == '00000000000' or len(set(cpf)) == 1:
            return False
        
        # Calcula dígitos verificadores
        for i in range(2):
            soma = sum(int(cpf[j]) * (len(cpf) + 1 - j) for j in range(len(cpf) - i - 1))
            digito = (soma * 10) % 11
            if digito == 10:
                digito = 0
            if digito != int(cpf[-i - 1]):
                return False
        
        return True
    
    def validate_nome(self, value):
        """Validar nome"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError("Nome deve ter pelo menos 3 caracteres")
        return value.strip()
    
    @transaction.atomic
    def create(self, validated_data):
        """Cria pessoa física com pessoa genérica"""
        goa = validated_data.pop('goa', '')
        
        # Criar pessoa genérica
        pessoa = Pessoa.objects.create(tipo='F', goa=goa or None)
        
        # Criar pessoa física
        pf = PessoaFisica.objects.create(pessoa=pessoa, **validated_data)
        return pf
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Atualiza pessoa física"""
        goa = validated_data.pop('goa', None)
        
        # Atualizar GOA se fornecido
        if goa:
            instance.pessoa.goa = goa
            instance.pessoa.save()
        
        # Atualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class PessoaJuridicaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para pessoa jurídica"""
    pessoa = serializers.PrimaryKeyRelatedField(read_only=True)
    enderecos = EnderecoSerializer(many=True, read_only=True, source='pessoa.enderecos')
    goa = serializers.CharField(source='pessoa.goa', read_only=True)
    
    class Meta:
        model = PessoaJuridica
        fields = '__all__'
        read_only_fields = ['pessoa']


class PessoaJuridicaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de PJ"""
    goa = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = PessoaJuridica
        exclude = ['pessoa']
    
    def validate_cnpj(self, value):
        """Validar CNPJ"""
        if not value:
            raise serializers.ValidationError("CNPJ é obrigatório")
        
        cnpj = value.replace('.', '').replace('/', '').replace('-', '')
        
        if len(cnpj) != 14 or not cnpj.isdigit():
            raise serializers.ValidationError("CNPJ deve ter 14 dígitos")
        
        if not self._validar_cnpj(cnpj):
            raise serializers.ValidationError("CNPJ inválido")
        
        return value
    
    def _validar_cnpj(self, cnpj):
        """Validação CNPJ"""
        if cnpj == '00000000000000' or len(set(cnpj)) == 1:
            return False
        
        # Cálculo dígito verificador
        for i in range(2):
            multiplicador = 5 if i == 0 else 6
            soma = sum(int(cnpj[j]) * (multiplicador + j) for j in range(8 + i))
            digito = (soma * 10) % 11
            if digito == 10:
                digito = 0
            if digito != int(cnpj[8 + i]):
                return False
        
        return True
    
    def validate_razao_social(self, value):
        """Validar razão social"""
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError("Razão social deve ter pelo menos 3 caracteres")
        return value.strip()
    
    @transaction.atomic
    def create(self, validated_data):
        """Cria pessoa jurídica"""
        goa = validated_data.pop('goa', '')
        pessoa = Pessoa.objects.create(tipo='J', goa=goa or None)
        pj = PessoaJuridica.objects.create(pessoa=pessoa, **validated_data)
        return pj
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Atualiza pessoa jurídica"""
        goa = validated_data.pop('goa', None)
        
        if goa:
            instance.pessoa.goa = goa
            instance.pessoa.save()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class PessoaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    nome = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Pessoa
        fields = ['id', 'tipo', 'tipo_display', 'goa', 'nome', 'created_at']
    
    def get_nome(self, obj):
        if obj.tipo == 'F' and hasattr(obj, 'fisica'):
            return obj.fisica.nome
        elif obj.tipo == 'J' and hasattr(obj, 'juridica'):
            return obj.juridica.razao_social
        return 'Sem nome'
```

---

## 3. VIEWS COM ACTIONS CUSTOMIZADAS

### api/views/pessoa.py

```python
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from core.models import Pessoa, PessoaFisica, PessoaJuridica, Relacionamento, Foto
from core.api.serializers.pessoa import (
    PessoaListSerializer,
    PessoaFisicaDetailSerializer,
    PessoaFisicaCreateUpdateSerializer,
    PessoaJuridicaDetailSerializer,
    PessoaJuridicaCreateUpdateSerializer
)
from core.api.utils import validate_goa_format, calcular_similiaridade


class PessoaFisicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Pessoa Física
    
    Endpoints:
    - GET /api/pessoas-fisicas/ - Listar
    - POST /api/pessoas-fisicas/ - Criar
    - GET /api/pessoas-fisicas/{id}/ - Detalhe
    - PATCH /api/pessoas-fisicas/{id}/ - Atualizar parcial
    - DELETE /api/pessoas-fisicas/{id}/ - Deletar
    """
    
    queryset = PessoaFisica.objects.select_related('pessoa').prefetch_related('pessoa__enderecos')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome', 'cpf', 'telefone1', 'ocupacao']
    filterset_fields = ['sexo', 'estado_civil', 'suspeita_obito']
    ordering_fields = ['nome', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Retorna serializer apropriado baseado na ação"""
        if self.action in ['create', 'update', 'partial_update']:
            return PessoaFisicaCreateUpdateSerializer
        return PessoaFisicaDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """POST /api/pessoas-fisicas/"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """
        GET /api/pessoas-fisicas/count/
        Retorna total de pessoas físicas
        """
        total = self.queryset.count()
        return Response({'total': total})
    
    @action(detail=True, methods=['get'])
    def relacionamentos(self, request, pk=None):
        """
        GET /api/pessoas-fisicas/{id}/relacionamentos/
        Retorna relacionamentos da pessoa
        """
        pessoa = self.get_object().pessoa
        
        relacionamentos = Relacionamento.objects.filter(
            Q(pessoa_origem_id=pessoa.id) | Q(pessoa_destino_id=pessoa.id)
        )
        
        from core.api.serializers.relacionamento import RelacionamentoSerializer
        serializer = RelacionamentoSerializer(relacionamentos, many=True)
        
        return Response({
            'pessoa_id': pessoa.id,
            'total': relacionamentos.count(),
            'relacionamentos': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def fotos(self, request, pk=None):
        """
        GET /api/pessoas-fisicas/{id}/fotos/
        Retorna fotos da pessoa
        """
        pessoa = self.get_object().pessoa
        fotos = Foto.objects.filter(pessoa_id=pessoa.id)
        
        from core.api.serializers.foto import FotoListSerializer
        serializer = FotoListSerializer(fotos, many=True)
        
        return Response({
            'pessoa_id': pessoa.id,
            'total': fotos.count(),
            'fotos': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def analisar_relacionamentos(self, request, pk=None):
        """
        POST /api/pessoas-fisicas/{id}/analisar-relacionamentos/
        Analisa e sugere relacionamentos automáticos
        """
        pf = self.get_object()
        pessoa = pf.pessoa
        
        sugestoes = []
        
        # 1. Mesmo sobrenome
        if pf.nome:
            sobrenome = pf.nome.split()[-1]
            outras = PessoaFisica.objects.filter(
                nome__iendswith=f' {sobrenome}'
            ).exclude(id=pf.id)[:10]
            
            for outra in outras:
                sugestoes.append({
                    'tipo': 'parente',
                    'pessoa_id': outra.pessoa.id,
                    'nome': outra.nome,
                    'motivo': f'Mesmo sobrenome: {sobrenome}',
                    'confianca': 60
                })
        
        # 2. Mesmo CNPJ empresa
        if pf.cnpj_empresa:
            outras = PessoaFisica.objects.filter(
                cnpj_empresa=pf.cnpj_empresa
            ).exclude(id=pf.id)
            
            for outra in outras:
                sugestoes.append({
                    'tipo': 'empresarial',
                    'pessoa_id': outra.pessoa.id,
                    'nome': outra.nome,
                    'motivo': f'Mesmo CNPJ: {pf.cnpj_empresa}',
                    'confianca': 90
                })
        
        # 3. Mesmo telefone
        if pf.telefone1:
            outras = PessoaFisica.objects.filter(
                Q(telefone1=pf.telefone1) | Q(telefone2=pf.telefone1)
            ).exclude(id=pf.id)
            
            for outra in outras:
                sugestoes.append({
                    'tipo': 'telefone',
                    'pessoa_id': outra.pessoa.id,
                    'nome': outra.nome,
                    'motivo': f'Mesmo telefone: {pf.telefone1}',
                    'confianca': 80
                })
        
        return Response({
            'pessoa_id': pessoa.id,
            'total_sugestoes': len(sugestoes),
            'sugestoes': sugestoes
        })
    
    @action(detail=False, methods=['get'])
    def validate_goa(self, request):
        """
        GET /api/pessoas-fisicas/validate-goa/?goa=GOAINV001&exclude_id=123
        Valida GOA durante cadastro
        """
        goa = request.query_params.get('goa', '').strip().upper()
        exclude_id = request.query_params.get('exclude_id')
        
        # Validar formato
        validation = validate_goa_format(goa)
        if not validation['valid']:
            return Response(validation)
        
        # Verificar existência
        query = Pessoa.objects.filter(goa=goa, tipo='F')
        if exclude_id:
            query = query.exclude(id=exclude_id)
        
        existe = query.exists()
        
        return Response({
            'valido': not existe,
            'existe': existe,
            'goa': goa,
            'mensagem': 'GOA já cadastrado' if existe else 'GOA disponível'
        })
    
    @action(detail=False, methods=['get'])
    def validate_name(self, request):
        """
        GET /api/pessoas-fisicas/validate-name/?nome=João&exclude_id=123
        Valida duplicidade de nome
        """
        nome = request.query_params.get('nome', '').strip()
        exclude_id = request.query_params.get('exclude_id')
        
        if not nome or len(nome) < 3:
            return Response({'existe': False, 'similar': False})
        
        # Busca exata
        query = PessoaFisica.objects.filter(nome__iexact=nome)
        if exclude_id:
            query = query.exclude(pessoa_id=exclude_id)
        
        exato = query.first()
        if exato:
            return Response({
                'existe': True,
                'exato': True,
                'pessoa': PessoaFisicaDetailSerializer(exato).data,
                'similaridade': 100
            })
        
        # Busca similar
        from difflib import SequenceMatcher
        pessoas = PessoaFisica.objects.all()
        if exclude_id:
            pessoas = pessoas.exclude(pessoa_id=exclude_id)
        
        for pessoa in pessoas:
            similarity = SequenceMatcher(None, nome.lower(), pessoa.nome.lower()).ratio() * 100
            
            if similarity >= 85:
                return Response({
                    'existe': False,
                    'similar': True,
                    'pessoa': PessoaFisicaDetailSerializer(pessoa).data,
                    'similaridade': round(similarity, 2)
                })
        
        return Response({
            'existe': False,
            'similar': False,
            'disponivel': True
        })
    
    @action(detail=False, methods=['delete'])
    def limpar(self, request):
        """
        DELETE /api/pessoas-fisicas/limpar/
        Deleta TODOS os registros (confirmação necessária)
        """
        if not request.data.get('confirm'):
            return Response(
                {'erro': 'Confirmação necessária (confirm=true)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quantidade = self.queryset.count()
        self.queryset.delete()
        
        return Response({
            'sucesso': True,
            'registros_deletados': quantidade
        })


class PessoaJuridicaViewSet(viewsets.ModelViewSet):
    """ViewSet para Pessoa Jurídica - similar à PessoaFisica"""
    
    queryset = PessoaJuridica.objects.select_related('pessoa')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj']
    filterset_fields = ['mei', 'optante_simples', 'situacao_cadastral']
    ordering_fields = ['razao_social', 'created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PessoaJuridicaCreateUpdateSerializer
        return PessoaJuridicaDetailSerializer
    
    # Implementar actions similares à PessoaFisicaViewSet
    # ...
```

---

## 4. ANÁLISE ASSÍNCRONA COM CELERY

### api/tasks.py

```python
from celery import shared_task
from django.db.models import Q
from core.models import Pessoa, PessoaFisica, PessoaJuridica, Relacionamento
from datetime import datetime


@shared_task(bind=True)
def analisar_todos_relacionamentos(self):
    """
    Tarefa assíncrona para análise completa de relacionamentos
    Atualiza progresso com Celery signals
    """
    try:
        pessoas = Pessoa.objects.all()
        total = pessoas.count()
        relacionamentos_encontrados = 0
        
        for idx, pessoa in enumerate(pessoas):
            # Atualizar progresso
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': idx + 1,
                    'total': total,
                    'status': f'Analisando {pessoa} ...'
                }
            )
            
            if pessoa.tipo == 'F':
                pf = pessoa.fisica
                
                # 1. Análise familiar
                if pf.nome:
                    sobrenome = pf.nome.split()[-1]
                    outras = PessoaFisica.objects.filter(
                        nome__iendswith=f' {sobrenome}'
                    ).exclude(id=pf.id)
                    
                    for outra in outras:
                        rel, created = Relacionamento.objects.get_or_create(
                            pessoa_origem_id=pessoa.id,
                            pessoa_destino_id=outra.pessoa.id,
                            defaults={
                                'tipo_relacionamento': 'parente',
                                'confianca': 60,
                                'automatico': True,
                                'descricao': f'Mesmo sobrenome: {sobrenome}'
                            }
                        )
                        if created:
                            relacionamentos_encontrados += 1
        
        return {
            'status': 'success',
            'total_analisados': total,
            'relacionamentos_encontrados': relacionamentos_encontrados,
            'finalizacao': datetime.now().isoformat()
        }
    
    except Exception as e:
        self.update_state(
            state='FAILURE',
            meta={'erro': str(e)}
        )
        raise


@shared_task
def exportar_dados_background():
    """Exporta dados em background para download"""
    from django.core.files.base import ContentFile
    import json
    
    pessoas_f = PessoaFisica.objects.all()
    pessoas_j = PessoaJuridica.objects.all()
    
    dados = {
        'pessoa_fisica': list(pessoas_f.values()),
        'pessoa_juridica': list(pessoas_j.values()),
        'exported_at': datetime.now().isoformat()
    }
    
    arquivo = ContentFile(
        json.dumps(dados, indent=2, default=str).encode('utf-8')
    )
    
    return f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
```

---

## 5. FILTERS AVANÇADOS

### api/filters.py

```python
from django_filters import rest_framework as filters
from core.models import Pessoa, PessoaFisica, PessoaJuridica


class PessoaFisicaFilter(filters.FilterSet):
    """Filtros avançados para PF"""
    
    nome = filters.CharFilter(field_name='nome', lookup_expr='icontains')
    cpf = filters.CharFilter(field_name='cpf', lookup_expr='exact')
    idade_min = filters.NumberFilter(field_name='idade', lookup_expr='gte')
    idade_max = filters.NumberFilter(field_name='idade', lookup_expr='lte')
    estado_civil = filters.CharFilter(field_name='estado_civil', lookup_expr='iexact')
    criado_apos = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    
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
```

---

## 6. UTILITIES E VALIDADORES

### api/utils.py

```python
from django.core.exceptions import ValidationError
import re
from difflib import SequenceMatcher


def validate_goa_format(goa: str) -> dict:
    """
    Valida formato GOA
    Retorna: {'valid': bool, 'message': str, 'prefixo': str, 'numero': str}
    """
    if not goa:
        return {'valid': True, 'message': ''}
    
    goa = goa.strip().upper()
    
    if len(goa) < 8:
        return {
            'valid': False,
            'message': 'GOA deve ter pelo menos 8 caracteres'
        }
    
    prefixos = {
        'GOAINV': 'Investigação',
        'GOADEN': 'Denúncia',
        'GOACIV': 'Processo Civil',
        'GOACRI': 'Processo Criminal',
        'GOAADM': 'Administrativo',
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
    }
    
    prefixo = goa[:6]
    numero = goa[6:]
    
    if prefixo not in prefixos:
        return {
            'valid': False,
            'message': f'Prefixo inválido. Use: {", ".join(sorted(prefixos.keys()))}'
        }
    
    if not numero.isdigit():
        return {
            'valid': False,
            'message': 'Número GOA deve conter apenas dígitos'
        }
    
    if int(numero) < 1:
        return {
            'valid': False,
            'message': 'Número GOA deve ser positivo'
        }
    
    return {
        'valid': True,
        'message': f'GOA válido: {prefixos[prefixo]} #{numero}',
        'prefixo': prefixo,
        'numero': numero,
        'descricao': prefixos[prefixo]
    }


def calcular_similaridade(str1: str, str2: str) -> float:
    """Calcula similaridade entre duas strings (0-100)"""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio() * 100


def limpar_telefone(telefone: str) -> str:
    """Remove caracteres especiais do telefone"""
    return re.sub(r'\D', '', telefone)


def formatar_cpf(cpf: str) -> str:
    """Formata CPF como 000.000.000-00"""
    cpf = re.sub(r'\D', '', cpf)
    if len(cpf) == 11:
        return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:11]}"
    return cpf


def formatar_cnpj(cnpj: str) -> str:
    """Formata CNPJ como 00.000.000/0000-00"""
    cnpj = re.sub(r'\D', '', cnpj)
    if len(cnpj) == 14:
        return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:14]}"
    return cnpj


def buscarf_pessoas_por_rede(pessoa_id: int, profundidade: int = 2) -> list:
    """
    Busca pessoas relacionadas em profundidade (BFS)
    """
    from core.models import Pessoa, Relacionamento
    from collections import deque
    
    visitados = set([pessoa_id])
    fila = deque([(pessoa_id, 0)])  # (pessoa_id, profundidade_atual)
    resultados = []
    
    while fila:
        current_id, depth = fila.popleft()
        
        if depth >= profundidade:
            continue
        
        # Encontrar relacionamentos
        relacionamentos = Relacionamento.objects.filter(
            pessoa_origem_id=current_id
        ) | Relacionamento.objects.filter(
            pessoa_destino_id=current_id
        )
        
        for rel in relacionamentos:
            next_id = rel.pessoa_destino_id if rel.pessoa_origem_id == current_id else rel.pessoa_origem_id
            
            if next_id not in visitados:
                visitados.add(next_id)
                fila.append((next_id, depth + 1))
                
                pessoa = Pessoa.objects.get(id=next_id)
                resultados.append({
                    'id': pessoa.id,
                    'profundidade': depth + 1,
                    'tipo_relacionamento': rel.tipo_relacionamento,
                    'confianca': rel.confianca
                })
    
    return resultados
```

---

## 7. URL CONFIGURATION

### api/urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.pessoa import PessoaFisicaViewSet, PessoaJuridicaViewSet
from .views.foto import FotoViewSet
from .views.relacionamento import RelacionamentoViewSet
from .views.analise import AnaliseViewSet
from .views.administracao import AdministracaoViewSet

router = DefaultRouter()
router.register(r'pessoas-fisicas', PessoaFisicaViewSet, basename='pessoa-fisica')
router.register(r'pessoas-juridicas', PessoaJuridicaViewSet, basename='pessoa-juridica')
router.register(r'fotos', FotoViewSet, basename='foto')
router.register(r'relacionamentos', RelacionamentoViewSet, basename='relacionamento')

urlpatterns = [
    path('', include(router.urls)),
    path('analise/', AnaliseViewSet.as_view(), name='analise'),
    path('administracao/', AdministracaoViewSet.as_view(), name='administracao'),
]
```

---

## 8. CONSUMO NO FRONTEND

### api-client.js (Modernizado)

```javascript
class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('access_token');
    }
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }
    
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
    
    async request(method, endpoint, data = null) {
        try {
            const options = {
                method,
                headers: this.getHeaders()
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error: ${endpoint}`, error);
            throw error;
        }
    }
    
    // CRUD básico
    async get(endpoint) {
        return this.request('GET', endpoint);
    }
    
    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }
    
    async patch(endpoint, data) {
        return this.request('PATCH', endpoint, data);
    }
    
    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
    
    // Pessoa Física
    async listarPessoasFisicas(page = 1, search = '') {
        const params = new URLSearchParams({ page, search });
        return this.get(`/pessoas-fisicas/?${params}`);
    }
    
    async obterPessoaFisica(id) {
        return this.get(`/pessoas-fisicas/${id}/`);
    }
    
    async criarPessoaFisica(dados) {
        return this.post('/pessoas-fisicas/', dados);
    }
    
    async atualizarPessoaFisica(id, dados) {
        return this.patch(`/pessoas-fisicas/${id}/`, dados);
    }
    
    async deletarPessoaFisica(id) {
        return this.delete(`/pessoas-fisicas/${id}/`);
    }
    
    async analisarRelacionamentos(id) {
        return this.post(`/pessoas-fisicas/${id}/analisar-relacionamentos/`, {});
    }
    
    async validarGoa(goa, excludeId = null) {
        const params = new URLSearchParams({ goa });
        if (excludeId) params.append('exclude_id', excludeId);
        return this.get(`/pessoas-fisicas/validate-goa/?${params}`);
    }
    
    // Fotos
    async listarFotos(pessoaId) {
        return this.get(`/fotos/?pessoa_id=${pessoaId}`);
    }
    
    async uploadFoto(pessoaId, arquivo, descricao) {
        const formData = new FormData();
        formData.append('pessoa_id', pessoaId);
        formData.append('arquivo', arquivo);
        formData.append('descricao', descricao);
        
        // Usar fetch direto para FormData
        const response = await fetch(`${this.baseURL}/fotos/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
        
        return response.json();
    }
}

// Instância global
const api = new ApiClient('/api');

// Uso nos arquivos JS
async function carregarPessoasFisicas() {
    try {
        const data = await api.listarPessoasFisicas(1, '');
        console.log('Pessoas:', data);
    } catch (error) {
        console.error('Erro ao carregar:', error);
    }
}
```

---

## 9. TESTES UNITÁRIOS

### tests/test_api.py

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Pessoa, PessoaFisica, PessoaJuridica
from django.contrib.auth.models import User


class PessoaFisicaAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test@test.com', password='123456')
        self.client.force_authenticate(user=self.user)
        
        # Criar pessoa teste
        self.pessoa = Pessoa.objects.create(tipo='F', goa='GOAINV001')
        self.pf = PessoaFisica.objects.create(
            pessoa=self.pessoa,
            nome='João Silva',
            cpf='12345678900'
        )
    
    def test_listar_pessoas(self):
        """Testa listagem de pessoas físicas"""
        response = self.client.get('/api/pessoas-fisicas/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_criar_pessoa(self):
        """Testa criação de pessoa"""
        data = {
            'nome': 'Maria Silva',
            'cpf': '98765432100',
            'goa': 'GOAINV002'
        }
        
        response = self.client.post('/api/pessoas-fisicas/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], 'Maria Silva')
    
    def test_validar_goa(self):
        """Testa validação de GOA"""
        response = self.client.get('/api/pessoas-fisicas/validate-goa/?goa=GOAINV001')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['existe'])
    
    def test_validar_goa_invalido(self):
        """Testa GOA com formato inválido"""
        response = self.client.get('/api/pessoas-fisicas/validate-goa/?goa=INVALID')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['valido'])
```

---

## 10. MIGRATION CHECKLIST

- [ ] Criar migrations para novos models (Relacionamento, Foto)
- [ ] Implementar ViewSets base
- [ ] Criar Serializers com validação
- [ ] Configurar URLs e routers
- [ ] Implementar SearchFilter e DjangoFilterBackend
- [ ] Adicionar validadores customizados
- [ ] Criar testes unitários
- [ ] Configurar autenticação JWT
- [ ] Implementar rate limiting
- [ ] Documentar API com Swagger/OpenAPI
- [ ] Testar endpoints com Postman/Insomnia
- [ ] Migrar frontend para consumir API
- [ ] Remover database.js progressivamente
- [ ] Implementar análise assíncrona com Celery

