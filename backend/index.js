import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/presenca", async (req, res) => {
  try {
    console.log("Recebido do frontend:", req.body);

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzF1bKzZoIImSjpirToSYzGWKhG-uTTY49MtY-VEIUhu0ph72KYBYM8_tI1SK56zT4e/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );
    const text = await response.text();
    console.log("Resposta do Apps Script:", text);
    res.status(200).send(text);
  } catch (err) {
    console.error("Erro ao enviar para o Apps Script:", err, err.stack);
    res.status(500).send("Erro ao enviar para o Apps Script: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Backend intermediário rodando em http://localhost:${PORT}`);
});
