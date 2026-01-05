from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from core.models import Foto, Pessoa
from core.api.serializers.foto import (
    FotoDetailSerializer,
    FotoListSerializer,
    FotoCreateUpdateSerializer
)


class FotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Fotos
    
    Endpoints:
    - GET /api/fotos/ - Listar
    - POST /api/fotos/ - Criar (com upload)
    - GET /api/fotos/{id}/ - Detalhe
    - PATCH /api/fotos/{id}/ - Atualizar
    - DELETE /api/fotos/{id}/ - Deletar
    """
    
    queryset = Foto.objects.select_related('pessoa')
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FotoCreateUpdateSerializer
        elif self.action == 'list':
            return FotoListSerializer
        return FotoDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/fotos/
        GET /api/fotos/?pessoa_id=123
        """
        pessoa_id = request.query_params.get('pessoa_id')
        
        if pessoa_id:
            self.queryset = self.queryset.filter(pessoa_id=pessoa_id)
        
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/fotos/
        Multipart form com: pessoa_id, arquivo, descricao
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(
            FotoDetailSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def por_pessoa(self, request):
        """
        GET /api/fotos/por-pessoa/?pessoa_id=123
        Retorna fotos agrupadas por pessoa
        """
        pessoa_id = request.query_params.get('pessoa_id')
        
        if not pessoa_id:
            return Response(
                {'erro': 'pessoa_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pessoa = Pessoa.objects.get(id=pessoa_id)
        except Pessoa.DoesNotExist:
            return Response(
                {'erro': 'Pessoa não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        fotos = Foto.objects.filter(pessoa_id=pessoa_id)
        serializer = FotoListSerializer(fotos, many=True)
        
        return Response({
            'pessoa_id': pessoa_id,
            'total': fotos.count(),
            'fotos': serializer.data
        })
