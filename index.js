// No seu index.js principal

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ CONFIGURAÇÃO IMPORTANTE: Aumentar limites no Express
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'JSON inválido' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 50000
}));

// ✅ Middleware para debug (opcional, mas útil)
app.use((req, res, next) => {
  if (req.headers['content-length']) {
    const sizeMB = parseInt(req.headers['content-length']) / (1024 * 1024);
    console.log(`📦 Tamanho da requisição: ${sizeMB.toFixed(2)} MB - ${req.method} ${req.url}`);
  }
  next();
});

// ✅ Correção para BigInt
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Setimo Elemento API is running',
    timestamp: new Date().toISOString()
  });
});

// Rotas
app.use('/api', router);

// Tratamento de 404
app.use((req, res) => {
  console.log(`⚠️ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Rota ${req.method} ${req.url} não encontrada` });
});

// ✅ Middleware de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro global:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'Arquivo muito grande', 
      maxSize: '50MB' 
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      error: 'Campo de arquivo inesperado' 
    });
  }
  
  res.status(500).json({ 
    error: err.message || 'Erro interno no servidor' 
  });
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});