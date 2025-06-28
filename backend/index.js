import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000
const GAS_URL = process.env.GAS_URL

// Middlewares
app.use(cors({ origin: ['https://presencas-bras.vercel.app/'] })) // ajuste seu front-end host
app.use(express.json())
app.use(morgan('tiny'))

// POST /presenca -> reencaminha ao Apps Script
app.post('/presenca', async (req, res) => {
  try {
    const resp = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    })
    const text = await resp.text()
    return res.status(200).send(text)
  } catch (err) {
    console.error('Erro /presenca:', err)
    return res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () =>
  console.log(`API rodando em https://presencas-bras.vercel.app/:${PORT}`)
)