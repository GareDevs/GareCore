from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone

from core.models import Pessoa, PessoaFisica, PessoaJuridica, Relacionamento, Foto


class DashboardStatsAPIView(APIView):
    """
    API View para estatísticas do Dashboard
    
    GET /api/dashboard/stats/
    Retorna todas as estatísticas consolidadas para o dashboard
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Estatísticas básicas
            total_pessoas_fisicas = PessoaFisica.objects.count()
            total_pessoas_juridicas = PessoaJuridica.objects.count()
            total_pessoas = total_pessoas_fisicas + total_pessoas_juridicas
            total_relacionamentos = Relacionamento.objects.count()
            total_fotos = Foto.objects.count()
            
            # Estatísticas por tipo de relacionamento
            relacionamentos_por_tipo = Relacionamento.objects.values(
                'tipo_relacionamento'
            ).annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Estatísticas por prefixo GOA
            goa_stats = {}
            for prefixo in ['GOAINV', 'GOADEN', 'GOACIV', 'GOACRI', 'GOAADM', 'GOAJUD', 'GOAEXT']:
                count = Pessoa.objects.filter(goa__startswith=prefixo).count()
                if count > 0:
                    goa_stats[prefixo] = count
            
            # Pessoas com fotos (percentual)
            pessoas_com_fotos = Foto.objects.values('pessoa_id').distinct().count()
            percentual_com_fotos = (pessoas_com_fotos / total_pessoas * 100) if total_pessoas > 0 else 0
            
            # Pessoas com relacionamentos (percentual)
            pessoas_com_relacionamentos = Relacionamento.objects.filter(
                Q(pessoa_origem__tipo='F') | Q(pessoa_destino__tipo='F')
            ).values('pessoa_origem_id', 'pessoa_destino_id').distinct().count()
            percentual_com_relacionamentos = (pessoas_com_relacionamentos / total_pessoas * 100) if total_pessoas > 0 else 0
            
            # Últimas atividades (criações recentes)
            pessoas_recentes = Pessoa.objects.order_by('-created_at')[:5]
            relacionamentos_recentes = Relacionamento.objects.order_by('-created_at')[:5]
            
            # Formatar dados recentes
            pessoas_recentes_data = []
            for p in pessoas_recentes:
                try:
                    nome = ''
                    if p.tipo == 'F':
                        nome = p.pessoafisica.nome if hasattr(p, 'pessoafisica') and p.pessoafisica else 'N/A'
                    else:
                        nome = p.pessoajuridica.razao_social if hasattr(p, 'pessoajuridica') and p.pessoajuridica else 'N/A'
                    
                    pessoas_recentes_data.append({
                        'id': p.id,
                        'goa': p.goa or 'N/A',
                        'tipo': p.tipo,
                        'nome': nome,
                        'created_at': p.created_at
                    })
                except Exception as e:
                    print(f"Erro ao processar pessoa {p.id}: {e}")
                    continue
            
            relacionamentos_recentes_data = []
            for r in relacionamentos_recentes:
                try:
                    # Obter nomes das pessoas relacionadas
                    origem_nome = ''
                    if r.pessoa_origem.tipo == 'F':
                        origem_nome = r.pessoa_origem.pessoafisica.nome if hasattr(r.pessoa_origem, 'pessoafisica') and r.pessoa_origem.pessoafisica else 'N/A'
                    else:
                        origem_nome = r.pessoa_origem.pessoajuridica.razao_social if hasattr(r.pessoa_origem, 'pessoajuridica') and r.pessoa_origem.pessoajuridica else 'N/A'
                    
                    destino_nome = ''
                    if r.pessoa_destino.tipo == 'F':
                        destino_nome = r.pessoa_destino.pessoafisica.nome if hasattr(r.pessoa_destino, 'pessoafisica') and r.pessoa_destino.pessoafisica else 'N/A'
                    else:
                        destino_nome = r.pessoa_destino.pessoajuridica.razao_social if hasattr(r.pessoa_destino, 'pessoajuridica') and r.pessoa_destino.pessoajuridica else 'N/A'
                    
                    relacionamentos_recentes_data.append({
                        'id': r.id,
                        'tipo_relacionamento': r.tipo_relacionamento or 'N/A',
                        'origem_nome': origem_nome,
                        'destino_nome': destino_nome,
                        'created_at': r.created_at
                    })
                except Exception as e:
                    print(f"Erro ao processar relacionamento {r.id}: {e}")
                    continue
            
            return Response({
                'estatisticas_gerais': {
                    'total_pessoas': total_pessoas,
                    'total_pessoas_fisicas': total_pessoas_fisicas,
                    'total_pessoas_juridicas': total_pessoas_juridicas,
                    'total_relacionamentos': total_relacionamentos,
                    'total_fotos': total_fotos,
                    'pessoas_com_fotos': pessoas_com_fotos,
                    'percentual_com_fotos': round(percentual_com_fotos, 2),
                    'pessoas_com_relacionamentos': pessoas_com_relacionamentos,
                    'percentual_com_relacionamentos': round(percentual_com_relacionamentos, 2)
                },
                'relacionamentos_por_tipo': list(relacionamentos_por_tipo),
                'estatisticas_goa': goa_stats,
                'atividades_recentes': {
                    'pessoas': pessoas_recentes_data,
                    'relacionamentos': relacionamentos_recentes_data
                }
            })
            
        except Exception as e:
            import traceback
            print(f"Erro na API do dashboard: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'erro': f'Erro ao carregar estatísticas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DashboardSearchAPIView(APIView):
    """
    API View para busca no dashboard
    
    GET /api/dashboard/search/?q=termo&tipo=pessoa|relacionamento|foto
    Busca por pessoas, relacionamentos ou fotos
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        tipo = request.query_params.get('tipo', 'pessoa')
        
        if not query or len(query) < 2:
            return Response({'erro': 'Termo de busca muito curto'}, status=400)
        
        results = []
        
        if tipo in ['pessoa', 'todos']:
            # Buscar pessoas físicas
            pf_results = PessoaFisica.objects.filter(
                Q(nome__icontains=query) |
                Q(cpf__icontains=query) |
                Q(pessoa__goa__icontains=query)
            ).select_related('pessoa')[:10]
            
            for pf in pf_results:
                results.append({
                    'tipo': 'pessoa_fisica',
                    'id': pf.pessoa.id,
                    'goa': pf.pessoa.goa,
                    'nome': pf.nome,
                    'cpf': pf.cpf,
                    'detalhes': f'CPF: {pf.cpf}'
                })
            
            # Buscar pessoas jurídicas
            pj_results = PessoaJuridica.objects.filter(
                Q(razao_social__icontains=query) |
                Q(nome_fantasia__icontains=query) |
                Q(cnpj__icontains=query) |
                Q(pessoa__goa__icontains=query)
            ).select_related('pessoa')[:10]
            
            for pj in pj_results:
                results.append({
                    'tipo': 'pessoa_juridica',
                    'id': pj.pessoa.id,
                    'goa': pj.pessoa.goa,
                    'nome': pj.razao_social,
                    'cnpj': pj.cnpj,
                    'detalhes': f'CNPJ: {pj.cnpj}'
                })
        
        if tipo in ['relacionamento', 'todos']:
            # Buscar relacionamentos
            rel_results = Relacionamento.objects.filter(
                Q(tipo_relacionamento__icontains=query) |
                Q(pessoa_origem__pessoafisica__nome__icontains=query) |
                Q(pessoa_origem__pessoajuridica__razao_social__icontains=query) |
                Q(pessoa_destino__pessoafisica__nome__icontains=query) |
                Q(pessoa_destino__pessoajuridica__razao_social__icontains=query)
            ).select_related('pessoa_origem', 'pessoa_destino')[:10]
            
            for rel in rel_results:
                try:
                    # Obter nomes das pessoas relacionadas
                    origem_nome = ''
                    if rel.pessoa_origem.tipo == 'F':
                        origem_nome = rel.pessoa_origem.pessoafisica.nome if hasattr(rel.pessoa_origem, 'pessoafisica') and rel.pessoa_origem.pessoafisica else 'N/A'
                    else:
                        origem_nome = rel.pessoa_origem.pessoajuridica.razao_social if hasattr(rel.pessoa_origem, 'pessoajuridica') and rel.pessoa_origem.pessoajuridica else 'N/A'
                    
                    destino_nome = ''
                    if rel.pessoa_destino.tipo == 'F':
                        destino_nome = rel.pessoa_destino.pessoafisica.nome if hasattr(rel.pessoa_destino, 'pessoafisica') and rel.pessoa_destino.pessoafisica else 'N/A'
                    else:
                        destino_nome = rel.pessoa_destino.pessoajuridica.razao_social if hasattr(rel.pessoa_destino, 'pessoajuridica') and rel.pessoa_destino.pessoajuridica else 'N/A'
                    
                    results.append({
                        'tipo': 'relacionamento',
                        'id': rel.id,
                        'tipo_relacionamento': rel.tipo_relacionamento or 'N/A',
                        'origem': origem_nome,
                        'destino': destino_nome,
                        'detalhes': f'{rel.tipo_relacionamento or "N/A"}: {origem_nome} → {destino_nome}'
                    })
                except Exception as e:
                    print(f"Erro ao processar relacionamento na busca {rel.id}: {e}")
                    continue
        
        return Response({
            'query': query,
            'total': len(results),
            'resultados': results
        })
