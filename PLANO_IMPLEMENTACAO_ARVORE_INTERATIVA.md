# Plano de Implementação Detalhado - Árvore Interativa de Relacionamentos

## 📋 Visão Geral

Este documento detalha o plano de implementação para o sistema de árvore interativa de relacionamentos, incluindo 35+ funções especializadas organizadas em 6 categorias principais.

---

## 🎯 Categoria 1: Busca & Navegação

### 🔍 `pesquisarEExibirPessoaNaArvore()`

**Objetivo**: Função principal que coordena busca, criação de relacionamentos e exibição focada na árvore.

**Parâmetros**: 
- Nenhum (lê do input `#busca-arvore`)

**Retorno**: 
- `void` (atualiza interface)

**Implementação**:
```javascript
async function pesquisarEExibirPessoaNaArvore() {
    // 1. Validar input (min 2 chars)
    // 2. Mostrar loading
    // 3. Buscar pessoa via buscarPessoaPorTermo()
    // 4. Criar relacionamentos automáticos
    // 5. Renderizar árvore focada
    // 6. Exibir resultado com estatísticas
    // 7. Centralizar pessoa encontrada
}
```

**Dependências**:
- `buscarPessoaPorTermo()`
- `criarRelacionamentosParaPessoa()`
- `renderizarArvoreComFoco()`
- `centralizarPessoaNaArvore()`

**Prioridade**: 🔴 Alta

---

### 🎯 `buscarPessoaPorTermo(termo)`

**Objetivo**: Buscar pessoa específica por nome, CPF, CNPJ ou GOA com score de relevância.

**Parâmetros**:
- `termo` (string): Texto para busca

**Retorno**:
```javascript
{
    id: number,
    tipo: 'fisica'|'juridica',
    tabela: 'pessoa_fisica'|'pessoa_juridica',
    dados: Object,
    score: number
} | null
```

**Implementação**:
```javascript
async function buscarPessoaPorTermo(termo) {
    // 1. Normalizar termo (toLowerCase, remover caracteres especiais)
    // 2. Buscar em pessoas físicas
    // 3. Buscar em pessoas jurídicas  
    // 4. Calcular score para cada match
    // 5. Retornar melhor resultado
}
```

**Dependências**:
- `api.listarPessoasFisicas()`
- `api.listarPessoasJuridicas()`
- `calcularScoreBusca()`

**Prioridade**: 🔴 Alta

---

### 📊 `calcularScoreBusca(pessoa, termo, tipo)`

**Objetivo**: Calcular score de relevância (0-100) para ranking de resultados.

**Parâmetros**:
- `pessoa` (Object): Dados da pessoa
- `termo` (string): Termo pesquisado
- `tipo` (string): 'fisica' ou 'juridica'

**Retorno**: `number` (0-100)

**Implementação**:
```javascript
function calcularScoreBusca(pessoa, termo, tipo) {
    let score = 0;
    // Match exato nome: +100
    // Começa com termo: +80  
    // Contém termo: +60
    // Match GOA: +20
    // Match documento: +15
    return score;
}
```

**Dependências**: Nenhuma

**Prioridade**: 🟡 Média

---

### 🔗 `obterRelacionamentosDaPessoa(pessoaId, tipoPessoa)`

**Objetivo**: Buscar todos os relacionamentos de uma pessoa específica.

**Parâmetros**:
- `pessoaId` (number): ID da pessoa
- `tipoPessoa` (string): 'fisica' ou 'juridica'

**Retorno**: `Array<Relacionamento>`

**Implementação**:
```javascript
async function obterRelacionamentosDaPessoa(pessoaId, tipoPessoa) {
    // 1. Buscar todos relacionamentos
    // 2. Filtrar por pessoa (origem OU destino)
    // 3. Retornar array filtrado
}
```

**Dependências**:
- `api.listarRelacionamentos()`

**Prioridade**: 🔴 Alta

---

### 🎨 `renderizarArvoreComFoco(pessoaEncontrada)`

