import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ CONFIGURAÇÃO CORS ROBUSTA
const allowedOrigins = [
    'https://setimoelemento.com.br',
    'https://www.setimoelemento.com.br',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (ex: Postman, curl)
        if (!origin) {
            console.log('✅ Requisição sem origin (permitida)');
            return callback(null, true);
        }
        
        // Verificar se a origem está na lista de permitidas
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS permitido para: ${origin}`);
            return callback(null, true);
        } else {
            console.log(`❌ CORS bloqueado para: ${origin}`);
            return callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With'
    ],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    credentials: true,
    optionsSuccessStatus: 200 // Para navegadores antigos
}));

// ✅ Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Correção para BigInt (Prisma)
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

// ✅ Rota de teste para CORS
app.options('*', cors()); // Responder a todas as requisições OPTIONS

// ✅ Montagem das rotas
app.use('/api', router);

// ✅ Tratamento de rotas não encontradas
app.use((req, res) => {
    console.log(`⚠️ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({
        error: `Rota ${req.method} ${req.url} não encontrada no servidor.`
    });
});

// ✅ Iniciar servidor
const port = process.env.PORT || 3333;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`📍 HTTPS: https://api.setimoelemento.com.br`);
    console.log(`✅ CORS configurado para:`, allowedOrigins);
});