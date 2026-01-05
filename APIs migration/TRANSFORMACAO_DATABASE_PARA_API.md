# Transformação database.js → Django API Views

**Objetivo:** Mapear todas as funções localStorage do `database.js` para views/serializers Django acessíveis via API REST.

---

## 📋 SUMÁRIO EXECUTIVO

### Estrutura Atual (Frontend)
- **database.js**: Classe `Database` que gerencia dados em localStorage
- **Consumidores**: forms.js, fotos.js, main.js, exportacao-excel.js, backup.js, vinculos-avancados.js

### Estrutura Alvo (Backend)
- **Django Views**: ViewSets + APIViews para CRUD e processamentos
- **Serializers**: Validação de dados conforme models
- **URLs**: Rotas RESTful estruturadas por recurso

---

## 🔄 MAPEAMENTO COMPLETO

### 1. CRUD GENÉRICO

#### 1.1 `insert(table, data)` → POST `/api/{resource}/`

**Atual (database.js):**
```javascript
db.insert('pessoa_fisica', {
    nome: 'João Silva',
    cpf: '12345678900',
    telefone1: '11999999999'
});
```

**Novo (API):**
```bash
POST /api/pessoas-fisicas/
Content-Type: application/json

{
    "nome": "João Silva",
    "cpf": "12345678900",
    "telefone1": "11999999999",
    "goa": "GOAINV001"
}
```

**Django Implementation:**
```python
# views.py
from rest_framework.viewsets import ModelViewSet
from .serializers import PessoaFisicaSerializer
from .models import PessoaFisica

class PessoaFisicaViewSet(ModelViewSet):
    queryset = PessoaFisica.objects.all()
    serializer_class = PessoaFisicaSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/pessoas-fisicas/
        Cria nova pessoa física
        """
        return super().create(request, *args, **kwargs)
```

**Arquivos JS afetados:** forms.js (linhas 1723, 1749, 1886), main.js (500, 529, 549, 568), fotos.js (250)

---

#### 1.2 `getAll(table)` → GET `/api/{resource}/`

**Atual (database.js):**
```javascript
const pessoas = db.getAll('pessoa_fisica');
const fotos = db.getAll('fotos');
```

**Novo (API):**
```bash
GET /api/pessoas-fisicas/
GET /api/fotos/

# Com paginação
GET /api/pessoas-fisicas/?page=1&page_size=20
```

**Django Implementation:**
```python
class PessoaFisicaViewSet(ModelViewSet):
    def list(self, request, *args, **kwargs):
        """
        GET /api/pessoas-fisicas/
        Lista todas as pessoas físicas
        """
        return super().list(request, *args, **kwargs)
```

**Arquivos JS afetados:** forms.js (1937, 1980, 2019), main.js (281-284, 375-377), fotos.js (144, 367, 693, 729, 958), exportacao-excel.js (14, 45, 85-86), exportacao-excel-simples.js (14, 36, 59-60)

---

#### 1.3 `getById(table, id)` → GET `/api/{resource}/{id}/`

**Atual (database.js):**
```javascript
const pessoa = db.getById('pessoa_fisica', 123);
const foto = db.getById('fotos', 456);
```

**Novo (API):**
```bash
GET /api/pessoas-fisicas/123/
GET /api/fotos/456/
```

**Django Implementation:**
```python
class PessoaFisicaViewSet(ModelViewSet):
    def retrieve(self, request, pk=None, *args, **kwargs):
        """
        GET /api/pessoas-fisicas/{id}/
        Retorna pessoa física específica
        """
        return super().retrieve(request, pk, *args, **kwargs)
```

**Arquivos JS afetados:** forms.js (2019, 2238), fotos.js (400, 474, 610)

---

#### 1.4 `update(table, id, data)` → PATCH `/api/{resource}/{id}/`

**Atual (database.js):**
```javascript
db.update('pessoa_fisica', 123, {
    nome: 'João Pedro Silva',
    telefone1: '11988888888'
});
```

**Novo (API):**
```bash
PATCH /api/pessoas-fisicas/123/
Content-Type: application/json

{
    "nome": "João Pedro Silva",
    "telefone1": "11988888888"
}
```

**Django Implementation:**
```python
class PessoaFisicaViewSet(ModelViewSet):
    def update(self, request, pk=None, *args, **kwargs):
        """
        PATCH /api/pessoas-fisicas/{id}/
        Atualiza pessoa física parcialmente
        """
        return super().update(request, pk, *args, **kwargs)
    
    def partial_update(self, request, pk=None, *args, **kwargs):
        """PUT para atualização completa"""
        return super().partial_update(request, pk, *args, **kwargs)
```