**Objetivo**: Renderizar árvore focada apenas na pessoa encontrada e seus relacionamentos.

**Parâmetros**:
- `pessoaEncontrada` (Object): Dados da pessoa principal

**Retorno**: `void`

**Implementação**:
```javascript
async function renderizarArvoreComFoco(pessoaEncontrada) {
    // 1. Limpar container
    // 2. Preparar dados focados
    // 3. Criar SVG com destaque especial
    // 4. Configurar simulação centrada
    // 5. Posicionar pessoa principal no centro
    // 6. Criar elementos com destaque visual
}
```

**Dependências**:
- `prepararDadosComFoco()`
- `criarElementosComDestaque()`
- D3.js

**Prioridade**: 🔴 Alta

---

### 📋 `prepararDadosComFoco(pessoaEncontrada)`

**Objetivo**: Preparar estrutura de dados focada apenas na pessoa e relacionados diretos.

**Parâmetros**:
- `pessoaEncontrada` (Object): Dados da pessoa principal

**Retorno**:
```javascript
{
    nodes: Array<Node>,
    links: Array<Link>
}
```

**Implementação**:
```javascript
async function prepararDadosComFoco(pessoaEncontrada) {
    // 1. Criar nó principal (isPrincipal: true)
    // 2. Buscar relacionamentos da pessoa
    // 3. Adicionar nós relacionados
    // 4. Criar links entre nós
    // 5. Retornar estrutura D3
}
```

**Dependências**:
- `obterRelacionamentosDaPessoa()`
- `obterInfoPessoa()`

**Prioridade**: 🔴 Alta

---

### 🎯 `centralizarPessoaNaArvore(nodeId)`

**Objetivo**: Centralizar e destacar visualmente uma pessoa específica na árvore.

**Parâmetros**:
- `nodeId` (string): ID do nó (formato: "tipo_id")

**Retorno**: `void`

**Implementação**:
```javascript
function centralizarPessoaNaArvore(nodeId) {
    // 1. Encontrar nó no SVG
    // 2. Calcular transformação para centro
    // 3. Aplicar zoom/pan animado
    // 4. Destacar visualmente (stroke, animação)
    // 5. Remover destaque após delay
}
```

**Dependências**:
- D3.js (zoom, transitions)

**Prioridade**: 🟡 Média

---

## 🖱️ Categoria 2: Interface Interativa

### 📝 `mostrarMenuNoSimples(no, event)`

**Objetivo**: Exibir menu contextual ao clicar em um nó da árvore.

**Parâmetros**:
- `no` (Object): Dados do nó clicado
- `event` (Event): Evento do mouse

**Retorno**: `void`

**Implementação**:
```javascript
function mostrarMenuNoSimples(no, event) {
    // 1. Prevenir propagação
    // 2. Criar menu contextual HTML
    // 3. Posicionar próximo ao cursor
    // 4. Adicionar opções dinâmicas baseadas no tipo
    // 5. Event listeners para cada ação
}
```

**Opções do Menu**:
- 👁️ Ver Detalhes
- 🔗 Criar Novo Vínculo
- 📷 Adicionar Foto
- 🎨 Personalizar Cor
- ➕ Expandir Vínculos
- ❌ Remover da Árvore

**Dependências**: 
- `verDetalhes()`
- `criarNovoVinculoSimples()`
- `adicionarFotoSimples()`

**Prioridade**: 🟡 Média

---

### 📈 `toggleExpansaoNoSimples(no)`

**Objetivo**: Expandir/recolher vínculos de um nó específico.

**Parâmetros**:
- `no` (Object): Dados do nó

**Retorno**: `void`

**Implementação**:
```javascript
function toggleExpansaoNoSimples(no) {
    // 1. Verificar estado atual (expandido/recolhido)
    // 2. Toggle no Set nosExpandidos
    // 3. Buscar novos relacionamentos se expandindo
    // 4. Re-renderizar árvore
    // 5. Mostrar notificação
}
```

**Dependências**:
- `nosExpandidos` (Set global)
- `renderizarArvoreInterativa()`

