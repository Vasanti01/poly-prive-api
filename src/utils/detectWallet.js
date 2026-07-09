export function detectWallet(message) {
  const match = message.match(/0x[a-fA-F0-9]{40}/);

  if (!match) return null;

  return match[0];
}