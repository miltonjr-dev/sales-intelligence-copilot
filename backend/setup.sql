-- ============================================
-- Sales Intelligence Copilot — Schema Inicial
-- ============================================

CREATE TABLE IF NOT EXISTS clientes (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  empresa     TEXT,
  email       TEXT UNIQUE,
  telefone    TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  cliente_id  INT REFERENCES clientes(id) ON DELETE CASCADE,
  origem      TEXT,                        -- LinkedIn, Indicação, Site, Evento
  status      TEXT DEFAULT 'novo',         -- novo, contatado, qualificado, perdido
  prioridade  INT DEFAULT 5,               -- 1 (alta) a 10 (baixa)
  notas       TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oportunidades (
  id              SERIAL PRIMARY KEY,
  lead_id         INT REFERENCES leads(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  valor           NUMERIC(12,2) DEFAULT 0,
  estagio         TEXT DEFAULT 'prospecção', -- prospecção, proposta, negociação, fechado_ganho, fechado_perdido
  data_fechamento DATE,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico (
  id          SERIAL PRIMARY KEY,
  lead_id     INT REFERENCES leads(id) ON DELETE CASCADE,
  tipo        TEXT,                        -- ligação, email, reunião, nota, ia_resumo
  descricao   TEXT NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  senha_hash  TEXT NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_prioridade ON leads(prioridade);
CREATE INDEX IF NOT EXISTS idx_oport_estagio    ON oportunidades(estagio);
CREATE INDEX IF NOT EXISTS idx_historico_lead   ON historico(lead_id);

-- Dados de exemplo
INSERT INTO clientes (nome, empresa, email, telefone) VALUES
  ('Ana Costa',    'Tech Solutions',  'ana@techsolutions.com',  '11 91111-1111'),
  ('Bruno Lima',   'Varejo Plus',     'bruno@varejoplus.com',   '11 92222-2222'),
  ('Carla Mendes', 'Edu Startup',     'carla@edustartup.com',   '11 93333-3333')
ON CONFLICT DO NOTHING;

INSERT INTO leads (cliente_id, origem, status, prioridade) VALUES
  (1, 'LinkedIn',   'qualificado', 2),
  (2, 'Indicação',  'contatado',   4),
  (3, 'Site',       'novo',        7)
ON CONFLICT DO NOTHING;

INSERT INTO oportunidades (lead_id, titulo, valor, estagio, data_fechamento) VALUES
  (1, 'Implantação CRM Enterprise', 45000.00, 'negociação',  '2026-05-15'),
  (2, 'Consultoria Comercial',      12000.00, 'proposta',    '2026-04-30'),
  (3, 'Treinamento de Vendas',       8000.00, 'prospecção',  '2026-06-01')
ON CONFLICT DO NOTHING;
