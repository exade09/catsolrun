import { Icon, SectionIntro } from '../components'

const questions = [
  {
    question: 'What is Meowave?',
    answer: 'Meowave is a browser-based low-poly runner on Solana. Guide the cat across three lanes, dodge hazards, collect SOL coins, and push your best distance',
  },
  {
    question: 'Are SOL coins real cryptocurrency?',
    answer: 'SOL coins are gameplay collectibles that drive score and leaderboard results. Real on-chain claims will activate only after the treasury, claim contract, and server-side run verification are deployed',
  },
  {
    question: 'What does Phantom connection enable?',
    answer: 'The site can read your public Solana address and live mainnet balance. You can also sign a message to prove wallet ownership. Connecting or signing a message does not move funds',
  },
  {
    question: 'Can I earn SOL by playing?',
    answer: 'The game is designed around a play, verify, and claim route. Gameplay and wallet verification are live now; SOL distribution is not active until the on-chain reward infrastructure is deployed and published',
  },
  {
    question: 'Do I need to install the game?',
    answer: 'No. Meowave runs in a modern browser with WebGL enabled. Phantom is optional for playing and required only for wallet-linked features',
  },
  {
    question: 'Can I play on a phone or tablet?',
    answer: 'Yes. Swipe left or right to switch lanes, up to jump, and down to slide. Visual quality adapts to smaller devices',
  },
  {
    question: 'Where is my best score stored?',
    answer: 'Your personal best and preferences stay in this browser. Completed runs are also submitted to the leaderboard when the database is available',
  },
]

export function FAQSection() {
  return (
    <section className='faq-section section-space' id='faq' aria-labelledby='faq-title'>
      <div className='section-shell faq-section__layout'>
        <div className='faq-section__heading'>
          <SectionIntro
            eyebrow='Before the run'
            title={<>Clear answers<br />No hidden clicks</>}
            description='Know what the game, the wallet connection, and the future claim route do before you start'
            id='faq-title'
          />
          <a className='faq-section__game-link' href='#game'>
            Ready to run? <span>Open the game</span>
          </a>
        </div>

        <div className='faq-list'>
          {questions.map((item, index) => (
            <details key={item.question} name='meowave-faq' open={index === 0}>
              <summary>
                <span className='faq-list__index'>0{index + 1}</span>
                <span>{item.question}</span>
                <span className='faq-list__toggle' aria-hidden='true'><Icon name='chevron' /></span>
              </summary>
              <div className='faq-list__answer'><p>{item.answer}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
