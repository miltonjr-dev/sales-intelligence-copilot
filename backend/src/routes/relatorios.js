const express      = require('express');
const PDFDocument  = require('pdfkit');
const db           = require('../db');
const auth         = require('../middleware/auth');
const router       = express.Router();

router.use(auth);

// ─── Paleta ───────────────────────────────────────────────────────────────────
const AZUL_ESCURO  = '#1e3a5f';
const AZUL         = '#2563eb';
const CINZA        = '#6b7280';
const VERDE        = '#16a34a';
const VERMELHO     = '#dc2626';
const AMARELO      = '#d97706';
const BRANCO       = '#ffffff';
const PRETO        = '#111827';
const CINZA_BG     = '#f8fafc';

const COR_ESTAGIO  = { 'prospecção': CINZA, 'proposta': AZUL, 'negociação': AMARELO, 'fechado_ganho': VERDE, 'fechado_perdido': VERMELHO };
const COR_STATUS   = { novo: CINZA, contatado: AMARELO, qualificado: VERDE, perdido: VERMELHO };
const COR_TIPO     = { ligação: AZUL, email: VERDE, reunião: AMARELO, nota: CINZA, ia_resumo: '#7c3aed' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function criarDoc(landscape) {
  return new PDFDocument({ margin: 0, size: 'A4', layout: landscape ? 'landscape' : 'portrait' });
}

function cabecalho(doc, titulo, subtitulo) {
  doc.rect(0, 0, doc.page.width, 72).fill(AZUL_ESCURO);
  doc.fillColor(BRANCO).fontSize(20).font('Helvetica-Bold').text('Sales Intelligence Copilot', 40, 16);
  doc.fontSize(10).font('Helvetica').fillColor('#93c5fd').text(titulo, 40, 44);
  if (subtitulo) {
    doc.fontSize(8).fillColor('#64748b').text(subtitulo, doc.page.width - 220, 44, { width: 180, align: 'right' });
  }
  doc.fontSize(7).fillColor('#475569').text(
    'Gerado em ' + new Date().toLocaleString('pt-BR'),
    doc.page.width - 220, 58, { width: 180, align: 'right' }
  );
}

function rodape(doc) {
  const py = doc.page.height - 32;
  doc.rect(0, py - 4, doc.page.width, 36).fill('#f1f5f9');
  doc.fontSize(7).font('Helvetica').fillColor(CINZA)
     .text('Sales Intelligence Copilot  —  Documento gerado automaticamente', 40, py + 4, { align: 'left', width: doc.page.width - 80 })
     .text('Confidencial', doc.page.width - 100, py + 4, { width: 60, align: 'right' });
}

// Retorna novo y após desenhar um bloco de seção
function secao(doc, y, titulo) {
  doc.rect(40, y, doc.page.width - 80, 22).fill(AZUL_ESCURO);
  doc.fillColor(BRANCO).fontSize(9).font('Helvetica-Bold')
     .text(titulo.toUpperCase(), 50, y + 7, { width: doc.page.width - 100 });
  return y + 30; // retorna y abaixo da seção
}

// Desenha um par label: valor e retorna o novo y
function linha(doc, y, label, valor, cor) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(CINZA).text(label, 50, y, { width: 120, lineBreak: false });
  doc.fontSize(9).font('Helvetica').fillColor(cor || PRETO).text(String(valor || '—'), 175, y, { width: doc.page.width - 220, lineBreak: false });
  return y + 16;
}

// Desenha um badge colorido e retorna largura + x final
function badge(doc, x, y, texto, cor) {
  const w = Math.max(texto.length * 5.8 + 16, 50);
  doc.roundedRect(x, y - 1, w, 15, 3).fill(cor || CINZA);
  doc.fillColor(BRANCO).fontSize(7.5).font('Helvetica-Bold').text(texto.toUpperCase(), x + 6, y + 2, { width: w - 8, lineBreak: false });
  return x + w + 6;
}