**Prioridade**: 🟡 Média

---

### ➕ `criarNovoVinculoSimples(no)`

**Objetivo**: Interface simplificada para criar relacionamento a partir de um nó.

**Parâmetros**:
- `no` (Object): Nó origem

**Retorno**: `void`

**Implementação**:
```javascript
async function criarNovoVinculoSimples(no) {
    // 1. Modal/form com busca de pessoa destino
    // 2. Select para tipo de relacionamento
    // 3. Campo descrição opcional
    // 4. Validar dados
    // 5. Criar relacionamento via API
    // 6. Atualizar árvore
}
```

**Dependências**:
- `api.criarRelacionamento()`
- `buscarPessoaPorTermo()` (para destino)

**Prioridade**: 🟡 Média

---

### 🎨 `personalizarCorSimples(no)`

**Objetivo**: Permitir personalização da cor de um nó específico.

**Parâmetros**:
- `no` (Object): Nó a personalizar

**Retorno**: `void`

**Implementação**:
```javascript
function personalizarCorSimples(no) {
    // 1. Modal com color picker
    // 2. Paleta de cores predefinidas
    // 3. Salvar em arvoreConfig.coresPersonalizadas
    // 4. Re-renderizar nó com nova cor
    // 5. Persistir em localStorage
}
```

**Dependências**:
- `arvoreConfig` (objeto global)
- Color picker library ou input[type=color]

**Prioridade**: 🟢 Baixa

---

### 📷 `adicionarFotoSimples(no)`

**Objetivo**: Adicionar foto personalizada a um nó.

**Parâmetros**:
- `no` (Object): Nó para adicionar foto

**Retorno**: `void`

**Implementação**:
```javascript
function adicionarFotoSimples(no) {
    // 1. Input file para upload
    // 2. Preview da imagem
    // 3. Redimensionar/crop se necessário
    // 4. Salvar em arvoreConfig.fotosPersonalizadas
    // 5. Re-renderizar nó com foto
}
```

**Dependências**:
- `arvoreConfig.fotosPersonalizadas` (Map)
- Canvas para redimensionamento

**Prioridade**: 🟢 Baixa

---

### 👤 `adicionarNovaPessoa(pessoaBase)`

**Objetivo**: Interface rápida para adicionar nova pessoa à árvore.

**Parâmetros**:
- `pessoaBase` (Object): Dados base para pré-preenchimento

**Retorno**: `void`

**Implementação**:
```javascript
function adicionarNovaPessoa(pessoaBase) {
    // 1. Modal com form simplificado
    // 2. Campos obrigatórios apenas
    // 3. Auto-preenchimento baseado em pessoaBase
    // 4. Criar pessoa via API
    // 5. Adicionar à árvore automaticamente
}
```

**Dependências**:
- `api.criarPessoaFisica()` ou `api.criarPessoaJuridica()`

**Prioridade**: 🟡 Média

---

### 🗑️ `removerVinculosPessoa(pessoa)`

**Objetivo**: Remover pessoa e todos seus vínculos da árvore.

**Parâmetros**:
- `pessoa` (Object): Dados da pessoa

**Retorno**: `void`

**Implementação**:
```javascript
async function removerVinculosPessoa(pessoa) {
    // 1. Confirmação com usuário
    // 2. Buscar todos relacionamentos da pessoa
    // 3. Deletar relacionamentos (não a pessoa)
    // 4. Re-renderizar árvore
    // 5. Mostrar estatísticas
}
```

**Dependências**:
- `obterRelacionamentosDaPessoa()`
- `api.deletarRelacionamento()`

**Prioridade**: 🟡 Média

---

## ⚙️ Categoria 3: Controles da Árvore

### 🚀 `inicializarArvoreInterativa()`

**Objetivo**: Função principal de inicialização do sistema.

**Parâmetros**: Nenhum

**Retorno**: `void`

