import * as ftp from 'basic-ftp';
import path from 'path';
import { Readable } from 'stream';

const config = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  secure: process.env.FTP_SECURE === 'true'
};

const ftpService = {
  async uploadFile(file, subPasta = 'personagens', customName = null) {
    // 🚀 Adicionadas novas pastas permitidas
    const allowedFolders = ['personagens', 'bestiario', 'itens', 'locais', 'formas', 'livros'];
    
    if (!allowedFolders.includes(subPasta)) {
      console.warn(`⚠️ Pasta inválida: ${subPasta}, usando 'personagens'`);
      subPasta = 'personagens';
    }

    const client = new ftp.Client();
    client.ftp.timeout = 30000;

    try {
      await client.access(config);
      
      const extensao = path.extname(file.originalname).toLowerCase();
      
      // 1. Sanitização do nome
      let nameBase = Date.now().toString();

      if (customName) {
        const apenasNome = path.parse(customName).name;
        nameBase = apenasNome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase();
      }

      const nomeFinal = `${nameBase}${extensao}`;

      // 📁 Regras de Negócio para pastas aninhadas
      let caminhoDiretorio = subPasta;
      if (subPasta === 'formas') {
        caminhoDiretorio = 'personagens/formas';
      }
      // 📚 Regra para capas de livros - manter em pasta própria
      if (subPasta === 'livros') {
        caminhoDiretorio = 'livros/capas';
      }

      // 🔥 CORRIGIDO: O caminho deve ser /setimoelemento.com.br/uploads/...
      // Mas note que no servidor, a estrutura é:
      // /home/usuario/setimoelemento.com.br/uploads/
      // Ou pode ser que o FTP já esteja na raiz do domínio
      const remoteDir = `/setimoelemento.com.br/uploads/${caminhoDiretorio}`;
      console.log(`📁 Criando diretório: ${remoteDir}`);
      await client.ensureDir(remoteDir);

      const stream = Readable.from(file.buffer);
      const remoteFilePath = `${remoteDir}/${nomeFinal}`;
      console.log(`📤 Enviando arquivo para: ${remoteFilePath}`);
      await client.uploadFrom(stream, remoteFilePath);

      // 🔥 CORRIGIDO: A URL pública deve apontar para a pasta correta
      // Se o servidor tem a estrutura /setimoelemento.com.br/uploads/
      // A URL pública é https://setimoelemento.com.br/uploads/...
      const urlPublica = `https://setimoelemento.com.br/uploads/${caminhoDiretorio}/${nomeFinal}`;
      
      console.log(`✅ Upload concluído em [${caminhoDiretorio}]: ${nomeFinal}`);
      console.log(`🔗 URL pública: ${urlPublica}`);
      return urlPublica;

    } catch (error) {
      console.error("❌ Erro no upload FTP:", error);
      throw new Error("Falha ao enviar imagem para o servidor.");
    } finally {
      client.close();
    }
  },

  /**
   * Remove um arquivo do servidor FTP usando a sua URL pública.
   * @param {string} urlPublica - Suporta subpastas aninhadas dinamicamente
   */
  async deleteFile(urlPublica) {
    if (!urlPublica) return;

    const client = new ftp.Client();
    client.ftp.timeout = 30000;

    try {
      const urlObj = new URL(urlPublica);
      const remoteFilePath = `/setimoelemento.com.br${urlObj.pathname}`;

      await client.access(config);
      
      await client.remove(remoteFilePath);
      console.log(`🗑️ Arquivo removido do FTP com sucesso: ${remoteFilePath}`);
      return true;

    } catch (error) {
      console.warn(`⚠️ Não foi possível deletar o arquivo no FTP (pode já ter sido apagado):`, error.message);
      return false;
    } finally {
      client.close();
    }
  }
};

export default ftpService;