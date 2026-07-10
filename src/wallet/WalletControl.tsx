import { useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWalletStatus } from './walletContext'

export interface WalletControlProps {
  compact?: boolean
  className?: string
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export function WalletControl({ compact = false, className = '' }: WalletControlProps) {
  const { connected, connecting, disconnecting, publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const { error, clearError, reportError } = useWalletStatus()
  const address = publicKey?.toBase58() ?? null

  const handlePrimaryAction = useCallback(async () => {
    clearError()
    if (connected) {
      try {
        await disconnect()
      } catch {
        reportError('The wallet could not disconnect. Check the wallet extension and try again.')
      }
      return
    }
    setVisible(true)
  }, [clearError, connected, disconnect, reportError, setVisible])

  const busy = connecting || disconnecting
  const buttonLabel = busy
    ? connecting
      ? 'Connecting…'
      : 'Disconnecting…'
    : connected && address
      ? compact
        ? shortAddress(address)
        : `Disconnect ${shortAddress(address)}`
      : 'Connect Wallet'

  return (
    <div className={`wallet-control ${className}`.trim()}>
      <button
        className="wallet-control__button"
        type="button"
        onClick={() => void handlePrimaryAction()}
        disabled={busy}
        aria-label={connected ? 'Disconnect Solana wallet' : 'Connect Solana wallet'}
      >
        <span className={`wallet-control__dot${connected ? ' is-connected' : ''}`} aria-hidden="true" />
        {buttonLabel}
      </button>
      {!compact && (
        <p className="wallet-control__status" role={error ? 'alert' : 'status'}>
          {error ??
            (connected
              ? 'Wallet connected for player identity. No transaction is required to play.'
              : 'Wallet connection is optional. No transaction is required to play.')}
        </p>
      )}
    </div>
  )
}