// Tabela: retorna novo y
function tabela(doc, y, headers, rows, colWidths) {
  const startX = 40;
  const rowH   = 18;
  const pageBottom = doc.page.height - 60;

  // Cabeçalho
  doc.rect(startX, y, doc.page.width - 80, rowH).fill(AZUL);
  let x = startX + 4;
  headers.forEach((h, i) => {
    doc.fillColor(BRANCO).fontSize(8).font('Helvetica-Bold')
       .text(h, x, y + 5, { width: colWidths[i] - 6, lineBreak: false });
    x += colWidths[i];
  });
  y += rowH;

  // Linhas
  rows.forEach((row, ri) => {
    if (y > pageBottom) {
      doc.addPage();
      cabecalho(doc, 'continuação', '');
      y = 90;
      // Redesenha cabeçalho da tabela
      doc.rect(startX, y, doc.page.width - 80, rowH).fill(AZUL);
      x = startX + 4;
      headers.forEach((h, i) => {
        doc.fillColor(BRANCO).fontSize(8).font('Helvetica-Bold')
           .text(h, x, y + 5, { width: colWidths[i] - 6, lineBreak: false });
        x += colWidths[i];
      });
      y += rowH;
    }

    if (ri % 2 === 0) doc.rect(startX, y, doc.page.width - 80, rowH).fill('#eff6ff');
    doc.rect(startX, y, doc.page.width - 80, rowH).stroke('#e2e8f0');

    x = startX + 4;
    row.forEach((cell, i) => {
      const cor = (i === 3 && COR_ESTAGIO[cell]) ? COR_ESTAGIO[cell] : PRETO;
      doc.fillColor(cor).fontSize(8).font('Helvetica')
         .text(String(cell ?? '—'), x, y + 5, { width: colWidths[i] - 6, lineBreak: false, ellipsis: true });
      x += colWidths[i];
    });
    y += rowH;
  });

  return y + 8;
}

