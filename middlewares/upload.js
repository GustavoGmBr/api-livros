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
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 10MB por arquivo
});

// Uploads de arquivo único (.single)
export const uploadPersonagem = upload.single('personagem');
export const uploadItem = upload.single('item');
export const uploadLocal = upload.single('local'); 
// 🐲 Novo: Upload de arquivo único para o Bestiário
export const uploadBestiario = upload.single('bestiario'); 

// Upload de múltiplos campos para a Forma Especial (.fields)
export const uploadFormaEspecial = upload.fields([
  { name: 'corpo', maxCount: 1 },
  { name: 'rosto', maxCount: 1 }
]);

export default upload;