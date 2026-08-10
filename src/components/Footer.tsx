import { BrandMark } from "./BrandMark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <a href="#top" className="site-footer__brand">
          <BrandMark />
        </a>
        <p>A tiny runner chasing a very large signal</p>
        <a className="site-footer__back" href="#top">
          Back to top <span aria-hidden="true">/</span>
        </a>
      </div>
      <div className="site-footer__line" />
      <div className="site-footer__bottom">
        <p>&copy; {year} MEOWAVE. Built for play</p>
        <p>Demo rewards are simulated. No real SOL is transferred</p>
        <nav aria-label="Footer navigation">
          <a href="#game">Game</a>
          <a href="#rewards">Rewards</a>
          <a href="#story">Story</a>
          <a href="#faq">FAQ</a>
        </nav>
      </div>
    </footer>
  );
}
