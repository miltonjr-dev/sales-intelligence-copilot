const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const { status, cliente_id } = req.query;
  let query = `
    SELECT l.*, c.nome AS cliente_nome, c.empresa,
      -- temperatura calculada: quente/morno/frio
      CASE
        WHEN l.prioridade >= 8 THEN 'quente'
        WHEN l.prioridade >= 5 THEN 'morno'
        ELSE 'frio'
      END AS temperatura,
      -- dias até fechamento (menor oportunidade mais próxima)
      (SELECT MIN(EXTRACT(DAY FROM (o.data_fechamento - NOW())))
       FROM oportunidades o WHERE o.lead_id = l.id AND o.data_fechamento > NOW()
      ) AS dias_fechamento
    FROM leads l
    JOIN clientes c ON c.id = l.cliente_id
    WHERE 1=1
  `;
  const params = [];
  if (status)     { params.push(status);     query += ` AND l.status=$${params.length}`; }
  if (cliente_id) { params.push(cliente_id); query += ` AND l.cliente_id=$${params.length}`; }
  query += ' ORDER BY l.prioridade DESC, l.criado_em DESC';

  const { rows } = await db.query(query, params);
  // Sobrescreve temperatura se fechamento em < 14 dias
  const resultado = rows.map(r => ({
    ...r,
    temperatura: (r.dias_fechamento !== null && r.dias_fechamento <= 14) ? 'quente'
               : r.temperatura
  }));
  res.json(resultado);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(
    `SELECT l.*, c.nome AS cliente_nome, c.empresa, c.email, c.telefone
     FROM leads l JOIN clientes c ON c.id = l.cliente_id WHERE l.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Lead não encontrado' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { cliente_id, origem, status, prioridade, notas } = req.body;
  const { rows } = await db.query(
    'INSERT INTO leads (cliente_id,origem,status,prioridade,notas) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [cliente_id, origem, status || 'novo', prioridade || 5, notas]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { origem, status, prioridade, notas } = req.body;
  const { rows } = await db.query(
    `UPDATE leads SET origem=$1,status=$2,prioridade=$3,notas=$4,atualizado_em=NOW()
     WHERE id=$5 RETURNING *`,
    [origem, status, prioridade, notas, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Lead não encontrado' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM leads WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