**Implementação**:
```javascript
function inicializarArvoreInterativa() {
    // 1. Inicializar configurações globais
    // 2. Configurar event listeners
    // 3. Carregar dados iniciais
    // 4. Configurar controles da interface
    // 5. Renderizar árvore inicial
    // 6. Configurar auto-save/restore
}
```

**Dependências**: 
- `configurarControlesArvore()`
- `renderizarArvoreInterativa()`

**Prioridade**: 🔴 Alta

---

### 🌳 `renderizarArvoreInterativa()`

**Objetivo**: Função principal de renderização da árvore completa.

**Parâmetros**: Nenhum

**Retorno**: `void`

**Implementação**:
```javascript
async function renderizarArvoreInterativa() {
    // 1. Preparar dados completos
    // 2. Determinar layout ativo
    // 3. Configurar simulação D3
    // 4. Criar elementos visuais
    // 5. Configurar interações
    // 6. Aplicar configurações personalizadas
}
```

**Dependências**:
- `prepararDadosArvore()`
- `configurarSimulacao()`
- `criarElementosInterativos()`

**Prioridade**: 🔴 Alta

---

### 🎛️ `configurarControlesArvore()`

**Objetivo**: Configurar todos os controles da interface (zoom, layout, filtros).

**Parâmetros**: Nenhum

**Retorno**: `void`

**Implementação**:
```javascript
function configurarControlesArvore() {
    // 1. Botões de zoom (+, -, reset)
    // 2. Seletor de layout
    // 3. Controles de filtro
    // 4. Botões de exportação
    // 5. Toggle tela cheia
    // 6. Controles de busca
}
```

**Controles Incluídos**:
- 🔍 Busca inteligente
- 📐 Seletor de layout (9 tipos)
- 🔎 Zoom in/out/reset
- 🖥️ Toggle tela cheia
- 📤 Exportar árvore
- 🎨 Personalização visual
- 📊 Mostrar/ocultar estatísticas

**Prioridade**: 🟡 Média

---

### ⚡ `configurarSimulacao(dados, width, height)`

**Objetivo**: Configurar simulação física D3 baseada no layout ativo.

**Parâmetros**:
- `dados` (Object): {nodes, links}
- `width` (number): Largura do SVG
- `height` (number): Altura do SVG

**Retorno**: `d3.forceSimulation`

**Implementação**:
```javascript
function configurarSimulacao(dados, width, height) {
    // 1. Criar simulação base
    // 2. Adicionar forças baseadas no layout
    // 3. Configurar parâmetros de performance
    // 4. Definir eventos de tick
    // 5. Retornar simulação configurada
}
```

**Forças por Layout**:
- **Força**: charge, link, center, collision
- **Hierárquico**: dagre + força suave
- **Circular**: radial + angular
- **Radial**: radial crescente
- **Grade**: posicionamento fixo
- **Timeline**: força X temporal

**Prioridade**: 🔴 Alta

---

### 📐 `alterarLayoutArvore(layout)`

**Objetivo**: Trocar layout da árvore dinamicamente.

**Parâmetros**:
- `layout` (string): Tipo do layout

**Retorno**: `void`

**Layouts Disponíveis**:
1. `forca` - Layout de força padrão
2. `hierarquico` - Hierarquia top-down
3. `circular` - Nós em círculo
4. `radial` - Expansão radial
5. `grade` - Grid organizado
6. `agrupado` - Clusters por tipo
7. `timeline` - Linha temporal
8. `espiral` - Espiral matemática
9. `livre` - Posicionamento manual

**Implementação**:
```javascript
function alterarLayoutArvore(layout) {
    // 1. Validar layout
    // 2. Salvar preferência
    // 3. Re-configurar simulação
    // 4. Aplicar transição suave
    // 5. Atualizar UI
}
```

**Prioridade**: 🟡 Média

---

### 🔎 `ajustarZoom(fator)`

**Objetivo**: Ajustar zoom da árvore programaticamente.

**Parâmetros**:
- `fator` (number): Fator de zoom (0.1 - 5.0)

**Retorno**: `void`

