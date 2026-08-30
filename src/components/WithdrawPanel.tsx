import { useMemo } from 'react'

import { useWallet, type EligibilityStatus } from '../wallet/WalletProvider'
import { shortenWalletAddress } from '../wallet/phantom'
import { Icon } from './Icon'

const MINIMUM_WITHDRAWAL_SOL = 0.25
const CLAIMABLE_SOL = 0

const eligibilityCopy: Record<EligibilityStatus, { label: string; tone: string }> = {
  'not-configured': { label: 'Token contract pending', tone: 'pending' },
  idle: { label: 'Connect Phantom', tone: 'pending' },
  checking: { label: 'Checking token holding', tone: 'checking' },
  eligible: { label: 'Eligible', tone: 'eligible' },
  ineligible: { label: 'Required token not found', tone: 'ineligible' },
  error: { label: 'Check unavailable', tone: 'ineligible' },
}

export function WithdrawPanel() {
  const {
    address,
    connect,
    eligibilityBalance,
    eligibilityError,
    eligibilityStatus,
    eligibilityTokenMint,
    installed,
    refreshEligibility,
    status,
    verified,
    verifyOwnership,
  } = useWallet()

  const progress = Math.min(100, (CLAIMABLE_SOL / MINIMUM_WITHDRAWAL_SOL) * 100)
  const eligibility = eligibilityCopy[eligibilityStatus]
  const action = useMemo(() => {
    if (!address) {
      return {
        disabled: false,
        label: status === 'connecting' ? 'Check Phantom' : installed ? 'Connect Phantom' : 'Get Phantom',
        run: connect,
      }
    }
    if (!verified) {
      return {
        disabled: false,
        label: status === 'signing' ? 'Check Phantom' : 'Verify wallet',
        run: verifyOwnership,
      }
    }
    if (eligibilityStatus === 'idle' || eligibilityStatus === 'error') {
      return {
        disabled: false,
        label: eligibilityStatus === 'error' ? 'Retry eligibility check' : 'Check eligibility',
        run: refreshEligibility,
      }
    }
    if (eligibilityStatus === 'checking') {
      return { disabled: true, label: 'Checking eligibility', run: refreshEligibility }
    }
    if (eligibilityStatus === 'not-configured') {
      return { disabled: true, label: 'Eligibility token not configured', run: refreshEligibility }
    }
    if (eligibilityStatus === 'ineligible') {
      return { disabled: true, label: 'Wallet is not eligible', run: refreshEligibility }
    }
    return { disabled: true, label: 'Withdraw 0.25 SOL', run: refreshEligibility }
  }, [
    address,
    connect,
    eligibilityStatus,
    installed,
    refreshEligibility,
    status,
    verified,
    verifyOwnership,
  ])

  return (
    <article className='withdraw-panel' aria-labelledby='withdraw-title'>
      <header className='withdraw-panel__header'>
        <div>
          <span className='wallet-hub__eyebrow'>Rewards / Withdraw</span>
          <h3 id='withdraw-title'>Withdraw earnings</h3>
        </div>
        <span className={'withdraw-panel__eligibility is-' + eligibility.tone}>
          <i aria-hidden='true' />
          {eligibility.label}
        </span>
      </header>

      <div className='withdraw-panel__balance'>
        <span>Available for withdrawal</span>
        <strong>{CLAIMABLE_SOL.toFixed(4)} <small>SOL</small></strong>
        <p>Minimum withdrawal: {MINIMUM_WITHDRAWAL_SOL.toFixed(2)} SOL</p>
      </div>

      <div className='withdraw-panel__progress' aria-label='Withdrawal threshold progress'>
        <span style={{ width: progress + '%' }} />
      </div>

      <dl className='withdraw-panel__facts'>
        <div>
          <dt>Destination wallet</dt>
          <dd>{address ? shortenWalletAddress(address, 7) : 'Connect Phantom'}</dd>
          <small>Detected automatically</small>
        </div>
        <div>
          <dt>Eligibility token</dt>
          <dd>{eligibilityTokenMint ? shortenWalletAddress(eligibilityTokenMint, 7) : 'Awaiting contract'}</dd>
          <small>
            {eligibilityStatus === 'eligible'
              ? (eligibilityBalance ?? 0).toLocaleString('en-US') + ' tokens detected'
              : 'Holding is checked on Solana'}
          </small>
        </div>
        <div>
          <dt>Wallet ownership</dt>
          <dd>{verified ? 'Verified' : address ? 'Signature required' : 'Not connected'}</dd>
          <small>Confirmed through Phantom</small>
        </div>
      </dl>

      <button
        className='button button--primary withdraw-panel__button'
        type='button'
        disabled={action.disabled || status === 'connecting' || status === 'signing'}
        onClick={() => void action.run()}
      >
        <Icon name='wallet' />
        {action.label}
      </button>

      {eligibilityError && <p className='withdraw-panel__error' role='alert'>{eligibilityError}</p>}

      <footer className='withdraw-panel__footer'>
        <p>
          The connected Phantom address is always used as the destination. Withdrawals unlock only after
          wallet eligibility, earned balance, and the reward treasury are confirmed.
        </p>
        <a href='/MEOWAVE-REWARD-WHITEPAPER.md' target='_blank' rel='noreferrer'>
          Read reward whitepaper <span aria-hidden='true'>/</span>
        </a>
      </footer>
    </article>
  )
}
