export function calculateWalletScore(portfolio) {
  let score = 50;

  const total = portfolio.summary?.totalValueUsd || 0;
  const tokens = portfolio.summary?.tokenCount || 0;

  if (total > 1000) score += 10;
  if (total > 10000) score += 10;
  if (total > 100000) score += 10;

  if (tokens >= 5) score += 5;
  if (tokens >= 10) score += 5;

  if (tokens === 0) score -= 20;

  const spam = portfolio.tokens.filter(t => t.possibleSpam);

  score -= spam.length * 5;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let risk = "Medium";

  if (score >= 80) risk = "Low";
  else if (score < 50) risk = "High";

  return {
    score,
    risk
  };
}
