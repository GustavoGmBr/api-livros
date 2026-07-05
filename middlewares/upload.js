// server/middlewares/upload.middleware.js
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

// ✅ Aumentar limites e adicionar tratamento de erro
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    fieldSize: 50 * 1024 * 1024, // 50MB
    files: 2 // Máximo 2 arquivos
  }
});

// ✅ Middleware com tratamento de erro melhorado
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Arquivo muito grande', 
        maxSize: '50MB',
        detalhe: err.message 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Campo inesperado', 
        detalhe: err.message 
      });
    }
    return res.status(400).json({ 
      error: 'Erro no upload', 
      detalhe: err.message 
    });
  }
  next(err);
};

// Exportar middlewares com tratamento de erro
export const uploadPersonagem = (req, res, next) => {
  upload.fields([
    { name: 'corpo', maxCount: 1 },
    { name: 'rosto', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Exportar outros uploads
export const uploadItem = upload.single('item');
export const uploadLocal = upload.single('local');
export const uploadBestiario = upload.single('bestiario');
export const uploadFormaEspecial = upload.fields([
  { name: 'corpo', maxCount: 1 },
  { name: 'rosto', maxCount: 1 }
]);

export default upload;    