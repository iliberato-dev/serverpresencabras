import express from "express";
import cors from "cors";
import fetch from 'node-fetch'; // Para Node.js < 18

const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente (Render) ou 3000

app.use(cors()); // Permite requisições de qualquer origem, incluindo seu frontend
app.use(express.json());

// ===> URL BASE DO SEU GOOGLE APPS SCRIPT WEB APP <===
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQG5KMwOugQVSqEm9M2G2dwRoKKygmwQTxoWZMg05Uf7QJlkDi6zfocjEFdxbiXkfy/exec";

// Função utilitária para fazer requisições GET ao Apps Script
async function fetchFromAppsScript(type) {
    const url = `${APPS_SCRIPT_URL}?tipo=${type}`;
    console.log(`Backend: Fetching from Apps Script GET ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro Apps Script GET ${type}: ${response.status} - ${errorText}`);
    }
    return await response.json();
}

// ------------------------------------------------------
// ROTAS GET PARA O FRONTEND
// ------------------------------------------------------

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

// ------------------------------------------------------
// ROTA POST PARA REGISTRAR PRESENÇA
// ------------------------------------------------------
app.post("/presenca", async (req, res) => {
  try {
    console.log("Recebido do frontend (POST /presenca):", req.body);

    const response = await fetch(
      APPS_SCRIPT_URL, // Aqui o Apps Script recebe o POST padrão
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text(); 
    
    let responseData;
    try {
        responseData = JSON.parse(text); // Apps Script POST pode retornar JSON para erro
    } catch (parseError) {
        responseData = { message: text }; // Ou texto simples "OK"
    }

    if (!response.ok || responseData.message?.startsWith('Erro:')) { // Verifica status HTTP ou mensagem de erro do Apps Script
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
// INICIAR O SERVIDOR
// ------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend intermediário rodando em http://localhost:${PORT}`);
  console.log(`Conectando-se ao Apps Script em: ${APPS_SCRIPT_URL}`);
});
