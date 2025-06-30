import express from "express";
import cors from "cors";
import fetch from 'node-fetch'; // Para Node.js < 18, senão remova.
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// ===> URL BASE DO SEU GOOGLE APPS SCRIPT WEB APP <===
// Obtenha este URL após o deploy do seu Apps Script (termina em /exec)
// EXEMPLO: "https://script.google.com/macros/s/AKfycbwyXxjdGWoeeKW6HDYxD5F3pZEzHsg4PbFWMA89GjITO55cpUvHbTU8TzIgNF62DfS/exec";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyXxjdGWoeeKW6HDYxD5F3pZEzHsg4PbFWMA89GjITO55cpUvHbTU8TzIgNF62DfS/exec"; // <--- ATUALIZE AQUI COM O URL DO SEU DEPLOY DO APPS SCRIPT!

// Configuração do CORS: Permite requisições do seu frontend.
// EM PRODUÇÃO, MUDE '*' PARA O DOMÍNIO DO SEU FRONTEND (ex: 'https://seufrotend.onrender.com')
app.use(cors());
app.use(express.json());

// Função utilitária para fazer requisições GET ao Apps Script (SEM ALTERAÇÕES AQUI)
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

// ROTAS GET PARA O FRONTEND (SEM ALTERAÇÕES AQUI)
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

// ROTA POST PARA REGISTRAR PRESENÇA (ALTERAÇÃO AQUI PARA TRATAR RESPOSTA "OK" OU JSON DE ERRO)
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

    const text = await response.text(); // Sempre leia como texto primeiro

    let responseData;
    // Tenta parsear como JSON. Se falhar, assume que é texto puro (como "OK").
    try {
        responseData = JSON.parse(text);
    } catch (parseError) {
        // Se não for JSON, então é uma string simples (como "OK").
        // Cria um objeto para padronizar o retorno.
        responseData = { message: text };
    }

    // Verifica se a resposta não foi OK ou se o JSON de resposta indica erro
    // O seu Apps Script retorna 'OK' para sucesso ou JSON com '{error: true, message: 'Erro: ...'}'
    if (!response.ok || (responseData.error && responseData.message?.startsWith('Erro:'))) {
        console.error("Erro do Apps Script (POST):", response.status, responseData);
        return res.status(response.status >= 400 ? response.status : 500).json({
            error: "Erro do Apps Script ao registrar presença",
            details: responseData.message || responseData // Usa a mensagem de erro do Apps Script
        });
    }

    // Se chegou aqui, a resposta foi bem-sucedida (ex: 'OK')
    console.log("Resposta do Apps Script (POST):", responseData);
    res.status(200).json({ message: "Presença registrada com sucesso!" }); // Retorna um JSON padrão de sucesso
  } catch (err) {
    console.error("Erro ao enviar para o Apps Script (POST):", err);
    res.status(500).json({ error: "Erro interno do servidor", details: err.message });
  }
});

// Configuração para servir arquivos estáticos (frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assumindo que seus arquivos HTML, CSS, JS estão na pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Para lidar com rotas não encontradas no frontend (SPA - Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// INICIAR O SERVIDOR
app.listen(PORT, () => {
  console.log(`Backend intermediário rodando em http://localhost:${PORT}`);
  console.log(`Conectando-se ao Apps Script em: ${APPS_SCRIPT_URL}`);
});
