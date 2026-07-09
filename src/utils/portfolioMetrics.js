export function buildMetrics(portfolio) {
  const tokens = portfolio.tokens;

  const stablecoins = ["USDC", "USDT", "DAI", "USDE"];

  const stableValue = tokens
    .filter(t => stablecoins.includes(t.symbol))
    .reduce((sum, t) => sum + (t.valueUsd || 0), 0);

  const topHolding = tokens[0];

  return {
    totalValue: portfolio.summary.totalValueUsd,
    tokenCount: portfolio.summary.tokenCount,
    stablecoinValue: stableValue,
    stablecoinPercent:
      portfolio.summary.totalValueUsd > 0
        ? ((stableValue / portfolio.summary.totalValueUsd) * 100).toFixed(1)
        : 0,
    topHolding: topHolding
      ? `${topHolding.symbol} ($${topHolding.valueUsd})`
      : "None",
  };
}
