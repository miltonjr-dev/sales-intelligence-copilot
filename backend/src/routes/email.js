const express    = require('express');
const nodemailer = require('nodemailer');
const db         = require('../db');
const auth       = require('../middleware/auth');
const router     = express.Router();

router.use(auth);

async function criarTransporte() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

// POST /api/email/proposta/:id — send proposal PDF info by email
router.post('/proposta/:id', async (req, res) => {
  try {
    const { para, assunto, mensagem } = req.body;

    const { rows } = await db.query(
      `SELECT o.*, c.nome, c.empresa, c.email
       FROM oportunidades o
       JOIN leads l ON l.id = o.lead_id
       JOIN clientes c ON c.id = l.cliente_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada' });

    const o = rows[0];
    const destinatario = para || o.email;
    const assuntoFinal = assunto || `Proposta Comercial - ${o.titulo}`;
    const mensagemFinal = mensagem || `Prezado(a) ${o.nome},\n\nSegue a proposta comercial para ${o.titulo}.\n\nValor: R$ ${Number(o.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nAtenciosamente,\nSales Intelligence Copilot`;

    const transporter = await criarTransporte();
    const info = await transporter.sendMail({
      from: '"Sales Intelligence Copilot" <noreply@sic.dev>',
      to: destinatario,
      subject: assuntoFinal,
      text: mensagemFinal,
      html: `<p>${mensagemFinal.replace(/\n/g, '<br>')}</p>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('📧 Email proposta enviado. Preview:', previewUrl);

    res.json({ ok: true, preview: previewUrl, messageId: info.messageId });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    res.status(500).json({ erro: 'Falha ao enviar email', detalhe: err.message });
  }
});

// POST /api/email/mensagem — send custom email to a client
router.post('/mensagem', async (req, res) => {
  try {
    const { para, assunto, mensagem } = req.body;
    if (!para || !assunto || !mensagem) {
      return res.status(400).json({ erro: 'para, assunto e mensagem são obrigatórios' });
    }

    const transporter = await criarTransporte();
    const info = await transporter.sendMail({
      from: '"Sales Intelligence Copilot" <noreply@sic.dev>',
      to: para,
      subject: assunto,
      text: mensagem,
      html: `<p>${mensagem.replace(/\n/g, '<br>')}</p>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('📧 Email mensagem enviado. Preview:', previewUrl);

    res.json({ ok: true, preview: previewUrl, messageId: info.messageId });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    res.status(500).json({ erro: 'Falha ao enviar email', detalhe: err.message });
  }
});

module.exports = router;
