from rest_framework import serializers
from .models import (
    Usuario,
    Pessoa,
    PessoaFisica,
    PessoaJuridica,
    Endereco,
    ContatoEmpresa,
    SocioEmpresa,
    Relacionamento,
    Foto,
)

class RegistroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome', 'senha', 'role']

    def create(self, validated_data):
        # Só admin pode criar admin
        request = self.context.get('request')
        if validated_data.get('role') == 'admin' and not (request and request.user.is_admin):
            raise serializers.ValidationError("Apenas administradores podem criar outros admins.")
        
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            nome=validated_data['nome'],
            senha=validated_data['senha'],
            role=validated_data.get('role', 'user')
        )
        user.is_active = False  # Usuário criado inativo → precisa de aprovação
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        senha = data.get('senha')
        
        # Busca o usuário por email
        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Credenciais inválidas ou usuário não encontrado.")
        
        # Valida a senha
        if not user.check_password(senha):
            raise serializers.ValidationError("Credenciais inválidas.")
        
        if not user.is_active:
            raise serializers.ValidationError("Sua conta está inativa. Aguarde aprovação.")
        
        return user

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome', 'role', 'criado_em']
        read_only_fields = ['id', 'criado_em']

class PessoaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pessoa
        fields = '__all__'

class PessoaFisicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PessoaFisica
        fields = '__all__'

class PessoaJuridicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PessoaJuridica
        fields = '__all__'

class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = '__all__'

class ContatoEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContatoEmpresa
        fields = '__all__'

class SocioEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocioEmpresa
        fields = '__all__'

class RelacionamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Relacionamento
        fields = '__all__'

class FotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Foto
        fields = '__all__'