from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
import uuid

# ========================
# Validador GOA (melhorado)
# ========================
def validate_goa(value: str):
    if not value:
        return
    goa = str(value).strip().upper()
    if not (8 <= len(goa) <= 100):
        raise ValidationError('GOA deve ter entre 8 e 100 caracteres.')
    prefixo = goa[:6]
    numero = goa[6:]
    prefixos_validos = {
        'GOAINV', 'GOADEN', 'GOACIV', 'GOACRI', 'GOAADM', 'GOAJUD',
        'GOAEXT', 'GOATRI', 'GOATRA', 'GOAFAM', 'GOACOM', 'GOAIMO',
        'GOACON', 'GOAENV', 'GOACOR', 'GOASEG', 'GOAPRE', 'GOAMED',
        'GOAEDU', 'GOATEC', 'GOAALT'
    }
    if prefixo not in prefixos_validos:
        raise ValidationError(f'Prefixo inválido. Use: {", ".join(sorted(prefixos_validos))}')
    if not numero.isdigit():
        raise ValidationError('Parte numérica do GOA deve conter apenas dígitos.')
    if int(numero) < 1:
        raise ValidationError('Número do GOA deve ser positivo.')


# ========================
# Modelo Base
# ========================
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# ========================
# 1. Pessoa (pai de tudo)
# ========================
class Pessoa(TimeStampedModel):
    TIPO_CHOICES = (('F', 'Física'), ('J', 'Jurídica'))
    tipo = models.CharField(max_length=1, choices=TIPO_CHOICES)
    goa = models.CharField(max_length=100, unique=True,null=True, blank=True, validators=[validate_goa])

    class Meta:
        db_table = 'pessoa'
        indexes = [
            #models.Index(fields=['goa']),
            models.Index(fields=['tipo']),
        ]

    def __str__(self):
        if self.tipo == 'F' and hasattr(self, 'fisica'):
            return self.fisica.nome
        if self.tipo == 'J' and hasattr(self, 'juridica'):
            return self.juridica.razao_social
        return f'Pessoa {self.id}'

