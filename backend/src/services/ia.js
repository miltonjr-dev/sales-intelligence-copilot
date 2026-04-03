const axios = require('axios');

const OPENAI_KEY   = process.env.OPENAI_API_KEY;
const OLLAMA_URL   = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL    || 'llama3';

async function completar(prompt) {
  // Prioriza OpenAI se a chave estiver configurada
  if (OPENAI_KEY) {
    const { data } = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      },
      { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
    );
    return data.choices[0].message.content.trim();
  }

  // Fallback: Ollama local
  const { data } = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
  });
  return data.response.trim();
}

module.exports = { completar };
