from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.db import transaction
from difflib import SequenceMatcher

from core.models import Pessoa, PessoaFisica, PessoaJuridica, Relacionamento, Foto
from core.api.serializers.pessoa import (
    PessoaListSerializer,
    PessoaFisicaDetailSerializer,
    PessoaFisicaCreateUpdateSerializer,
    PessoaJuridicaDetailSerializer,
    PessoaJuridicaCreateUpdateSerializer
)
from core.api.utils import validate_goa_format
from core.api.filters import PessoaFisicaFilter, PessoaJuridicaFilter


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
    filterset_class = PessoaFisicaFilter
    search_fields = ['nome', 'cpf', 'telefone1', 'ocupacao']
    ordering_fields = ['nome', 'pessoa__created_at']
    ordering = ['-pessoa__created_at']
    
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
            PessoaFisicaDetailSerializer(serializer.instance).data,
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
        pf = self.get_object()
        pessoa = pf.pessoa
        
        relacionamentos = Relacionamento.objects.filter(
            Q(pessoa_origem_id=pessoa.id) | Q(pessoa_destino_id=pessoa.id)
        )
        
        from core.api.serializers.relacionamento import RelacionamentoListSerializer
        serializer = RelacionamentoListSerializer(relacionamentos, many=True)
        
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
        pf = self.get_object()
        pessoa = pf.pessoa
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
            ).exclude(pessoa_id=pessoa.id)[:10]
            
            for outra in outras:
                sugestoes.append({
                    'tipo': 'parente',
                    'pessoa_id': outra.pessoa.id,
                    'nome': outra.nome,
                    'motivo': f'Mesmo sobrenome: {sobrenome}',
                    'confianca': 60
                })
        
        # 2. Mesmo CNPJ empresa (se tiver campo cnpj_empresa)
        if hasattr(pf, 'cnpj_empresa') and pf.cnpj_empresa:
            outras = PessoaFisica.objects.filter(
                cnpj_empresa=pf.cnpj_empresa
            ).exclude(pessoa_id=pessoa.id)
            
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
            ).exclude(pessoa_id=pessoa.id)
            
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
        if not validation['valido']:
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
        pessoas = PessoaFisica.objects.all()
        if exclude_id:
            pessoas = pessoas.exclude(pessoa_id=exclude_id)
        
        for pessoa_obj in pessoas:
            similarity = SequenceMatcher(None, nome.lower(), pessoa_obj.nome.lower()).ratio() * 100
            
            if similarity >= 85:
                return Response({
                    'existe': False,
                    'similar': True,
                    'pessoa': PessoaFisicaDetailSerializer(pessoa_obj).data,
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
    """ViewSet para Pessoa Jurídica"""
    
    queryset = PessoaJuridica.objects.select_related('pessoa').prefetch_related('pessoa__enderecos')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PessoaJuridicaFilter
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj']
    ordering_fields = ['razao_social', 'pessoa__created_at']
    ordering = ['-pessoa__created_at']
    
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PessoaJuridicaCreateUpdateSerializer
        return PessoaJuridicaDetailSerializer
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """
        GET /api/pessoas-juridicas/count/
        Retorna total de pessoas jurídicas
        """
        total = self.queryset.count()
        return Response({'total': total})
    
    @action(detail=True, methods=['get'])
    def relacionamentos(self, request, pk=None):
        """
        GET /api/pessoas-juridicas/{id}/relacionamentos/
        Retorna relacionamentos da pessoa
        """
        pj = self.get_object()
        pessoa = pj.pessoa
        
        relacionamentos = Relacionamento.objects.filter(
            Q(pessoa_origem_id=pessoa.id) | Q(pessoa_destino_id=pessoa.id)
        )
        
        from core.api.serializers.relacionamento import RelacionamentoListSerializer
        serializer = RelacionamentoListSerializer(relacionamentos, many=True)
        
        return Response({
            'pessoa_id': pessoa.id,
            'total': relacionamentos.count(),
            'relacionamentos': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def fotos(self, request, pk=None):
        """
        GET /api/pessoas-juridicas/{id}/fotos/
        Retorna fotos da pessoa
        """
        pj = self.get_object()
        pessoa = pj.pessoa
        fotos = Foto.objects.filter(pessoa_id=pessoa.id)
        
        from core.api.serializers.foto import FotoListSerializer
        serializer = FotoListSerializer(fotos, many=True)
        
        return Response({
            'pessoa_id': pessoa.id,
            'total': fotos.count(),
            'fotos': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def validate_goa(self, request):
        """
        GET /api/pessoas-juridicas/validate-goa/?goa=GOAINV001&exclude_id=123
        Valida GOA durante cadastro
        """
        goa = request.query_params.get('goa', '').strip().upper()
        exclude_id = request.query_params.get('exclude_id')
        
        # Validar formato
        validation = validate_goa_format(goa)
        if not validation['valido']:
            return Response(validation)
        
        # Verificar existência
        query = Pessoa.objects.filter(goa=goa, tipo='J')
        if exclude_id:
            query = query.exclude(id=exclude_id)
        
        existe = query.exists()
        
        return Response({
            'valido': not existe,
            'existe': existe,
            'goa': goa,
            'mensagem': 'GOA já cadastrado' if existe else 'GOA disponível'
        })
    
    @action(detail=False, methods=['delete'])
    def limpar(self, request):
        """
        DELETE /api/pessoas-juridicas/limpar/
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
