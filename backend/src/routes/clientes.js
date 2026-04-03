const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.use(auth);

router.get('/', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT c.*,
      COUNT(DISTINCT l.id) AS total_leads,
      COUNT(DISTINCT o.id) AS total_oportunidades,
      COALESCE(SUM(o.valor),0) AS pipeline_total
    FROM clientes c
    LEFT JOIN leads l ON l.cliente_id = c.id
    LEFT JOIN oportunidades o ON o.lead_id = l.id
    GROUP BY c.id
    ORDER BY c.criado_em DESC
  `);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM clientes WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { nome, empresa, email, telefone } = req.body;
  const { rows } = await db.query(
    'INSERT INTO clientes (nome,empresa,email,telefone) VALUES ($1,$2,$3,$4) RETURNING *',
    [nome, empresa, email, telefone]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { nome, empresa, email, telefone, cidade, estado, resumo_atendente, segmento, cnpj, site } = req.body;
  const { rows } = await db.query(
    `UPDATE clientes SET
      nome=$1, empresa=$2, email=$3, telefone=$4,
      cidade=COALESCE($5, cidade), estado=COALESCE($6, estado),
      resumo_atendente=COALESCE($7, resumo_atendente),
      segmento=COALESCE($8, segmento), cnpj=COALESCE($9, cnpj), site=COALESCE($10, site)
     WHERE id=$11 RETURNING *`,
    [nome, empresa, email, telefone, cidade || null, estado || null,
     resumo_atendente || null, segmento || null, cnpj || null, site || null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM clientes WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
