"""
Management command para debugging - verifica dados da API
python manage.py debug_info
"""
from django.core.management.base import BaseCommand
from core.models import PessoaFisica, PessoaJuridica, Pessoa, Usuario
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Exibe informações de debug da aplicação'

    def handle(self, *args, **options):
        print("\n" + "="*80)
        print("🔧 DEBUG - INFORMAÇÕES DA APLICAÇÃO")
        print("="*80 + "\n")

        # 1. Verificar usuários
        print("👤 USUÁRIOS")
        User = get_user_model()
        users = User.objects.filter(is_active=True)
        print(f"  Total de usuários ativos: {users.count()}")
        for user in users[:5]:
            print(f"    - {user.username} ({user.email})")
        if users.count() == 0:
            print("    ⚠️ AVISO: Nenhum usuário ativo!")

        # 2. Verificar pessoas
        print("\n📊 PESSOAS")
        print(f"  Total de Pessoas: {Pessoa.objects.count()}")
        print(f"  - Físicas: {PessoaFisica.objects.count()}")
        print(f"  - Jurídicas: {PessoaJuridica.objects.count()}")

        # 3. Amostras
        print("\n🔍 AMOSTRAS")
        
        pf = PessoaFisica.objects.select_related('pessoa').first()
        if pf:
            print(f"  ✅ Primeira Pessoa Física:")
            print(f"     Nome: {pf.nome}")
            print(f"     CPF: {pf.cpf}")
            print(f"     Pessoa ID: {pf.pessoa.id}")
            print(f"     GOA: {pf.pessoa.goa}")
        else:
            print(f"  ❌ Nenhuma pessoa física encontrada")

        pj = PessoaJuridica.objects.select_related('pessoa').first()
        if pj:
            print(f"  ✅ Primeira Pessoa Jurídica:")
            print(f"     Razão Social: {pj.razao_social}")
            print(f"     CNPJ: {pj.cnpj}")
            print(f"     Pessoa ID: {pj.pessoa.id}")
            print(f"     GOA: {pj.pessoa.goa}")
        else:
            print(f"  ❌ Nenhuma pessoa jurídica encontrada")

        # 4. Testar serialização
        print("\n🔐 TESTES DE SERIALIZAÇÃO")
        
        if pf:
            try:
                from core.api.serializers.pessoa import PessoaFisicaDetailSerializer
                serializer = PessoaFisicaDetailSerializer(pf)
                print(f"  ✅ PessoaFisicaDetailSerializer OK")
                print(f"     Campos: {list(serializer.data.keys())}")
            except Exception as e:
                print(f"  ❌ Erro ao serializar PF: {e}")

        if pj:
            try:
                from core.api.serializers.pessoa import PessoaJuridicaDetailSerializer
                serializer = PessoaJuridicaDetailSerializer(pj)
                print(f"  ✅ PessoaJuridicaDetailSerializer OK")
                print(f"     Campos: {list(serializer.data.keys())}")
            except Exception as e:
                print(f"  ❌ Erro ao serializar PJ: {e}")

        print("\n" + "="*80)
        print("✅ Debug completo!")
        print("="*80 + "\n")
