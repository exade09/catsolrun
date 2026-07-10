import catReference from "../assets/cat-reference.png";
import { Icon } from "./Icon";

export interface HeroProps {
  onPlay?: () => void;
  onConnect?: () => void;
  isWalletConnected?: boolean;
  isWalletConnecting?: boolean;
  isWalletDisconnecting?: boolean;
  walletLabel?: string;
}

export function Hero({
  onPlay,
  onConnect,
  isWalletConnected = false,
  isWalletConnecting = false,
  isWalletDisconnecting = false,
  walletLabel,
}: HeroProps) {
  const walletBusy = isWalletConnecting || isWalletDisconnecting;

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__ambient" aria-hidden="true">
        <span className="hero__grid" />
        <span className="hero__orb hero__orb--cyan" />
        <span className="hero__orb hero__orb--violet" />
        <span className="hero__plane hero__plane--one" />
        <span className="hero__plane hero__plane--two" />
      </div>

      <div className="hero__content">
        <div className="hero__copy">
          <div className="hero__status">
            <span aria-hidden="true" />
            Browser runner / Devnet ready
          </div>
          <h1 id="hero-title">
            <span>SOL CAT</span>
            <span className="hero__title-run">RUN</span>
          </h1>
          <p className="hero__tagline">Run the chain. Catch the rhythm. Collect every SOL.</p>
          <p className="hero__description">
            Guide a headphone-wearing cat through a shifting geometric signal. Find the clean
            line, build the combo, and keep the beat alive.
          </p>

          <div className="hero__actions">
            <a className="button button--primary button--hero" href="#game" onClick={onPlay}>
              <Icon name="play" />
              Play Now
              <span className="button__key">Space</span>
            </a>
            <button
              className="button button--glass button--hero"
              type="button"
              onClick={onConnect}
              disabled={walletBusy}
              aria-label={isWalletConnected ? "Manage connected Solana wallet" : "Connect Solana wallet"}
            >
              <Icon name="wallet" />
              {isWalletDisconnecting
                ? "Disconnecting..."
                : isWalletConnecting
                ? "Connecting..."
                : isWalletConnected
                  ? walletLabel ?? "Wallet Connected"
                  : "Connect Wallet"}
            </button>
          </div>

          <div className="hero__facts" aria-label="Game highlights">
            <span><strong>03</strong> responsive lanes</span>
            <span><strong>ENDLESS</strong> generated route</span>
            <span><strong>01</strong> very focused cat</span>
          </div>
        </div>

        <div className="hero-character" role="group" aria-labelledby="hero-character-title">
          <div className="hero-character__orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-character__frame">
            <div className="hero-character__image-wrap">
              <img
                src={catReference}
                alt="Low-poly orange-and-white cat wearing large headphones beside a portable music player"
              />
              <span className="hero-character__scan" aria-hidden="true" />
            </div>
            <div className="hero-character__label">
              <span>Runner 01</span>
              <strong id="hero-character-title">Signal locked</strong>
            </div>
            <div className="hero-character__equalizer" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <span className="sol-shard sol-shard--one" aria-hidden="true"><Icon name="coin" /></span>
          <span className="sol-shard sol-shard--two" aria-hidden="true"><Icon name="coin" /></span>
          <span className="sol-shard sol-shard--three" aria-hidden="true"><Icon name="coin" /></span>

          <div className="hero-character__caption">
            <span className="hero-character__caption-index">A / 01</span>
            <span>Orange signal runner</span>
            <span>Headphones calibrated</span>
          </div>
        </div>
      </div>

      <a className="hero__scroll" href="#game" aria-label="Scroll to the game">
        <span>Enter the route</span>
        <Icon name="arrow-down" />
      </a>
    </section>
  );
}
