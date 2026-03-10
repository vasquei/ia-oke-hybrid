import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Para OKE:
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://svc-ollama.itti.svc.cluster.local:11434";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    ollama: OLLAMA_BASE_URL
  });
});

app.get("/api/models", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Failed to get models from Ollama",
        details: text
      });
    }

    const data = await response.json();
    const models = (data.models || []).map((m) => ({
      name: m.name
    }));

    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: "Cannot connect to Ollama",
      details: error.message
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { model, prompt } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({
        error: "model and prompt are required"
      });
    }

    const payload = {
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    };

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Ollama chat request failed",
        details: text
      });
    }

    const data = await response.json();
    const answer =
      data?.message?.content ||
      data?.response ||
      "No response from Ollama.";

    res.json({ reply: answer });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Chat app running on port ${PORT}`);
  console.log(`Using Ollama at: ${OLLAMA_BASE_URL}`);
});