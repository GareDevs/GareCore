from rest_framework import serializers
from django.db import transaction
from core.models import Pessoa, PessoaFisica, PessoaJuridica, Endereco
from core.api.serializers.socio import SocioCreateUpdateSerializer


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
    """Serializer para criação/atualização de PJ com suporte a sócios"""
    goa = serializers.CharField(required=False, allow_blank=True, max_length=100)
    
    # Aceitar sócios como lista ou JSON
    socios = serializers.JSONField(required=False, allow_null=True)
    
    # Novos campos do formulário
    situacao = serializers.CharField(required=False, allow_blank=True, max_length=20)
    tipo = serializers.CharField(required=False, allow_blank=True, max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True)
    cep = serializers.CharField(required=False, allow_blank=True, max_length=9)
    telefone1 = serializers.CharField(required=False, allow_blank=True, max_length=15)
    telefone2 = serializers.CharField(required=False, allow_blank=True, max_length=15)
    endereco = serializers.CharField(required=False, allow_blank=True, max_length=255)
    cidade = serializers.CharField(required=False, allow_blank=True, max_length=100)
    situacao_simples_nacional = serializers.CharField(required=False, allow_blank=True, max_length=20)
    data_situacao_cadastral = serializers.DateField(required=False, allow_null=True)
    endereco_filial = serializers.CharField(required=False, allow_blank=True, max_length=255)
    cidade_filial = serializers.CharField(required=False, allow_blank=True, max_length=100)
    
    class Meta:
        model = PessoaJuridica
        fields = [
            'razao_social', 'nome_fantasia', 'cnpj', 'situacao_cadastral',
            'data_abertura', 'data_fechamento', 'porte_empresa', 'capital_social',
            'cnae_principal', 'cnae_descricao', 'mei', 'optante_simples',
            'data_opcao_simples', 'data_exclusao_simples', 'possui_filial',
            'observacoes', 'goa', 'socios', 'situacao', 'tipo', 'email', 'cep',
            'telefone1', 'telefone2', 'endereco', 'cidade', 'situacao_simples_nacional',
            'data_situacao_cadastral', 'endereco_filial', 'cidade_filial'
        ]
    
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
    
    def _processar_socios(self, pj, dados_socios):
        """
        Processa dados de sócios vindos do formulário ou planilha
        Normaliza e cria registros em SocioEmpresa
        
        Args:
            pj: Instância de PessoaJuridica
            dados_socios: Dict ou List de dados de sócios
        """
        if not dados_socios:
            return
        
        # Converter para lista se for dict (vindo do formulário)
        if isinstance(dados_socios, dict):
            lista_socios = list(dados_socios.values())
        else:
            lista_socios = dados_socios if isinstance(dados_socios, list) else []
        
        # Processar cada sócio
        for socio_data in lista_socios:
            if not isinstance(socio_data, dict):
                continue
            
            # Mapear campos do formulário para o esperado
            # Pode vir como 'nome' ou 'nome_socio', 'cpf' ou 'cpf_cnpj', etc
            dados_limpos = {
                'nome_socio': socio_data.get('nome') or socio_data.get('nome_socio', ''),
                'cpf_cnpj': socio_data.get('cpf') or socio_data.get('cnpj') or socio_data.get('cpf_cnpj') or '',
                'data_nascimento': socio_data.get('data_nascimento'),
                'idade': socio_data.get('idade'),
                'nome_mae': socio_data.get('nome_mae', ''),
                'suspeita_obito': socio_data.get('suspeita_obito', False),
                'qualificacao': socio_data.get('qualificacao', ''),
                'participacao_percentual': socio_data.get('participacao_percentual'),
                'data_entrada': socio_data.get('data_entrada'),
            }
            
            # Validar e criar sócio
            try:
                serializer = SocioCreateUpdateSerializer(data=dados_limpos)
                if serializer.is_valid():
                    serializer.create_or_update_socio(pj.pessoa, serializer.validated_data)
                else:
                    # Log erros mas continua processando outros sócios
                    print(f"❌ Erro ao processar sócio {dados_limpos.get('nome_socio')}: {serializer.errors}")
            except Exception as e:
                print(f"❌ Erro ao criar sócio: {str(e)}")
    
    @transaction.atomic
    def create(self, validated_data):
        """Cria pessoa jurídica com sócios"""
        goa = validated_data.pop('goa', '')
        socios_data = validated_data.pop('socios', None)
        
        # Criar pessoa genérica
        pessoa = Pessoa.objects.create(tipo='J', goa=goa or None)
        
        # Criar pessoa jurídica
        pj = PessoaJuridica.objects.create(pessoa=pessoa, **validated_data)
        
        # Processar sócios
        self._processar_socios(pj, socios_data)
        
        return pj
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Atualiza pessoa jurídica com sócios"""
        goa = validated_data.pop('goa', None)
        socios_data = validated_data.pop('socios', None)
        
        # Atualizar GOA
        if goa:
            instance.pessoa.goa = goa
            instance.pessoa.save()
        
        # Atualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Processar sócios
        self._processar_socios(instance, socios_data)
        
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
