import "dotenv/config";
import cors from "cors";
import express from "express";

import walletRoutes from "./routes/wallet.js";
import chatRoutes from "./routes/chat.js";
import { initMoralis } from "./services/moralis.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Poly Privé AI API",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({
    name: "Poly Privé AI API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      wallet: "GET /wallet/:address",
      chat: "POST /chat",
    },
  });
});

app.use("/wallet", walletRoutes);
app.use("/chat", chatRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist.",
    },
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message,
    },
  });
});

async function start() {
  try {
    await initMoralis();

    app.listen(port, () => {
      console.log(`Poly Privé AI API listening on port ${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

start();