**Implementação**:
```javascript
function ajustarZoom(fator) {
    // 1. Validar fator (min/max)
    // 2. Aplicar transformação D3
    // 3. Animação suave
    // 4. Atualizar controles UI
}
```

**Prioridade**: 🟢 Baixa

---

### 🔄 `resetarZoom()`

**Objetivo**: Resetar zoom e centralizar árvore.

**Parâmetros**: Nenhum

**Retorno**: `void`

**Implementação**:
```javascript
function resetarZoom() {
    // 1. Calcular centro da árvore
    // 2. Aplicar zoom 1.0 + centro
    // 3. Animação suave
}
```

**Prioridade**: 🟢 Baixa

---

## 📐 Categoria 4: Layouts Especializados

### ⚡ `configurarLayoutForca(dados, width, height)`

**Objetivo**: Layout padrão com simulação de forças física.

**Características**:
- Nós se repelem mutuamente
- Links mantêm distância ideal
- Centro gravitacional
- Colisões evitadas

**Implementação**:
```javascript
function configurarLayoutForca(dados, width, height) {
    return d3.forceSimulation(dados.nodes)
        .force('link', d3.forceLink(dados.links).distance(150))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width/2, height/2))
        .force('collision', d3.forceCollide().radius(60));
}
```

**Prioridade**: 🔴 Alta

---

### 📊 `configurarLayoutHierarquico(dados, width, height)`

**Objetivo**: Layout hierárquico top-down usando dagre.

**Características**:
- Estrutura de árvore clara
- Níveis bem definidos
- Setas direcionais
- Alinhamento vertical

**Implementação**:
```javascript
function configurarLayoutHierarquico(dados, width, height) {
    // 1. Criar grafo dagre
    // 2. Definir hierarquia por tipo de relacionamento
    // 3. Calcular posições
    // 4. Aplicar simulação suave para ajustes
}
```

**Dependências**: dagre.js

**Prioridade**: 🟡 Média

---

### ⭕ `configurarLayoutCircular(dados, width, height)`

**Objetivo**: Organizar nós em círculo perfeito.

**Características**:
- Nós distribuídos em círculo
- Links cruzam o centro
- Rotação baseada em importância
- Raio ajustável

**Implementação**:
```javascript
function configurarLayoutCircular(dados, width, height) {
    const raio = Math.min(width, height) * 0.35;
    const angleStep = (2 * Math.PI) / dados.nodes.length;
    
    dados.nodes.forEach((node, i) => {
        node.fx = width/2 + raio * Math.cos(i * angleStep);
        node.fy = height/2 + raio * Math.sin(i * angleStep);
    });
}
```

**Prioridade**: 🟡 Média

---

### 🎯 `configurarLayoutRadial(dados, width, height)`

**Objetivo**: Expansão radial com nós centrais importantes.

**Características**:
- Nós principais no centro
- Expansão em camadas
- Distância baseada em relevância
- Agrupamento por tipo

**Implementação**:
```javascript
function configurarLayoutRadial(dados, width, height) {
    // 1. Identificar nós centrais (mais relacionamentos)
    // 2. Calcular camadas de distância
    // 3. Posicionar em anéis concêntricos
    // 4. Balancear ângulos por camada
}
```

**Prioridade**: 🟡 Média

---

### ⬜ `configurarLayoutGrade(dados, width, height)`

**Objetivo**: Organização em grid ordenado.

**Características**:
- Grid regular
- Ordenação por critério
- Espaçamento uniforme
- Alinhamento perfeito

**Implementação**:
```javascript
function configurarLayoutGrade(dados, width, height) {
    const cols = Math.ceil(Math.sqrt(dados.nodes.length));
    const cellWidth = width / cols;
    const cellHeight = height / Math.ceil(dados.nodes.length / cols);
    
    dados.nodes.forEach((node, i) => {
        node.fx = (i % cols) * cellWidth + cellWidth/2;
        node.fy = Math.floor(i / cols) * cellHeight + cellHeight/2;
    });
}
```

**Prioridade**: 🟢 Baixa

---

### 🎲 `configurarLayoutAgrupado(dados, width, height)`

