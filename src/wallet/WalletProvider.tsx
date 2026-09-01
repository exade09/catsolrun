import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { TOKEN_MINT } from '../config/token'
import {
  getPhantomProvider,
  PHANTOM_DOWNLOAD_URL,
  type PhantomPublicKey,
  type PhantomSolanaProvider,
} from './phantom'

type WalletStatus = 'idle' | 'connecting' | 'connected' | 'signing'
type BalanceStatus = 'idle' | 'loading' | 'ready' | 'error'
export type EligibilityStatus = 'not-configured' | 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

interface WalletContextValue {
  address: string | null
  balanceSol: number | null
  balanceStatus: BalanceStatus
  eligibilityBalance: number | null
  eligibilityError: string | null
  eligibilityStatus: EligibilityStatus
  eligibilityTokenMint: string | null
  error: string | null
  installed: boolean
  status: WalletStatus
  verified: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshBalance: () => Promise<void>
  refreshEligibility: () => Promise<void>
  verifyOwnership: () => Promise<void>
  clearError: () => void
}

interface TokenAccountPayload {
  result?: {
    value?: Array<{
      account?: {
        data?: {
          parsed?: {
            info?: {
              tokenAmount?: {
                amount?: string
                uiAmountString?: string
              }
            }
          }
        }
      }
    }>
  }
  error?: { message?: string }
}

const WalletContext = createContext<WalletContextValue | null>(null)
// Helius endpoint. Vite inlines VITE_* values into the client bundle, so this
// key is public either way; restrict it by domain in the Helius dashboard.
const DEFAULT_MAINNET_RPC = 'https://mainnet.helius-rpc.com/?api-key=a1189f04-72aa-4809-82fe-2b4ee51f612e'
const LAMPORTS_PER_SOL = 1_000_000_000

const getRpcEndpoint = (): string => {
  const configured = import.meta.env.VITE_SOLANA_RPC_URL?.trim()
  return configured || DEFAULT_MAINNET_RPC
}

const getEligibilityTokenMint = (): string | null => {
  // The published MWAVE mint is the default; the env var stays as an override
  // for staging against a different mint.
  const configured = import.meta.env.VITE_ELIGIBILITY_TOKEN_MINT?.trim()
  return configured || TOKEN_MINT
}

const walletErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
    return 'The Phantom request was cancelled.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'Phantom could not complete the request.'
}

const callRpc = async (method: string, params: unknown[]): Promise<unknown> => {
  const response = await fetch(getRpcEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'meowave-' + method,
      method,
      params,
    }),
  })
  if (!response.ok) throw new Error('Solana RPC returned ' + response.status + '.')
  return response.json()
}

const readBalance = async (address: string): Promise<number> => {
  const payload = await callRpc('getBalance', [address, { commitment: 'confirmed' }])
  if (
    !payload
    || typeof payload !== 'object'
    || !('result' in payload)
    || !payload.result
    || typeof payload.result !== 'object'
    || !('value' in payload.result)
    || typeof payload.result.value !== 'number'
  ) {
    throw new Error('The Solana RPC returned an invalid balance response.')
  }
  return payload.result.value / LAMPORTS_PER_SOL
}

