import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ LISTA DE ORIGENS PERMITIDAS
const allowedOrigins = [
    'https://setimoelemento.com.br',
    'https://www.setimoelemento.com.br',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
];

// ✅ MIDDLEWARE PARA OPTIONS (CORRIGIDO)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
        return res.sendStatus(200);
    }
    next();
});

// ✅ CONFIGURAÇÃO CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            console.log('✅ Requisição sem origin (permitida)');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS permitido para: ${origin}`);
            return callback(null, true);
        } else {
            console.log(`❌ CORS bloqueado para: ${origin}`);
            return callback(new Error('Origem não permitida pelo CORS'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
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