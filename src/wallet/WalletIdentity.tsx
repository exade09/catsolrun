import type { ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

interface WalletIdentityProps {
  children: (address: string | null) => ReactNode
}

export function WalletIdentity({ children }: WalletIdentityProps) {
  const { publicKey } = useWallet()
  return <>{children(publicKey?.toBase58() ?? null)}</>
}