**Arquivos JS afetados:** forms.js (1723, 1860)

---

#### 1.5 `delete(table, id)` → DELETE `/api/{resource}/{id}/`

**Atual (database.js):**
```javascript
db.delete('pessoa_fisica', 123);
db.delete('fotos', 456);
```

**Novo (API):**
```bash
DELETE /api/pessoas-fisicas/123/
DELETE /api/fotos/456/
```

**Django Implementation:**
```python
class PessoaFisicaViewSet(ModelViewSet):
    def destroy(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/pessoas-fisicas/{id}/
        Deleta pessoa física
        """
        return super().destroy(request, pk, *args, **kwargs)
```

**Arquivos JS afetados:** forms.js (2566), fotos.js (648)

---

### 2. CONSULTAS E VALIDAÇÕES

#### 2.1 `search(table, searchTerm, fields=[])` → GET `/api/{resource}/?search=termo`

**Atual (database.js):**
```javascript
const resultados = db.search('pessoa_fisica', 'João', ['nome', 'cpf']);
const fotos = db.search('fotos', 'documentos');
```

**Novo (API):**
```bash
GET /api/pessoas-fisicas/?search=João
GET /api/fotos/?search=documentos
```

**Django Implementation:**
```python
from rest_framework.filters import SearchFilter, OrderingFilter

class PessoaFisicaViewSet(ModelViewSet):
    queryset = PessoaFisica.objects.all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome', 'cpf', 'telefone1', 'ocupacao']
    ordering_fields = ['nome', 'created_at']
```

**Arquivos JS afetados:** main.js (busca por GOA - será mapeado em 2.2)

---

#### 2.2 `searchByGOA(goa)` → GET `/api/pessoas/?search_goa=GOAINV001`

**Atual (database.js):**
```javascript
const resultado = db.searchByGOA('GOAINV001');
// Retorna: { pessoa, tipo, table }
```

**Novo (API):**
```bash
GET /api/pessoas/?search_goa=GOAINV001
# OU busca unificada de PF e PJ
GET /api/pessoas/search-by-goa/?goa=GOAINV001
```

**Django Implementation:**
```python
from rest_framework.decorators import action
from rest_framework.response import Response

class PessoaViewSet(ModelViewSet):
    queryset = Pessoa.objects.all()
    
    @action(detail=False, methods=['get'])
    def search_by_goa(self, request):
        """
        GET /api/pessoas/search-by-goa/?goa=GOAINV001
        Busca pessoa (física ou jurídica) por GOA
        """
        goa = request.query_params.get('goa', '').strip().upper()
        
        if not goa:
            return Response({'erro': 'GOA obrigatório'}, status=400)
        
        pessoa = Pessoa.objects.filter(goa=goa).first()
        
        if not pessoa:
            return Response({'erro': 'GOA não encontrado'}, status=404)
        
        if pessoa.tipo == 'F':
            serializer = PessoaFisicaDetailSerializer(pessoa.fisica)
        else:
            serializer = PessoaJuridicaDetailSerializer(pessoa.juridica)
        
        return Response({
            'pessoa': serializer.data,
            'tipo': pessoa.get_tipo_display(),
            'goa': pessoa.goa
        })
```

**Arquivos JS afetados:** main.js (764, 767)

---

#### 2.3 `searchByGOAPrefix(prefixo)` → GET `/api/pessoas/?search_goa_prefix=GOAINV`

**Atual (database.js):**
```javascript
const resultados = db.searchByGOAPrefix('GOAINV');
// Retorna: array de { pessoa, tipo, table }
```

**Novo (API):**
```bash
GET /api/pessoas/search-by-goa-prefix/?prefix=GOAINV
```

**Django Implementation:**
```python
class PessoaViewSet(ModelViewSet):
    @action(detail=False, methods=['get'])
    def search_by_goa_prefix(self, request):
        """
        GET /api/pessoas/search-by-goa-prefix/?prefix=GOAINV
        Busca todas as pessoas que começam com prefixo GOA
        """
        prefixo = request.query_params.get('prefix', '').strip().upper()
        
        if not prefixo or len(prefixo) < 4:
            return Response({'erro': 'Prefixo mínimo 4 caracteres'}, status=400)
        
        pessoas = Pessoa.objects.filter(goa__istartswith=prefixo)
        
        resultados = []
        for pessoa in pessoas:
            if pessoa.tipo == 'F':
                resultados.append({
                    'pessoa': PessoaFisicaSerializer(pessoa.fisica).data,
                    'tipo': 'F',
                    'goa': pessoa.goa
                })
            else:
                resultados.append({
                    'pessoa': PessoaJuridicaSerializer(pessoa.juridica).data,
                    'tipo': 'J',
                    'goa': pessoa.goa
                })
        
        return Response({
            'total': len(resultados),
            'resultados': resultados
        })
```

