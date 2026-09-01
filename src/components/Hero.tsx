import { ContractBadge } from './ContractBadge'
import { Icon } from './Icon'

export interface HeroProps {
  onPlay?: () => void
}

export function Hero({ onPlay }: HeroProps) {
  return (
    <section className='hero' id='top' aria-labelledby='hero-title'>
      <video
        className='hero__video'
        autoPlay
        muted
        loop
        playsInline
        preload='auto'
        disablePictureInPicture
        controlsList='nodownload noplaybackrate'
        aria-hidden='true'
      >
        <source src='/meowave-hero-loop.mp4' type='video/mp4' />
      </video>
      <div className='hero__video-shade' aria-hidden='true' />
      <div className='hero__ambient' aria-hidden='true'>
        <span className='hero__grid' />
        <span className='hero__orb hero__orb--cyan' />
        <span className='hero__orb hero__orb--violet' />
        <span className='hero__plane hero__plane--one' />
        <span className='hero__plane hero__plane--two' />
      </div>

      <div className='hero__content'>
        <div className='hero__copy'>
          <div className='hero__status'>
            <span aria-hidden='true' />
            Solana runner / Signal live
          </div>
          <h1 id='hero-title' aria-label='MEOWAVE'>
            <span aria-hidden='true'>MEO</span>
            <span className='hero__title-run' aria-hidden='true'>WAVE</span>
          </h1>
          <p className='hero__tagline'>Run the signal. Collect SOL coins. Own every move.</p>
          <p className='hero__description'>
            Guide a low-poly cat through a shifting three-lane route, stack SOL coins,
            climb the leaderboard, and link the run to Phantom.
          </p>

          <div className='hero__actions'>
            <a className='button button--primary button--hero' href='#game' onClick={onPlay}>
              <Icon name='play' />
              Play Now
              <span className='button__key'>Space</span>
            </a>
            <a className='button button--ghost button--hero-wallet' href='#rewards'>
              <Icon name='wallet' />
              Connect Phantom
            </a>
          </div>

          <div className='hero__facts' aria-label='Game highlights'>
            <span><strong>03</strong> responsive lanes</span>
            <span><strong>LIVE</strong> Phantom connection</span>
            <span><strong>01</strong> focused cat</span>
          </div>

          <ContractBadge className='hero__contract' />
        </div>
      </div>

      <a className='hero__scroll' href='#game' aria-label='Scroll to the game'>
        <span>Enter the route</span>
        <Icon name='arrow-down' />
      </a>
    </section>
  )
}
