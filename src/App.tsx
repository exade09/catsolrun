import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { GameErrorBoundary } from './app/GameErrorBoundary'
import { Footer, Header, Hero } from './components'
import { primeGameAudio } from './game/systems/audio'
import { Leaderboard } from './leaderboard'
import {
  FAQSection,
  FeaturesSection,
  GameSection,
  HowToPlaySection,
  LeaderboardSection,
  StorySection,
  WalletSection,
} from './sections'
import { saveLocalLeaderboardResult } from './services'
import { useGameStore, type GamePhase } from './stores/gameStore'
import { shortAddress, useWalletStatus } from './wallet'
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
  const { connected, connecting, disconnecting, publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const { error: walletError, clearError, reportError } = useWalletStatus()
  const phase = useGameStore((state) => state.phase)
  const finalStats = useGameStore((state) => state.finalStats)
  const startRun = useGameStore((state) => state.startRun)
  const resumeGame = useGameStore((state) => state.resumeGame)
  const pauseGame = useGameStore((state) => state.pauseGame)
  const setReducedMotion = useGameStore((state) => state.setReducedMotion)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const savedRunRef = useRef('')
  const pendingPlayRef = useRef(false)
  const address = publicKey?.toBase58() ?? null

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
    if (phase !== 'gameover' || finalStats.elapsedTime <= 0) return
    const runId = [
      finalStats.score,
      finalStats.distance.toFixed(2),
      finalStats.sol,
      finalStats.elapsedTime.toFixed(2),
    ].join(':')
    if (savedRunRef.current === runId) return
    savedRunRef.current = runId
    saveLocalLeaderboardResult(
      {
        score: finalStats.score,
        distance: Math.floor(finalStats.distance),
        sol: finalStats.sol,
        bestCombo: finalStats.bestCombo,
      },
      address,
    )
  }, [address, finalStats, phase])

  useEffect(() => {
    if (phase !== 'menu' || !pendingPlayRef.current) return
    pendingPlayRef.current = false
    startRun()
  }, [phase, startRun])

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
    else if (phase === 'menu' || phase === 'gameover') startRun()
  }, [phase, reducedMotion, resumeGame, startRun])

  const openWallet = useCallback(() => {
    clearError()
    setVisible(true)
  }, [clearError, setVisible])

  const disconnectWallet = useCallback(async () => {
    clearError()
    try {
      await disconnect()
    } catch {
      reportError('The wallet could not disconnect. Check the wallet extension and try again.')
    }
  }, [clearError, disconnect, reportError])

  const walletLabel = address ? shortAddress(address) : undefined
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header
        onPlay={handlePlay}
        onConnect={openWallet}
        walletLabel={walletLabel}
        isWalletConnected={connected}
        isWalletConnecting={connecting}
        isWalletDisconnecting={disconnecting}
      />
      <main className="site-main" id="main-content" tabIndex={-1}>
        <Hero
          onPlay={handlePlay}
          onConnect={openWallet}
          walletLabel={walletLabel}
          isWalletConnected={connected}
          isWalletConnecting={connecting}
          isWalletDisconnecting={disconnecting}
        />
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
        <StorySection />
        <HowToPlaySection />
        <FeaturesSection />
        <LeaderboardSection>
          <Leaderboard walletAddress={address} />
        </LeaderboardSection>
        <WalletSection
          connected={connected}
          connecting={connecting}
          disconnecting={disconnecting}
          publicKey={walletLabel}
          error={walletError}
          onConnect={openWallet}
          onDisconnect={() => void disconnectWallet()}
        />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}

export default App
