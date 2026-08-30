# API — Sales Intelligence Copilot

Base URL local: `http://localhost:3001`

Autenticação: `Authorization: Bearer <JWT>` em todas as rotas, **exceto** `GET /health` e `/api/auth/*`. O token expira em **8 horas**.

O frontend chama a API com o prefixo `/api` (`NEXT_PUBLIC_API_URL` + `/api`).

---

## Saúde

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | Não | Status do processo (`{ status, env }`) |

---

## Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | Não | Cadastrar usuário |
| POST | `/api/auth/login` | Não | Login (retorna JWT + dados do usuário) |

**POST `/api/auth/register`**

```json
{ "nome": "Gestor", "email": "voce@empresa.com", "senha": "senha-segura" }
```

Resposta `201`: `{ "id", "nome", "email" }`. Email duplicado → `400`.

**POST `/api/auth/login`**

```json
{ "email": "voce@empresa.com", "senha": "senha-segura" }
```

Resposta: `{ "token", "usuario": { "id", "nome", "email" } }`. Credenciais inválidas → `401`.

---

## Clientes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clientes` | Listar (inclui totais de leads, oportunidades e pipeline) |
| GET | `/api/clientes/:id` | Detalhe |
| POST | `/api/clientes` | Criar (`nome`, `empresa`, `email`, `telefone`) |
| PUT | `/api/clientes/:id` | Atualizar ficha (também aceita `cidade`, `estado`, `resumo_atendente`, `segmento`, `cnpj`, `site`) |
| DELETE | `/api/clientes/:id` | Remover |

---

## Leads

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/leads` | Listar com temperatura e `dias_fechamento`. Query: `status`, `cliente_id` |
| GET | `/api/leads/:id` | Detalhe (join com cliente) |
| POST | `/api/leads` | Criar (`cliente_id`, `origem`, `status`, `prioridade`, `notas`) |
| PUT | `/api/leads/:id` | Atualizar |
| DELETE | `/api/leads/:id` | Remover |

Temperatura calculada na listagem: `quente` se `prioridade >= 8` **ou** fechamento em até 14 dias; `morno` se `prioridade >= 5`; senão `frio`.

---

## Oportunidades

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/oportunidades` | Listar. Query: `estagio`, `lead_id`, `cliente_id` |
| GET | `/api/oportunidades/:id` | Detalhe |
| POST | `/api/oportunidades` | Criar (`lead_id`, `titulo`, `valor`, `estagio`, `data_fechamento`) |
| PUT | `/api/oportunidades/:id` | Atualização parcial (`COALESCE` nos campos omitidos) |
| DELETE | `/api/oportunidades/:id` | Remover |

Estágios do funil: `prospecção`, `proposta`, `negociação`, `fechado_ganho`, `fechado_perdido`.

---

## Histórico

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/historico/recentes` | Últimas 20 interações (com nome do cliente) |
| GET | `/api/historico/:leadId` | Timeline de um lead |
| POST | `/api/historico` | Registrar (`lead_id`, `tipo`, `descricao`) |

Tipos usados no app: `ligação`, `email`, `reunião`, `nota`, `ia_resumo`.

---

## Métricas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/metrics/resumo` | Totais, funil por estágio, ticket médio, taxa de conversão, pipeline |
| GET | `/api/metrics/ranking` | Ranking de leads (prioridade + interações) |

---

## Assistente de IA

Requer OpenAI (`OPENAI_API_KEY`) ou Ollama (`OLLAMA_BASE_URL` + `OLLAMA_MODEL`). Sem um dos dois, as rotas falham.

| Método | Rota | Body | Resposta |
|--------|------|------|----------|
| POST | `/api/ia/resumir` | `{ "lead_id" }` | `{ "resumo" }` — também grava no histórico como `ia_resumo` |
| POST | `/api/ia/proximo-passo` | `{ "lead_id" }` | `{ "sugestao" }` |
| POST | `/api/ia/urgencia` | `{ "lead_id" }` | `{ "urgencia" }` |
| POST | `/api/ia/mensagem` | `{ "lead_id", "objetivo" }` | `{ "mensagem" }` |

Lead sem histórico em `/resumir` → `404`. Lead inexistente nas demais → `404`.

---

## Relatórios (PDF)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/relatorios/proposta/:id` | PDF da proposta (`:id` = oportunidade) |
| GET | `/api/relatorios/negociacao/:leadId` | PDF do resumo de negociação |
| GET | `/api/relatorios/pipeline` | PDF do pipeline completo |

---

## Email

No código atual o transporte é **Ethereal** (conta de teste + URL de preview). Útil em desenvolvimento; não envia e-mail real de produção.

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/api/email/proposta/:id` | `{ "para", "assunto", "mensagem" }` | Envia proposta (`:id` = oportunidade). `para` opcional (usa e-mail do cliente) |
| POST | `/api/email/mensagem` | `{ "para", "assunto", "mensagem" }` | Mensagem avulsa (`para`, `assunto` e `mensagem` obrigatórios) |

Resposta de sucesso: `{ "ok", "preview", "messageId" }`.

---

## CSV

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/csv/leads` | Importar leads (`multipart/form-data`, campo `arquivo`) |
| GET | `/api/csv/export` | Exportar leads |
| GET | `/api/csv/export/oportunidades` | Exportar oportunidades |

Colunas esperadas no import: `nome`, `empresa`, `email`, `telefone`, `origem`, `status`, `prioridade`. E-mail de cliente já existente é atualizado (`ON CONFLICT`).

---

## Erros comuns

| Status | Quando |
|--------|--------|
| 401 | Token ausente, inválido ou expirado |
| 400 | Validação (CSV, e-mail obrigatório, cadastro) |
| 404 | Recurso não encontrado |
| 500 | Falha interna (ex.: envio de e-mail) |