---

#### 2.4 `goaExists(goa, excludeId, excludeTable)` → GET `/api/pessoas/validate-goa/`

**Atual (database.js):**
```javascript
const existe = db.goaExists('GOAINV001', 123, 'pessoa_fisica');
// Validação durante cadastro
```

**Novo (API):**
```bash
GET /api/pessoas/validate-goa/?goa=GOAINV001&exclude_id=123
```

**Django Implementation:**
```python
class PessoaViewSet(ModelViewSet):
    @action(detail=False, methods=['get'])
    def validate_goa(self, request):
        """
        GET /api/pessoas/validate-goa/?goa=GOAINV001&exclude_id=123
        Verifica se GOA já existe (exclui um ID específico)
        """
        goa = request.query_params.get('goa', '').strip().upper()
        exclude_id = request.query_params.get('exclude_id')
        
        if not goa:
            return Response({'valido': True, 'mensagem': 'GOA opcional'})
        
        # Validar formato
        validation = validate_goa_format(goa)
        if not validation['valid']:
            return Response({'valido': False, 'mensagem': validation['message']})
        
        # Verificar existência
        query = Pessoa.objects.filter(goa=goa)
        if exclude_id:
            query = query.exclude(id=exclude_id)
        
        existe = query.exists()
        
        return Response({
            'valido': not existe,
            'existe': existe,
            'goa': goa,
            'mensagem': 'GOA já cadastrado' if existe else 'GOA disponível'
        })
```

---

#### 2.5 `nameExists(nome, tipo, excludeId)` → GET `/api/pessoas/validate-name/`

**Atual (database.js):**
```javascript
const result = db.nameExists('João Silva', 'fisica', 123);
// Retorna: { exists, similar, pessoa, similaridade }
```

**Novo (API):**
```bash
GET /api/pessoas/validate-name/?nome=João+Silva&tipo=F&exclude_id=123
```

**Django Implementation:**
```python
from difflib import SequenceMatcher

class PessoaViewSet(ModelViewSet):
    @action(detail=False, methods=['get'])
    def validate_name(self, request):
        """
        GET /api/pessoas/validate-name/?nome=João+Silva&tipo=F&exclude_id=123
        Verifica duplicidade de nome (exato e similar)
        """
        nome = request.query_params.get('nome', '').strip()
        tipo = request.query_params.get('tipo', 'F')  # F ou J
        exclude_id = request.query_params.get('exclude_id')
        
        if not nome or len(nome) < 3:
            return Response({'valido': True, 'existe': False})
        
        if tipo == 'F':
            campo = 'fisica__nome'
            model = PessoaFisica
        else:
            campo = 'juridica__razao_social'
            model = PessoaJuridica
        
        # Busca exata
        query = Pessoa.objects.filter(tipo=tipo, **{f'{campo}__iexact': nome})
        if exclude_id:
            query = query.exclude(id=exclude_id)
        
        exato = query.first()
        if exato:
            return Response({
                'existe': True,
                'exato': True,
                'pessoa': model.objects.get(pessoa_id=exato.id),
                'similaridade': 100
            })
        
        # Busca similar (85%+)
        pessoas = model.objects.all()
        if exclude_id:
            pessoas = pessoas.exclude(pessoa_id=exclude_id)
        
        for pessoa in pessoas:
            pessoa_nome = pessoa.nome if tipo == 'F' else pessoa.razao_social
            similarity = SequenceMatcher(None, nome.lower(), pessoa_nome.lower()).ratio() * 100
            
            if similarity >= 85:
                return Response({
                    'existe': False,
                    'similar': True,
                    'pessoa': PessoaFisicaSerializer(pessoa).data if tipo == 'F' else PessoaJuridicaSerializer(pessoa).data,
                    'similaridade': round(similarity, 2)
                })
        
        return Response({
            'existe': False,
            'similar': False,
            'disponivel': True
        })
```

---

#### 2.6 `count(table)` → GET `/api/{resource}/count/`

**Atual (database.js):**
```javascript
const totalPF = db.count('pessoa_fisica');
const totalPJ = db.count('pessoa_juridica');
const totalFotos = db.count('fotos');
```

