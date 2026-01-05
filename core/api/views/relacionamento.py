from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from core.models import Relacionamento, Pessoa
from core.api.serializers.relacionamento import (
    RelacionamentoDetailSerializer,
    RelacionamentoListSerializer,
    RelacionamentoCreateUpdateSerializer
)


class RelacionamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Relacionamentos
    
    Endpoints:
    - GET /api/relacionamentos/ - Listar
    - POST /api/relacionamentos/ - Criar
    - GET /api/relacionamentos/{id}/ - Detalhe
    - PATCH /api/relacionamentos/{id}/ - Atualizar
    - DELETE /api/relacionamentos/{id}/ - Deletar
    """
    
    queryset = Relacionamento.objects.select_related('pessoa_origem', 'pessoa_destino')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RelacionamentoCreateUpdateSerializer
        elif self.action == 'list':
            return RelacionamentoListSerializer
        return RelacionamentoDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/relacionamentos/
        GET /api/relacionamentos/?pessoa_id=123 - Relacionamentos de uma pessoa
        GET /api/relacionamentos/?tipo=parente - Filtrar por tipo
        """
        pessoa_id = request.query_params.get('pessoa_id')
        tipo = request.query_params.get('tipo')
        
        if pessoa_id:
            self.queryset = self.queryset.filter(
                Q(pessoa_origem_id=pessoa_id) | Q(pessoa_destino_id=pessoa_id)
            )
        
        if tipo:
            self.queryset = self.queryset.filter(tipo_relacionamento__icontains=tipo)
        
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def por_pessoa(self, request):
        """
        GET /api/relacionamentos/por-pessoa/?pessoa_id=123
        Retorna relacionamentos de uma pessoa formatados
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
        
        # Relacionamentos como origem
        origem = Relacionamento.objects.filter(pessoa_origem_id=pessoa_id)
        
        # Relacionamentos como destino
        destino = Relacionamento.objects.filter(pessoa_destino_id=pessoa_id)
        
        todos = list(origem) + list(destino)
        serializer = RelacionamentoListSerializer(todos, many=True)
        
        return Response({
            'pessoa_id': pessoa_id,
            'total': len(todos),
            'como_origem': RelacionamentoListSerializer(origem, many=True).data,
            'como_destino': RelacionamentoListSerializer(destino, many=True).data,
            'todos': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def analisar_rede(self, request):
        """
        POST /api/relacionamentos/analisar-rede/
        Analisa rede de relacionamentos e retorna estatísticas
        """
        pessoa_id = request.data.get('pessoa_id')
        profundidade = request.data.get('profundidade', 2)
        
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
        
        # Busca BFS para encontrar rede de relacionamentos
        from collections import deque
        
        visitados = set([pessoa_id])
        fila = deque([(pessoa_id, 0)])
        rede = []
        
        while fila:
            current_id, depth = fila.popleft()
            
            if depth >= profundidade:
                continue
            
            relacionamentos = Relacionamento.objects.filter(
                Q(pessoa_origem_id=current_id) | Q(pessoa_destino_id=current_id)
            )
            
            for rel in relacionamentos:
                next_id = rel.pessoa_destino_id if rel.pessoa_origem_id == current_id else rel.pessoa_origem_id
                
                if next_id not in visitados:
                    visitados.add(next_id)
                    fila.append((next_id, depth + 1))
                    
                    rede.append({
                        'pessoa_id': next_id,
                        'profundidade': depth + 1,
                        'tipo_relacionamento': rel.tipo_relacionamento,
                        'confianca': rel.confiabilidade
                    })
        
        return Response({
            'pessoa_id': pessoa_id,
            'profundidade': profundidade,
            'total_conexoes': len(rede),
            'total_visitados': len(visitados),
            'rede': rede
        })
