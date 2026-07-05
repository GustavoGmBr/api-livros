import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ Configuração CORS Corrigida para Express v5/path-to-regexp v8
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ Middleware para garantir o retorno correto de requisições OPTIONS (Preflight) sem quebrar o roteador
app.options('(.*)', cors());

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

// ✅ Tratamento 404 (Usando a sintaxe universal segura)
app.use('(.*)', (req, res) => {
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