**Novo (API):**
```bash
GET /api/pessoas-fisicas/count/
GET /api/pessoas-juridicas/count/
GET /api/fotos/count/
```

**Django Implementation:**
```python
class PessoaFisicaViewSet(ModelViewSet):
    @action(detail=False, methods=['get'])
    def count(self, request):
        """
        GET /api/pessoas-fisicas/count/
        Retorna quantidade total
        """
        return Response({
            'total': self.queryset.count()
        })
```

**Arquivos JS afetados:** forms.js (109, 113), main.js (281-284, 491)

---

### 3. RELACIONAMENTOS E FOTOS

#### 3.1 `getRelacionamentos(pessoaId, tipoPessoa)` → GET `/api/pessoas/{id}/relacionamentos/`

**Atual (database.js):**
```javascript
const relacionamentos = db.getRelacionamentos(123, 'fisica');
// Retorna relacionamentos onde pessoa está envolvida
```

**Novo (API):**
```bash
GET /api/pessoas/123/relacionamentos/
```

**Django Implementation:**
```python
class PessoaViewSet(ModelViewSet):
    @action(detail=True, methods=['get'])
    def relacionamentos(self, request, pk=None):
        """
        GET /api/pessoas/{id}/relacionamentos/
        Retorna relacionamentos da pessoa (entrada ou saída)
        """
        pessoa = self.get_object()
        
        relacionamentos = Relacionamento.objects.filter(
            models.Q(pessoa_origem_id=pessoa.id) |
            models.Q(pessoa_destino_id=pessoa.id)
        )
        
        serializer = RelacionamentoSerializer(relacionamentos, many=True)
        return Response(serializer.data)
```

---

#### 3.2 `getFotosPessoa(pessoaId, tipoPessoa)` → GET `/api/pessoas/{id}/fotos/`

**Atual (database.js):**
```javascript
const fotos = db.getFotosPessoa(123, 'fisica');
// Retorna fotos associadas à pessoa
```

**Novo (API):**
```bash
GET /api/pessoas/123/fotos/
```

**Django Implementation:**
```python
class PessoaViewSet(ModelViewSet):
    @action(detail=True, methods=['get'])
    def fotos(self, request, pk=None):
        """
        GET /api/pessoas/{id}/fotos/
        Retorna fotos da pessoa
        """
        pessoa = self.get_object()
        fotos = Foto.objects.filter(pessoa_id=pessoa.id)
        
        serializer = FotoSerializer(fotos, many=True)
        return Response(serializer.data)
```

---

#### 3.3 CRUD de Fotos

**API Endpoints:**
```bash
# Criar foto
POST /api/fotos/
{
    "pessoa_id": 123,
    "descricao": "Documento de identificação",
    "arquivo": <binary>,
    "tipo_arquivo": "image/jpeg"
}

# Listar fotos
GET /api/fotos/?pessoa_id=123

# Detalhes foto
GET /api/fotos/456/

# Deletar foto
DELETE /api/fotos/456/
```

**Arquivos JS afetados:** fotos.js (250, 367, 400, 474, 610, 648, 663, 693, 729, 958)

---

### 4. PROCESSAMENTOS AUTOMÁTICOS

#### 4.1 `findAutoRelationships(pessoaId, tipoPessoa)` → POST `/api/pessoas/{id}/analisar-relacionamentos/`

**Atual (database.js):**
```javascript
const relacionamentos = db.findAutoRelationships(123, 'fisica');
// Análise local baseada em dados
```

**Novo (API):**
```bash
POST /api/pessoas/123/analisar-relacionamentos/
```

