from rest_framework import serializers
from django.db import transaction
from core.models import Pessoa, PessoaFisica, PessoaJuridica, Endereco


class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = ['id', 'tipo_endereco', 'logradouro', 'numero', 'complemento',
                  'bairro', 'cidade', 'uf', 'cep', 'principal', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PessoaFisicaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado com endereços aninhados"""
    pessoa_id = serializers.IntegerField(source='pessoa.id', read_only=True)
    goa = serializers.CharField(source='pessoa.goa', read_only=True)
    enderecos = EnderecoSerializer(many=True, read_only=True, source='pessoa.enderecos')
    created_at = serializers.DateTimeField(source='pessoa.created_at', read_only=True)
    updated_at = serializers.DateTimeField(source='pessoa.updated_at', read_only=True)
    
    class Meta:
        model = PessoaFisica
        fields = ['pessoa_id', 'nome', 'cpf', 'rg', 'nascimento', 'nome_mae', 'nome_pai',
                  'naturalidade', 'sexo', 'estado_civil', 'telefone1', 'telefone2', 'ocupacao',
                  'vinculo', 'observacoes', 'possui_veiculos', 'placa', 'marca_modelo',
                  'ano_veiculo', 'cor_veiculo', 'idade', 'suspeita_obito', 'qualificacao_socio',
                  'goa', 'enderecos', 'created_at', 'updated_at']
        read_only_fields = ['pessoa_id', 'goa', 'created_at', 'updated_at']


class PessoaFisicaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização"""
    goa = serializers.CharField(required=False, allow_blank=True, max_length=100)
    
    class Meta:
        model = PessoaFisica
        fields = ['nome', 'cpf', 'rg', 'nascimento', 'nome_mae', 'nome_pai',
                  'naturalidade', 'sexo', 'estado_civil', 'telefone1', 'telefone2', 'ocupacao',
                  'vinculo', 'observacoes', 'possui_veiculos', 'placa', 'marca_modelo',
                  'ano_veiculo', 'cor_veiculo', 'idade', 'suspeita_obito', 'qualificacao_socio', 'goa']
    
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
    pessoa_id = serializers.IntegerField(source='pessoa.id', read_only=True)
    goa = serializers.CharField(source='pessoa.goa', read_only=True)
    enderecos = EnderecoSerializer(many=True, read_only=True, source='pessoa.enderecos')
    created_at = serializers.DateTimeField(source='pessoa.created_at', read_only=True)
    updated_at = serializers.DateTimeField(source='pessoa.updated_at', read_only=True)
    
    class Meta:
        model = PessoaJuridica
        fields = ['pessoa_id', 'razao_social', 'nome_fantasia', 'cnpj', 'situacao_cadastral',
                  'data_abertura', 'data_fechamento', 'porte_empresa', 'capital_social',
                  'cnae_principal', 'cnae_descricao', 'mei', 'optante_simples',
                  'data_opcao_simples', 'data_exclusao_simples', 'possui_filial',
                  'observacoes', 'goa', 'enderecos', 'created_at', 'updated_at']
        read_only_fields = ['pessoa_id', 'goa', 'created_at', 'updated_at']


class PessoaJuridicaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação/atualização de PJ"""
    goa = serializers.CharField(required=False, allow_blank=True, max_length=100)
    
    class Meta:
        model = PessoaJuridica
        fields = ['razao_social', 'nome_fantasia', 'cnpj', 'situacao_cadastral',
                  'data_abertura', 'data_fechamento', 'porte_empresa', 'capital_social',
                  'cnae_principal', 'cnae_descricao', 'mei', 'optante_simples',
                  'data_opcao_simples', 'data_exclusao_simples', 'possui_filial',
                  'observacoes', 'goa']
    
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
        fields = ['id', 'tipo', 'tipo_display', 'goa', 'nome', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_nome(self, obj):
        if obj.tipo == 'F' and hasattr(obj, 'fisica'):
            return obj.fisica.nome
        elif obj.tipo == 'J' and hasattr(obj, 'juridica'):
            return obj.juridica.razao_social
        return 'Sem nome'
