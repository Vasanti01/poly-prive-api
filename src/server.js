import "dotenv/config";
import cors from "cors";
import express from "express";
import walletRoutes from "./routes/wallet.js";
import { initMoralis } from "./services/moralis.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
  })
);
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
      wallet: "GET /wallet/:address?chain=eth",
    },
  });
});

app.use("/wallet", walletRoutes);

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
  const statusCode = error.statusCode || error.status || 500;
  const isServerError = statusCode >= 500;

  console.error("[Poly Privé AI]", error);

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || (isServerError ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
      message: isServerError
        ? "Unable to fetch wallet data. Please try again later."
        : error.message || "Invalid request.",
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
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();

export default app;