**Django Implementation:**
```python
from django.db.models import Q

class PessoaViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def analisar_relacionamentos(self, request, pk=None):
        """
        POST /api/pessoas/{id}/analisar-relacionamentos/
        Análise automática de relacionamentos da pessoa
        
        Retorna:
        - Relacionamentos familiares (mesmo sobrenome, pai/mãe)
        - Relacionamentos empresariais (mesmo CNPJ)
        - Relacionamentos por endereço
        - Relacionamentos por telefone
        - Sócios (se pessoa jurídica)
        """
        pessoa = self.get_object()
        
        relacionamentos_encontrados = []
        
        if pessoa.tipo == 'F':
            # Análise familiar
            pf = pessoa.fisica
            
            # 1. Mesmo sobrenome
            sobrenome = pf.nome.split()[-1] if pf.nome else None
            if sobrenome:
                outras = PessoaFisica.objects.filter(
                    pessoa__tipo='F',
                    nome__iendswith=f' {sobrenome}'
                ).exclude(id=pf.id)
                
                for outra in outras:
                    relacionamentos_encontrados.append({
                        'tipo': 'parente',
                        'pessoa_origem_id': pessoa.id,
                        'pessoa_destino_id': outra.pessoa.id,
                        'motivo': f'Mesmo sobrenome: {sobrenome}',
                        'confianca': 60
                    })
            
            # 2. Empresarial (mesmo CNPJ empresa)
            if pf.cnpj_empresa:
                outras_pf = PessoaFisica.objects.filter(
                    cnpj_empresa=pf.cnpj_empresa
                ).exclude(id=pf.id)
                
                for outra in outras_pf:
                    relacionamentos_encontrados.append({
                        'tipo': 'empresarial',
                        'pessoa_origem_id': pessoa.id,
                        'pessoa_destino_id': outra.pessoa.id,
                        'motivo': f'Mesmo CNPJ: {pf.cnpj_empresa}',
                        'confianca': 90
                    })
        
        else:
            # Análise para pessoa jurídica - sócios
            pj = pessoa.juridica
            
            # Verificar sócios
            socios = SocioEmpresa.objects.filter(empresa_id=pessoa.id)
            for socio in socios:
                relacionamentos_encontrados.append({
                    'tipo': 'socio',
                    'pessoa_origem_id': pessoa.id,
                    'pessoa_destino_id': socio.pessoa_id,
                    'motivo': f'Sócio: {socio.nome}',
                    'confianca': 85
                })
        
        return Response({
            'pessoa_id': pessoa.id,
            'total_encontrados': len(relacionamentos_encontrados),
            'relacionamentos': relacionamentos_encontrados
        })
```

---

#### 4.2 `analyzeAllDataAndCreateRelationships()` → POST `/api/analise/processar-todos/`

**Atual (database.js):**
```javascript
const resultado = db.analyzeAllDataAndCreateRelationships();
// Análise completa de TODAS as pessoas
```

**Novo (API):**
```bash
POST /api/analise/processar-todos/

Response:
{
    "sucesso": true,
    "total_analisados": 250,
    "relacionamentos_encontrados": 1847,
    "resumo": {
        "familares": 450,
        "empresariais": 800,
        "endereco": 350,
        "telefone": 247
    }
}
```

**Django Implementation:**
```python
from rest_framework.views import APIView
from celery import shared_task  # Para processamento assíncrono

class AnaliseViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        POST /api/analise/processar-todos/
        Inicia análise de relacionamentos para todas as pessoas
        """
        # Opção 1: Síncrono (rápido para pouco dados)
        if request.data.get('async', False):
            # Opção 2: Assíncrono com Celery (para muitos dados)
            task = analyze_all_data.delay()
            return Response({
                'task_id': task.id,
                'status': 'processing'
            }, status=202)
        
        # Executar análise
        resultado = executar_analise_completa()
        return Response(resultado)


@shared_task
def analyze_all_data():
    """Tarefa assíncrona de análise de todos os dados"""
    pessoas = Pessoa.objects.all()
    relacionamentos_encontrados = []
    
    for pessoa in pessoas:
        # Análise similar à anterior
        pass
    
    return {
        'total_analisados': len(pessoas),
        'relacionamentos_encontrados': len(relacionamentos_encontrados)
    }
```

---

### 5. ADMINISTRAÇÃO E MANUTENÇÃO

#### 5.1 `exportData()` → GET `/api/exportacao/backup/`

**Atual (database.js):**
```javascript
const data = db.exportData();
// Retorna JSON string com todos os dados
```

**Novo (API):**
```bash
GET /api/exportacao/backup/

Response: JSON com estrutura:
{
    "pessoa_fisica": [...],
    "pessoa_juridica": [...],
    "fotos": [...],
    "relacionamentos": [...],
    "exported_at": "2025-01-04T12:30:00Z"
}
```

