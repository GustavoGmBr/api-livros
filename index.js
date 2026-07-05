import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ CONFIGURAÇÃO CORS CORRETA - APENAS NO NODE.JS
const corsOptions = {
  origin: [
    'https://setimoelemento.com.br',
    'https://www.setimoelemento.com.br',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// Para requisições OPTIONS (preflight)
app.options('*', cors(corsOptions));

// ✅ Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ BigInt fix
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// ✅ Rotas
app.use('/api', router);

// ✅ Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
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