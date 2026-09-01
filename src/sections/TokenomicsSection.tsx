import catProfile from '../assets/poses/meowave-profile.jpg'
import { ContractBadge, SectionIntro } from '../components'
import { TOKEN_TICKER, tokenLinks } from '../config/token'

const tokenFacts = [
  { label: 'Ticker', value: TOKEN_TICKER, tone: 'orange' },
  { label: 'Supply', value: '1B', tone: 'cyan' },
  { label: 'Blockchain', value: 'Solana', tone: 'violet' },
] as const

const tokenExplorers = [
  { label: 'Pump.fun', href: tokenLinks.pumpFun },
  { label: 'DEX Screener', href: tokenLinks.dexScreener },
  { label: 'Solscan', href: tokenLinks.solscan },
] as const

export function TokenomicsSection() {
  return (
    <section className='tokenomics-section section-space' id='tokenomics' aria-labelledby='tokenomics-title'>
      <div className='tokenomics-section__mesh' aria-hidden='true'>
        <span />
        <span />
        <span />
      </div>

      <div className='section-shell tokenomics-section__layout'>
        <div className='tokenomics-section__copy'>
          <SectionIntro
            eyebrow='Tokenomics'
            title={<>One signal<br />A billion waves</>}
            description='A compact snapshot of the Meowave token architecture on Solana. Clear numbers, no fictional chain metrics.'
            id='tokenomics-title'
          />
          <div className='tokenomics-section__contract'>
            <span className='tokenomics-section__contract-label'>Contract address / Solana Mainnet</span>
            <ContractBadge />
            <ul className='tokenomics-section__explorers'>
              {tokenExplorers.map((explorer) => (
                <li key={explorer.label}>
                  <a href={explorer.href} target='_blank' rel='noreferrer noopener'>
                    {explorer.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className='tokenomics-section__note'>
            Always verify the mint above before trading. Allocation, vesting, and claim rules are published with the reward service rollout.
          </p>
        </div>

        <div className='tokenomics-board'>
          <div className='tokenomics-board__portrait'>
            <img
              src={catProfile}
              alt='Side reference view of the low-poly Meowave cat wearing silver headphones'
              loading='lazy'
            />
            <span>Character study / 02</span>
          </div>

          <dl className='tokenomics-board__facts'>
            {tokenFacts.map((fact, index) => (
              <div className={'tokenomics-fact tokenomics-fact--' + fact.tone} key={fact.label}>
                <dt><span>0{index + 1}</span>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <svg className='tokenomics-board__wave' viewBox='0 0 420 82' aria-hidden='true'>
            <path d='M2 42h38l14-24 18 47 22-37 20 14h39l15-24 18 47 22-37 20 14h39l15-24 18 47 22-37 20 14h80' />
          </svg>
        </div>
      </div>
    </section>
  )
}
