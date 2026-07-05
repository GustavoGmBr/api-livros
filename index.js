import express from 'express';
// Remova o import do cors se não for mais usar aqui
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();


app.options(/.*/, (req, res) => {
  res.sendStatus(204); 
});

// ✅ O resto do seu arquivo continua rigorosamente igual...
app.use(express.json());