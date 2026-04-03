const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const router   = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1,$2,$3) RETURNING id, nome, email',
      [nome, email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ erro: 'Email já cadastrado ou dados inválidos' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(senha, user.senha_hash)))
      return res.status(401).json({ erro: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email } });
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
