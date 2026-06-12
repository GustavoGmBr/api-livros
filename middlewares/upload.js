// server/middlewares/upload.middleware.js
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por arquivo
});

// Uploads de arquivo único (.single)
export const uploadPersonagem = upload.single('personagem');
export const uploadItem = upload.single('item');
export const uploadLocal = upload.single('local'); 

// ✅ Novo: Upload de múltiplos campos para a Forma Especial (.fields)
// Permite enviar um arquivo no campo 'corpo' e outro no campo 'rosto'
export const uploadFormaEspecial = upload.fields([
  { name: 'corpo', maxCount: 1 },
  { name: 'rosto', maxCount: 1 }
]);

export default upload;