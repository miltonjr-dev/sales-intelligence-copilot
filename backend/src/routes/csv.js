const express = require('express');
const multer  = require('multer');
const { parse } = require('csv-parse');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.use(auth);

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/csv/leads
// Colunas esperadas: nome, empresa, email, telefone, origem, status, prioridade
router.post('/leads', upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Arquivo não enviado' });

  const erros = [];
  const inseridos = [];

  parse(req.file.buffer.toString(), { columns: true, trim: true, skip_empty_lines: true },
    async (err, registros) => {
      if (err) return res.status(400).json({ erro: 'CSV inválido' });

      for (const [i, r] of registros.entries()) {
        try {
          const { rows: cl } = await db.query(
            `INSERT INTO clientes (nome,empresa,email,telefone)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (email) DO UPDATE SET nome=EXCLUDED.nome
             RETURNING id`,
            [r.nome, r.empresa, r.email, r.telefone]
          );
          const clienteId = cl[0].id;

          const { rows: lead } = await db.query(
            `INSERT INTO leads (cliente_id,origem,status,prioridade)
             VALUES ($1,$2,$3,$4) RETURNING id`,
            [clienteId, r.origem || 'CSV', r.status || 'novo', r.prioridade || 5]
          );
          inseridos.push(lead[0].id);
        } catch (e) {
          erros.push({ linha: i + 2, erro: e.message });
        }
      }

      res.json({ inseridos: inseridos.length, erros });
    }
  );
});

// GET /api/csv/export — export all leads as CSV
router.get('/export', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT l.id, c.nome, c.empresa, c.email, c.telefone,
           l.origem, l.status, l.prioridade, l.criado_em
    FROM leads l
    JOIN clientes c ON c.id = l.cliente_id
    ORDER BY l.criado_em DESC
  `);
  const header = 'id,nome,empresa,email,telefone,origem,status,prioridade,criado_em';
  const csvRows = rows.map(r =>
    [r.id, r.nome, r.empresa, r.email, r.telefone, r.origem, r.status, r.prioridade,
     new Date(r.criado_em).toLocaleDateString('pt-BR')].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
  res.send([header, ...csvRows].join('\n'));
});

// GET /api/csv/export/oportunidades — export all oportunidades as CSV
router.get('/export/oportunidades', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT o.id, o.titulo, c.nome AS cliente, c.empresa, o.valor, o.estagio, o.data_fechamento, o.criado_em
    FROM oportunidades o
    JOIN leads l ON l.id = o.lead_id
    JOIN clientes c ON c.id = l.cliente_id
    ORDER BY o.criado_em DESC
  `);
  const header = 'id,titulo,cliente,empresa,valor,estagio,data_fechamento,criado_em';
  const csvRows = rows.map(r =>
    [r.id, r.titulo, r.cliente, r.empresa, r.valor, r.estagio,
     r.data_fechamento ? new Date(r.data_fechamento).toLocaleDateString('pt-BR') : '',
     new Date(r.criado_em).toLocaleDateString('pt-BR')].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="oportunidades-export.csv"');
  res.send([header, ...csvRows].join('\n'));
});

module.exports = router;
