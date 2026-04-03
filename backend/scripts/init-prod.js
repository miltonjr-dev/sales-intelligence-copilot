const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false
});

async function run() {
  try {
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    console.log('Tabelas encontradas:', rows.map(r => r.table_name).join(', ') || 'NENHUMA');

    if (rows.length === 0) {
      console.log('Inicializando schema...');
      const sql = fs.readFileSync(path.join(__dirname, '..', 'setup.sql'), 'utf8');
      await pool.query(sql);
      console.log('Schema criado!');
    }

    // Cria usuário admin se não existir
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('senha123', 10);
    try {
      await pool.query(
        "INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET senha_hash=$3",
        ['Milton Andrade', 'miltonjrandra@gmail.com', hash]
      );
      console.log('Usuário admin atualizado com senha123');
    } catch(e) {
      console.log('Erro ao criar usuário:', e.message);
    }

  } catch(e) {
    console.error('ERRO:', e.message);
  } finally {
    await pool.end();
  }
}

run();