**Objetivo**: Clusters por tipo ou categoria.

**Características**:
- Grupos por tipo (PF/PJ)
- Clusters por relacionamento
- Cores por grupo
- Separação clara

**Implementação**:
```javascript
function configurarLayoutAgrupado(dados, width, height) {
    // 1. Agrupar nós por tipo
    // 2. Calcular centros de cluster
    // 3. Aplicar força de cluster
    // 4. Manter separação entre grupos
}
```

**Prioridade**: 🟡 Média

---

### ⏰ `configurarLayoutTimeline(dados, width, height)`

**Objetivo**: Organização temporal baseada em datas.

**Características**:
- Linha temporal horizontal
- Posição baseada em data
- Agrupamento por período
- Zoom temporal

**Implementação**:
```javascript
function configurarLayoutTimeline(dados, width, height) {
    // 1. Extrair datas dos relacionamentos
    // 2. Criar escala temporal
    // 3. Posicionar no eixo X por data
    // 4. Agrupar verticalmente por tipo
}
```

**Dependências**: d3.scaleTime()

**Prioridade**: 🟢 Baixa

---

### 🌀 `configurarLayoutEspiral(dados, width, height)`

**Objetivo**: Disposição em espiral matemática.

**Características**:
- Espiral de Arquimedes
- Crescimento gradual
- Estética interessante
- Centralização natural

**Implementação**:
```javascript
function configurarLayoutEspiral(dados, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const spiralSpacing = 10;
    
    dados.nodes.forEach((node, i) => {
        const angle = 0.1 * i;
        const radius = spiralSpacing * angle;
        node.fx = centerX + radius * Math.cos(angle);
        node.fy = centerY + radius * Math.sin(angle);
    });
}
```

**Prioridade**: 🟢 Baixa

---

### ✋ `configurarLayoutLivre(dados, width, height)`

**Objetivo**: Posicionamento manual pelo usuário.

**Características**:
- Drag & drop completo
- Posições salvas
- Grade de alinhamento
- Snap to grid

**Implementação**:
```javascript
function configurarLayoutLivre(dados, width, height) {
    // 1. Carregar posições salvas
    // 2. Habilitar drag total
    // 3. Mostrar grade de alinhamento
    // 4. Salvar posições no localStorage
}
```

**Prioridade**: 🟢 Baixa

---

## 🎨 Categoria 5: Elementos Visuais

### 🎭 `criarElementosInterativos(g, dados, width, height)`

**Objetivo**: Criar todos os elementos SVG da árvore com interatividade completa.

**Implementação**:
```javascript
function criarElementosInterativos(g, dados, width, height) {
    // 1. Criar definições SVG
    // 2. Criar links interativos
    // 3. Criar nós interativos
    // 4. Adicionar tooltips
    // 5. Configurar event listeners
    // 6. Aplicar animações
}
```

**Elementos Criados**:
- 🔗 Links com hover e click
- ⭕ Nós com menu contextual
- 🏷️ Labels editáveis
- 💡 Tooltips informativos
- 🎨 Gradientes e sombras

**Prioridade**: 🔴 Alta

---

### 📐 `criarDefinicoesSVG(g)`

**Objetivo**: Definir gradientes, filtros, padrões e markers SVG.

**Implementação**:
```javascript
function criarDefinicoesSVG(g) {
    const defs = g.append('defs');
    
    // Gradientes para PF/PJ
    // Filtros de sombra e destaque
    // Markers para setas
    // Padrões de fundo
    // Máscaras para fotos
}
```

**Definições Incluídas**:
- 🌈 Gradientes (PF: azul, PJ: verde)
- 🔳 Sombras e highlights
- ➡️ Setas direcionais
- 📷 Máscaras circulares para fotos
- ✨ Efeitos especiais

**Prioridade**: 🟡 Média

---

### 🖼️ `criarPadraoFundo(svg, defs)`

**Objetivo**: Criar padrão de fundo opcional para a árvore.

