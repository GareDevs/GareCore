import pandas as pd
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional
import csv
import json
from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional

# 1. Extração do template-pessoa-fisica.csv (template vazio para pessoas físicas)
def extrair_template_pessoa_fisica(caminho_arquivo: str) -> pd.DataFrame:
    """
    Extrai o template CSV de pessoa física.
    Retorna um DataFrame com as colunas (linhas vazias são ignoradas).
    """
    df = pd.read_csv(caminho_arquivo, sep=';', encoding='utf-8-sig')  # utf-8-sig lida com BOM
    df = df.dropna(how='all')  # Remove linhas completamente vazias
    return df

# Exemplo de uso:
# df_pf = extrair_template_pessoa_fisica('template-pessoa-fisica.csv')
# print(df_pf.columns)


# 2. Extração do template-pessoa-juridica.csv (template vazio para empresas)
def extrair_template_pessoa_juridica(caminho_arquivo: str) -> pd.DataFrame:
    """
    Extrai o template CSV de pessoa jurídica.
    Retorna um DataFrame com as colunas (linhas vazias são ignoradas).
    """
    df = pd.read_csv(caminho_arquivo, sep=';', encoding='utf-8-sig')
    df = df.dropna(how='all')
    return df

# Exemplo de uso:
# df_pj = extrair_template_pessoa_juridica('template-pessoa-juridica.csv')
# print(df_pj.columns)


# 3. Extração do relacionamentos.xls (HTML com tabela de empresas e sócios)
def extrair_relacionamentos_empresas(caminho_arquivo: str) -> List[Dict]:
    """
    Extrai dados do arquivo HTML (relacionamentos.xls) retornando uma lista de dicionários,
    cada um representando uma empresa com seus dados principais e lista de sócios.
    
    Retorno exemplo:
    [
        {
            'razao_social': 'MAGAZINE DOS PLUG E VARIEDADES LTDA',
            'nome_fantasia': '',
            'cnpj': '51.527.743/0001-55',
            'data_abertura': '24/07/2023',
            'situacao': 'ATIVA',
            'email': 'SMLBAPTISTA@HOTMAIL.COM',
            'endereco': 'RUA DOS BANQUEIROS, 95 - VILA BANCARIA',
            'cidade': 'SAO PAULO/SP',
            'cep': '03.918-050',
            'telefones': ['(11) 40044866', '(11) 25362565', '(11) 22564958'],
            'capital_social': 'R$ 500.000,00',
            'socios': [
                {
                    'nome': 'DEBORA ROSA DA SILVA BITAR',
                    'cpf': None,
                    'data_nascimento': None,
                    'idade': None,
                    'nome_mae': None,
                    'qualificacao': 'Sócio-Administrador'
                },
                # ... outros sócios se houver
            ]
        },
        ...
    ]
    """
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table')
    main_table = tables[1]  # A segunda tabela é a principal (Mapa de Relacionamentos)

    rows = main_table.find_all('tr')[1:]  # Pula a linha de cabeçalho

    empresas = []
    current_empresa = {}

    socio_blocks = [
        'SOCIO I', 'SOCIO II', 'SOCIO III', 'SOCIO IV',
        'SOCIO V', 'SOCIO VI', 'SOCIO VII'
    ]

    for row in rows:
        cells = [cell.get_text(strip=True) for cell in row.find_all('td')]
        if not cells:
            continue

        # Detecta início de nova empresa (razão social na primeira célula, geralmente longa)
        if cells[0] and ('LTDA' in cells[0] or '/' in ''.join(cells[:10])):  # Heurística simples
            if current_empresa:
                empresas.append(current_empresa)

            current_empresa = {
                'razao_social': cells[0],
                'nome_fantasia': cells[8] if len(cells) > 8 else '',
                'cnpj': cells[10] if len(cells) > 10 else '',
                'data_abertura': cells[14] if len(cells) > 14 else '',
                'situacao': cells[18] if len(cells) > 18 else '',
                'email': cells[22] if len(cells) > 22 else '',
                'endereco': cells[26] if len(cells) > 26 else '',
                'cidade': cells[32] if len(cells) > 32 else '',
                'cep': cells[34] if len(cells) > 34 else '',
                'telefones': [t.strip() for t in cells[38].split(',') if t.strip()] if len(cells) > 38 else [],
                'capital_social': cells[42] if len(cells) > 42 else '',
                'socios': []
            }

        # Extrai sócios (blocos repetitivos)
        # Os índices são aproximados com base na estrutura fornecida
        for i, block_name in enumerate(socio_blocks):
            base_idx = 50 + i * 20  # Aproximação do offset de cada bloco de sócio
            if len(cells) > base_idx + 10:
                nome_socio = cells[base_idx]
                if nome_socio:  # Só adiciona se houver nome
                    cpf = cells[base_idx + 6] if cells[base_idx + 6] != '..' else None
                    data_nasc = cells[base_idx + 8] if len(cells[base_idx + 8]) > 4 else None
                    idade = cells[base_idx + 10] if cells[base_idx + 10].isdigit() else None
                    nome_mae = cells[base_idx + 14] if cells[base_idx + 14] else None
                    qualificacao = cells[base_idx + 18]

                    current_empresa['socios'].append({
                        'nome': nome_socio,
                        'cpf': cpf,
                        'data_nascimento': data_nasc,
                        'idade': idade,
                        'nome_mae': nome_mae,
                        'qualificacao': qualificacao
                    })

    if current_empresa:
        empresas.append(current_empresa)

    return empresas