// ─── GET /api/relatorios/proposta/:id ─────────────────────────────────────────
router.get('/proposta/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, l.status AS lead_status, l.origem, l.notas AS lead_notas, l.prioridade,
              c.nome, c.empresa, c.email, c.telefone
       FROM oportunidades o
       JOIN leads l ON l.id = o.lead_id
       JOIN clientes c ON c.id = l.cliente_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada' });

    const { rows: hist } = await db.query(
      'SELECT * FROM historico WHERE lead_id = $1 ORDER BY criado_em DESC LIMIT 8',
      [rows[0].lead_id]
    );

    const o   = rows[0];
    const doc = criarDoc(false);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposta-${o.id}.pdf"`);
    doc.pipe(res);

    cabecalho(doc, 'PROPOSTA COMERCIAL', `Proposta Nº ${String(o.id).padStart(4, '0')}`);

    let y = 90;

    // ── Card identidade da proposta ──
    doc.rect(40, y, doc.page.width - 80, 52).fill('#eff6ff').stroke('#bfdbfe');
    doc.fillColor(AZUL_ESCURO).fontSize(15).font('Helvetica-Bold')
       .text(o.titulo, 55, y + 8, { width: doc.page.width - 200, lineBreak: false });
    doc.fillColor(CINZA).fontSize(8).font('Helvetica')
       .text(`Criado em ${new Date(o.criado_em).toLocaleDateString('pt-BR')}`, 55, y + 28, { lineBreak: false });
    badge(doc, 55, y + 38, o.estagio || 'prospecção', COR_ESTAGIO[o.estagio] || CINZA);
    badge(doc, 170, y + 38, `Prioridade ${o.prioridade}`, AZUL);
    y += 60;

    // ── Dados do cliente ──
    y = secao(doc, y, '📋  Dados do Cliente');
    y = linha(doc, y, 'Nome Completo', o.nome);
    y = linha(doc, y, 'Empresa', o.empresa);
    y = linha(doc, y, 'E-mail', o.email);
    y = linha(doc, y, 'Telefone', o.telefone);
    y = linha(doc, y, 'Origem do Lead', o.origem);
    y += 4;

    // ── Detalhes da proposta ──
    y = secao(doc, y, '📄  Detalhes da Proposta');
    y = linha(doc, y, 'Status do Lead', o.lead_status, COR_STATUS[o.lead_status]);
    y = linha(doc, y, 'Prev. Fechamento', o.data_fechamento ? new Date(o.data_fechamento).toLocaleDateString('pt-BR') : '—');
    y += 4;

    // ── Valor em destaque ──
    doc.rect(40, y, doc.page.width - 80, 56).fill(AZUL_ESCURO);
    doc.fillColor('#93c5fd').fontSize(9).font('Helvetica-Bold')
       .text('VALOR TOTAL DA PROPOSTA', 40, y + 8, { align: 'center', width: doc.page.width - 80 });
    doc.fillColor(BRANCO).fontSize(26).font('Helvetica-Bold')
       .text(`R$ ${Number(o.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 40, y + 22, { align: 'center', width: doc.page.width - 80 });
    y += 64;

    // ── Histórico recente ──
    if (hist.length > 0) {
      y = secao(doc, y, '🕐  Histórico Recente da Negociação');
      const pw = doc.page.width - 80;
      y = tabela(doc, y,
        ['Data', 'Tipo', 'Descrição'],
        hist.map(h => [new Date(h.criado_em).toLocaleDateString('pt-BR'), h.tipo || 'nota', h.descricao]),
        [70, 70, pw - 140]
      );
    }

    // ── Observações ──
    if (o.lead_notas) {
      y = secao(doc, y, '📝  Observações');
      doc.rect(40, y, doc.page.width - 80, 0).stroke('#bfdbfe');
      doc.fillColor('#374151').fontSize(9).font('Helvetica')
         .text(o.lead_notas, 50, y + 4, { width: doc.page.width - 100, align: 'justify' });
      y += doc.heightOfString(o.lead_notas, { width: doc.page.width - 100 }) + 12;
    }

    // ── Assinaturas ──
    y += 24;
    if (y < doc.page.height - 100) {
      doc.rect(50, y, 160, 1).fill(CINZA);
      doc.rect(doc.page.width - 210, y, 160, 1).fill(CINZA);
      doc.fillColor(CINZA).fontSize(8).font('Helvetica')
         .text('Gestor Comercial / Representante', 50, y + 5, { width: 160, align: 'center' })
         .text('Cliente / Responsável', doc.page.width - 210, y + 5, { width: 160, align: 'center' });
    }

    rodape(doc);
    doc.end();
  } catch (err) {
    console.error('PDF proposta erro:', err);
    if (!res.headersSent) res.status(500).json({ erro: 'Erro ao gerar PDF' });
  }
});

// ─── GET /api/relatorios/negociacao/:leadId ────────────────────────────────────
router.get('/negociacao/:leadId', async (req, res) => {
  try {
    const [leadR, histR, oportR] = await Promise.all([
      db.query(
        `SELECT l.*, c.nome, c.empresa, c.email, c.telefone
         FROM leads l JOIN clientes c ON c.id = l.cliente_id WHERE l.id = $1`,
        [req.params.leadId]
      ),
      db.query('SELECT * FROM historico WHERE lead_id = $1 ORDER BY criado_em ASC', [req.params.leadId]),
      db.query('SELECT * FROM oportunidades WHERE lead_id = $1 ORDER BY criado_em DESC', [req.params.leadId]),
    ]);

    if (!leadR.rows[0]) return res.status(404).json({ erro: 'Lead não encontrado' });

    const lead  = leadR.rows[0];
    const hist  = histR.rows;
    const oport = oportR.rows;
    const totalOport = oport.reduce((s, o) => s + Number(o.valor), 0);

    const doc = criarDoc(false);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="negociacao-lead-${lead.id}.pdf"`);
    doc.pipe(res);

    cabecalho(doc, 'RESUMO DA NEGOCIAÇÃO', lead.empresa || '');

    let y = 90;

    // ── Card do lead ──
    doc.rect(40, y, doc.page.width - 80, 54).fill('#eff6ff').stroke('#bfdbfe');
    doc.fillColor(AZUL_ESCURO).fontSize(15).font('Helvetica-Bold')
       .text(lead.nome, 55, y + 7, { width: doc.page.width - 200, lineBreak: false });
    doc.fillColor(CINZA).fontSize(8).font('Helvetica')
       .text(`${lead.empresa || ''}  ·  ${lead.email || ''}  ·  ${lead.telefone || ''}`, 55, y + 26, { lineBreak: false });
    let bx = 55;
    bx = badge(doc, bx, y + 38, lead.status || 'novo', COR_STATUS[lead.status] || CINZA);
    badge(doc, bx, y + 38, `Prioridade ${lead.prioridade}`, AZUL);
    y += 62;

    // ── Dados do lead ──
    y = secao(doc, y, '👤  Dados do Lead');
    y = linha(doc, y, 'Origem', lead.origem);
    y = linha(doc, y, 'Status', lead.status);
    y = linha(doc, y, 'Prioridade', `${lead.prioridade} / 10`);
    y = linha(doc, y, 'Cadastrado em', new Date(lead.criado_em).toLocaleDateString('pt-BR'));
    y += 4;

    // ── Oportunidades ──
    if (oport.length > 0) {
      y = secao(doc, y, `💼  Oportunidades  (${oport.length} · R$ ${totalOport.toLocaleString('pt-BR')})`);
      const pw = doc.page.width - 80;
      y = tabela(doc, y,
        ['Título', 'Estágio', 'Valor', 'Prev. Fechamento'],
        oport.map(o => [o.titulo, o.estagio, `R$ ${Number(o.valor).toLocaleString('pt-BR')}`,
          o.data_fechamento ? new Date(o.data_fechamento).toLocaleDateString('pt-BR') : '—']),
        [Math.round(pw * 0.4), Math.round(pw * 0.2), Math.round(pw * 0.2), Math.round(pw * 0.2)]
      );
    }

    // ── Histórico completo ──
    y = secao(doc, y, `🕐  Histórico Completo  (${hist.length} interações)`);
    if (!hist.length) {
      doc.fillColor(CINZA).fontSize(9).font('Helvetica').text('Nenhuma interação registrada.', 50, y);
      y += 20;
    } else {
      hist.forEach((h) => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          cabecalho(doc, 'Histórico (continuação)', '');
          y = 90;
        }
        const tipo = h.tipo || 'nota';
        const cor  = COR_TIPO[tipo] || CINZA;
        // Bola da timeline
        doc.circle(54, y + 6, 4).fill(cor);
        // Data + tipo
        const data = new Date(h.criado_em).toLocaleString('pt-BR');
        doc.fillColor(CINZA).fontSize(7.5).font('Helvetica').text(data, 66, y, { lineBreak: false });
        doc.fillColor(BRANCO);
        badge(doc, 66 + doc.widthOfString(data) + 4, y - 1, tipo, cor);
        y += 13;
        // Descrição
        const descH = doc.heightOfString(h.descricao, { width: doc.page.width - 120, fontSize: 9 });
        doc.fillColor(PRETO).fontSize(9).font('Helvetica')
           .text(h.descricao, 66, y, { width: doc.page.width - 120, lineBreak: true });
        y += descH + 10;
      });
    }

    // ── Notas do gestor ──
    if (lead.notas) {
      y = secao(doc, y, '📝  Notas do Gestor');
      const nh = doc.heightOfString(lead.notas, { width: doc.page.width - 100 });
      doc.fillColor('#374151').fontSize(9).font('Helvetica')
         .text(lead.notas, 50, y, { width: doc.page.width - 100, align: 'justify' });
      y += nh + 10;
    }

    rodape(doc);
    doc.end();
  } catch (err) {
    console.error('PDF negociacao erro:', err);
    if (!res.headersSent) res.status(500).json({ erro: 'Erro ao gerar PDF' });
  }
});

