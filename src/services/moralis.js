import Moralis from "moralis";

let initialized = false;

export async function initMoralis() {
  if (initialized) return;

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error("MORALIS_API_KEY is not configured");
  }

  await Moralis.start({ apiKey });
  initialized = true;
}

function resolveChain(chain) {
  const value = (chain || process.env.DEFAULT_CHAIN || "eth").toLowerCase();

  const chains = {
    eth: "0x1",
    ethereum: "0x1",

    polygon: "0x89",
    matic: "0x89",

    base: "0x2105",

    arbitrum: "0xa4b1",

    optimism: "0xa",

    bsc: "0x38",
    binance: "0x38",

    avalanche: "0xa86a"
  };

  return chains[value] || value;
}

function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatToken(token) {
  return {
    symbol: token.symbol ?? null,
    name: token.name ?? null,
    contractAddress: token.token_address ?? null,
    balance: token.balance_formatted ?? null,
    balanceRaw: token.balance ?? null,
    decimals: token.decimals ?? null,
    priceUsd: toNumber(token.usd_price),
    valueUsd: toNumber(token.usd_value),
    change24hPercent: toNumber(token.usd_price_24hr_percent_change),
    portfolioPercent: toNumber(token.portfolio_percentage),
    verified: Boolean(token.verified_contract),
    possibleSpam: Boolean(token.possible_spam),
    logo: token.logo ?? null,
  };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function roundUsd(value) {
  if (value === null || value === undefined) return null;
  return Math.round(value * 100) / 100;
}

function mapMoralisError(error) {
  const statusCode = error?.status ?? error?.response?.status ?? 502;
  const mapped = new Error(
    error?.message || "Unable to fetch wallet data from Moralis."
  );
  mapped.statusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 502;
  mapped.code = "MORALIS_ERROR";
  mapped.cause = error;
  return mapped;
}

async function fetchAllTokenBalances(address, chain) {
  const tokens = [];
  let cursor = undefined;
  let blockNumber = null;

  try {
    do {
      const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        address,
        chain,
        excludeSpam: true,
        limit: 100,
        cursor,
      });

      const json = response.toJSON();
      if (Array.isArray(json.result)) {
        tokens.push(...json.result);
      }

      blockNumber = json.block_number ?? blockNumber;
      cursor = json.cursor || undefined;
    } while (cursor);
  } catch (error) {
    throw mapMoralisError(error);
  }

  return { tokens, blockNumber };
}

async function fetchNativeBalance(address, chain) {
  try {
    const response = await Moralis.EvmApi.balance.getNativeBalance({
      address,
      chain,
    });

    return response.toJSON();
  } catch (error) {
    throw mapMoralisError(error);
  }
}

async function fetchNetWorth(address, chains) {
  try {
    const response = await Moralis.EvmApi.wallets.getWalletNetWorth({
      address,
      chains,
      excludeSpam: true,
      excludeUnverifiedContracts: false,
    });

    return response.toJSON();
  } catch (error) {
    throw mapMoralisError(error);
  }
}

export async function getWalletPortfolio(address, chainParam) {
  if (!isValidAddress(address)) {
    const error = new Error("Invalid wallet address. Expected a checksummed or lowercase 0x address with 40 hex characters.");
    error.statusCode = 400;
    error.code = "INVALID_ADDRESS";
    throw error;
  }

  const chain = resolveChain(chainParam);

  await initMoralis();

  const [tokenPayload, nativeBalanceRaw, netWorth] = await Promise.all([
    fetchAllTokenBalances(address, chain),
    fetchNativeBalance(address, chain),
    fetchNetWorth(address, [chain]).catch(() => null),
  ]);

  const { tokens, blockNumber } = tokenPayload;

  const nativeFromTokens = tokens.find((token) => token.native_token);
  const erc20Tokens = tokens.filter((token) => !token.native_token);

  const nativeBalance = nativeFromTokens
    ? formatToken(nativeFromTokens)
    : {
        symbol: null,
        name: "Native Token",
        contractAddress: null,
        balance: null,
        balanceRaw: nativeBalanceRaw.balance ?? null,
        decimals: 18,
        priceUsd: null,
        valueUsd: null,
        change24hPercent: null,
        portfolioPercent: null,
        verified: true,
        possibleSpam: false,
        logo: null,
      };

  const formattedTokens = erc20Tokens
    .map(formatToken)
    .sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0));

  const computedTotal = tokens.reduce((sum, token) => sum + (toNumber(token.usd_value) ?? 0), 0);
  const chainNetWorth = netWorth?.chains?.find(
    (entry) => entry.chain?.toLowerCase() === chain.toLowerCase()
  );

  const totalValueUsd =
    toNumber(netWorth?.total_networth_usd) ??
    toNumber(chainNetWorth?.networth_usd) ??
    computedTotal;

  const nativeValueUsd =
    nativeBalance.valueUsd ??
    toNumber(chainNetWorth?.native_balance_usd) ??
    0;

  const erc20ValueUsd =
    toNumber(chainNetWorth?.token_balance_usd) ??
    formattedTokens.reduce((sum, token) => sum + (token.valueUsd ?? 0), 0);

  return {
    address: address.toLowerCase(),
    chain,
    summary: {
      totalValueUsd: roundUsd(totalValueUsd),
      nativeValueUsd: roundUsd(nativeValueUsd),
      erc20ValueUsd: roundUsd(erc20ValueUsd),
      tokenCount: formattedTokens.length,
      currency: "USD",
    },
    nativeBalance: {
      ...nativeBalance,
      valueUsd: roundUsd(nativeBalance.valueUsd ?? nativeValueUsd),
      priceUsd: nativeBalance.priceUsd,
    },
    tokens: formattedTokens.map((token) => ({
      ...token,
      valueUsd: roundUsd(token.valueUsd),
      priceUsd: token.priceUsd,
    })),
    meta: {
      fetchedAt: new Date().toISOString(),
      source: "Moralis",
      blockNumber,
    },
  };
}

export { isValidAddress, resolveChain };
