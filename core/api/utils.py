from difflib import SequenceMatcher
import re


def validate_goa_format(goa: str) -> dict:
    """
    Valida formato GOA
    Retorna: {'valido': bool, 'mensagem': str, 'prefixo': str, 'numero': str}
    """
    if not goa:
        return {'valido': True, 'mensagem': ''}
    
    goa = goa.strip().upper()
    
    if len(goa) < 8:
        return {
            'valido': False,
            'mensagem': 'GOA deve ter pelo menos 8 caracteres'
        }
    
    prefixos = {
        'GOAINV': 'Investigação',
        'GOADEN': 'Denúncia',
        'GOACIV': 'Processo Civil',
        'GOACRI': 'Processo Criminal',
        'GOAADM': 'Administrativo',
        'GOAJUD': 'Judicial',
        'GOAEXT': 'Extrajudicial',
        'GOATRI': 'Tributário',
        'GOATRA': 'Trabalhista',
        'GOAFAM': 'Família',
        'GOACOM': 'Comercial',
        'GOAIMO': 'Imobiliário',
        'GOACON': 'Consumidor',
        'GOAENV': 'Ambiental',
        'GOACOR': 'Corporativo',
        'GOASEG': 'Seguros',
        'GOAPRE': 'Previdenciário',
        'GOAMED': 'Médico',
        'GOAEDU': 'Educacional',
        'GOATEC': 'Tecnologia',
        'GOAALT': 'Outros'
    }
    
    prefixo = goa[:6]
    numero = goa[6:]
    
    if prefixo not in prefixos:
        return {
            'valido': False,
            'mensagem': f'Prefixo inválido. Use: {", ".join(sorted(prefixos.keys()))}'
        }
    
    if not numero.isdigit():
        return {
            'valido': False,
            'mensagem': 'Número GOA deve conter apenas dígitos'
        }
    
    if int(numero) < 1:
        return {
            'valido': False,
            'mensagem': 'Número GOA deve ser positivo'
        }
    
    return {
        'valido': True,
        'mensagem': f'GOA válido: {prefixos[prefixo]} #{numero}',
        'prefixo': prefixo,
        'numero': numero,
        'descricao': prefixos[prefixo]
    }


def calcular_similaridade(str1: str, str2: str) -> float:
    """Calcula similaridade entre duas strings (0-100)"""
    if not str1 or not str2:
        return 0.0
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio() * 100


def limpar_telefone(telefone: str) -> str:
    """Remove caracteres especiais do telefone"""
    return re.sub(r'\D', '', telefone) if telefone else ''


def formatar_cpf(cpf: str) -> str:
    """Formata CPF como 000.000.000-00"""
    cpf = re.sub(r'\D', '', cpf)
    if len(cpf) == 11:
        return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:11]}"
    return cpf


def formatar_cnpj(cnpj: str) -> str:
    """Formata CNPJ como 00.000.000/0000-00"""
    cnpj = re.sub(r'\D', '', cnpj)
    if len(cnpj) == 14:
        return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:14]}"
    return cnpj


def buscar_pessoas_por_rede(pessoa_id: int, profundidade: int = 2) -> list:
    """
    Busca pessoas relacionadas em profundidade (BFS)
    """
    from core.models import Pessoa, Relacionamento
    from collections import deque
    
    visitados = set([pessoa_id])
    fila = deque([(pessoa_id, 0)])  # (pessoa_id, profundidade_atual)
    resultados = []
    
    while fila:
        current_id, depth = fila.popleft()
        
        if depth >= profundidade:
            continue
        
        # Encontrar relacionamentos
        relacionamentos = Relacionamento.objects.filter(
            pessoa_origem_id=current_id
        ) | Relacionamento.objects.filter(
            pessoa_destino_id=current_id
        )
        
        for rel in relacionamentos:
            next_id = rel.pessoa_destino_id if rel.pessoa_origem_id == current_id else rel.pessoa_origem_id
            
            if next_id not in visitados:
                visitados.add(next_id)
                fila.append((next_id, depth + 1))
                
                pessoa = Pessoa.objects.get(id=next_id)
                resultados.append({
                    'id': pessoa.id,
                    'profundidade': depth + 1,
                    'tipo_relacionamento': rel.tipo_relacionamento,
                    'confianca': rel.confiabilidade
                })
    
    return resultados
