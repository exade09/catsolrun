import { useState } from 'react'

import { Icon, SectionIntro, WithdrawPanel } from '../components'
import { useGameStore } from '../stores/gameStore'
import { useWallet } from '../wallet/WalletProvider'
import {
  PHANTOM_DOWNLOAD_URL,
  shortenWalletAddress,
  SOLANA_EXPLORER_URL,
} from '../wallet/phantom'

const rewardRoute = [
  {
    number: '01',
    title: 'Run',
    copy: 'Survive the three-lane route and build a clean score through movement, timing, and risk',
  },
  {
    number: '02',
    title: 'Collect',
    copy: 'Pick up SOL coins during the run. Every coin also pushes your score and leaderboard result',
  },
  {
    number: '03',
    title: 'Verify',
    copy: 'Connect Phantom and sign a message to bind the run identity to a wallet you control',
  },
  {
    number: '04',
    title: 'Claim',
    copy: 'On-chain claims activate only through an explicit Phantom confirmation when the reward treasury goes live',
  },
]

export function RewardsSection() {
  const {
    address,
    balanceSol,
    balanceStatus,
    connect,
    disconnect,
    error,
    installed,
    refreshBalance,
    status,
    verified,
    verifyOwnership,
  } = useWallet()
  const bestScore = useGameStore((state) => state.bestScore)
  const [copyLabel, setCopyLabel] = useState('Copy address')

  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopyLabel('Copied')
      window.setTimeout(() => setCopyLabel('Copy address'), 1_500)
    } catch {
      setCopyLabel('Copy failed')
    }
  }

  return (
    <section className='rewards-section section-space' id='rewards' aria-labelledby='rewards-title'>
      <div className='rewards-section__mesh' aria-hidden='true'><span /><span /><span /></div>
      <div className='section-shell rewards-section__layout'>
        <div className='rewards-section__intro'>
          <SectionIntro
            eyebrow='Wallet / Phantom'
            title={<>One wallet.<br />One runner.</>}
            description='Connect a real Solana wallet, read its mainnet balance, and prove ownership with a message signature. Phantom keeps your keys under your control'
            id='rewards-title'
          />
          <div className='wallet-trust-list' aria-label='Wallet connection guarantees'>
            <span><i />No seed phrase requested</span>
            <span><i />No automatic transactions</span>
            <span><i />Account changes detected live</span>
          </div>
        </div>

        <div className='wallet-hub'>
          <article className='wallet-hub__primary'>
            <header>
              <div>
                <span className='wallet-hub__eyebrow'>Player identity</span>
                <h3>{address ? 'Phantom is connected' : 'Connect to the Solana route'}</h3>
              </div>
              <span className={`wallet-hub__status${address ? ' is-online' : ''}`}>
                <i aria-hidden='true' />
                {address ? 'Mainnet linked' : installed ? 'Ready' : 'Phantom needed'}
              </span>
            </header>

            {!address ? (
              <div className='wallet-hub__connect'>
                <div className='wallet-hub__phantom-mark' aria-hidden='true'>
                  <Icon name='wallet' />
                </div>
                <div>
                  <strong>Phantom wallet</strong>
                  <p>Approve a standard wallet connection. The site receives only your public Solana address</p>
                </div>
                <button
                  className='button button--primary'
                  type='button'
                  disabled={status === 'connecting'}
                  onClick={() => void connect()}
                >
                  {status === 'connecting' ? 'Check Phantom' : installed ? 'Connect Phantom' : 'Get Phantom'}
                </button>
                {!installed && (
                  <a href={PHANTOM_DOWNLOAD_URL} target='_blank' rel='noreferrer'>
                    Open the official Phantom download page
                  </a>
                )}
              </div>
            ) : (
              <>
                <div className='wallet-hub__identity'>
                  <div>
                    <span>Connected address</span>
                    <strong title={address}>{shortenWalletAddress(address, 8)}</strong>
                  </div>
                  <div>
                    <span>Live SOL balance</span>
                    <strong>
                      {balanceStatus === 'loading'
                        ? 'Refreshing...'
                        : balanceSol === null
                          ? 'Unavailable'
                          : `${balanceSol.toFixed(4)} SOL`}
                    </strong>
                  </div>
                </div>

                <div className='wallet-hub__verification'>
                  <span className={verified ? 'is-verified' : ''}>
                    <i aria-hidden='true' />
                    {verified ? 'Ownership verified for this session' : 'Ownership signature required'}
                  </span>
                  <p>
                    Signing confirms control of this address. It is not a transaction and cannot move funds
                  </p>
                </div>

                <div className='wallet-hub__actions'>
                  {!verified && (
                    <button
                      className='button button--primary'
                      type='button'
                      disabled={status === 'signing'}
                      onClick={() => void verifyOwnership()}
                    >
                      {status === 'signing' ? 'Check Phantom' : 'Verify ownership'}
                    </button>
                  )}
                  <button className='button button--ghost' type='button' onClick={() => void refreshBalance()}>
                    Refresh balance
                  </button>
                  <button className='button button--ghost' type='button' onClick={() => void copyAddress()}>
                    {copyLabel}
                  </button>
                  <a
                    className='button button--ghost'
                    href={`${SOLANA_EXPLORER_URL}${address}`}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Explorer
                  </a>
                  <button className='button button--ghost' type='button' onClick={() => void disconnect()}>
                    Disconnect
                  </button>
                </div>
              </>
            )}

            {error && <p className='wallet-hub__error' role='alert'>{error}</p>}
          </article>

          <div className='wallet-hub__metrics'>
            <article>
              <span>Network</span>
              <strong>Solana mainnet</strong>
              <small>Live RPC balance</small>
            </article>
            <article>
              <span>Best run</span>
              <strong>{bestScore.toLocaleString('en-US')}</strong>
              <small>Saved in this browser</small>
            </article>
            <article>
              <span>Ownership</span>
              <strong>{verified ? 'Verified' : address ? 'Connected' : 'Not linked'}</strong>
              <small>Message signature</small>
            </article>
          </div>

          <WithdrawPanel />

          <div className='reward-route'>
            {rewardRoute.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.copy}</p></div>
              </article>
            ))}
          </div>

          <aside className='wallet-hub__disclosure'>
            <strong>On-chain status</strong>
            <p>
              Wallet connection, live balance reading, and signed ownership are active. Reward claims remain
              unavailable until the distribution treasury and claim contract are deployed. When enabled, every
              transfer will require a visible Phantom transaction confirmation
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
