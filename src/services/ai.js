import gemini from "./gemini.js";

const provider = process.env.AI_PROVIDER || "gemini";

function needsLiveSearch(message) {
  const text = message.toLowerCase();

  const keywords = [
    "latest",
    "today",
    "recent",
    "news",
    "update",
    "updates",
    "announcement",
    "released",
    "release",
    "this week",
    "this month",
    "roadmap",
    "governance",
    "proposal",
    "pip",
    "github",
    "blog",
    "price",
    "market",
    "upgrade",
    "hard fork",
    "fork"
  ];

  return keywords.some(keyword => text.includes(keyword));
}

export async function chat(message) {
  switch (provider) {
    case "gemini":
      return await chatWithGemini(message);

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function chatWithGemini(message) {

  const liveSearch = needsLiveSearch(message);

  console.log(
    liveSearch
      ? "🌐 Using Google Search"
      : "🧠 Using Gemini knowledge"
  );

  const config = {};

  if (liveSearch) {
    config.tools = [
      {
        googleSearch: {}
      }
    ];
  }

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",

    config,

    contents: `
You are Poly Privé AI.

You are a senior Polygon ecosystem expert.

Your expertise includes:

• Polygon PoS
• Polygon zkEVM
• AggLayer
• Polygon CDK
• POL Token
• Validators
• Staking
• Governance
• Web3
• Ethereum

Instructions:

1. Be concise.
2. Explain like an expert.
3. If Google Search is enabled, use the latest information.
4. Never hallucinate.
5. If you are unsure, clearly say so.

User Question:

${message}
`
  });

  return response.text;
}
