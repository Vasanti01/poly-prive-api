import express from "express";
import { chat } from "../services/ai.js";
import { detectWallet } from "../utils/detectWallet.js";
import { analyzeWallet } from "../services/walletAI.js";

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

    const address = detectWallet(message);

    if (address) {
      const wallet = await analyzeWallet(address);

      return res.json({
        success: true,
        wallet
      });
    }

    const reply = await chat(message);

    return res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
