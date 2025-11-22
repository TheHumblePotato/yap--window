import fetch from "node-fetch";

// read the prompt passed in by workflow
const prompt = process.argv.slice(2).join(" ");

if (!prompt) {
  console.error("⛔ No prompt provided.");
  process.exit(1);
}

// combine your GitHub Secrets
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2
].filter(Boolean);

if (API_KEYS.length === 0) {
  console.error("⛔ No API keys provided in environment variables.");
  process.exit(1);
}

async function callGemini(prompt) {
  for (const key of API_KEYS) {
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ]
          }),
        }
      );

      const data = await response.json();

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

      if (text) {
        return text;
      }

    } catch (err) {
      console.error("Key failed:", key, err);
    }
  }

  return null;
}

const run = async () => {
  const output = await callGemini(prompt);

  if (!output) {
    console.log(JSON.stringify({ error: "AI unavailable" }));
    process.exit(0);
  }

  // VERY IMPORTANT:
  // GitHub Actions only reads log lines that START WITH "::set-output"
  console.log(`::set-output name=reply::${output}`);
};

run();
