const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const { estagio, lead_id, cliente_id } = req.query;
  let query = `
    SELECT o.*, l.status AS lead_status, c.nome AS cliente_nome, c.empresa
    FROM oportunidades o
    JOIN leads l ON l.id = o.lead_id
    JOIN clientes c ON c.id = l.cliente_id
    WHERE 1=1
  `;
  const params = [];
  if (estagio)    { params.push(estagio);    query += ` AND o.estagio=$${params.length}`; }
  if (lead_id)    { params.push(lead_id);    query += ` AND o.lead_id=$${params.length}`; }
  if (cliente_id) { params.push(cliente_id); query += ` AND l.cliente_id=$${params.length}`; }
  query += ' ORDER BY o.valor DESC';

  const { rows } = await db.query(query, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(
    `SELECT o.*, c.nome AS cliente_nome, c.empresa
     FROM oportunidades o
     JOIN leads l ON l.id = o.lead_id
     JOIN clientes c ON c.id = l.cliente_id
     WHERE o.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { lead_id, titulo, valor, estagio, data_fechamento } = req.body;
  const { rows } = await db.query(
    'INSERT INTO oportunidades (lead_id,titulo,valor,estagio,data_fechamento) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [lead_id, titulo, valor || 0, estagio || 'prospecção', data_fechamento]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { titulo, valor, estagio, data_fechamento } = req.body;
  // Partial update: keep existing values for fields not provided
  const { rows } = await db.query(
    `UPDATE oportunidades
     SET titulo          = COALESCE($1, titulo),
         valor           = COALESCE($2, valor),
         estagio         = COALESCE($3, estagio),
         data_fechamento = COALESCE($4, data_fechamento),
         atualizado_em   = NOW()
     WHERE id=$5 RETURNING *`,
    [titulo || null, valor || null, estagio || null, data_fechamento || null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM oportunidades WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