const readEligibilityToken = async (
  address: string,
  tokenMint: string,
): Promise<{ eligible: boolean; balance: number }> => {
  const payload = await callRpc('getTokenAccountsByOwner', [
    address,
    { mint: tokenMint },
    { encoding: 'jsonParsed', commitment: 'confirmed' },
  ]) as TokenAccountPayload

  if (payload.error) {
    throw new Error(payload.error.message || 'The token holding check failed.')
  }

  const accounts = payload.result?.value
  if (!Array.isArray(accounts)) {
    throw new Error('The Solana RPC returned an invalid token response.')
  }

  let rawBalance = 0n
  let visibleBalance = 0
  for (const tokenAccount of accounts) {
    const tokenAmount = tokenAccount.account?.data?.parsed?.info?.tokenAmount
    if (!tokenAmount) continue
    try {
      rawBalance += BigInt(tokenAmount.amount || '0')
    } catch {
      throw new Error('The token account returned an invalid amount.')
    }
    const uiAmount = Number(tokenAmount.uiAmountString || '0')
    if (Number.isFinite(uiAmount)) visibleBalance += uiAmount
  }

  return { eligible: rawBalance > 0n, balance: visibleBalance }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const eligibilityTokenMint = getEligibilityTokenMint()
  const [address, setAddress] = useState<string | null>(null)
  const [balanceSol, setBalanceSol] = useState<number | null>(null)
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>('idle')
  const [eligibilityBalance, setEligibilityBalance] = useState<number | null>(null)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus>(
    eligibilityTokenMint ? 'idle' : 'not-configured',
  )
  const [error, setError] = useState<string | null>(null)
  const [installed, setInstalled] = useState(() => getPhantomProvider() !== null)
  const [status, setStatus] = useState<WalletStatus>('idle')
  const [verified, setVerified] = useState(false)
  const providerRef = useRef<PhantomSolanaProvider | null>(null)
  const addressRef = useRef<string | null>(null)

  const updateAddress = useCallback((nextAddress: string | null) => {
    addressRef.current = nextAddress
    setAddress(nextAddress)
    setVerified(nextAddress ? sessionStorage.getItem('meowave-wallet-proof:' + nextAddress) === 'true' : false)
    setStatus(nextAddress ? 'connected' : 'idle')
    setEligibilityBalance(null)
    setEligibilityError(null)
    setEligibilityStatus(eligibilityTokenMint ? 'idle' : 'not-configured')
    if (!nextAddress) {
      setBalanceSol(null)
      setBalanceStatus('idle')
    }
  }, [eligibilityTokenMint])

  const refreshBalance = useCallback(async () => {
    const activeAddress = addressRef.current
    if (!activeAddress) return
    setBalanceStatus('loading')
    try {
      const balance = await readBalance(activeAddress)
      if (addressRef.current !== activeAddress) return
      setBalanceSol(balance)
      setBalanceStatus('ready')
    } catch (nextError) {
      if (addressRef.current !== activeAddress) return
      setBalanceSol(null)
      setBalanceStatus('error')
      setError(walletErrorMessage(nextError))
    }
  }, [])

  const refreshEligibility = useCallback(async () => {
    const activeAddress = addressRef.current
    if (!eligibilityTokenMint) {
      setEligibilityStatus('not-configured')
      setEligibilityBalance(null)
      setEligibilityError(null)
      return
    }
    if (!activeAddress) {
      setEligibilityStatus('idle')
      setEligibilityBalance(null)
      return
    }

    setEligibilityStatus('checking')
    setEligibilityError(null)
    try {
      const result = await readEligibilityToken(activeAddress, eligibilityTokenMint)
      if (addressRef.current !== activeAddress) return
      setEligibilityBalance(result.balance)
      setEligibilityStatus(result.eligible ? 'eligible' : 'ineligible')
    } catch (nextError) {
      if (addressRef.current !== activeAddress) return
      setEligibilityBalance(null)
      setEligibilityStatus('error')
      setEligibilityError(walletErrorMessage(nextError))
    }
  }, [eligibilityTokenMint])

  const bindConnectedProvider = useCallback((provider: PhantomSolanaProvider, publicKey: PhantomPublicKey) => {
    providerRef.current = provider
    setInstalled(true)
    setError(null)
    updateAddress(publicKey.toString())
  }, [updateAddress])

  const connect = useCallback(async () => {
    const provider = getPhantomProvider()
    if (!provider) {
      setInstalled(false)
      setError('Phantom is not installed. Opening the official download page.')
      window.open(PHANTOM_DOWNLOAD_URL, '_blank', 'noopener,noreferrer')
      return
    }

    setStatus('connecting')
    setError(null)
    try {
      const result = await provider.connect()
      bindConnectedProvider(provider, result.publicKey)
    } catch (nextError) {
      setStatus(addressRef.current ? 'connected' : 'idle')
      setError(walletErrorMessage(nextError))
    }
  }, [bindConnectedProvider])

  const disconnect = useCallback(async () => {
    const provider = providerRef.current ?? getPhantomProvider()
    setError(null)
    try {
      await provider?.disconnect()
    } catch (nextError) {
      setError(walletErrorMessage(nextError))
    } finally {
      providerRef.current = provider ?? null
      updateAddress(null)
    }
  }, [updateAddress])

  const verifyOwnership = useCallback(async () => {
    const provider = providerRef.current ?? getPhantomProvider()
    const activeAddress = addressRef.current
    if (!provider || !activeAddress) {
      setError('Connect Phantom before verifying wallet ownership.')
      return
    }

    setStatus('signing')
    setError(null)
    const nonce = crypto.getRandomValues(new Uint32Array(4)).join('-')
    const message = [
      'MEOWAVE wallet verification',
      'Domain: ' + window.location.host,
      'Address: ' + activeAddress,
      'Issued at: ' + new Date().toISOString(),
      'Nonce: ' + nonce,
      '',
      'This request does not create a transaction or move funds.',
    ].join('\n')

    try {
      const result = await provider.signMessage(new TextEncoder().encode(message), 'utf8')
      if (!(result.signature instanceof Uint8Array) || result.signature.length === 0) {
        throw new Error('Phantom returned an empty signature.')
      }
      sessionStorage.setItem('meowave-wallet-proof:' + activeAddress, 'true')
      setVerified(true)
    } catch (nextError) {
      setError(walletErrorMessage(nextError))
    } finally {
      setStatus('connected')
    }
  }, [])

  useEffect(() => {
    const detectProvider = () => setInstalled(getPhantomProvider() !== null)
    window.addEventListener('phantom#initialized', detectProvider, { once: true })
    const timer = window.setTimeout(detectProvider, 800)
    return () => {
      window.removeEventListener('phantom#initialized', detectProvider)
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const provider = getPhantomProvider()
    if (!provider) return undefined
    providerRef.current = provider
    setInstalled(true)

    const handleConnect = (publicKey?: PhantomPublicKey | null) => {
      if (publicKey) bindConnectedProvider(provider, publicKey)
    }
    const handleDisconnect = () => updateAddress(null)
    const handleAccountChanged = (publicKey?: PhantomPublicKey | null) => {
      updateAddress(publicKey?.toString() ?? null)
    }

    provider.on('connect', handleConnect)
    provider.on('disconnect', handleDisconnect)
    provider.on('accountChanged', handleAccountChanged)

    void provider.connect({ onlyIfTrusted: true })
      .then((result) => bindConnectedProvider(provider, result.publicKey))
      .catch(() => {
        // A trusted session is optional; never open Phantom automatically.
      })

    return () => {
      provider.off?.('connect', handleConnect)
      provider.off?.('disconnect', handleDisconnect)
      provider.off?.('accountChanged', handleAccountChanged)
    }
  }, [bindConnectedProvider, updateAddress])

  useEffect(() => {
    if (!address) return
    void refreshBalance()
    void refreshEligibility()
  }, [address, refreshBalance, refreshEligibility])

  const value = useMemo<WalletContextValue>(() => ({
    address,
    balanceSol,
    balanceStatus,
    eligibilityBalance,
    eligibilityError,
    eligibilityStatus,
    eligibilityTokenMint,
    error,
    installed,
    status,
    verified,
    connect,
    disconnect,
    refreshBalance,
    refreshEligibility,
    verifyOwnership,
    clearError: () => setError(null),
  }), [
    address,
    balanceSol,
    balanceStatus,
    connect,
    disconnect,
    eligibilityBalance,
    eligibilityError,
    eligibilityStatus,
    eligibilityTokenMint,
    error,
    installed,
    refreshBalance,
    refreshEligibility,
    status,
    verified,
    verifyOwnership,
  ])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const wallet = useContext(WalletContext)
  if (!wallet) throw new Error('useWallet must be used inside WalletProvider.')
  return wallet
}