// ─── GET /api/relatorios/pipeline ──────────────────────────────────────────────
router.get('/pipeline', async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT o.titulo, o.estagio, o.valor, o.data_fechamento, o.criado_em,
             c.nome, c.empresa, c.email, l.prioridade, l.origem, l.status AS lead_status
      FROM oportunidades o
      JOIN leads l ON l.id = o.lead_id
      JOIN clientes c ON c.id = l.cliente_id
      ORDER BY o.valor DESC
    `);

    const total   = rows.reduce((s, r) => s + Number(r.valor), 0);
    const ganhos  = rows.filter(r => r.estagio === 'fechado_ganho').reduce((s, r) => s + Number(r.valor), 0);
    const abertos = rows.filter(r => !['fechado_ganho','fechado_perdido'].includes(r.estagio)).reduce((s, r) => s + Number(r.valor), 0);

    const doc = criarDoc(true);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pipeline-completo.pdf"');
    doc.pipe(res);

    cabecalho(doc, 'RELATÓRIO DE PIPELINE COMPLETO', new Date().toLocaleDateString('pt-BR'));

    let y = 90;

    // ── Cards de resumo ──
    const cards = [
      { val: String(rows.length),                                      label: 'Oportunidades',  cor: AZUL         },
      { val: `R$ ${total.toLocaleString('pt-BR')}`,                   label: 'Volume Total',   cor: AZUL_ESCURO  },
      { val: `R$ ${ganhos.toLocaleString('pt-BR')}`,                  label: 'Fechado Ganho',  cor: VERDE        },
      { val: `R$ ${abertos.toLocaleString('pt-BR')}`,                 label: 'Em Andamento',   cor: AMARELO      },
    ];
    const cardW = (doc.page.width - 80 - 15) / 4;
    cards.forEach((c, i) => {
      const cx = 40 + i * (cardW + 5);
      doc.rect(cx, y, cardW, 48).fill(c.cor);
      doc.fillColor(BRANCO).fontSize(14).font('Helvetica-Bold')
         .text(c.val, cx + 8, y + 7, { width: cardW - 16, lineBreak: false });
      doc.fontSize(8).font('Helvetica').fillColor('#dbeafe')
         .text(c.label, cx + 8, y + 28, { width: cardW - 16, lineBreak: false });
    });
    y += 56;

    // ── Distribuição por estágio ──
    y = secao(doc, y, '📊  Distribuição por Estágio');
    const estagios = ['prospecção','proposta','negociação','fechado_ganho','fechado_perdido'];
    const eW = (doc.page.width - 80) / estagios.length;
    estagios.forEach((e, i) => {
      const cx = 40 + i * eW;
      const n  = rows.filter(r => r.estagio === e).length;
      const v  = rows.filter(r => r.estagio === e).reduce((s, r) => s + Number(r.valor), 0);
      doc.rect(cx, y, eW - 3, 38).fill(COR_ESTAGIO[e] || CINZA);
      doc.fillColor(BRANCO).fontSize(18).font('Helvetica-Bold').text(String(n), cx + 6, y + 3, { width: eW - 10, lineBreak: false });
      doc.fontSize(7).font('Helvetica').text(e, cx + 6, y + 23, { width: eW - 10, lineBreak: false });
      doc.fontSize(7).text(`R$ ${v.toLocaleString('pt-BR')}`, cx + 6, y + 30, { width: eW - 10, lineBreak: false });
    });
    y += 46;

    // ── Tabela ──
    y = secao(doc, y, '📋  Lista Detalhada de Oportunidades');
    const pw   = doc.page.width - 80;
    const cols = [Math.round(pw*0.23), Math.round(pw*0.14), Math.round(pw*0.14), Math.round(pw*0.12), Math.round(pw*0.12), Math.round(pw*0.09), Math.round(pw*0.12)];
    y = tabela(doc, y,
      ['Título', 'Cliente', 'Empresa', 'Estágio', 'Valor', 'Prioridade', 'Fechamento'],
      rows.map(r => [
        r.titulo, r.nome, r.empresa, r.estagio,
        `R$ ${Number(r.valor).toLocaleString('pt-BR')}`,
        String(r.prioridade),
        r.data_fechamento ? new Date(r.data_fechamento).toLocaleDateString('pt-BR') : '—'
      ]),
      cols
    );

    rodape(doc);
    doc.end();
  } catch (err) {
    console.error('PDF pipeline erro:', err);
    if (!res.headersSent) res.status(500).json({ erro: 'Erro ao gerar PDF' });
  }
});

module.exports = router;