# Exemplo de uso:
# empresas = extrair_relacionamentos_empresas('relacionamentos.xls')
# for emp in empresas:
#     print(emp['razao_social'], emp['cnpj'], len(emp['socios']), "sócios")

def extrair_dados_csv_pj(caminho_arquivo: str) -> list[dict]:
    """
    Extrai dados do template-pessoa-juridica.csv e retorna uma lista de dicionários.
    Cada dicionário representa uma empresa, com 'socios' como lista de subdicionários.
    """
    data_list = []
    
    with open(caminho_arquivo, mode='r', encoding='utf-8-sig', newline='') as file:
        reader = csv.DictReader(file, delimiter=';')
        
        for row in reader:
            # Pular linhas completamente vazias (todas as colunas em branco)
            if all(not value.strip() for value in row.values()):
                continue
                
            socios = []
            for i in range(1, 4):
                nome = row.get(f'Sócio {i} - Nome', '').strip()
                cpf = row.get(f'Sócio {i} - CPF', '').strip()
                participacao = row.get(f'Sócio {i} - Participação %', '').strip()
                
                # Só adiciona o sócio se pelo menos um campo estiver preenchido
                if nome or cpf or participacao:
                    socios.append({
                        'nome': nome,
                        'cpf': cpf,
                        'participacao_percent': participacao
                    })
            
            empresa = {
                'razao_social': row['Razão Social'].strip(),
                'nome_fantasia': row['Nome Fantasia'].strip(),
                'cnpj': row['CNPJ'].strip(),
                'inscricao_estadual': row['Inscrição Estadual'].strip(),
                'data_abertura': row['Data de Abertura'].strip(),
                'endereco_completo': row['Endereço Completo'].strip(),
                'telefone_1': row['Telefone 1'].strip(),
                'telefone_2': row['Telefone 2'].strip(),
                'email': row['Email'].strip(),
                'atividade_principal': row['Atividade Principal'].strip(),
                'socios': socios,
                'observacoes': row['Observações'].strip()
            }
            
            data_list.append(empresa)
    
    return data_list

def extrair_dados_csv_pf(caminho_arquivo: str) -> List[Dict]:
    """
    Extrai dados do CSV de Pessoa Física e retorna em formato JSON-like.
    Retorna uma lista de dicionários, um por pessoa.
    """
    pessoas = []

    with open(caminho_arquivo, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file, delimiter=';')
        
        for row in reader:
            # Ignora linhas completamente vazias
            if not any(row.values()):
                continue
            
            # Cria o dicionário da pessoa
            pessoa = {
                "nome_completo": row["Nome Completo"].strip(),
                "cpf": row["CPF"].strip(),
                "data_nascimento": row["Data de Nascimento"].strip(),
                "nome_mae": row["Nome da Mãe"].strip(),
                "endereco": row["Endereço"].strip(),
                "rg": row["RG"].strip(),
                "telefone_1": row["Telefone 1"].strip(),
                "telefone_2": row["Telefone 2"].strip(),
                "email": row["Email"].strip(),
                "sexo": row["Sexo"].strip(),
                "estado_civil": row["Estado Civil"].strip(),
                "naturalidade": row["Naturalidade"].strip(),
                "nome_pai": row["Nome do Pai"].strip(),
                "profissao": row["Profissão"].strip(),
                "observacoes": row["Observações"].strip()
            }
            
            # Opcional: só adiciona se houver nome ou CPF (evita entradas vazias)
            if pessoa["nome_completo"] or pessoa["cpf"]:
                pessoas.append(pessoa)
    
    return pessoas