# ========================
# 2. Pessoa Física
# ========================
class PessoaFisica(models.Model):
    pessoa = models.OneToOneField(Pessoa, on_delete=models.CASCADE, primary_key=True, related_name='fisica')
    nome = models.CharField(max_length=300)
    cpf = models.CharField(max_length=11, unique=True, blank=True, null=True, db_index=True)
    rg = models.CharField(max_length=20, blank=True, null=True)
    nascimento = models.DateField(blank=True, null=True)
    nome_mae = models.CharField(max_length=300, blank=True, null=True)
    nome_pai = models.CharField(max_length=300, blank=True, null=True)
    naturalidade = models.CharField(max_length=200, blank=True, null=True)
    sexo = models.CharField(max_length=1, choices=[('M', 'Masculino'), ('F', 'Feminino')], blank=True, null=True)
    estado_civil = models.CharField(max_length=50, blank=True, null=True)
    telefone1 = models.CharField(max_length=20, blank=True, null=True)
    telefone2 = models.CharField(max_length=20, blank=True, null=True)
    ocupacao = models.CharField(max_length=200, blank=True, null=True)
    vinculo = models.CharField(max_length=200, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    possui_veiculos = models.BooleanField(default=False)
    placa = models.CharField(max_length=10, blank=True, null=True)
    marca_modelo = models.CharField(max_length=100, blank=True, null=True)
    ano_veiculo = models.PositiveSmallIntegerField(blank=True, null=True)
    cor_veiculo = models.CharField(max_length=50, blank=True, null=True)
    idade = models.SmallIntegerField(blank=True, null=True)
    suspeita_obito = models.BooleanField(default=False)
    qualificacao_socio = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'pessoa_fisica'

    def __str__(self):
        return self.nome

# ========================
# 3. Pessoa Jurídica
# ========================
class PessoaJuridica(models.Model):
    pessoa = models.OneToOneField(Pessoa, on_delete=models.CASCADE, primary_key=True, related_name='juridica')
    razao_social = models.CharField(max_length=300)
    nome_fantasia = models.CharField(max_length=300, blank=True, null=True)
    cnpj = models.CharField(max_length=14, unique=True)
    situacao_cadastral = models.CharField(max_length=50, default='ATIVA')
    
    # Datas principais
    data_abertura = models.DateField(blank=True, null=True)
    data_fechamento = models.DateField(blank=True, null=True)
    data_situacao_cadastral = models.DateField(blank=True, null=True)
    
    # Classificação
    porte_empresa = models.CharField(max_length=50, blank=True, null=True)
    tipo = models.CharField(max_length=100, blank=True, null=True)
    situacao = models.CharField(max_length=20, blank=True, null=True)
    
    # Financeiro
    capital_social = models.DecimalField(max_digits=16, decimal_places=2, blank=True, null=True)
    
    # Atividade econômica
    cnae_principal = models.CharField(max_length=20, blank=True, null=True)
    cnae_descricao = models.TextField(blank=True, null=True)
    
    # Contatos
    email = models.EmailField(blank=True, null=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    telefone1 = models.CharField(max_length=15, blank=True, null=True)
    telefone2 = models.CharField(max_length=15, blank=True, null=True)
    
    # Endereços
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    possui_filial = models.BooleanField(default=False)
    endereco_filial = models.CharField(max_length=255, blank=True, null=True)
    cidade_filial = models.CharField(max_length=100, blank=True, null=True)
    
    # Simples Nacional
    situacao_simples_nacional = models.CharField(max_length=20, blank=True, null=True)
    mei = models.BooleanField(default=False)
    optante_simples = models.BooleanField(default=False)
    data_opcao_simples = models.DateField(blank=True, null=True)
    data_exclusao_simples = models.DateField(blank=True, null=True)
    
    # Observações
    observacoes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'pessoa_juridica'

    def __str__(self):
        return self.razao_social
# ========================
# 4. Endereço
# ========================
class Endereco(TimeStampedModel):
    pessoa = models.ForeignKey(Pessoa, on_delete=models.CASCADE, related_name='enderecos')
    tipo_endereco = models.CharField(max_length=50, default='RESIDENCIAL')
    logradouro = models.CharField(max_length=300, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)
    cep = models.CharField(max_length=8, blank=True, null=True)
    principal = models.BooleanField(default=False)

    class Meta:
        db_table = 'endereco'
        indexes = [
            models.Index(fields=['pessoa']),
            models.Index(fields=['cep']),
        ]

    def __str__(self):
        return f"{self.logradouro}, {self.numero} - {self.cidade}/{self.uf}"

# ========================
# 5. Contato Empresa
# ========================
class ContatoEmpresa(TimeStampedModel):
    TIPO_CONTATO = (
        ('email', 'E-mail'),
        ('telefone', 'Telefone'),
        ('celular', 'Celular'),
        ('whatsapp', 'WhatsApp'),
    )
    empresa = models.ForeignKey(Pessoa, on_delete=models.CASCADE, related_name='contatos')
    tipo = models.CharField(max_length=20, choices=TIPO_CONTATO)
    valor = models.CharField(max_length=150)
    principal = models.BooleanField(default=False)

    class Meta:
        db_table = 'contato_empresa'

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.valor}"

# ========================
# 6. Sócio
# ========================
class SocioEmpresa(TimeStampedModel):
    empresa = models.ForeignKey(Pessoa, on_delete=models.CASCADE, related_name='socios')
    pessoa = models.ForeignKey(Pessoa, on_delete=models.SET_NULL, null=True, blank=True, related_name='participacoes')
    cpf_cnpj = models.CharField(max_length=14, blank=True, null=True, db_index=True)
    nome_socio = models.CharField(max_length=300)
    data_entrada = models.DateField(blank=True, null=True)
    participacao_percentual = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    qualificacao = models.CharField(max_length=150, blank=True, null=True)
    suspeita_obito = models.BooleanField(default=False)
    nome_mae = models.CharField(max_length=300, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    idade = models.IntegerField(blank=True, null=True)
    ordem_exibicao = models.SmallIntegerField(default=99)
    fonte_importacao = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'socio_empresa'
        indexes = [
            models.Index(fields=['empresa']),
            models.Index(fields=['cpf_cnpj']),
            models.Index(fields=['nome_socio']),
        ]

    def __str__(self):
        return f"{self.nome_socio} ({self.participacao_percentual or 0}%) em {self.empresa}"

# ========================
# 7. Relacionamento (rede neural)
# ========================
class Relacionamento(TimeStampedModel):
    pessoa_origem = models.ForeignKey(Pessoa, on_delete=models.CASCADE, related_name='relacionamentos_origem')
    tipo_origem = models.CharField(max_length=1, choices=Pessoa.TIPO_CHOICES)
    pessoa_destino = models.ForeignKey(Pessoa, on_delete=models.CASCADE, related_name='relacionamentos_destino')
    tipo_destino = models.CharField(max_length=1, choices=Pessoa.TIPO_CHOICES)
    tipo_relacionamento = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    data_inicio = models.DateField(blank=True, null=True)
    data_fim = models.DateField(blank=True, null=True)
    participacao = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    eh_auto = models.BooleanField(default=False)
    fonte_importacao = models.CharField(max_length=100, blank=True, null=True)
    confiabilidade = models.SmallIntegerField(default=5, choices=[(i, i) for i in range(1, 6)])

    class Meta:
        db_table = 'relacionamento'
        indexes = [
            models.Index(fields=['pessoa_origem']),
            models.Index(fields=['pessoa_destino']),
            models.Index(fields=['tipo_relacionamento']),
        ]

    def __str__(self):
        return f"{self.pessoa_origem} → {self.pessoa_destino} ({self.tipo_relacionamento})"

# ========================
# 8. Foto (mantida simples)
# ========================

class Foto(TimeStampedModel):
    pessoa = models.ForeignKey(Pessoa, on_delete=models.CASCADE, related_name='fotos')
    url_arquivo = models.TextField()
    nome_arquivo = models.CharField(max_length=255)
    tipo_arquivo = models.CharField(max_length=100)
    tamanho_arquivo = models.BigIntegerField(blank=True, null=True)
    descricao = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='ativa')

    class Meta:
        db_table = 'fotos'

    def __str__(self):
        return self.nome_arquivo

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome, senha=None, **extra_fields):
        if not email:
            raise ValueError('Email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, **extra_fields)
        user.set_password(senha)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome, senha=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, nome, senha, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    nome = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=[('user', 'Usuário'), ('admin', 'Administrador')],
        default='user'
    )
    ativo = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)  # para acessar /admin
    is_superuser = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']

    class Meta:
        db_table = 'usuarios'  # nome exato da tabela no Supabase
        # managed = False  # se você NÃO quiser que o Django crie/altere a tabela

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == 'admin'