**Django Implementation:**
```python
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import FileResponse
import json
from datetime import datetime

class ExportacaoViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def backup(self, request):
        """
        GET /api/exportacao/backup/
        Exporta todos os dados em JSON
        """
        dados = {
            'pessoa_fisica': PessoaFisicaSerializer(
                PessoaFisica.objects.all(), many=True
            ).data,
            'pessoa_juridica': PessoaJuridicaSerializer(
                PessoaJuridica.objects.all(), many=True
            ).data,
            'fotos': FotoSerializer(
                Foto.objects.all(), many=True
            ).data,
            'relacionamentos': RelacionamentoSerializer(
                Relacionamento.objects.all(), many=True
            ).data,
            'exported_at': datetime.now().isoformat()
        }
        
        return Response(dados)
    
    @action(detail=False, methods=['get'])
    def backup_arquivo(self, request):
        """
        GET /api/exportacao/backup-arquivo/
        Retorna backup como arquivo JSON downloadável
        """
        dados = {...}  # Similar acima
        
        response = FileResponse(
            json.dumps(dados, indent=2, ensure_ascii=False).encode('utf-8'),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="backup.json"'
        return response
```

**Arquivos JS afetados:** main.js (637), backup.js (153)

---

#### 5.2 `importData(jsonData)` → POST `/api/exportacao/restaurar/`

**Atual (database.js):**
```javascript
const success = db.importData(jsonData);
// Restaura dados do localStorage
```

**Novo (API):**
```bash
POST /api/exportacao/restaurar/
Content-Type: application/json

{
    "pessoa_fisica": [...],
    "pessoa_juridica": [...],
    "fotos": [...],
    "relacionamentos": [...]
}
```

**Django Implementation:**
```python
class ExportacaoViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def restaurar(self, request):
        """
        POST /api/exportacao/restaurar/
        Importa dados de backup (com validação de integridade)
        """
        dados = request.data
        
        try:
            # Validar estrutura
            if 'pessoa_fisica' not in dados or 'pessoa_juridica' not in dados:
                return Response(
                    {'erro': 'Formato de backup inválido'},
                    status=400
                )
            
            # Restaurar (com transação para segurança)
            from django.db import transaction
            
            with transaction.atomic():
                # Limpar dados existentes (opcional)
                if request.data.get('clear_existing', False):
                    PessoaFisica.objects.all().delete()
                    PessoaJuridica.objects.all().delete()
                
                # Importar dados
                for pf_data in dados['pessoa_fisica']:
                    serializer = PessoaFisicaSerializer(data=pf_data)
                    if serializer.is_valid():
                        serializer.save()
                
                # Similar para outros
            
            return Response({
                'sucesso': True,
                'mensagem': 'Backup restaurado com sucesso'
            })
        
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=500
            )
```

**Arquivos JS afetados:** main.js (661), backup.js

---

#### 5.3 `clear(table)` → DELETE `/api/{resource}/limpar/`

**Atual (database.js):**
```javascript
db.clear('pessoa_fisica');
db.clear('fotos');
```

**Novo (API):**
```bash
DELETE /api/pessoas-fisicas/limpar/
DELETE /api/fotos/limpar/
```

**Django Implementation:**
```python
class PessoaFisicaViewSet(ModelViewSet):
    @action(detail=False, methods=['delete'])
    def limpar(self, request):
        """
        DELETE /api/pessoas-fisicas/limpar/
        Deleta todos os registros (CUIDADO!)
        """
        # Confirmação adicional
        if not request.data.get('confirm', False):
            return Response(
                {'erro': 'Confirmação necessária (confirm=true)'},
                status=400
            )
        
        quantidade = self.queryset.count()
        self.queryset.delete()
        
        return Response({
            'sucesso': True,
            'registros_deletados': quantidade
        })
```

---

#### 5.4 `resetDatabase()` → POST `/api/administracao/reset/`

**Atual (database.js):**
```javascript
db.resetDatabase();
// Limpa TODOS os dados e reseta contadores
```

**Novo (API):**
```bash
POST /api/administracao/reset/
Content-Type: application/json

{
    "senha_admin": "senha_confirmacao"
}
```

**Django Implementation:**
```python
class AdministracaoViewSet(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        """
        POST /api/administracao/reset/
        PERIGO: Reseta TODO o banco de dados
        Requer confirmação e autenticação admin
        """
        if not request.user.is_admin:
            return Response(
                {'erro': 'Apenas administradores'},
                status=403
            )
        
        senha = request.data.get('senha_admin')
        if not request.user.check_password(senha):
            return Response(
                {'erro': 'Senha incorreta'},
                status=401
            )
        
        from django.db import transaction
        
        with transaction.atomic():
            PessoaFisica.objects.all().delete()
            PessoaJuridica.objects.all().delete()
            Foto.objects.all().delete()
            Relacionamento.objects.all().delete()
        
        return Response({
            'sucesso': True,
            'mensagem': 'Banco resetado completamente'
        })
```

---

#### 5.5 `validateGOAFormat(goa)` → GET `/api/validacao/formato-goa/`

