import type { ReactNode } from 'react'
import { SectionIntro } from '../components'

export interface GameSectionProps {
  children: ReactNode
  status?: string
  className?: string
}

export function GameSection({ children, status = 'Ready when you are', className = '' }: GameSectionProps) {
  return (
    <section className={('game-section section-space ' + className).trim()} id='game' aria-labelledby='game-title'>
      <div className='section-shell'>
        <div className='game-section__heading'>
          <SectionIntro
            eyebrow='The run'
            title={<>Find your line<br />Keep the signal</>}
            description='Three lanes, one clean rhythm, and a route that gets sharper the longer you survive'
            id='game-title'
          />
          <div className='game-section__status' aria-live='polite'>
            <span aria-hidden='true' />
            {status}
          </div>
        </div>

        <div className='game-stage-shell'>
          <div className='game-stage-shell__rail game-stage-shell__rail--left' aria-hidden='true'>
            <span>RUN / 001</span>
            <span>REAL-TIME 3D</span>
          </div>
          <div className='game-stage-shell__viewport'>{children}</div>
          <div className='game-stage-shell__rail game-stage-shell__rail--right' aria-hidden='true'>
            <span>LANE 03</span>
            <span>SIGNAL ACTIVE</span>
          </div>
        </div>

        <div className='game-section__notice'>
          <span>Runner mechanics</span>
          <p>SOL coins drive score and leaderboard results. Phantom links a public wallet identity without interrupting the run</p>
        </div>
      </div>
    </section>
  )
}
