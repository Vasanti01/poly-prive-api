import { Router } from "express";
import { getWalletPortfolio, resolveChain } from "../services/moralis.js";

const router = Router();

router.get("/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const chain = resolveChain(req.query.chain);

    const portfolio = await getWalletPortfolio(address, chain);

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
