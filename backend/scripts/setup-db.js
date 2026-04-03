/**
 * Auto-migração: cria o schema se não existir.
 * Chamado pelo start script antes do servidor iniciar.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='clientes'"
    );

    if (rows[0].count === '0') {
      console.log('📦 Inicializando schema do banco...');
      const sql = fs.readFileSync(path.join(__dirname, '../setup.sql'), 'utf8');
      await pool.query(sql);
      console.log('✅ Schema criado com sucesso!');
    } else {
      console.log('✅ Banco já inicializado, pulando migração.');
    }
  } catch (err) {
    console.error('⚠️  Setup do banco falhou (não fatal):', err.message);
  } finally {
    await pool.end();
  }
}

module.exports = setupDatabase;
