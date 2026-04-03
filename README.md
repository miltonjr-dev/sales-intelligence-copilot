# 🚀 Sales Intelligence Copilot

> Sistema fullstack de gestão comercial com inteligência artificial — gerencie leads, oportunidades e pipeline de vendas com suporte de IA.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🌡️ **Termômetro de Leads** | Classifica leads como 🔥 Quente, 🌡️ Morno ou 🧊 Frio por prioridade e prazo |
| 📋 **Kanban de Oportunidades** | Arraste oportunidades entre etapas do funil comercial |
| 🏢 **Ficha Cadastral de Clientes** | CNPJ, segmento, site, resumo do atendente e histórico |
| 🤖 **Assistente de IA** | Resumo de negociações, sugestão de próximo passo, classificação de urgência e geração de mensagem comercial |
| 📄 **PDFs Profissionais** | Proposta comercial, resumo de negociação e relatório de pipeline |
| 📧 **Envio de Email** | Envio de propostas e mensagens por email (Ethereal em dev, SMTP em produção) |
| 📊 **Dashboard com Gráficos** | Métricas em tempo real, funil de vendas, metas mensais e atividade recente |
| 📤 **Import/Export CSV** | Importação em lote de leads e exportação de pipeline |
| 🔐 **Autenticação JWT** | Login seguro com token de 8 horas |

---

## 🛠️ Stack Tecnológica

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts (gráficos)
- Axios

**Backend**
- Node.js + Express
- JWT + bcryptjs
- PDFKit (geração de PDF)
- Nodemailer (envio de email)
- csv-parse (importação CSV)

**Banco de Dados**
- PostgreSQL 16

**Infraestrutura**
- Docker + Docker Compose

---

## ⚡ Como Rodar

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/sales-intelligence-copilot.git
cd sales-intelligence-copilot
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:
```env
JWT_SECRET=seu_segredo_super_seguro_aqui

# Opcional: para usar IA real
OPENAI_API_KEY=sk-...
```

### 3. Subir com Docker
```bash
docker-compose up --build
```

Aguarde todos os containers subirem (~1 min na primeira vez).

| Serviço   | URL                   |
|-----------|-----------------------|
| 🌐 Frontend  | http://localhost:3000 |
| ⚙️ Backend   | http://localhost:3001 |
| 🐘 PostgreSQL | localhost:5432        |

### 4. Criar conta e acessar
Acesse **http://localhost:3000** → clique em **"Criar Conta"** → faça login.

---

## 🗂️ Estrutura do Projeto

```
sales-intelligence-copilot/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # Entry point Express
│       ├── db/index.js           # Conexão PostgreSQL
│       ├── middleware/auth.js    # Validação JWT
│       ├── services/ia.js        # OpenAI / Ollama
│       └── routes/
│           ├── auth.js           # Login / Registro
│           ├── leads.js          # CRUD + temperatura
│           ├── clientes.js       # CRUD + ficha cadastral
│           ├── oportunidades.js  # CRUD + funil
│           ├── historico.js      # Timeline de interações
│           ├── metrics.js        # Dashboard metrics
│           ├── ia.js             # Assistente IA
│           ├── relatorios.js     # Geração de PDFs
│           ├── email.js          # Envio de email
│           └── csv.js            # Import/Export CSV
├── frontend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── page.tsx              # Home / Landing
│   │   ├── login/                # Autenticação
│   │   ├── dashboard/            # Métricas e gráficos
│   │   ├── leads/                # Lista + detalhe do lead
│   │   ├── clientes/             # Lista + ficha do cliente
│   │   ├── oportunidades/        # Kanban + lista
│   │   ├── assistente/           # Chat com IA
│   │   └── relatorios/           # Download de PDFs
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── ModalNovoLead.tsx
│   │   ├── ModalEditarOportunidade.tsx
│   │   └── ModalEmail.tsx
│   └── lib/api.ts                # Axios + interceptor JWT
├── db/
│   └── init.sql                  # Schema + dados de exemplo
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📡 API Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastrar usuário |
| POST | `/api/auth/login` | Login (retorna JWT) |

### Leads
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/leads` | Listar leads com temperatura |
| GET | `/api/leads/:id` | Detalhe do lead |
| POST | `/api/leads` | Criar lead |
| PUT | `/api/leads/:id` | Atualizar lead |
| DELETE | `/api/leads/:id` | Remover lead |

### Oportunidades
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/oportunidades` | Listar (filtros: estagio, lead_id, cliente_id) |
| PUT | `/api/oportunidades/:id` | Atualizar (suporte a atualização parcial) |

### Relatórios / PDFs
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/relatorios/proposta/:id` | PDF da proposta comercial |
| GET | `/api/relatorios/negociacao/:leadId` | PDF do resumo de negociação |
| GET | `/api/relatorios/pipeline` | PDF do pipeline completo |

### IA
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/ia/resumir` | Resumir negociação |
| POST | `/api/ia/proximo-passo` | Sugerir próximo passo |
| POST | `/api/ia/urgencia` | Classificar urgência |
| POST | `/api/ia/mensagem` | Gerar mensagem comercial |

### CSV
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/csv/leads` | Importar leads via CSV |
| GET | `/api/csv/export` | Exportar leads como CSV |
| GET | `/api/csv/export/oportunidades` | Exportar oportunidades como CSV |

---

## 🤖 Configuração de IA

O assistente suporta dois modos configuráveis via `.env`:

**OpenAI (recomendado para produção)**
```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

**Ollama (local/gratuito)**
```bash
ollama pull llama3
```
```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3
```

---

## 🌡️ Sistema de Temperatura de Leads

| Temperatura | Critério |
|-------------|----------|
| 🔥 Quente | Prioridade ≥ 8 **ou** fechamento em menos de 14 dias |
| 🌡️ Morno | Prioridade entre 5 e 7 |
| 🧊 Frio | Prioridade < 5 |

---

## 🚢 Deploy

| Serviço | Plataforma sugerida |
|---------|-------------------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Railway](https://railway.app) |
| Banco de dados | [Supabase](https://supabase.com) ou Railway PostgreSQL |

---

## 📝 Licença

MIT — sinta-se livre para usar, modificar e distribuir.

---

> **Projeto de portfólio** — desenvolvido para demonstrar habilidades em desenvolvimento fullstack, integração com IA e gestão comercial.

