const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const iaService = require('../services/ia');
const router  = express.Router();

router.use(auth);

// POST /api/ia/resumir  — resume o histórico de um lead
router.post('/resumir', async (req, res) => {
  const { lead_id } = req.body;
  const { rows } = await db.query(
    'SELECT tipo, descricao, criado_em FROM historico WHERE lead_id=$1 ORDER BY criado_em ASC',
    [lead_id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Sem histórico para este lead' });

  const historico = rows.map(r => `[${r.tipo}] ${r.descricao}`).join('\n');
  const resposta  = await iaService.completar(
    `Você é um assistente de vendas. Resuma de forma objetiva a negociação abaixo e aponte o ponto atual:\n\n${historico}`
  );
  await db.query(
    'INSERT INTO historico (lead_id,tipo,descricao) VALUES ($1,$2,$3)',
    [lead_id, 'ia_resumo', resposta]
  );
  res.json({ resumo: resposta });
});

// POST /api/ia/proximo-passo
router.post('/proximo-passo', async (req, res) => {
  const { lead_id } = req.body;
  const { rows: lead } = await db.query(
    `SELECT l.status, l.prioridade, l.notas, c.nome, c.empresa,
            o.titulo, o.estagio, o.valor
     FROM leads l
     JOIN clientes c ON c.id = l.cliente_id
     LEFT JOIN oportunidades o ON o.lead_id = l.id
     WHERE l.id=$1 LIMIT 1`, [lead_id]
  );
  if (!lead[0]) return res.status(404).json({ erro: 'Lead não encontrado' });

  const ctx = JSON.stringify(lead[0], null, 2);
  const resposta = await iaService.completar(
    `Você é um coach de vendas. Com base nos dados abaixo, sugira o próximo passo concreto para avançar nesta negociação:\n\n${ctx}`
  );
  res.json({ sugestao: resposta });
});

// POST /api/ia/urgencia
router.post('/urgencia', async (req, res) => {
  const { lead_id } = req.body;
  const { rows } = await db.query(
    `SELECT l.*, c.nome, c.empresa, o.estagio, o.valor, o.data_fechamento
     FROM leads l JOIN clientes c ON c.id=l.cliente_id
     LEFT JOIN oportunidades o ON o.lead_id=l.id
     WHERE l.id=$1 LIMIT 1`, [lead_id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Lead não encontrado' });

  const resposta = await iaService.completar(
    `Classifique a urgência deste lead em: ALTA, MÉDIA ou BAIXA. Explique em 1 frase.\n\nDados: ${JSON.stringify(rows[0])}`
  );
  res.json({ urgencia: resposta });
});

// POST /api/ia/mensagem
router.post('/mensagem', async (req, res) => {
  const { lead_id, objetivo } = req.body;
  const { rows } = await db.query(
    `SELECT c.nome, c.empresa, l.status, o.titulo, o.estagio, o.valor
     FROM leads l JOIN clientes c ON c.id=l.cliente_id
     LEFT JOIN oportunidades o ON o.lead_id=l.id
     WHERE l.id=$1 LIMIT 1`, [lead_id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Lead não encontrado' });

  const resposta = await iaService.completar(
    `Você é um especialista em comunicação comercial. Gere uma mensagem profissional de WhatsApp/Email para o cliente abaixo com o objetivo: "${objetivo}".\n\nCliente: ${JSON.stringify(rows[0])}`
  );
  res.json({ mensagem: resposta });
});

module.exports = router;
