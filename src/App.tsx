import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { GameErrorBoundary } from './app/GameErrorBoundary'
import { Footer, Header, Hero, SocialLinks } from './components'
import { primeGameAudio } from './game/systems/audio'
import {
  FAQSection,
  FeaturesSection,
  GameSection,
  HowToPlaySection,
  LeaderboardSection,
  StorySection,
  TokenomicsSection,
} from './sections'
import { useGameStore, type GamePhase } from './stores/gameStore'
import './app/app.css'

const GameCanvas = lazy(() => import('./game/GameCanvas'))

const phaseLabels: Record<GamePhase, string> = {
  loading: 'Loading the route',
  menu: 'Ready when you are',
  countdown: 'Signal countdown',
  playing: 'Run in progress',
  paused: 'Run paused',
  gameover: 'Run complete',
  restarting: 'Resetting the route',
}

function App() {
  const phase = useGameStore((state) => state.phase)
  const startRun = useGameStore((state) => state.startRun)
  const resumeGame = useGameStore((state) => state.resumeGame)
  const pauseGame = useGameStore((state) => state.pauseGame)
  const setReducedMotion = useGameStore((state) => state.setReducedMotion)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const nickname = useGameStore((state) => state.nickname)
  const pendingPlayRef = useRef(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) setReducedMotion(true)
  }, [setReducedMotion])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) pauseGame()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [pauseGame])

  useEffect(() => {
    if (phase !== 'menu' || !pendingPlayRef.current) return
    pendingPlayRef.current = false
    if (nickname) startRun()
  }, [nickname, phase, startRun])

  const handlePlay = useCallback(() => {
    void primeGameAudio()
    window.requestAnimationFrame(() => {
      document.querySelector('#game')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
    if (phase === 'loading') pendingPlayRef.current = true
    else if (phase === 'paused') resumeGame()
    else if (phase === 'menu' && nickname) startRun()
    else if (phase === 'gameover') startRun()
  }, [nickname, phase, reducedMotion, resumeGame, startRun])

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header onPlay={handlePlay} socialLinks={<SocialLinks compact />} />
      <main className="site-main" id="main-content" tabIndex={-1}>
        <Hero onPlay={handlePlay} />
        <GameSection status={phaseLabels[phase]}>
          <GameErrorBoundary>
            <Suspense
              fallback={(
                <div className="game-module-loading" role="status" aria-live="polite">
                  <span className="game-module-loading__signal" aria-hidden="true" />
                  <p>Loading the 3D runner...</p>
                </div>
              )}
            >
              <GameCanvas />
            </Suspense>
          </GameErrorBoundary>
        </GameSection>
        <LeaderboardSection />
        <StorySection />
        <HowToPlaySection />
        <FeaturesSection />
        <TokenomicsSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}

export default App
