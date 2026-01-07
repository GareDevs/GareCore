"""
Serializers para SocioEmpresa
Trata dados de sócios vindos de formulário e planilha
"""

from rest_framework import serializers
from core.models import SocioEmpresa, PessoaFisica, Pessoa, Relacionamento
from datetime import datetime, date
from decimal import Decimal


class SocioSerializer(serializers.ModelSerializer):
    """Serializer para dados de sócios (leitura)"""
    
    class Meta:
        model = SocioEmpresa
        fields = [
            'id', 'nome_socio', 'cpf_cnpj', 'data_nascimento', 'idade',
            'nome_mae', 'suspeita_obito', 'qualificacao', 'participacao_percentual',
            'data_entrada', 'pessoa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pessoa', 'created_at', 'updated_at']


class SocioCreateUpdateSerializer(serializers.Serializer):
    """
    Serializer para criação/atualização de sócios
    Normaliza dados vindos de formulário e planilha
    
    Aceita campos variados e cria registros consistentes
    """
    nome_socio = serializers.CharField(required=True, max_length=300)
    cpf_cnpj = serializers.CharField(required=False, allow_blank=True, max_length=14)
    data_nascimento = serializers.DateField(required=False, allow_null=True)
    idade = serializers.IntegerField(required=False, allow_null=True)
    nome_mae = serializers.CharField(required=False, allow_blank=True, max_length=300)
    suspeita_obito = serializers.BooleanField(required=False, default=False)
    qualificacao = serializers.CharField(required=False, allow_blank=True, max_length=150)
    participacao_percentual = serializers.DecimalField(
        required=False, allow_null=True, max_digits=6, decimal_places=3
    )
    data_entrada = serializers.DateField(required=False, allow_null=True)
    
    def validate_cpf_cnpj(self, value):
        """Validar e normalizar CPF/CNPJ"""
        if not value:
            return None
        
        # Remove caracteres especiais
        limpo = value.replace('.', '').replace('-', '').replace('/', '')
        
        # Validar se é CPF ou CNPJ
        if len(limpo) == 11:
            # CPF
            if not self._validar_cpf(limpo):
                raise serializers.ValidationError("CPF inválido")
        elif len(limpo) == 14:
            # CNPJ
            if not self._validar_cnpj(limpo):
                raise serializers.ValidationError("CNPJ inválido")
        else:
            if len(limpo) > 0:
                raise serializers.ValidationError("CPF/CNPJ deve ter 11 ou 14 dígitos")
            return None
        
        return limpo
    
    def _validar_cpf(self, cpf):
        """Validar CPF com algoritmo matemático"""
        if cpf == '00000000000' or len(set(cpf)) == 1:
            return False
        
        try:
            for i in range(2):
                soma = sum(int(cpf[j]) * (len(cpf) + 1 - j) for j in range(len(cpf) - i - 1))
                digito = (soma * 10) % 11
                if digito == 10:
                    digito = 0
                if digito != int(cpf[-i - 1]):
                    return False
            return True
        except (ValueError, IndexError):
            return False
    
    def _validar_cnpj(self, cnpj):
        """Validar CNPJ com algoritmo matemático"""
        if cnpj == '00000000000000' or len(set(cnpj)) == 1:
            return False
        
        try:
            for i in range(2):
                multiplicador = 5 if i == 0 else 6
                soma = sum(int(cnpj[j]) * (multiplicador + j) for j in range(8 + i))
                digito = (soma * 10) % 11
                if digito == 10:
                    digito = 0
                if digito != int(cnpj[8 + i]):
                    return False
            return True
        except (ValueError, IndexError):
            return False
    
    def calcular_idade(self, data_nascimento):
        """Calcular idade a partir da data de nascimento"""
        if not data_nascimento:
            return None
        
        # Converter para date se for string
        if isinstance(data_nascimento, str):
            try:
                data_nascimento = datetime.strptime(data_nascimento, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                return None
        
        hoje = date.today()
        
        try:
            # Tentar usar relativedelta (mais preciso)
            from dateutil.relativedelta import relativedelta
            idade = relativedelta(hoje, data_nascimento).years
        except ImportError:
            # Fallback para cálculo simples
            idade = hoje.year - data_nascimento.year
            if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
                idade -= 1
        
        return idade if idade >= 0 else None
    
    def create_or_update_socio(self, empresa_pessoa, validated_data):
        """
        Cria ou atualiza sócio e relacionamentos
        
        Args:
            empresa_pessoa: Instância da Pessoa (empresa/PJ)
            validated_data: Dados normalizados do sócio
        
        Returns:
            Tupla (SocioEmpresa, criado: bool)
        """
        cpf_cnpj = validated_data.get('cpf_cnpj')
        nome = validated_data.get('nome_socio', '').strip()
        
        if not nome:
            raise serializers.ValidationError("Nome do sócio é obrigatório")
        
        # 1. Calcular idade se não fornecida
        data_nasc = validated_data.get('data_nascimento')
        idade = validated_data.get('idade')
        if data_nasc and not idade:
            idade = self.calcular_idade(data_nasc)
            validated_data['idade'] = idade
        
        # 2. Buscar ou criar PessoaFisica para o sócio
        pessoa_socio = None
        if cpf_cnpj and len(cpf_cnpj) == 11:  # É CPF
            # Buscar pessoa física existente
            try:
                pf = PessoaFisica.objects.get(cpf=cpf_cnpj)
                pessoa_socio = pf.pessoa
                
                # Atualizar dados se necessário
                if pf.nome_mae != validated_data.get('nome_mae', ''):
                    pf.nome_mae = validated_data.get('nome_mae', '')
                    pf.save()
                    
            except PessoaFisica.DoesNotExist:
                # Criar nova pessoa física
                from django.db import transaction
                
                with transaction.atomic():
                    pessoa = Pessoa.objects.create(tipo='F')
                    pf = PessoaFisica.objects.create(
                        pessoa=pessoa,
                        nome=nome,
                        cpf=cpf_cnpj,
                        nome_mae=validated_data.get('nome_mae', ''),
                        nascimento=data_nasc,
                        idade=idade,
                        suspeita_obito=validated_data.get('suspeita_obito', False),
                        qualificacao_socio=validated_data.get('qualificacao', ''),
                    )
                    pessoa_socio = pessoa
        
        # 3. Criar ou atualizar registro em SocioEmpresa
        socio_dict = {
            'nome_socio': nome,
            'data_nascimento': data_nasc,
            'idade': idade,
            'nome_mae': validated_data.get('nome_mae', ''),
            'suspeita_obito': validated_data.get('suspeita_obito', False),
            'qualificacao': validated_data.get('qualificacao', ''),
            'participacao_percentual': validated_data.get('participacao_percentual'),
            'data_entrada': validated_data.get('data_entrada'),
            'pessoa': pessoa_socio,
        }
        
        # Use update_or_create baseado em empresa + cpf_cnpj + nome
        lookup_dict = {
            'empresa': empresa_pessoa,
            'cpf_cnpj': cpf_cnpj or '',
            'nome_socio': nome,
        }
        
        socio, created = SocioEmpresa.objects.update_or_create(
            **lookup_dict,
            defaults=socio_dict
        )
        
        # 4. Criar relacionamento entre empresa e sócio (se pessoa_socio existe)
        if pessoa_socio and socio.empresa.tipo == 'J':
            Relacionamento.objects.update_or_create(
                pessoa_origem=empresa_pessoa,
                pessoa_destino=pessoa_socio,
                defaults={
                    'tipo_origem': 'J',
                    'tipo_destino': 'F',
                    'tipo_relacionamento': 'Sócio',
                    'descricao': f'Sócio: {nome}',
                    'participacao': socio.participacao_percentual,
                    'data_inicio': socio.data_entrada,
                    'confiabilidade': 9,
                }
            )
        
        return socio, created