**Implementação**:
```javascript
function criarPadraoFundo(svg, defs) {
    // 1. Padrão de grid sutil
    // 2. Gradiente de fundo
    // 3. Textura opcional
    // 4. Marca d'água
}
```

**Prioridade**: 🟢 Baixa

---

### 🔗 `criarLinksInterativos(g, dados)`

**Objetivo**: Criar links entre nós com interatividade completa.

**Características**:
- Hover para destaque
- Click para informações
- Cores por tipo de relacionamento
- Animações suaves
- Labels editáveis

**Implementação**:
```javascript
function criarLinksInterativos(g, dados) {
    const links = g.selectAll('.link')
        .data(dados.links)
        .enter().append('g')
        .attr('class', 'link')
        .on('mouseover', destacarLink)
        .on('mouseout', removerDestaqueLink)
        .on('click', mostrarInfoRelacionamento);
    
    // Linha do link
    // Label do relacionamento  
    // Tooltips
}
```

**Prioridade**: 🔴 Alta

---

### ⭕ `criarNosInterativos(g, dados)`

**Objetivo**: Criar nós com interatividade completa e personalização.

**Características**:
- Menu contextual
- Drag & drop
- Cores personalizáveis
- Fotos opcionais
- Badges informativos

**Implementação**:
```javascript
function criarNosInterativos(g, dados) {
    const nodes = g.selectAll('.node')
        .data(dados.nodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(drag())
        .on('click', mostrarMenuNoSimples)
        .on('mouseover', mostrarTooltip);
    
    // Círculo base
    // Ícone da pessoa
    // Nome
    // Documento
    // GOA
    // Foto (se disponível)
}
```

**Prioridade**: 🔴 Alta

---

### ⭐ `criarElementosComDestaque(g, dados, pessoaEncontrada)`

**Objetivo**: Criar elementos com destaque especial para busca focada.

**Características**:
- Pessoa principal maior e dourada
- Coroa identificativa
- Bordas especiais
- Animações de destaque

**Implementação**:
```javascript
function criarElementosComDestaque(g, dados, pessoaEncontrada) {
    // Similar a criarElementosInterativos mas com:
    // - Nó principal 50% maior
    // - Cor dourada especial
    // - Coroa ou badge especial
    // - Bordas destacadas
}
```

**Prioridade**: 🟡 Média

---

## 📤 Categoria 6: Exportação & Utilidades

### 💾 `exportarArvore()`

**Objetivo**: Exportar árvore em múltiplos formatos.

**Formatos Suportados**:
- 🖼️ PNG de alta qualidade
- 📄 PDF vetorial
- 📊 JSON com dados
- 📋 Lista textual

**Implementação**:
```javascript
async function exportarArvore() {
    // 1. Modal com opções de export
    // 2. Configurar layout para exportação
    // 3. Renderizar versão limpa
    // 4. Converter para formato escolhido
    // 5. Trigger download
}
```

**Dependências**: 
- html2canvas ou SVG serialization
- jsPDF para PDF

**Prioridade**: 🟡 Média

---

### 📐 `configurarLayoutParaExportacao(dados, width, height)`

**Objetivo**: Layout otimizado para exportação (sem interatividade).

**Implementação**:
```javascript
function configurarLayoutParaExportacao(dados, width, height) {
    // 1. Layout estático otimizado
    // 2. Posições finais calculadas
    // 3. Sem animações
    // 4. Elementos simplificados
}
```

**Prioridade**: 🟡 Média

---

### 🎨 `criarElementosParaExportacao(g, dados)`

**Objetivo**: Elementos visuais otimizados para exportação.

**Características**:
- Sem interatividade
- Cores sólidas
- Texto legível
- Layout compacto

**Prioridade**: 🟡 Média

---

### 🖥️ `toggleTelaCheia()`

**Objetivo**: Alternar modo tela cheia da árvore.

**Implementação**:
```javascript
function toggleTelaCheia() {
    // 1. Toggle classe CSS full-screen
    // 2. Ajustar dimensões do SVG
    // 3. Re-renderizar com novo tamanho
    // 4. Event listener para ESC
}
```

