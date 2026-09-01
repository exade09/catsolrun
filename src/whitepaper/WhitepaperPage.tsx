import { useEffect } from 'react'

import { BrandMark } from '../components/BrandMark'
import { ScannerBackdrop } from '../components/ScannerBackdrop'
import { TOKEN_CHAIN, TOKEN_MINT, TOKEN_TICKER } from '../config/token'

const navigation = [
  ['01', 'Purpose', 'purpose'],
  ['02', 'Eligibility', 'eligibility'],
  ['03', 'Reward model', 'reward-model'],
  ['04', 'Withdrawals', 'withdrawals'],
  ['05', 'Integrity', 'integrity'],
] as const

const outcomes = [
  ['50% of available SOL coins', '0.0625 SOL', 'About 4 active hours'],
  ['66.7% of available SOL coins', '0.0833 SOL', 'About 3 active hours'],
  ['At the hourly cap', '0.125 SOL', '2 active hours'],
]

export function WhitepaperPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'MEOWAVE Reward Whitepaper'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className='whitepaper-page'>
      <div className='whitepaper-page__ambient' aria-hidden='true'>
        <ScannerBackdrop />
      </div>

      <header className='whitepaper-header'>
        <a href='/' aria-label='Return to Meowave'>
          <BrandMark />
        </a>
        <div>
          <span>Reward architecture</span>
          <strong>Version 1.0 / Solana</strong>
        </div>
        <div className='whitepaper-header__actions'>
          <button type='button' onClick={() => window.print()}>Print document</button>
          <a href='/#rewards'>Return to Wallet Hub</a>
        </div>
      </header>

      <main className='whitepaper-shell'>
        <aside className='whitepaper-index'>
          <span>MEOWAVE / WHITEPAPER</span>
          <h1>Run.<br />Collect.<br />Withdraw.</h1>
          <p>
            The operating model for connecting skilled runner gameplay to wallet-based
            eligibility and transparent SOL withdrawals.
          </p>
          <nav aria-label='Whitepaper sections'>
            {navigation.map(([number, label, id]) => (
              <a href={'#' + id} key={id}><span>{number}</span>{label}</a>
            ))}
          </nav>
        </aside>

        <article className='whitepaper-document'>
          <header className='whitepaper-document__hero'>
            <span>MEOWAVE REWARD SYSTEM</span>
            <h2>Every reward follows a visible route.</h2>
            <p>
              Phantom supplies the destination wallet. The configured MEOWAVE token determines
              eligibility. Validated play determines earned balance. A withdrawal is completed
              only through the official reward service and an on-chain result.
            </p>
            <dl>
              <div><dt>Network</dt><dd>Solana Mainnet</dd></div>
              <div><dt>Minimum withdrawal</dt><dd>0.25 SOL</dd></div>
              <div><dt>Expected target</dt><dd>About 3 active hours</dd></div>
            </dl>
          </header>

          <section id='purpose'>
            <span className='whitepaper-section__number'>01 / PURPOSE</span>
            <h2>Gameplay first. Wallet control always.</h2>
            <p>
              MEOWAVE is a three-lane low-poly runner where movement, survival, and SOL coin
              collection define each result. Connecting Phantom is not required to enter the
              game. It becomes required when a player wants wallet eligibility and withdrawals.
            </p>
            <div className='whitepaper-principles'>
              <article><strong>Play</strong><p>Read the route, avoid hazards, and finish meaningful runs.</p></article>
              <article><strong>Collect</strong><p>SOL coins build score and feed validated reward metrics.</p></article>
              <article><strong>Qualify</strong><p>Hold the required token in the connected Phantom wallet.</p></article>
              <article><strong>Withdraw</strong><p>Send eligible earnings only to that same verified address.</p></article>
            </div>
          </section>

          <section id='eligibility'>
            <span className='whitepaper-section__number'>02 / ELIGIBILITY</span>
            <h2>The wallet is detected, never typed.</h2>
            <p>
              A player connects Phantom and approves a message signature. MEOWAVE reads the
              selected public address and checks its token accounts against the configured
              eligibility mint on Solana Mainnet.
            </p>
            <ol className='whitepaper-flow'>
              <li><span>01</span><div><strong>Connect Phantom</strong><p>The active public address becomes the player destination.</p></div></li>
              <li><span>02</span><div><strong>Verify ownership</strong><p>A message signature confirms control without moving funds.</p></div></li>
              <li><span>03</span><div><strong>Check token holding</strong><p>A positive balance of the published mint returns Eligible.</p></div></li>
              <li><span>04</span><div><strong>Keep status current</strong><p>Changing the Phantom account triggers a new wallet check.</p></div></li>
            </ol>
            <aside className='whitepaper-callout'>
              <strong>Token contract</strong>
              <p>
                The official {TOKEN_TICKER} mint on {TOKEN_CHAIN} is:
              </p>
              <code className='whitepaper-callout__mint'>{TOKEN_MINT}</code>
              <p>
                Any address not matching this mint must be ignored by the eligibility service.
              </p>
            </aside>
          </section>

          <section id='reward-model'>
            <span className='whitepaper-section__number'>03 / REWARD MODEL</span>
            <h2>Active play determines the route to 0.25 SOL.</h2>
            <p>
              The reusable track contains fourteen 20-meter segments, creating a 280-meter
              cycle with five SOL coin opportunities. At the current speed curve, repeated
              four-minute runs produce approximately 70,000 meters of active movement per hour.
            </p>
            <div className='whitepaper-formula'>
              <span>70,000 m</span><i>/</i><span>280 m</span><i>x</i><span>5 coins</span><b>= 1,250 opportunities</b>
            </div>
            <p>
              A competent collection rate of 66.7% is approximately 833 validated SOL coins per
              active hour. At 0.0001 SOL per accepted coin, that produces an expected rate near
              0.0833 SOL per active hour.
            </p>
            <div className='whitepaper-table-wrap'>
              <table>
                <thead><tr><th>Collection performance</th><th>Estimated hourly reward</th><th>Time to 0.25 SOL</th></tr></thead>
                <tbody>
                  {outcomes.map((row) => (
                    <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className='whitepaper-rules'>
              <li>Only time in the active Playing state is counted.</li>
              <li>Menus, countdowns, pauses, hidden tabs, and inactive periods do not count.</li>
              <li>A qualifying run must last at least 20 seconds and contain accepted player actions.</li>
              <li>Reward issuance is capped at 0.125 SOL per active hour and 0.30 SOL per day.</li>
              <li>Power-ups improve survival and score but cannot bypass issuance limits.</li>
            </ul>
          </section>

          <section id='withdrawals'>
            <span className='whitepaper-section__number'>04 / WITHDRAWALS</span>
            <h2>One connected wallet. One destination.</h2>
            <p>
              The Withdraw window uses the active Phantom address automatically. There is no
              address field and no alternate destination. This removes copy errors and keeps
              eligibility, ownership, and the payout route attached to one wallet.
            </p>
            <div className='whitepaper-withdraw-grid'>
              <article><span>Requirement 01</span><strong>Eligible token holding</strong><p>The required mint must have a positive on-chain balance.</p></article>
              <article><span>Requirement 02</span><strong>Verified wallet</strong><p>The connected address must complete ownership signing.</p></article>
              <article><span>Requirement 03</span><strong>0.25 SOL minimum</strong><p>Available validated earnings must meet the withdrawal threshold.</p></article>
              <article><span>Requirement 04</span><strong>Reward service online</strong><p>The official service must accept and record the withdrawal request.</p></article>
            </div>
            <aside className='whitepaper-callout whitepaper-callout--cyan'>
              <strong>Completion rule</strong>
              <p>
                The interface may report a withdrawal as completed only after the reward service
                returns a valid Solana transaction reference that can be opened in Explorer.
              </p>
            </aside>
          </section>

          <section id='integrity'>
            <span className='whitepaper-section__number'>05 / INTEGRITY</span>
            <h2>Client gameplay is not payout authority.</h2>
            <p>
              Real-value distribution requires server-authoritative run validation. Client score,
              distance, active time, and pickup totals are useful for the interface but must be
              checked against secure telemetry before they affect a withdrawable balance.
            </p>
            <div className='whitepaper-integrity'>
              <div><strong>Run validation</strong><p>Reject impossible movement, timing, collection, and replay patterns.</p></div>
              <div><strong>Durable ledger</strong><p>Record credits and withdrawals with idempotent server events.</p></div>
              <div><strong>Treasury controls</strong><p>Apply reserve limits, rate limits, monitoring, and operational approval.</p></div>
              <div><strong>On-chain proof</strong><p>Expose every completed withdrawal through a verifiable transaction.</p></div>
            </div>
            <p className='whitepaper-document__status'>
              Wallet connection, ownership signing, live mainnet balance, and automatic token
              eligibility checks against the published {TOKEN_TICKER} mint are implemented. Reward
              distribution opens once the validated reward service and funded treasury are live.
            </p>
          </section>
        </article>
      </main>

      <footer className='whitepaper-footer'>
        <BrandMark />
        <p>MEOWAVE reward architecture / Solana Mainnet</p>
        <a href='/#rewards'>Open Wallet Hub</a>
      </footer>
    </div>
  )
}
