import { Icon, SectionIntro } from "../components";

const questions = [
  {
    question: "Do I need a wallet to play?",
    answer: "No. Every gameplay feature is available without a wallet. Connecting one only provides an optional player identity for your local record.",
  },
  {
    question: "Is the SOL I collect real cryptocurrency?",
    answer: "No. In-game SOL is a gameplay collectible used for scoring and combos. It has no monetary value and cannot be withdrawn or transferred.",
  },
  {
    question: "Will the game ask me to sign a transaction?",
    answer: "No. Connecting is read-only for identity, and playing never starts a transaction. SOL CAT RUN never asks for a seed phrase or private key.",
  },
  {
    question: "Can I play on a phone or tablet?",
    answer: "Yes. Swipe left or right to switch lanes, up to jump, and down to slide. Visual quality adapts to smaller devices where needed.",
  },
  {
    question: "Where is my best score stored?",
    answer: "Your best score and settings are stored locally in your browser. Demo leaderboard entries are clearly labeled and do not come from a blockchain.",
  },
];

export function FAQSection() {
  return (
    <section className="faq-section section-space" id="faq" aria-labelledby="faq-title">
      <div className="section-shell faq-section__layout">
        <div className="faq-section__heading">
          <SectionIntro
            eyebrow="Before the run"
            title={<>Clear answers.<br />No fine print.</>}
            description="The game is free to enter, the wallet is optional, and every collectible stays inside the game."
            id="faq-title"
          />
          <a className="faq-section__game-link" href="#game">
            Ready to run? <span>Open the game</span>
          </a>
        </div>

        <div className="faq-list">
          {questions.map((item, index) => (
            <details key={item.question} name="sol-cat-faq" open={index === 0}>
              <summary>
                <span className="faq-list__index">0{index + 1}</span>
                <span>{item.question}</span>
                <span className="faq-list__toggle" aria-hidden="true"><Icon name="chevron" /></span>
              </summary>
              <div className="faq-list__answer"><p>{item.answer}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
