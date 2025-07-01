import express from "express";
import cors from "cors";
import fetch from 'node-fetch'; // Se estiver usando Node.js 18+ (ou módulos esm em versões anteriores), 'fetch' é global.
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// ===> URL BASE DO SEU GOOGLE APPS SCRIPT WEB APP <===
// Obtenha este URL após o deploy do seu Apps Script (termina em /exec)
// EXEMPLO: "https://script.google.com/macros/s/AKfycbwyXxjdGWoeeKW6HDYxD5F3pZEzHsg4PbFWMA89GjITO55cpUvHbTU8TzIgNF62DfS/exec";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyTmDpB4RGxJ6whSuoydK-PiQ0jOjzvHHXPeVO9Us8587Ldg5NmyZLhykQTLenbGjnA/exec"; // <--- ATUALIZE AQUI COM O URL DO SEU DEPLOY DO APPS SCRIPT!

// ===> URL DO SEU FRONTEND HOSPEDADO NO VERCEL <===
// Você forneceu esta URL!
const FRONTEND_URL = "https://presencas-bras.vercel.app";
const FRONTEND_LOCAL_URL = "http://127.0.0.1:5500/index.html"; // ou a porta que você usa, como 3000, 8080 etc.
// Configuração do CORS: Permite requisições APENAS do seu frontend Vercel e local
app.use(cors({
    origin: [FRONTEND_URL, FRONTEND_LOCAL_URL]
}));
app.use(express.json());

// Função utilitária para fazer requisições GET ao Apps Script
async function fetchFromAppsScript(endpointType) {
    const url = `${APPS_SCRIPT_URL}?tipo=${endpointType}`;
    console.log(`Backend: Encaminhando GET para Apps Script: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro Apps Script GET ${endpointType}: ${response.status} - ${errorText}`);
    }
    return await response.json();
}

// ROTAS GET PARA O FRONTEND
app.get("/get-membros", async (req, res) => {
    try {
        const data = await fetchFromAppsScript('getMembros');
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao obter membros do Apps Script:", err);
        res.status(500).json({ error: "Erro ao obter dados de membros", details: err.message });
    }
});

app.get("/get-presencas-mes", async (req, res) => {
    try {
        const data = await fetchFromAppsScript('presencasMes');
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao obter presenças do mês do Apps Script:", err);
        res.status(500).json({ error: "Erro ao obter presenças do mês", details: err.message });
    }
});

app.get("/get-presencas-total", async (req, res) => {
    try {
        const data = await fetchFromAppsScript('presencasTotal');
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao obter presenças totais do Apps Script:", err);
        res.status(500).json({ error: "Erro ao obter presenças totais", details: err.message });
    }
});

// ROTA POST PARA REGISTRAR PRESENÇA
app.post("/presenca", async (req, res) => {
  try {
    console.log("Recebido do frontend (POST /presenca):", req.body);

    const response = await fetch(
      APPS_SCRIPT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text(); 

    let responseData;
    try {
        responseData = JSON.parse(text);
    } catch (parseError) {
        responseData = { message: text }; // Assume que é uma string simples como "OK"
    }

    if (!response.ok || (responseData.error && responseData.message?.startsWith('Erro:'))) {
        console.error("Erro do Apps Script (POST):", response.status, responseData);
        return res.status(response.status >= 400 ? response.status : 500).json({
            error: "Erro do Apps Script ao registrar presença",
            details: responseData.message || responseData
        });
    }

    console.log("Resposta do Apps Script (POST):", responseData);
    res.status(200).json({ message: "Presença registrada com sucesso!" }); 
  } catch (err) {
    console.error("Erro ao enviar para o Apps Script (POST):", err);
    res.status(500).json({ error: "Erro interno do servidor", details: err.message });
  }
});

// Configuração para servir arquivos estáticos (frontend)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Assumindo que seus arquivos HTML, CSS, JS estão na pasta 'public'
// app.use(express.static(path.join(__dirname, 'public')));

// Para lidar com rotas não encontradas no frontend (SPA - Single Page Application)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// INICIAR O SERVIDOR
app.listen(PORT, () => {
  console.log(`Backend intermediário rodando em http://localhost:${PORT}`);
  console.log(`Conectando-se ao Apps Script em: ${APPS_SCRIPT_URL}`);
});
