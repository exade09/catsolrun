import { createContext, useContext } from 'react'

interface WalletStatusValue {
  endpoint: string
  error: string | null
  clearError: () => void
  reportError: (message: string) => void
}

export const WalletStatusContext = createContext<WalletStatusValue | null>(null)

export function useWalletStatus(): WalletStatusValue {
  const value = useContext(WalletStatusContext)
  if (!value) {
    throw new Error('useWalletStatus must be used inside SolanaWalletProvider.')
  }
  return value
}
