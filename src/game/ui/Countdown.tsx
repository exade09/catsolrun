import { useEffect } from 'react'
import { audioSystem } from '../systems/audio'
import { useGameStore } from '../../stores/gameStore'

export function Countdown() {
  const phase = useGameStore((state) => state.phase)
  const countdown = useGameStore((state) => state.countdown)
  const setCountdown = useGameStore((state) => state.setCountdown)
  const finishCountdown = useGameStore((state) => state.finishCountdown)
  const finishRestart = useGameStore((state) => state.finishRestart)
  const returnToMenu = useGameStore((state) => state.returnToMenu)

  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'restarting') return undefined
    const abortCountdown = (): void => {
      const currentPhase = useGameStore.getState().phase
      if (currentPhase !== 'countdown' && currentPhase !== 'restarting') return
      audioSystem.stopMusic()
      returnToMenu()
    }
    const handleVisibility = (): void => {
      if (document.visibilityState === 'hidden') abortCountdown()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', abortCountdown)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', abortCountdown)
    }
  }, [phase, returnToMenu])

  useEffect(() => {
    if (phase === 'restarting') {
      const timer = window.setTimeout(finishRestart, 260)
      return () => window.clearTimeout(timer)
    }
    if (phase !== 'countdown') return undefined
    audioSystem.play('countdown')
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'hidden') {
        returnToMenu()
        return
      }
      if (countdown > 1) setCountdown(countdown - 1)
      else {
        finishCountdown()
        audioSystem.play('start')
      }
    }, 820)
    return () => window.clearTimeout(timer)
  }, [countdown, finishCountdown, finishRestart, phase, returnToMenu, setCountdown])

  if (phase === 'restarting') {
    return <div className="game-overlay countdown-overlay" role="status"><strong className="restart-mark">RESET</strong></div>
  }

  return (
    <div className="game-overlay countdown-overlay" role="status" aria-live="assertive">
      <p>READY ON THE BEAT</p>
      <strong key={countdown}>{countdown}</strong>
    </div>
  )
}
