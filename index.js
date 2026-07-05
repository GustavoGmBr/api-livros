import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ Configuração CORS 
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ Regex pura para capturar todas as rotas OPTIONS sem quebrar o path-to-regexp
app.options(/.*/, cors());

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ BigInt fix
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// ✅ Rota de teste
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Setimo Elemento API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ Rotas da API
app.use('/api', router);

// ✅ Tratamento 404 usando Regex pura
app.use(/.*/, (req, res) => {
  console.log(`⚠️ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Rota ${req.method} ${req.url} não encontrada` });
});

// ✅ Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ error: err.message || 'Erro interno' });
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});