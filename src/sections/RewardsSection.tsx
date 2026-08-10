import { useMemo, useState, type FormEvent } from 'react'

import { SectionIntro } from '../components'
import {
  DAILY_REWARD_CAP_LAMPORTS,
  HOURLY_REWARD_CAP_LAMPORTS,
  MIN_WITHDRAWAL_LAMPORTS,
  PICKUP_REWARD_LAMPORTS,
  SIMULATED_LAMPORTS_PER_SOL,
  WITHDRAWAL_ACTIVE_GATE_SECONDS,
} from '../rewards/rewardRules'
import {
  selectActiveRewardProfile,
  useRewardStore,
} from '../stores/rewardStore'

const formatDemoSol = (lamports: number): string =>
  `${(lamports / SIMULATED_LAMPORTS_PER_SOL).toFixed(4)} Demo SOL`

const formatActiveTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

const formatAddress = (address: string): string =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address

const progressPercent = (value: number, goal: number): number =>
  Math.min(100, Math.max(0, value / goal * 100))

export function RewardsSection() {
  const activeAddress = useRewardStore((state) => state.activeAddress)
  const profile = useRewardStore(selectActiveRewardProfile)
  const error = useRewardStore((state) => state.error)
  const linkAddress = useRewardStore((state) => state.linkAddress)
  const unlinkAddress = useRewardStore((state) => state.unlinkAddress)
  const simulateEligibility = useRewardStore((state) => state.simulateEligibility)
  const withdrawDemo = useRewardStore((state) => state.withdrawDemo)
  const clearError = useRewardStore((state) => state.clearError)
  const [addressInput, setAddressInput] = useState('')
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null)

  const balanceProgress = progressPercent(profile?.balanceLamports ?? 0, MIN_WITHDRAWAL_LAMPORTS)
  const timeProgress = progressPercent(profile?.eligibleActiveSeconds ?? 0, WITHDRAWAL_ACTIVE_GATE_SECONDS)
  const canWithdraw = Boolean(
    profile?.eligibility === 'eligible'
      && profile.eligibleActiveSeconds >= WITHDRAWAL_ACTIVE_GATE_SECONDS
      && profile.balanceLamports >= MIN_WITHDRAWAL_LAMPORTS,
  )
  const projectedHoursRemaining = useMemo(() => {
    const balance = profile?.balanceLamports ?? 0
    const targetHourlyLamports = MIN_WITHDRAWAL_LAMPORTS / 3
    return Math.max(0, (MIN_WITHDRAWAL_LAMPORTS - balance) / targetHourlyLamports)
  }, [profile?.balanceLamports])

  const submitAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setReceiptMessage(null)
    if (linkAddress(addressInput)) setAddressInput('')
  }

  const completeWithdrawal = () => {
    setReceiptMessage(null)
    const receipt = withdrawDemo()
    if (receipt) {
      setReceiptMessage(
        `${formatDemoSol(Number(receipt.amountLamports))} was removed from this browser's local demo balance. No cryptocurrency was sent.`,
      )
    }
  }

  return (
    <section className="rewards-section section-space" id="rewards" aria-labelledby="rewards-title">
      <div className="rewards-section__mesh" aria-hidden="true"><span /><span /><span /></div>
      <div className="section-shell rewards-section__layout">
        <div className="rewards-section__intro">
          <SectionIntro
            eyebrow="Reward Lab / Local-first simulation"
            title={<>Run the route.<br />Test the loop.</>}
            description={(
              <>A local-first reward prototype that turns active play into Demo SOL credits. When available, the simulation API mirrors the public address and demo records to the site's database. Nothing checks real holdings or transfers cryptocurrency.</>
            )}
            id="rewards-title"
          />
          <a className="rewards-section__whitepaper" href="/MEOWAVE-REWARD-WHITEPAPER.md" target="_blank" rel="noreferrer">
            Read the reward whitepaper <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="reward-lab">
          <aside className="reward-lab__notice" role="note">
            <strong>Simulation only</strong>
            <p>No real SOL is earned or withdrawable. Public addresses and demo telemetry may be mirrored to the simulation server; never send funds, sign a transaction, or share a seed phrase.</p>
          </aside>

          <div className="reward-lab__steps">
            <article className="reward-step reward-step--address">
              <header><span>01</span><h3>Link a public address</h3></header>
              {!activeAddress ? (
                <>
                  <p>Enter a Solana public address to label this local demo profile. The public address may also be sent to the site's optional simulation API; no private key or signature is requested.</p>
                  <form className="reward-address-form" onSubmit={submitAddress} noValidate>
                    <label htmlFor="reward-address">Solana public address</label>
                    <div>
                      <input
                        id="reward-address"
                        name="reward-address"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={addressInput}
                        onChange={(event) => {
                          setAddressInput(event.target.value)
                          clearError()
                        }}
                        placeholder="Solana public address"
                        aria-describedby="reward-address-help"
                      />
                      <button className="button button--primary" type="submit">Link address</button>
                    </div>
                    <small id="reward-address-help">Public address only / locally saved and optionally mirrored / never enter a seed phrase.</small>
                  </form>
                </>
              ) : (
                <div className="reward-linked-address">
                  <span>Linked locally</span>
                  <strong title={activeAddress}>{formatAddress(activeAddress)}</strong>
                  <button className="button button--ghost" type="button" onClick={() => {
                    unlinkAddress()
                    setReceiptMessage(null)
                  }}>Change address</button>
                </div>
              )}
            </article>

            <article className="reward-step reward-step--eligibility">
              <header><span>02</span><h3>Simulate eligibility</h3></header>
              {!activeAddress && <p>Link a public address to unlock this local demonstration step.</p>}
              {activeAddress && profile?.eligibility !== 'eligible' && (
                <>
                  <p>The full demo loop uses a fictional $10 token-value gate. No RPC or on-chain request is made.</p>
                  <button
                    className="button button--primary"
                    type="button"
                    disabled={profile?.eligibility === 'checking'}
                    onClick={() => void simulateEligibility()}
                  >
                    {profile?.eligibility === 'checking' ? 'Running local simulation…' : 'Run demo check'}
                  </button>
                </>
              )}
              {profile?.eligibility === 'eligible' && (
                <div className="reward-eligibility-result" role="status">
                  <span>Demo eligible</span>
                  <strong>${((profile.simulatedUsdCents ?? 0) / 100).toFixed(2)} simulated value</strong>
                  <p>Required: $10.00. This fictional value does not reflect holdings at the entered address. Source: {profile.eligibilitySource === 'api' ? 'simulation API mirror' : 'local fallback'}.</p>
                </div>
              )}
            </article>
          </div>

          {error && <p className="reward-lab__error" role="alert">{error}</p>}

          <article className="reward-balance-panel">
            <header>
              <div><span>Local Demo SOL balance</span><strong>{formatDemoSol(profile?.balanceLamports ?? 0)}</strong></div>
              <small>Browser ledger / optional server mirror</small>
            </header>

            <div className="reward-progress-grid">
              <div className="reward-progress">
                <div><span>Minimum demo withdrawal</span><b>{formatDemoSol(profile?.balanceLamports ?? 0)} / {formatDemoSol(MIN_WITHDRAWAL_LAMPORTS)}</b></div>
                <progress max="100" value={balanceProgress} aria-label="Demo balance progress" />
              </div>
              <div className="reward-progress">
                <div><span>Active play requirement</span><b>{formatActiveTime(profile?.eligibleActiveSeconds ?? 0)} / 2h 00m</b></div>
                <progress max="100" value={timeProgress} aria-label="Active play progress" />
              </div>
            </div>

            {profile?.eligibility === 'eligible' ? (
              <p className="reward-balance-panel__estimate">
                At the target pace: approximately {projectedHoursRemaining.toFixed(1)} active hours to the balance minimum. Withdrawal controls also require two active hours.
              </p>
            ) : (
              <p className="reward-balance-panel__estimate">Trial runs remain playable but are not credited retroactively. Link an address and complete the demo check before an eligible run begins.</p>
            )}

            <button
              className="button button--primary button--wide"
              type="button"
              disabled={!canWithdraw}
              onClick={completeWithdrawal}
            >
              Complete 0.2500 Demo SOL withdrawal simulation
            </button>
            <small>No blockchain transaction, transaction hash, wallet signature, or monetary value is created.</small>
            {receiptMessage && <p className="reward-balance-panel__success" role="status">{receiptMessage}</p>}
          </article>

          <article className="reward-math">
            <header><span>03</span><h3>Three-hour target</h3></header>
            <div className="reward-math__equation">
              <strong>~14 pickups/min</strong><span>×</span><strong>0.0001 Demo SOL</strong><span>≈</span><strong>0.0833/hour</strong><span>× 3 ≈</span><strong>0.2500</strong>
            </div>
            <p>Only raw physical pickups count. Power-up doubling does not create extra credit. A completed run is capped proportionally at {formatDemoSol(HOURLY_REWARD_CAP_LAMPORTS)} per active hour, with a {formatDemoSol(DAILY_REWARD_CAP_LAMPORTS)} UTC-day ceiling.</p>
            <small>Each physical pickup credits {PICKUP_REWARD_LAMPORTS.toLocaleString('en-US')} integer simulated lamports. Display rounding never changes the stored amount.</small>
          </article>

          <article className="reward-history">
            <header><span>Simulation history</span><strong>{profile?.withdrawals.length ?? 0} local records</strong></header>
            {profile && profile.withdrawals.length > 0 ? (
              <div className="reward-history__table-wrap">
                <table>
                  <caption className="sr-only">Local simulated withdrawal history</caption>
                  <thead><tr><th>Date</th><th>Destination</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {profile.withdrawals.map((receipt) => (
                      <tr key={receipt.requestId}>
                        <td>
                          <time dateTime={new Date(receipt.createdAt).toISOString()}>{new Date(receipt.createdAt).toLocaleDateString('en-US')}</time>
                          <small title={receipt.requestId}>Receipt {receipt.requestId.slice(0, 8)}…</small>
                        </td>
                        <td title={profile.address}>{formatAddress(profile.address)}</td>
                        <td>{formatDemoSol(Number(receipt.amountLamports))}</td>
                        <td>Simulated</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reward-history__empty">
                <strong>No demo withdrawals yet</strong>
                <p>Completed simulations will appear here. They are not blockchain transactions.</p>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
