import express from "express";
import cors from "cors";
import fetch from 'node-fetch'; // Para Node.js < 18

const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente (Render) ou 3000

app.use(cors()); // Permite requisições de qualquer origem, incluindo seu frontend
app.use(express.json());

// ===> URL BASE DO SEU GOOGLE APPS SCRIPT WEB APP <===
// Certifique-se que esta URL é o URL do seu deployment do Apps Script (termina em /exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyXxjdGWoeeKW6HDYxD5F3pZEzHsg4PbFWMA89XgjITO55cpUvHbTU8TzIgNF62DfS/exec";

// Função utilitária para fazer requisições GET ao Apps Script
// Esta função AGORA irá adicionar o parâmetro '?tipo='
async function fetchFromAppsScript(endpointType) { // 'endpointType' é o nome da função no Apps Script (ex: 'getMembros')
    const url = `${APPS_SCRIPT_URL}?tipo=${endpointType}`; // <--- MUDANÇA AQUI: usando '?tipo='
    console.log(`Backend: Encaminhando GET para Apps Script: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro Apps Script GET ${endpointType}: ${response.status} - ${errorText}`);
    }
    return await response.json();
}

// ------------------------------------------------------
// ROTAS GET PARA O FRONTEND (SEU SERVIDOR DO RENDER)
// Estas rotas recebem a URL LIMPA do frontend (ex: /get-membros)
// ------------------------------------------------------

app.get("/get-membros", async (req, res) => {
    try {
        const data = await fetchFromAppsScript('getMembros'); // <--- Chamando com 'getMembros'
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao obter membros do Apps Script:", err);
        res.status(500).json({ error: "Erro ao obter dados de membros", details: err.message });
    }
});

app.get("/get-presencas-mes", async (req, res) => {
    try {
        const data = await fetchFromAppsScript('presencasMes'); // <--- Chamando com 'presencasMes'
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao obter presenças do mês do Apps Script:", err);
        res.status(500).json({ error: "Erro ao obter presenças do mês", details: err.message });
    }
});

app.get("/get-presencas-total", async (req, res) => {
    try {
        const data = await fetchFromAppsScript('presencasTotal'); // <--- Chamando com 'presencasTotal'
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao obter presenças totais do Apps Script:", err);
        res.status(500).json({ error: "Erro ao obter presenças totais", details: err.message });
    }
});

// ------------------------------------------------------
// ROTA POST PARA REGISTRAR PRESENÇA
// ------------------------------------------------------
app.post("/presenca", async (req, res) => {
  try {
    console.log("Recebido do frontend (POST /presenca):", req.body);

    const response = await fetch(
      APPS_SCRIPT_URL, // O Apps Script doPost não usa parâmetros de URL
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body), // O corpo já contém o payload para doPost
      }
    );

    const text = await response.text(); 
    
    let responseData;
    try {
        responseData = JSON.parse(text); 
    } catch (parseError) {
        responseData = { message: text }; 
    }

    if (!response.ok || responseData.message?.startsWith('Erro:')) { 
        console.error("Erro do Apps Script (POST):", response.status, responseData);
        return res.status(response.status >= 400 ? response.status : 500).json({ 
            error: "Erro do Apps Script ao registrar presença", 
            details: responseData.message || responseData 
        });
    }

    console.log("Resposta do Apps Script (POST):", responseData);
    res.status(200).json(responseData); 
  } catch (err) {
    console.error("Erro ao enviar para o Apps Script (POST):", err);
    res.status(500).json({ error: "Erro interno do servidor", details: err.message });
  }
});

// ------------------------------------------------------
// Servir arquivos estáticos do frontend
// Assumindo que seus arquivos HTML, CSS, JS estão na pasta 'public'
// SE SEUS ARQUIVOS ESTÃO NA RAIZ, MUDE PARA: app.use(express.static(path.join(__dirname, '.')));
// Ou se tudo está na raiz e server.js tbm, pode ser: app.use(express.static(__dirname));
import path from 'path'; // Importe 'path' para usar path.join
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));


// Para lidar com rotas não encontradas no frontend (SPA - Single Page Application)
// Redireciona para index.html para que o frontend lide com roteamento
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });


// ------------------------------------------------------
// INICIAR O SERVIDOR
// ------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend intermediário rodando em http://localhost:${PORT}`);
  console.log(`Conectando-se ao Apps Script em: ${APPS_SCRIPT_URL}`);
});
