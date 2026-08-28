// server/middlewares/upload.js
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
export const uploadBestiario = upload.single('bestiario');
// 📚 NOVO: Upload de capa de livro
export const uploadLivro = upload.single('foto_capa');

// Upload de múltiplos campos para a Forma Especial (.fields)
export const uploadFormaEspecial = upload.fields([
  { name: 'corpo', maxCount: 1 },
  { name: 'rosto', maxCount: 1 }
]);

export default upload;