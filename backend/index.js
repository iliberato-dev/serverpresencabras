// backend/index.js
import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import fetch   from 'node-fetch';

dotenv.config();
const app     = express();
const PORT    = process.env.PORT;
const FRONT   = process.env.FRONT_URL;
const GAS_URL = process.env.GAS_URL;

// habilita CORS só pro seu front
app.use(cors({ origin: FRONT }));
app.options('*', cors({ origin: FRONT }));

app.use(express.json());

// rota proxy para GETs (getMembros e presencasMes)
app.get('/presenca', async (req, res) => {
  try {
    const { tipo } = req.query;
    const resp = await fetch(`${GAS_URL}?tipo=${tipo}`, { method: 'GET' });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// rota proxy para POST (gravar presença)
app.post('/presenca', async (req, res) => {
  try {
    const resp = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await resp.text();
    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`API ouvindo na porta ${PORT}`));
