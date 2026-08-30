export interface PhantomPublicKey {
  toString: () => string
}

export interface PhantomConnectResult {
  publicKey: PhantomPublicKey
}

export interface PhantomSignMessageResult {
  signature: Uint8Array
}

export interface PhantomSolanaProvider {
  isPhantom?: boolean
  isConnected?: boolean
  publicKey?: PhantomPublicKey | null
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<PhantomConnectResult>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array, display?: 'utf8' | 'hex') => Promise<PhantomSignMessageResult>
  on: (
    event: 'connect' | 'disconnect' | 'accountChanged',
    listener: (publicKey?: PhantomPublicKey | null) => void,
  ) => void
  off?: (
    event: 'connect' | 'disconnect' | 'accountChanged',
    listener: (publicKey?: PhantomPublicKey | null) => void,
  ) => void
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomSolanaProvider }
    solana?: PhantomSolanaProvider
  }
}

export const getPhantomProvider = (): PhantomSolanaProvider | null => {
  if (typeof window === 'undefined') return null
  const provider = window.phantom?.solana ?? window.solana
  return provider?.isPhantom ? provider : null
}

export const shortenWalletAddress = (address: string, edge = 4): string =>
  address.length > edge * 2 + 1
    ? `${address.slice(0, edge)}...${address.slice(-edge)}`
    : address

export const PHANTOM_DOWNLOAD_URL = 'https://phantom.com/download'
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com/address/'

