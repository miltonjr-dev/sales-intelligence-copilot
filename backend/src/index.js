require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const setupDatabase = require('../scripts/setup-db');

const authRoutes          = require('./routes/auth');
const clientesRoutes      = require('./routes/clientes');
const leadsRoutes         = require('./routes/leads');
const oportunidadesRoutes = require('./routes/oportunidades');
const historicoRoutes     = require('./routes/historico');
const metricsRoutes       = require('./routes/metrics');
const iaRoutes            = require('./routes/ia');
const csvRoutes           = require('./routes/csv');
const relatoriosRoutes    = require('./routes/relatorios');
const emailRoutes         = require('./routes/email');

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS: aceita origem configurada ou qualquer origem em dev
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000']
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

app.use('/api/auth',          authRoutes);
app.use('/api/clientes',      clientesRoutes);
app.use('/api/leads',         leadsRoutes);
app.use('/api/oportunidades', oportunidadesRoutes);
app.use('/api/historico',     historicoRoutes);
app.use('/api/metrics',       metricsRoutes);
app.use('/api/ia',            iaRoutes);
app.use('/api/csv',           csvRoutes);
app.use('/api/relatorios',    relatoriosRoutes);
app.use('/api/email',         emailRoutes);

app.listen(PORT, async () => {
  await setupDatabase();
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
