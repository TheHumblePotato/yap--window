import fetch from "node-fetch"; // for Vercel

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const API_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
  ];

  let data = null;
  let lastError = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    try {
      const response = await fetch("https://api.gemini.com/v1beta/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          prompt,
        }),
      });

      const json = await response.json();

      // check if we got a usable output
      if (json && json.output) {
        data = json;
        break; // stop rotating once successful
      } else {
        lastError = json;
      }
    } catch (error) {
      console.error(`Error with API key ${key}:`, error);
      lastError = error;
    }
  }

  if (!data) {
    // all keys failed
    return res.status(500).json({
      error: "All Gemini API requests failed",
      details: lastError,
    });
  }

  res.status(200).json(data);
}