**Atual (database.js):**
```javascript
const validacao = db.validateGOAFormat('GOAINV001');
// Retorna: { valid, message, prefixo, numero, descricao }
```

**Novo (API):**
```bash
GET /api/validacao/formato-goa/?goa=GOAINV001
```

**Django Implementation:**
```python
# Mover a função para utils.py
# core/utils.py
def validate_goa_format(goa):
    """Valida formato GOA com prefixos"""
    if not goa:
        return {'valid': True, 'message': ''}
    
    goa = goa.strip().upper()
    
    prefixos_validos = {
        'GOAINV': 'Investigação',
        'GOADEN': 'Denúncia',
        'GOACIV': 'Processo Civil',
        # ... outros
    }
    
    if len(goa) < 8:
        return {'valid': False, 'message': 'GOA mínimo 8 caracteres'}
    
    prefixo = goa[:6]
    numero = goa[6:]
    
    if prefixo not in prefixos_validos:
        return {'valid': False, 'message': f'Prefixo inválido'}
    
    if not numero.isdigit():
        return {'valid': False, 'message': 'Número deve ser dígito'}
    
    return {
        'valid': True,
        'message': f'GOA válido',
        'prefixo': prefixo,
        'numero': numero,
        'descricao': prefixos_validos[prefixo]
    }

# core/views.py
class ValidacaoViewSet(APIView):
    @action(detail=False, methods=['get'])
    def formato_goa(self, request):
        """
        GET /api/validacao/formato-goa/?goa=GOAINV001
        Valida formato do GOA
        """
        goa = request.query_params.get('goa', '')
        resultado = validate_goa_format(goa)
        return Response(resultado)
```

---

### 6. ANÁLISE INTELIGENTE COM vw_rede_pessoa

#### 6.1 Visualização da Rede de Pessoas

**VIEW SQL existente:**
```sql
CREATE OR REPLACE VIEW vw_rede_pessoa AS
SELECT
    p.id AS pessoa_central_id,
    p.tipo AS tipo_central,
    COALESCE(pf.nome, pj.razao_social) AS nome_central,
    r.tipo_relacionamento,
    r.participacao,
    p2.id AS pessoa_relacionada_id,
    p2.tipo AS tipo_relacionada,
    COALESCE(pf2.nome, pj2.razao_social) AS nome_relacionado,
    r.fonte_importacao,
    r.created_at
FROM pessoa p
LEFT JOIN relacionamento r ON r.pessoa_origem_id = p.id OR r.pessoa_destino_id = p.id
LEFT JOIN pessoa p2 ON ...
```

**API Endpoint:**
```bash
GET /api/rede/pessoa/{id}/
GET /api/rede/grafo/
GET /api/rede/analise/?pessoa_id=123&profundidade=3
```

**Django Implementation:**
```python
from django.db.models import Q

class RedeViewSet(APIView):
    
    @action(detail=False, methods=['get'])
    def grafo(self, request):
        """
        GET /api/rede/grafo/
        Retorna dados para visualização de grafo (D3.js, vis.js)
        """
        pessoas = Pessoa.objects.all()
        relacionamentos = Relacionamento.objects.all()
        
        nodes = []
        for pessoa in pessoas:
            if pessoa.tipo == 'F':
                nome = pessoa.fisica.nome
                cor = '#3498db'
            else:
                nome = pessoa.juridica.razao_social
                cor = '#e74c3c'
            
            nodes.append({
                'id': pessoa.id,
                'label': nome,
                'type': pessoa.tipo,
                'color': cor
            })
        
        edges = []
        for rel in relacionamentos:
            edges.append({
                'from': rel.pessoa_origem_id,
                'to': rel.pessoa_destino_id,
                'label': rel.tipo_relacionamento,
                'confianca': rel.confianca
            })
        
        return Response({
            'nodes': nodes,
            'edges': edges
        })
    
    @action(detail=False, methods=['get'])
    def analise(self, request):
        """
        GET /api/rede/analise/?pessoa_id=123&profundidade=3
        Análise de rede com profundidade
        """
        pessoa_id = request.query_params.get('pessoa_id')
        profundidade = int(request.query_params.get('profundidade', 2))
        
        pessoas_rede = self._buscar_rede(pessoa_id, profundidade)
        
        return Response({
            'pessoa_central_id': pessoa_id,
            'profundidade': profundidade,
            'total_pessoas': len(pessoas_rede),
            'pessoas': pessoas_rede
        })
    
    def _buscar_rede(self, pessoa_id, profundidade, visitados=None):
        """BFS para encontrar rede de pessoas"""
        if visitados is None:
            visitados = set()
        
        # Implementar busca em profundidade
        pass
```

