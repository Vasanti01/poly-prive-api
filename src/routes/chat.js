import express from "express";
import ai from "../services/gemini.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are Poly Privé AI.

You are an expert on:
- Polygon
- Polygon PoS
- AggLayer
- zkEVM
- Validators
- Wallets
- Staking
- Web3

User question:
${message}
`,
    });

    res.json({
      success: true,
      reply: response.text,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
