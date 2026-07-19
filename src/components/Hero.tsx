import catFront from "../assets/poses/meowave-front.jpg";
import { Icon } from "./Icon";

export interface HeroProps {
  onPlay?: () => void;
}

export function Hero({
  onPlay,
}: HeroProps) {
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
            Browser runner / Signal ready
          </div>
          <h1 id="hero-title" aria-label="MEOWAVE">
            <span aria-hidden="true">MEO</span>
            <span className="hero__title-run" aria-hidden="true">WAVE</span>
          </h1>
          <p className="hero__tagline">Ride the wave. Catch the rhythm. Collect every SOL</p>
          <p className="hero__description">
            Guide a headphone-wearing cat through a shifting geometric signal. Find the clean
            line, build the combo, and keep the beat alive
          </p>

          <div className="hero__actions">
            <a className="button button--primary button--hero" href="#game" onClick={onPlay}>
              <Icon name="play" />
              Play Now
              <span className="button__key">Space</span>
            </a>
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
                src={catFront}
                alt="Front view of Meowave, a low-poly orange-and-white cat wearing silver headphones"
              />
              <span className="hero-character__scan" aria-hidden="true" />
            </div>
            <div className="hero-character__label">
              <span>Meowave / 01</span>
              <strong id="hero-character-title">Frequency locked</strong>
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
            <span>Meowave signal runner</span>
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
