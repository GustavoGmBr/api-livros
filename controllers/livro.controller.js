import { prisma } from '../lib/prisma.js';
import { livroSchema, livroFormSchema } from '../validator/livro.validator.js';
import ftpService from '../services/ftp.service.js';

const livroController = {
  async index(req, res) {
    try {
      const { saga_id } = req.query;
      const livros = await prisma.livros.findMany({
        where: saga_id ? { saga_id: Number(saga_id) } : {},
        include: {
          saga: { select: { nome: true } },
          _count: { select: { capitulos: true } }
        },
        orderBy: [
          { saga_id: 'asc' },
          { ordem_serie: 'asc' },
          { data_publicacao: 'desc' }
        ]
      });
      res.json(livros);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const livro = await prisma.livros.findUnique({
        where: { id },
        include: {
          saga: true,
          capitulos: {
            orderBy: { numero: 'asc' },
            select: { id: true, numero: true, titulo: true }
          }
        }
      });
      if (!livro) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.json(livro);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      // Validar dados do formulário (sem arquivo)
      const data = livroFormSchema.parse(req.body);
      
      let foto_capa = null;

      // Se houver upload de capa
      if (req.file) {
        // Usar o título do livro como nome base para a imagem
        const nomeCustomizado = data.titulo || 'livro';
        foto_capa = await ftpService.uploadFile(req.file, 'livros', nomeCustomizado);
      }

      // Criar livro no banco
      const livro = await prisma.livros.create({
        data: {
          titulo: data.titulo,
          sinopse: data.sinopse,
          data_publicacao: data.data_publicacao,
          ordem_serie: data.ordem_serie,
          saga_id: data.saga_id,
          foto_capa // URL da imagem salva
        }
      });

      res.status(201).json(livro);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Erro ao criar livro:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      
      // Buscar livro atual para verificar capa existente
      const livroAtual = await prisma.livros.findUnique({
        where: { id }
      });

      if (!livroAtual) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      // Validar dados do formulário
      const data = livroFormSchema.parse(req.body);
      
      let foto_capa = livroAtual.foto_capa;

      // Se houver novo upload de capa
      if (req.file) {
        // Deletar capa antiga se existir
        if (livroAtual.foto_capa) {
          try {
            await ftpService.deleteFile(livroAtual.foto_capa);
          } catch (deleteError) {
            console.warn('⚠️ Erro ao deletar capa antiga:', deleteError.message);
          }
        }
        
        // Upload da nova capa
        const nomeCustomizado = data.titulo || livroAtual.titulo || 'livro';
        foto_capa = await ftpService.uploadFile(req.file, 'livros', nomeCustomizado);
      }

      // Atualizar livro no banco
      const livro = await prisma.livros.update({
        where: { id },
        data: {
          titulo: data.titulo,
          sinopse: data.sinopse,
          data_publicacao: data.data_publicacao,
          ordem_serie: data.ordem_serie,
          saga_id: data.saga_id,
          foto_capa
        }
      });

      res.json(livro);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      console.error('Erro ao atualizar livro:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);

      // Buscar livro para deletar a capa
      const livro = await prisma.livros.findUnique({
        where: { id }
      });

      if (!livro) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      // Deletar capa do FTP se existir
      if (livro.foto_capa) {
        try {
          await ftpService.deleteFile(livro.foto_capa);
        } catch (deleteError) {
          console.warn('⚠️ Erro ao deletar capa:', deleteError.message);
        }
      }

      // Verificar se o livro tem capítulos relacionados
      const temCapitulos = await prisma.capitulos.count({
        where: { livro_id: id }
      });

      if (temCapitulos > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar o livro pois ele possui capítulos associados.' 
        });
      }

      // Deletar livro do banco
      await prisma.livros.delete({ where: { id } });
      
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      console.error('Erro ao deletar livro:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Método adicional para remover apenas a capa (opcional)
  async removeCapa(req, res) {
    try {
      const id = Number(req.params.id);

      const livro = await prisma.livros.findUnique({
        where: { id }
      });

      if (!livro) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      if (livro.foto_capa) {
        // Deletar do FTP
        await ftpService.deleteFile(livro.foto_capa);
        
        // Atualizar banco removendo a URL
        await prisma.livros.update({
          where: { id },
          data: { foto_capa: null }
        });
      }

      res.json({ message: 'Capa removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover capa:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

export default livroController;