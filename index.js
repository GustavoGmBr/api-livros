import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Removi o import do axios, pois ele não estava sendo usado no index.js e pode causar erro de build se não estiver no package.json
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ Configuração de CORS robusta
app.use(cors({
  origin: '*', // Em produção, você pode trocar pelo link do seu front no Render
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Middleware para ler JSON (Obrigatório para receber dados do Postman/Front)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Adicionado para suportar diferentes formatos de requisição

// ✅ Correção Global para BigInt (Essencial para o Prisma não quebrar no JSON.stringify)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Rota de teste de saúde da API
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Setimo Elemento API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ Montagem das rotas
app.use('/api', router);

// ✅ Tratamento de rotas não encontradas (Ajuda a diagnosticar o 404)
app.use((req, res) => {
  console.log(`⚠️ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Rota ${req.method} ${req.url} não encontrada no servidor.` });
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});