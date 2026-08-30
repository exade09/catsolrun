import { useWallet } from '../wallet/WalletProvider'
import { shortenWalletAddress } from '../wallet/phantom'
import { Icon } from './Icon'

export function WalletButton() {
  const { address, balanceSol, balanceStatus, connect, status } = useWallet()

  if (address) {
    return (
      <a className='wallet-button wallet-button--connected' href='#rewards'>
        <span className='wallet-button__signal' aria-hidden='true' />
        <span>{shortenWalletAddress(address)}</span>
        <strong>
          {balanceStatus === 'ready' && balanceSol !== null
            ? `${balanceSol.toFixed(3)} SOL`
            : 'Mainnet'}
        </strong>
      </a>
    )
  }

  return (
    <button
      className='wallet-button'
      type='button'
      disabled={status === 'connecting'}
      onClick={() => void connect()}
    >
      <Icon name='wallet' />
      {status === 'connecting' ? 'Connecting' : 'Connect Phantom'}
    </button>
  )
}
