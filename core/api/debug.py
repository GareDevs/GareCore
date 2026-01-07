"""
Debug endpoints para diagnosticar problemas na API
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from core.models import PessoaFisica, PessoaJuridica, Pessoa


class DebugAPIView(APIView):
    """Endpoint de debug da API - sem autenticação necessária"""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Retorna informações sobre o estado da API"""
        try:
            pf_count = PessoaFisica.objects.count()
            pj_count = PessoaJuridica.objects.count()
            pessoa_count = Pessoa.objects.count()
            
            # Verificar primeira pessoa física
            pf_sample = None
            if pf_count > 0:
                pf = PessoaFisica.objects.first()
                pf_sample = {
                    'nome': pf.nome,
                    'pessoa_id': pf.pessoa.id,
                    'cpf': pf.cpf,
                    'goa': pf.pessoa.goa,
                }
            
            # Verificar primeira pessoa jurídica
            pj_sample = None
            if pj_count > 0:
                pj = PessoaJuridica.objects.first()
                pj_sample = {
                    'razao_social': pj.razao_social,
                    'pessoa_id': pj.pessoa.id,
                    'cnpj': pj.cnpj,
                    'goa': pj.pessoa.goa,
                }
            
            return Response({
                'status': 'ok',
                'database': {
                    'pessoas_fisicas': pf_count,
                    'pessoas_juridicas': pj_count,
                    'pessoas_total': pessoa_count,
                },
                'samples': {
                    'pessoa_fisica': pf_sample,
                    'pessoa_juridica': pj_sample,
                },
                'message': 'Debug API respondendo corretamente',
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'status': 'error',
                'error': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
