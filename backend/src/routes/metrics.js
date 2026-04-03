const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.use(auth);

// GET /api/metrics/resumo
router.get('/resumo', async (_req, res) => {
  const [totalLeads, porEstagio, ticketMedio, taxaConversao] = await Promise.all([
    db.query('SELECT COUNT(*) AS total FROM leads'),
    db.query(`
      SELECT estagio, COUNT(*) AS quantidade, SUM(valor) AS volume
      FROM oportunidades GROUP BY estagio ORDER BY estagio
    `),
    db.query(`
      SELECT ROUND(AVG(valor)::numeric, 2) AS ticket_medio
      FROM oportunidades WHERE estagio = 'fechado_ganho'
    `),
    db.query(`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE estagio='fechado_ganho') * 100.0 / NULLIF(COUNT(*),0), 1
        ) AS taxa_conversao
      FROM oportunidades
    `),
  ]);

  res.json({
    total_leads:         parseInt(totalLeads.rows[0].total),
    por_estagio:         porEstagio.rows,
    ticket_medio:        parseFloat(ticketMedio.rows[0].ticket_medio) || 0,
    taxa_conversao:      parseFloat(taxaConversao.rows[0].taxa_conversao) || 0,
    oportunidades_ativas: porEstagio.rows
      .filter(e => !e.estagio.startsWith('fechado'))
      .reduce((s, e) => s + parseInt(e.quantidade), 0),
    pipeline_total: porEstagio.rows.reduce((s, e) => s + parseFloat(e.volume || 0), 0),
  });
});

// GET /api/metrics/ranking
router.get('/ranking', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT l.id, c.nome, c.empresa, l.status, l.prioridade, l.origem,
           COUNT(h.id) AS interacoes,
           MAX(o.valor) AS maior_oportunidade
    FROM leads l
    JOIN clientes c ON c.id = l.cliente_id
    LEFT JOIN historico h ON h.lead_id = l.id
    LEFT JOIN oportunidades o ON o.lead_id = l.id
    GROUP BY l.id, c.nome, c.empresa, l.status, l.prioridade, l.origem
    ORDER BY l.prioridade ASC, interacoes DESC
    LIMIT 20
  `);
  res.json(rows);
});

module.exports = router;
