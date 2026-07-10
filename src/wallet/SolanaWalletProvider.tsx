import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { WalletAdapterNetwork, type WalletError } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletStatusContext } from './walletContext'
import '@solana/wallet-adapter-react-ui/styles.css'
import './wallet.css'

const DEVNET_ENDPOINT = clusterApiUrl(WalletAdapterNetwork.Devnet)

interface EndpointConfig {
  endpoint: string
  warning: string | null
}

function resolveEndpoint(configuredEndpoint?: string): EndpointConfig {
  const value = configuredEndpoint?.trim()
  if (!value) return { endpoint: DEVNET_ENDPOINT, warning: null }

  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { endpoint: url.toString(), warning: null }
    }
  } catch {
    // The fallback below keeps the rest of the site available.
  }

  return {
    endpoint: DEVNET_ENDPOINT,
    warning: 'The configured RPC endpoint is invalid. Player identity is using Solana Devnet instead.',
  }
}

function getWalletErrorMessage(error: WalletError): string {
  const name = error.name.toLowerCase()
  const message = error.message.toLowerCase()

  if (name.includes('notready')) {
    return 'No compatible wallet was found. Install or unlock a Solana wallet and try again.'
  }

  if (name.includes('notselected')) {
    return 'Choose a compatible Solana wallet to connect. You can still play without one.'
  }

  if (name.includes('disconnection')) {
    return 'The wallet could not disconnect. Check the wallet extension and try again.'
  }

  if (message.includes('reject') || message.includes('declin') || message.includes('cancel')) {
    return 'The wallet connection request was rejected. You can still play without a wallet.'
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('rpc')) {
    return 'The Solana Devnet endpoint is unavailable. You can still play without a wallet.'
  }

  return 'The wallet could not connect. Check the wallet extension and try again.'
}

export function SolanaWalletProvider({ children }: PropsWithChildren) {
  const endpointConfig = useMemo(
    () => resolveEndpoint(import.meta.env.VITE_SOLANA_RPC_URL),
    [],
  )
  const [error, setError] = useState<string | null>(endpointConfig.warning)

  const handleError = useCallback((walletError: WalletError) => {
    setError(getWalletErrorMessage(walletError))
  }, [])

  const clearError = useCallback(() => setError(null), [])
  const reportError = useCallback((message: string) => setError(message), [])
  const contextValue = useMemo(
    () => ({ endpoint: endpointConfig.endpoint, error, clearError, reportError }),
    [clearError, endpointConfig.endpoint, error, reportError],
  )

  return (
    <ConnectionProvider endpoint={endpointConfig.endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={[]} autoConnect={false} onError={handleError}>
        <WalletModalProvider>
          <WalletStatusContext.Provider value={contextValue}>
            {children}
          </WalletStatusContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
