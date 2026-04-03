const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.use(auth);

router.get('/recentes', async (req, res) => {
  const { rows } = await db.query(
    `SELECT h.*, c.nome AS cliente_nome
     FROM historico h
     JOIN leads l ON l.id = h.lead_id
     JOIN clientes c ON c.id = l.cliente_id
     ORDER BY h.criado_em DESC LIMIT 20`
  );
  res.json(rows);
});

router.get('/:leadId', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM historico WHERE lead_id=$1 ORDER BY criado_em DESC',
    [req.params.leadId]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { lead_id, tipo, descricao } = req.body;
  const { rows } = await db.query(
    'INSERT INTO historico (lead_id,tipo,descricao) VALUES ($1,$2,$3) RETURNING *',
    [lead_id, tipo, descricao]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