---

## 📊 RESUMO DE ENDPOINTS

### Tabela de Rotas

| Função database.js | Método | Endpoint | Status |
|---|---|---|---|
| insert | POST | `/api/{resource}/` | ✅ |
| getAll | GET | `/api/{resource}/` | ✅ |
| getById | GET | `/api/{resource}/{id}/` | ✅ |
| update | PATCH/PUT | `/api/{resource}/{id}/` | ✅ |
| delete | DELETE | `/api/{resource}/{id}/` | ✅ |
| search | GET | `/api/{resource}/?search=termo` | ✅ |
| count | GET | `/api/{resource}/count/` | ✅ |
| searchByGOA | GET | `/api/pessoas/search-by-goa/?goa=...` | ✅ |
| searchByGOAPrefix | GET | `/api/pessoas/search-by-goa-prefix/?prefix=...` | ✅ |
| goaExists | GET | `/api/pessoas/validate-goa/?goa=...` | ✅ |
| nameExists | GET | `/api/pessoas/validate-name/?nome=...` | ✅ |
| getRelacionamentos | GET | `/api/pessoas/{id}/relacionamentos/` | ✅ |
| getFotosPessoa | GET | `/api/pessoas/{id}/fotos/` | ✅ |
| findAutoRelationships | POST | `/api/pessoas/{id}/analisar-relacionamentos/` | ✅ |
| analyzeAllDataAndCreateRelationships | POST | `/api/analise/processar-todos/` | ✅ |
| exportData | GET | `/api/exportacao/backup/` | ✅ |
| importData | POST | `/api/exportacao/restaurar/` | ✅ |
| clear | DELETE | `/api/{resource}/limpar/` | ✅ |
| resetDatabase | POST | `/api/administracao/reset/` | ✅ |
| validateGOAFormat | GET | `/api/validacao/formato-goa/` | ✅ |

---

## 🔗 URLS CONFIGURATION

```python
# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pessoas', views.PessoaViewSet)
router.register(r'pessoas-fisicas', views.PessoaFisicaViewSet)
router.register(r'pessoas-juridicas', views.PessoaJuridicaViewSet)
router.register(r'enderecos', views.EnderecoViewSet)
router.register(r'fotos', views.FotoViewSet)
router.register(r'relacionamentos', views.RelacionamentoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Endpoints customizados
    path('api/rede/', include('core.urls.rede')),
    path('api/analise/', include('core.urls.analise')),
    path('api/exportacao/', include('core.urls.exportacao')),
    path('api/validacao/', include('core.urls.validacao')),
    path('api/administracao/', include('core.urls.administracao')),
]
```

---

## 📱 CONSUMO NO FRONTEND

### Substituição de chamadas database.js

**Antes:**
```javascript
const pessoas = db.getAll('pessoa_fisica');
```

**Depois:**
```javascript
const response = await fetch('/api/pessoas-fisicas/', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
const pessoas = await response.json();
```

**Com ApiClient (recomendado):**
```javascript
// core/static/core/js/api-client.js
class ApiClient {
    async get(endpoint) {
        return this.request('GET', endpoint);
    }
    
    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }
    
    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`/api${endpoint}`, options);
        return response.json();
    }
}

// Uso
const api = new ApiClient();
const pessoas = await api.get('/pessoas-fisicas/');
```

---

## ⚠️ CONSIDERAÇÕES DE MIGRAÇÃO

1. **Autenticação**: Adicionar `IsAuthenticated` em todas as views
2. **Paginação**: Implementar `PageNumberPagination` para listas grandes
3. **Rate Limiting**: Adicionar `throttle` para proteção
4. **Logging**: Registrar todas as ações críticas
5. **Validação**: Usar serializers Django para validação automática
6. **Testes**: Criar testes unitários para cada endpoint
7. **Performance**: Adicionar índices de banco para consultas frequentes
8. **Documentação**: Usar DRF documentation para auto-documentação

---

## 📝 PRÓXIMAS ETAPAS

1. ✅ Criar ViewSets base
2. ⬜ Implementar Actions customizadas
3. ⬜ Criar Serializers com validação
4. ⬜ Adicionar SearchFilter
5. ⬜ Implementar análise automática assíncrona
6. ⬜ Criar testes automatizados
7. ⬜ Documentar API com Swagger/OpenAPI
8. ⬜ Migrar frontend para consumir API

