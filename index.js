import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// ✅ CONFIGURAÇÃO CORS MELHORADA
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de origens permitidas
        const allowedOrigins = [
            'https://setimoelemento.com.br',
            'https://www.setimoelemento.com.br',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5174',
            'http://localhost:5175',
            // Adicione o IP ou domínio do HostGator se necessário
            // Ex: 'https://seudominio.hostgator.com.br'
        ];

        // Permite requisições sem origin (ex: mobile apps, curl, etc)
        if (!origin) {
            return callback(null, true);
        }

        // Verifica se a origin é permitida
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS permitido para: ${origin}`);
            return callback(null, true);
        }

        // Se não estiver na lista, verifica se é subdomínio do site
        const isSubdomain = origin.includes('.setimoelemento.com.br');
        if (isSubdomain) {
            console.log(`✅ CORS permitido para subdomínio: ${origin}`);
            return callback(null, true);
        }

        // Se for ambiente de desenvolvimento
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            console.log(`✅ CORS permitido para desenvolvimento: ${origin}`);
            return callback(null, true);
        }

        // Bloqueia outras origens
        console.log(`❌ CORS bloqueado para: ${origin}`);
        return callback(new Error('Origem não permitida pelo CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept', 
        'Origin', 
        'X-Requested-With',
        'X-Request-ID',
        'X-CSRF-Token'
    ],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 horas
};

// ✅ APLICA CORS
app.use(cors(corsOptions));

// ✅ MIDDLEWARE PARA TRATAR PREFLIGHT (OPTIONS)
app.options('*', cors(corsOptions));

// ✅ MIDDLEWARE PARA LOG DE REQUISIÇÕES
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
    next();
});

// ✅ Middleware para JSON com limite maior
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Correção para BigInt (Prisma)
BigInt.prototype.toJSON = function () {
    return this.toString();
};

// ✅ Rota de teste melhorada
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
        message: 'CORS está funcionando corretamente!',
        origin: req.headers.origin || 'N/A'
    });
});

// ✅ Montagem das rotas
app.use('/api', router);

// ✅ Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    console.error('Stack:', err.stack);
    
    // Se for erro de CORS
    if (err.message === 'Origem não permitida pelo CORS') {
        return res.status(403).json({
            error: 'Acesso negado por política de CORS',
            message: 'A origem da requisição não é permitida',
            origin: req.headers.origin || 'N/A'
        });
    }

    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// ✅ Tratamento de rotas não encontradas (deve vir depois das rotas e antes do erro)
app.use((req, res) => {
    console.log(`⚠️ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({
        error: `Rota ${req.method} ${req.url} não encontrada no servidor.`
    });
});

// ✅ Iniciar servidor
const port = process.env.PORT || 3333;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor iniciado com sucesso!`);
    console.log(`📍 Porta: ${port}`);
    console.log(`📍 Host: ${host}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`📍 API: https://api.setimoelemento.com.br`);
    console.log(`📍 CORS configurado para múltiplas origens`);
    console.log('='.repeat(50));
});

// ✅ Tratamento de sinais para desligamento gracioso
process.on('SIGTERM', () => {
    console.log('🔄 Recebido SIGTERM, fechando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Recebido SIGINT, fechando servidor...');
    process.exit(0);
});