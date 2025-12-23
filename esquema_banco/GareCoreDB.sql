=================================================
-- BANCO DE DADOS DE INVESTIGAÇÃO / OSINT / KYC
-- Versão: 2.0 (corrigida e otimizada para importação em massa)
-- Autor: Grok + você
-- Data: Dezembro 2025
-- =================================================
-- Habilita extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
-- =================================================
-- 1. Tabela pai: Pessoa (física ou jurídica)
-- =================================================
CREATE TABLE pessoa (
    id bigserial PRIMARY KEY,
    tipo char(1) NOT NULL CHECK (tipo IN ('F', 'J')), -- F = Física, J = Jurídica
    goa varchar(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
-- Índices essenciais
CREATE UNIQUE INDEX idx_pessoa_cpf   ON pessoa (goa) WHERE tipo = 'F' AND goa IS NOT NULL;
CREATE UNIQUE INDEX idx_pessoa_cnpj  ON pessoa (goa) WHERE tipo = 'J' AND goa IS NOT NULL;
-- =================================================
-- 2. Pessoa Física
-- =================================================
CREATE TABLE pessoa_fisica (
    id bigint PRIMARY KEY REFERENCES pessoa(id) ON DELETE CASCADE,
    nome varchar(300) NOT NULL,
    cpf varchar(11) UNIQUE,
    rg varchar(20),
    nascimento date,
    nome_mae varchar(300),
    nome_pai varchar(300),
    naturalidade varchar(200),
    sexo char(1) CHECK (sexo IN ('M','F')),
    estado_civil varchar(50),
    telefone1 varchar(20),
    telefone2 varchar(20),
    ocupacao varchar(200),
    vinculo varchar(200),
    observacoes text,
    possui_veiculos boolean DEFAULT false,
    placa varchar(10),
    marca_modelo varchar(100),
    ano_veiculo integer,
    cor_veiculo varchar(50),
    idade smallint,
    suspeita_obito boolean DEFAULT false,
    qualificacao_socio varchar(100)
);
-- =================================================
-- 3. Pessoa Jurídica
-- =================================================
CREATE TABLE pessoa_juridica (
    id bigint PRIMARY KEY REFERENCES pessoa(id) ON DELETE CASCADE,
    razao_social varchar(300) NOT NULL,
    nome_fantasia varchar(300),
    cnpj varchar(14) UNIQUE NOT NULL,
    situacao_cadastral varchar(50) DEFAULT 'ATIVA',
    data_abertura date,
    data_fechamento date,
    porte_empresa varchar(50),
    capital_social numeric(16,2),
    cnae_principal varchar(20),
    cnae_descricao text,
    mei boolean DEFAULT false,
    optante_simples boolean DEFAULT false,
    data_opcao_simples date,
    data_exclusao_simples date,
    possui_filial boolean DEFAULT false,
    observacoes text
);
-- =================================================
-- 4. Endereços (válido para PF e PJ)
-- =================================================
CREATE TABLE endereco (
    id bigserial PRIMARY KEY,
    pessoa_id bigint NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    tipo_endereco varchar(50) DEFAULT 'COMERCIAL', -- RESIDENCIAL, COMERCIAL, COBRANCA, etc.
    logradouro varchar(300),
    numero varchar(20),
    complemento varchar(100),
    bairro varchar(100),
    cidade varchar(100),
    uf char(2),
    cep varchar(8),
    principal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE INDEX idx_endereco_pessoa ON endereco(pessoa_id);
CREATE INDEX idx_endereco_cep     ON endereco(cep);
-- =================================================
-- 5. Contatos da empresa (e-mail + múltiplos telefones)
-- =================================================
CREATE TABLE contato_empresa (
    id bigserial PRIMARY KEY,
    empresa_id bigint NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    tipo varchar(20) NOT NULL CHECK (tipo IN ('email','telefone','celular','whatsapp')),
    valor varchar(150) NOT NULL,
    principal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);
CREATE INDEX idx_contato_empresa ON contato_empresa(empresa_id);
-- =================================================
-- 6. Sócios da empresa (o coração da importação!)
-- =================================================
CREATE TABLE socio_empresa (
    id bigserial PRIMARY KEY,
    empresa_id bigint NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    pessoa_id bigint REFERENCES pessoa(id), -- NULL = sócio não cadastrado como PF/PJ ainda
    cpf_cnpj varchar(14),                    -- redundância útil para busca rápida
    nome_socio varchar(300) NOT NULL,
    data_entrada date,
    participacao_percentual numeric(6,3),    -- ex: 50.000 = 50%
    qualificacao varchar(150),               -- "Sócio-Administrador", "Sócio", etc.
    suspeita_obito boolean DEFAULT false,
    nome_mae varchar(300),
    data_nascimento date,
    idade integer,
    ordem_exibicao smallint DEFAULT 99,      -- mantém ordem original da planilha (Sócio I, II...)
    fonte_importacao varchar(100),           -- ex: "DataInvesting_2025-12"
    created_at timestamp without time zone DEFAULT now()
);
CREATE INDEX idx_socio_empresa     ON socio_empresa(empresa_id);
CREATE INDEX idx_socio_cpf_cnpj    ON socio_empresa(cpf_cnpj);
CREATE INDEX idx_socio_nome        ON socio_empresa(nome_socio);
-- =================================================
-- 7. Relacionamentos (rede familiar, conjugal, confiança, etc.)
-- =================================================
CREATE TABLE relacionamento (
    id bigserial PRIMARY KEY,
    pessoa_origem_id bigint NOT NULL REFERENCES pessoa(id),
    tipo_origem char(1) NOT NULL CHECK (tipo_origem IN ('F','J')),
    pessoa_destino_id bigint NOT NULL REFERENCES pessoa(id),
    tipo_destino char(1) NOT NULL CHECK (tipo_destino IN ('F','J')),
    tipo_relacionamento varchar(100) NOT NULL, -- FILHO, IRMÃO, CÔNJUGE, MÃE, SÓCIO, etc.
    descricao text,
    data_inicio date,
    data_fim date,
    participacao numeric(6,3),           -- usado quando for societário
    eh_auto boolean DEFAULT false,      -- se foi inferido automaticamente
    fonte_importacao varchar(100),
    confiabilidade smallint DEFAULT 5 CHECK (confiabilidade BETWEEN 1 AND 5),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
-- Índices críticos para grafos
CREATE INDEX idx_relac_origem  ON relacionamento(pessoa_origem_id);
CREATE INDEX idx_relac_destino ON relacionamento(pessoa_destino_id);
CREATE INDEX idx_relac_tipo    ON relacionamento(tipo_relacionamento);
-- =================================================
-- 8. Tabelas de controle de importação (para auditoria)
-- =================================================
CREATE TABLE importacao_xls (
    id serial PRIMARY KEY,
    nome_arquivo varchar(500) NOT NULL,
    data_importacao timestamp without time zone DEFAULT now(),
    total_registros integer,
    registros_processados integer DEFAULT 0,
    status varchar(50) DEFAULT 'PENDENTE', -- PENDENTE, PROCESSANDO, CONCLUIDO, ERRO
    observacoes text,
    usuario_id uuid,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE log_importacao (
    id bigserial PRIMARY KEY,
    importacao_id integer NOT NULL REFERENCES importacao_xls(id) ON DELETE CASCADE,
    tipo varchar(50),           -- INFO, WARNING, ERROR
    mensagem text NOT NULL,
    detalhes text,
    linha_arquivo integer,
    created_at timestamp without time zone DEFAULT now()
);
-- =================================================
-- 9. Usuários do sistema
-- =================================================
CREATE TABLE usuarios (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL UNIQUE,
    senha text NOT NULL,
    nome text NOT NULL,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    ativo boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);
-- =================================================
-- 10. VIEW útil: Rede completa de uma pessoa (familiares + empresas)
-- =================================================
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
LEFT JOIN pessoa_fisica pf ON p.id = pf.id AND p.tipo = 'F'
LEFT JOIN pessoa_juridica pj ON p.id = pj.id AND p.tipo = 'J'
LEFT JOIN relacionamento r ON r.pessoa_origem_id = p.id OR r.pessoa_destino_id = p.id
LEFT JOIN pessoa p2 ON (r.pessoa_destino_id = p2.id AND r.pessoa_origem_id = p.id)
                    OR (r.pessoa_origem_id = p2.id AND r.pessoa_destino_id = p.id)
LEFT JOIN pessoa_fisica pf2 ON p2.id = pf2.id AND p2.tipo = 'F'
LEFT JOIN pessoa_juridica pj2 ON p2.id = pj2.id AND p2.tipo = 'J';
-- =================================================
-- FIM DO SCRIPT