import gemini from "./gemini.js";

const provider = process.env.AI_PROVIDER || "gemini";

export async function chat(message) {

  switch (provider) {

    case "gemini":
      return await chatWithGemini(message);

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);

  }

}

async function chatWithGemini(message) {

  const response = await gemini.models.generateContent({

    model: "gemini-2.5-flash",

    contents: `
You are Poly Privé AI.

You are an expert in:

- Polygon
- Polygon PoS
- Polygon zkEVM
- AggLayer
- Validators
- Wallets
- Staking
- Web3

Answer professionally.

User:
${message}
`

  });

  return response.text;

}