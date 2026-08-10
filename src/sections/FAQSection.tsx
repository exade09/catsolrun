import { Icon, SectionIntro } from "../components";

const questions = [
  {
    question: "What is Meowave?",
    answer: "Meowave is a browser-based low-poly runner about a calm cat, a restless signal, and a route that moves to its own rhythm",
  },
  {
    question: "Is the SOL I collect real cryptocurrency?",
    answer: "No. SOL notes are gameplay collectibles. Demo SOL is a separate simulated balance with no monetary value, blockchain transaction, or transfer of real cryptocurrency",
  },
  {
    question: "How does the Reward Lab work?",
    answer: "Link a public Solana address, run the clearly labeled simulation check, and finish meaningful runs. Withdrawal controls unlock after two active hours, while the published model targets 0.25 Demo SOL in about three hours for an average active player",
  },
  {
    question: "Do I need to install anything?",
    answer: "No. The complete game runs directly in a modern browser with WebGL enabled. Press Play Now and the route opens on the page",
  },
  {
    question: "Can I play on a phone or tablet?",
    answer: "Yes. Swipe left or right to switch lanes, up to jump, and down to slide. Visual quality adapts to smaller devices where needed",
  },
  {
    question: "Where is my best score stored?",
    answer: "Your personal best, audio setting, motion preference, and touch-control setting stay locally in your browser",
  },
  {
    question: "Where is my Demo SOL balance stored?",
    answer: "The displayed balance is a local browser ledger keyed to the public address you enter. When available, the optional simulation API receives a best-effort mirror, but it is not a wallet, authentication method, or real-value account",
  },
];

export function FAQSection() {
  return (
    <section className="faq-section section-space" id="faq" aria-labelledby="faq-title">
      <div className="section-shell faq-section__layout">
        <div className="faq-section__heading">
          <SectionIntro
            eyebrow="Before the run"
            title={<>Clear answers<br />No fine print</>}
            description="The game opens directly in your browser, and the Reward Lab explains every simulated unit before you play"
            id="faq-title"
          />
          <a className="faq-section__game-link" href="#game">
            Ready to run? <span>Open the game</span>
          </a>
        </div>

        <div className="faq-list">
          {questions.map((item, index) => (
            <details key={item.question} name="meowave-faq" open={index === 0}>
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
