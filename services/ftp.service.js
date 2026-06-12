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
    // 🚀 Adicionada 'formas' como uma pasta permitida na chamada do serviço
    const allowedFolders = ['personagens', 'bestiario', 'itens', 'locais', 'formas'];
    
    if (!allowedFolders.includes(subPasta)) {
      console.warn(`⚠️ Pasta inválida: ${subPasta}, usando 'personagens'`);
      subPasta = 'personagens';
    }

    const client = new ftp.Client();
    client.ftp.timeout = 30000; // Evita que a conexão trave infinitamente

    try {
      await client.access(config);
      
      const extensao = path.extname(file.originalname).toLowerCase();
      
      // 1. Sanitização do nome (Se houver customName, limpa e remove extensões extras)
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

      // 📁 Regra de Negócio: Se a pasta for 'formas', aninha ela dentro de 'personagens/formas'
      let caminhoDiretorio = subPasta;
      if (subPasta === 'formas') {
        caminhoDiretorio = 'personagens/formas';
      }

      const remoteDir = `/setimoelemento.com.br/uploads/${caminhoDiretorio}`;
      await client.ensureDir(remoteDir);

      const stream = Readable.from(file.buffer);
      const remoteFilePath = `${remoteDir}/${nomeFinal}`;
      await client.uploadFrom(stream, remoteFilePath);

      // Monta a URL pública apontando exatamente para onde o arquivo foi guardado
      const urlPublica = `https://setimoelemento.com.br/uploads/${caminhoDiretorio}/${nomeFinal}`;
      
      console.log(`✅ Upload concluído em [${caminhoDiretorio}]: ${nomeFinal}`);
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