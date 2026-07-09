import { getWalletPortfolio } from "./moralis.js";
import { calculateWalletScore } from "../utils/walletScore.js";
import { chat } from "./ai.js";

export async function analyzeWallet(address) {

  const portfolio = await getWalletPortfolio(address);

  const health = calculateWalletScore(portfolio);

  const holdings = portfolio.tokens
    .slice(0, 10)
    .map(token => ({
      symbol: token.symbol,
      value: token.valueUsd,
      percentage: token.portfolioPercent
    }));

  const prompt = `
You are a senior crypto portfolio analyst.

Analyze this wallet professionally.

Wallet Address:
${address}

Portfolio Value:
$${portfolio.summary.totalValueUsd}

Native Assets:
$${portfolio.summary.nativeValueUsd}

ERC20 Assets:
$${portfolio.summary.erc20ValueUsd}

Token Count:
${portfolio.summary.tokenCount}

Wallet Health Score:
${health.score}

Risk:
${health.risk}

Top Holdings:

${holdings
.map(
h =>
`${h.symbol}
Value: $${h.value}
Portfolio: ${Number(h.percentage).toFixed(2)}%`
)
.join("\n\n")}

Generate:

1. Executive Summary

2. Portfolio Quality (1-10)

3. Diversification Analysis

4. Concentration Risk

5. Blue-chip Exposure

6. Stablecoin Allocation

7. Potential Risks

8. Opportunities

9. Actionable Recommendations

Respond professionally using markdown.

Maximum 350 words.
`;

  const analysis = await chat(prompt);

  return {
    address,
    health,
    portfolio: portfolio.summary,
    topHoldings: holdings,
    analysis
  };
}
