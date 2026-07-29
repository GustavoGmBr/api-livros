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
    'http://setimoelemento.com.br',
    'http://www.setimoelemento.com.br',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

// ✅ MIDDLEWARE DE LOG
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    console.log(`📝 Origin: ${req.headers.origin || 'N/A'}`);
    next();
});

// ✅ CONFIGURAÇÃO CORS (única e correta)
app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin
        if (!origin) {
            console.log('✅ Requisição sem origin (permitida)');
            return callback(null, true);
        }

        const cleanOrigin = origin.replace(/\/$/, '');
        
        // Verifica na lista de permitidas
        if (allowedOrigins.includes(cleanOrigin)) {
            console.log(`✅ CORS permitido para: ${cleanOrigin}`);
            return callback(null, true);
        }

        // Verifica subdomínios
        if (cleanOrigin.includes('.setimoelemento.com.br')) {
            console.log(`✅ CORS permitido para subdomínio: ${cleanOrigin}`);
            return callback(null, true);
        }

        // Verifica localhost com porta
        if (/^http:\/\/localhost:\d+$/.test(cleanOrigin)) {
            console.log(`✅ CORS permitido para localhost: ${cleanOrigin}`);
            return callback(null, true);
        }

        console.log(`❌ CORS BLOQUEADO para: ${cleanOrigin}`);
        return callback(new Error('Origem não permitida pelo CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-Request-ID',
        'X-CSRF-Token',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: ['Content-Length', 'Content-Range', 'X-Total-Count'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400
}));

// ⚠️ REMOVA esta linha (está causando o erro):
// app.options('*', cors());

// ✅ Middleware para JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Correção para BigInt (Prisma)
BigInt.prototype.toJSON = function () {
    return this.toString();
};

// ✅ HEADERS DE SEGURANÇA
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ✅ Rota de teste
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Setimo Elemento API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ✅ Rota de teste CORS
app.get('/test-cors', (req, res) => {
    res.json({
        success: true,
        message: 'CORS está funcionando!',
        origin: req.headers.origin || 'N/A',
        method: req.method
    });
});

// ✅ Rota de saúde
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ✅ Montagem das rotas principais
app.use('/api', router);

// ✅ Tratamento de rotas não encontradas
app.use((req, res) => {
    console.log(`⚠️ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({
        error: `Rota ${req.method} ${req.url} não encontrada`,
        message: 'Verifique se a URL está correta'
    });
});

// ✅ Middleware de erro global
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    console.error('Stack:', err.stack);
    
    // Erro de CORS
    if (err.message === 'Origem não permitida pelo CORS') {
        return res.status(403).json({
            error: 'Acesso negado',
            message: 'A origem da requisição não é permitida',
            origin: req.headers.origin || 'N/A'
        });
    }

    // Outros erros
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
        status: err.status || 500
    });
});

// ✅ Iniciar servidor
const port = process.env.PORT || 3333;
const host = '0.0.0.0';

const server = app.listen(port, host, () => {
    console.log('='.repeat(60));
    console.log(`🚀 SERVIDOR INICIADO COM SUCESSO`);
    console.log(`📍 Porta: ${port}`);
    console.log(`📍 Host: ${host}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 URL Local: http://localhost:${port}`);
    console.log(`📍 URL API: https://api.setimoelemento.com.br`);
    console.log(`📍 CORS: Permitindo múltiplas origens`);
    console.log('='.repeat(60));
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Recebido SIGTERM, fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🔄 Recebido SIGINT, fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado');
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});