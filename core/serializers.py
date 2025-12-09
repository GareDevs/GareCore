from rest_framework import serializers
from .models import Usuario
from django.contrib.auth import authenticate

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
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['senha'])
        if not user or not user.ativo:
            raise serializers.ValidationError("Credenciais inválidas")
        return user

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome', 'role', 'criado_em']
        read_only_fields = ['id', 'criado_em']