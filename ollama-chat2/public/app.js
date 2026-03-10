const modelSelect = document.getElementById("modelSelect");
const reloadModelsBtn = document.getElementById("reloadModelsBtn");
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const statusBox = document.getElementById("status");

function setStatus(text) {
  statusBox.textContent = text || "";
}

function addMessage(text, type = "bot") {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadModels() {
  try {
    setStatus("Loading models...");
    modelSelect.innerHTML = `<option value="">Loading...</option>`;

    const res = await fetch("/api/models");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || "Failed to load models");
    }

    const models = data.models || [];

    if (models.length === 0) {
      modelSelect.innerHTML = `<option value="">No models found</option>`;
      setStatus("No models available in Ollama. Pull a model first.");
      return;
    }

    modelSelect.innerHTML = `<option value="">Select a model</option>`;
    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.name;
      option.textContent = model.name;
      modelSelect.appendChild(option);
    }

    setStatus(`Loaded ${models.length} model(s).`);
  } catch (error) {
    modelSelect.innerHTML = `<option value="">Error loading models</option>`;
    setStatus(`Error: ${error.message}`);
  }
}

async function sendMessage(event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  const model = modelSelect.value;

  if (!model) {
    setStatus("Please select a model.");
    return;
  }

  if (!prompt) {
    setStatus("Please write a message.");
    return;
  }

  addMessage(prompt, "user");
  promptInput.value = "";
  setStatus("Waiting for Ollama...");

  sendBtn.disabled = true;
  promptInput.disabled = true;
  modelSelect.disabled = true;
  reloadModelsBtn.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || "Chat request failed");
    }

    addMessage(data.reply || "No response.", "bot");
    setStatus("Response received.");
  } catch (error) {
    addMessage(`Error: ${error.message}`, "error");
    setStatus("Request failed.");
  } finally {
    sendBtn.disabled = false;
    promptInput.disabled = false;
    modelSelect.disabled = false;
    reloadModelsBtn.disabled = false;
    promptInput.focus();
  }
}

reloadModelsBtn.addEventListener("click", loadModels);
chatForm.addEventListener("submit", sendMessage);

loadModels();