**Prioridade**: 🟢 Baixa

---

### 🚀 `expandirTodosOsDadosAutomaticamente()`

**Objetivo**: Buscar e criar todos os relacionamentos automáticos possíveis.

**Implementação**:
```javascript
async function expandirTodosOsDadosAutomaticamente() {
    // 1. Confirmar com usuário (operação pesada)
    // 2. Mostrar progresso
    // 3. Analisar todas as pessoas
    // 4. Criar relacionamentos automáticos
    // 5. Mostrar resumo
    // 6. Renderizar árvore completa
}
```

**Análises Automáticas**:
- 👥 Relações familiares por nome
- 🏠 Mesmo endereço
- 📞 Telefones compartilhados  
- 💼 Vínculos empresariais
- 📄 Documentos relacionados

**Prioridade**: 🟡 Média

---

## 📊 Cronograma de Implementação

### Fase 1: Core (2-3 semanas) 🔴
1. `inicializarArvoreInterativa()`
2. `renderizarArvoreInterativa()`
3. `pesquisarEExibirPessoaNaArvore()`
4. `buscarPessoaPorTermo()`
5. `configurarSimulacao()`
6. `criarElementosInterativos()`

### Fase 2: Busca Avançada (1-2 semanas) 🟡
1. `renderizarArvoreComFoco()`
2. `prepararDadosComFoco()`
3. `obterRelacionamentosDaPessoa()`
4. `centralizarPessoaNaArvore()`
5. `calcularScoreBusca()`

### Fase 3: Interface Interativa (2 semanas) 🟡
1. `mostrarMenuNoSimples()`
2. `toggleExpansaoNoSimples()`
3. `criarNovoVinculoSimples()`
4. `adicionarNovaPessoa()`
5. `configurarControlesArvore()`

### Fase 4: Layouts (1-2 semanas) 🟡
1. `configurarLayoutForca()`
2. `configurarLayoutHierarquico()`
3. `configurarLayoutCircular()`
4. `alterarLayoutArvore()`
5. Layouts adicionais conforme prioridade

### Fase 5: Exportação & Extras (1 semana) 🟢
1. `exportarArvore()`
2. `toggleTelaCheia()`
3. `expandirTodosOsDadosAutomaticamente()`
4. Personalização visual
5. Otimizações de performance

---

## 🧪 Estratégia de Testes

### Testes Unitários
- ✅ Cada função individual
- ✅ Casos de borda
- ✅ Validação de parâmetros

### Testes de Integração  
- ✅ Fluxo completo de busca
- ✅ Criação de relacionamentos
- ✅ Renderização visual

### Testes de Performance
- ✅ Árvores com 1000+ nós
- ✅ Tempo de renderização
- ✅ Uso de memória

### Testes de UX
- ✅ Usabilidade da interface
- ✅ Responsividade
- ✅ Acessibilidade

---

## 📈 Métricas de Sucesso

- 🎯 **Performance**: Renderização < 2s para 500 nós
- 🎯 **Busca**: Resultados < 300ms
- 🎯 **UX**: Interface intuitiva sem documentação
- 🎯 **Robustez**: Zero erros JavaScript em produção
- 🎯 **Compatibilidade**: Chrome 90+, Firefox 88+, Safari 14+

---

## 🔧 Ferramentas Necessárias

### Bibliotecas JavaScript
- **D3.js v7+**: Visualização e simulação
- **dagre.js**: Layout hierárquico
- **html2canvas**: Exportação PNG
- **jsPDF**: Exportação PDF

### APIs Dependentes
- `/api/pessoas-fisicas/`
- `/api/pessoas-juridicas/`
- `/api/relacionamentos/`
- Funções utilitárias existentes

### Recursos de UI
- **Bootstrap 5**: Componentes
- **Font Awesome**: Ícones  
- **Color picker**: Personalização
- **File upload**: Fotos

---

*Documento gerado em: 07/01/2026*
*Total de funções: 37*
*Tempo estimado: 7-10 semanas*