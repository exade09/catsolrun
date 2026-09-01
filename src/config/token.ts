export const TOKEN_MINT = '5QJ6fJWzeJedcFra6pZwkU1HUz5RSAf1p7KkyooBpump'

export const TOKEN_TICKER = '$MEWAVE'

export const TOKEN_CHAIN = 'Solana Mainnet'

export const tokenLinks = {
  pumpFun: 'https://pump.fun/coin/' + TOKEN_MINT,
  dexScreener: 'https://dexscreener.com/solana/' + TOKEN_MINT,
  solscan: 'https://solscan.io/token/' + TOKEN_MINT,
} as const

/** Shortens a mint or wallet address to `head…tail` for compact UI slots. */
export function shortenMint(value: string, visible = 4): string {
  if (value.length <= visible * 2 + 1) return value
  return value.slice(0, visible) + '…' + value.slice(-visible)
}
