#!/usr/bin/env python
"""
Script para testar a API de pessoas
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gare_core.settings')
django.setup()

from core.models import PessoaFisica, PessoaJuridica, Pessoa
from core.api.serializers.pessoa import PessoaFisicaDetailSerializer, PessoaJuridicaDetailSerializer

print("=" * 80)
print("DEBUG: Verificando dados no banco")
print("=" * 80)

# Verificar Pessoas Físicas
print("\n📋 PESSOAS FÍSICAS")
pf_count = PessoaFisica.objects.count()
print(f"Total: {pf_count}")

if pf_count > 0:
    pf = PessoaFisica.objects.first()
    print(f"Primeira: {pf.nome} (ID: {pf.pessoa.id})")
    
    # Testar serializer
    try:
        serializer = PessoaFisicaDetailSerializer(pf)
        print(f"✅ Serializer OK")
        print(f"Dados: {json.dumps(serializer.data, indent=2, default=str)}")
    except Exception as e:
        print(f"❌ Erro ao serializar: {e}")
else:
    print("❌ Nenhuma pessoa física encontrada")

# Verificar Pessoas Jurídicas
print("\n📋 PESSOAS JURÍDICAS")
pj_count = PessoaJuridica.objects.count()
print(f"Total: {pj_count}")

if pj_count > 0:
    pj = PessoaJuridica.objects.first()
    print(f"Primeira: {pj.razao_social} (ID: {pj.pessoa.id})")
    
    # Testar serializer
    try:
        serializer = PessoaJuridicaDetailSerializer(pj)
        print(f"✅ Serializer OK")
        print(f"Dados: {json.dumps(serializer.data, indent=2, default=str)}")
    except Exception as e:
        print(f"❌ Erro ao serializar: {e}")
else:
    print("❌ Nenhuma pessoa jurídica encontrada")

# Verificar autenticação
print("\n🔐 AUTENTICAÇÃO")
from django.contrib.auth import get_user_model
User = get_user_model()
users = User.objects.filter(is_active=True)
print(f"Usuários ativos: {users.count()}")
for user in users[:3]:
    print(f"  - {user.username} ({user.email})")
