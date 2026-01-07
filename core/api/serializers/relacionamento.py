from rest_framework import serializers
from core.models import Relacionamento, Pessoa


class RelacionamentoDetailSerializer(serializers.ModelSerializer):
    pessoa_origem_nome = serializers.SerializerMethodField()
    pessoa_destino_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = Relacionamento
        fields = ['id', 'pessoa_origem', 'pessoa_origem_nome', 'tipo_origem',
                  'pessoa_destino', 'pessoa_destino_nome', 'tipo_destino',
                  'tipo_relacionamento', 'descricao', 'data_inicio', 'data_fim',
                  'participacao', 'eh_auto', 'fonte_importacao', 'confiabilidade',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_pessoa_origem_nome(self, obj):
        if obj.pessoa_origem.tipo == 'F' and hasattr(obj.pessoa_origem, 'fisica'):
            return obj.pessoa_origem.fisica.nome
        elif obj.pessoa_origem.tipo == 'J' and hasattr(obj.pessoa_origem, 'juridica'):
            return obj.pessoa_origem.juridica.razao_social
        return 'Sem nome'
    
    def get_pessoa_destino_nome(self, obj):
        if obj.pessoa_destino.tipo == 'F' and hasattr(obj.pessoa_destino, 'fisica'):
            return obj.pessoa_destino.fisica.nome
        elif obj.pessoa_destino.tipo == 'J' and hasattr(obj.pessoa_destino, 'juridica'):
            return obj.pessoa_destino.juridica.razao_social
        return 'Sem nome'


class RelacionamentoListSerializer(serializers.ModelSerializer):
    pessoa_origem_nome = serializers.SerializerMethodField()
    pessoa_destino_nome = serializers.SerializerMethodField()
    pessoa_origem_id = serializers.IntegerField(source='pessoa_origem.id', read_only=True)
    pessoa_destino_id = serializers.IntegerField(source='pessoa_destino.id', read_only=True)
    
    class Meta:
        model = Relacionamento
        fields = ['id', 'pessoa_origem', 'pessoa_origem_id', 'pessoa_origem_nome', 'tipo_origem',
                  'pessoa_destino', 'pessoa_destino_id', 'pessoa_destino_nome', 'tipo_destino',
                  'tipo_relacionamento', 'descricao', 'eh_auto', 'confiabilidade', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_pessoa_origem_nome(self, obj):
        if obj.pessoa_origem.tipo == 'F' and hasattr(obj.pessoa_origem, 'fisica'):
            return obj.pessoa_origem.fisica.nome
        elif obj.pessoa_origem.tipo == 'J' and hasattr(obj.pessoa_origem, 'juridica'):
            return obj.pessoa_origem.juridica.razao_social
        return 'Sem nome'
    
    def get_pessoa_destino_nome(self, obj):
        if obj.pessoa_destino.tipo == 'F' and hasattr(obj.pessoa_destino, 'fisica'):
            return obj.pessoa_destino.fisica.nome
        elif obj.pessoa_destino.tipo == 'J' and hasattr(obj.pessoa_destino, 'juridica'):
            return obj.pessoa_destino.juridica.razao_social
        return 'Sem nome'


class RelacionamentoCreateUpdateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Relacionamento
        fields = ['pessoa_origem', 'tipo_origem', 'pessoa_destino', 'tipo_destino',
                  'tipo_relacionamento', 'descricao', 'data_inicio', 'data_fim',
                  'participacao', 'eh_auto', 'fonte_importacao', 'confiabilidade']
