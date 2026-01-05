from rest_framework import serializers
from core.models import Foto


class FotoDetailSerializer(serializers.ModelSerializer):
    pessoa_id = serializers.IntegerField(source='pessoa.id', read_only=True)
    
    class Meta:
        model = Foto
        fields = ['id', 'pessoa_id', 'url_arquivo', 'nome_arquivo', 'tipo_arquivo',
                  'tamanho_arquivo', 'descricao', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'pessoa_id', 'created_at', 'updated_at']


class FotoListSerializer(serializers.ModelSerializer):
    pessoa_id = serializers.IntegerField(source='pessoa.id', read_only=True)
    
    class Meta:
        model = Foto
        fields = ['id', 'pessoa_id', 'nome_arquivo', 'tipo_arquivo',
                  'tamanho_arquivo', 'descricao', 'status', 'created_at']
        read_only_fields = ['id', 'pessoa_id', 'created_at']


class FotoCreateUpdateSerializer(serializers.ModelSerializer):
    pessoa_id = serializers.IntegerField(write_only=True)
    arquivo = serializers.FileField(write_only=True, required=False)
    
    class Meta:
        model = Foto
        fields = ['pessoa_id', 'arquivo', 'nome_arquivo', 'tipo_arquivo',
                  'tamanho_arquivo', 'descricao', 'status']
    
    def create(self, validated_data):
        pessoa_id = validated_data.pop('pessoa_id')
        arquivo = validated_data.pop('arquivo', None)
        
        from core.models import Pessoa
        pessoa = Pessoa.objects.get(id=pessoa_id)
        
        # Se arquivo foi fornecido, processar upload
        if arquivo:
            # Aqui você pode implementar upload para S3, local, etc.
            validated_data['url_arquivo'] = f'/media/fotos/{arquivo.name}'
            validated_data['nome_arquivo'] = arquivo.name
            validated_data['tipo_arquivo'] = arquivo.content_type
            validated_data['tamanho_arquivo'] = arquivo.size
        
        foto = Foto.objects.create(pessoa=pessoa, **validated_data)
        return foto
