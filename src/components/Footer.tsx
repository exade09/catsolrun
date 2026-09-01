import { BrandMark } from './BrandMark'
import { ContractBadge } from './ContractBadge'
import { ScannerBackdrop } from './ScannerBackdrop'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className='site-footer'>
      <ScannerBackdrop />
      <div className='site-footer__glow' aria-hidden='true' />
      <div className='site-footer__cta'>
        <span>THE ROUTE IS STILL OPEN</span>
        <h2>One more run?</h2>
        <p>Collect SOL coins, sharpen your line, and return to the signal.</p>
        <a className='button button--primary' href='#game'>Play Meowave</a>
      </div>
      <div className='site-footer__top'>
        <a href='#top' className='site-footer__brand'>
          <BrandMark />
        </a>
        <ContractBadge className='site-footer__contract' />
        <a className='site-footer__back' href='#top'>
          Back to top <span aria-hidden='true'>/</span>
        </a>
      </div>
      <div className='site-footer__line' />
      <div className='site-footer__bottom'>
        <p>&copy; {year} MEOWAVE. Built for play.</p>
        <p>Wallet actions stay inside Phantom.</p>
        <nav aria-label='Footer navigation'>
          <a href='#game'>Game</a>
          <a href='#rewards'>Wallet</a>
          <a href='#leaderboard'>Leaderboard</a>
          <a href='#faq'>FAQ</a>
        </nav>
      </div>
    </footer>
  )
}
