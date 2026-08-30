import { useEffect, useState } from 'react'
import { POWER_UP_LABELS } from '../config/gameConfig'
import { audioSystem } from '../systems/audio'
import { useGameStore } from '../../stores/gameStore'
import { PauseIcon, SolMark, SoundIcon } from './GameIcons'

export function GameHUD() {
  const score = useGameStore((state) => state.score)
  const distance = useGameStore((state) => state.distance)
  const sol = useGameStore((state) => state.sol)
  const combo = useGameStore((state) => state.combo)
  const speed = useGameStore((state) => state.speed)
  const activePowerUp = useGameStore((state) => state.activePowerUp)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const pauseGame = useGameStore((state) => state.pauseGame)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!activePowerUp) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [activePowerUp])

  const remaining = activePowerUp ? Math.max(0, (activePowerUp.expiresAt - now) / 1000) : 0
  const effectiveSpeed = activePowerUp?.type === 'slowTime' && remaining > 0 ? speed * 0.72 : speed

  return (
    <div className="game-hud" aria-label="Current run statistics">
      <div className="hud-score">
        <span>SCORE</span>
        <strong>{Math.floor(score).toLocaleString('en-US')}</strong>
      </div>
      <div className="hud-stats">
        <span><b>{Math.floor(distance)} m</b><small>DISTANCE</small></span>
        <span className="hud-sol"><b><SolMark />{sol}</b><small>SOL COINS</small></span>
        <span><b>{effectiveSpeed.toFixed(1)}</b><small>SPEED</small></span>
      </div>
      <div className={`hud-combo ${combo > 1 ? 'is-active' : ''}`}>
        <span>COMBO</span><strong>x{Math.max(1, 1 + Math.floor(Math.max(0, combo - 1) / 5) * 0.25).toFixed(2)}</strong>
      </div>
      <div className="hud-tools">
        <button type="button" className="game-icon-button" onClick={() => void audioSystem.toggle()} aria-label={audioEnabled ? 'Turn audio off' : 'Turn audio on'}>
          <SoundIcon muted={!audioEnabled} />
        </button>
        <button type="button" className="game-icon-button" onClick={pauseGame} aria-label="Pause run"><PauseIcon /></button>
      </div>
      {activePowerUp && remaining > 0 && (
        <div className={`powerup-timer powerup-${activePowerUp.type}`} role="status">
          <span>{POWER_UP_LABELS[activePowerUp.type]}</span>
          <div><i style={{ width: `${(remaining / activePowerUp.duration) * 100}%` }} /></div>
          <b>{remaining.toFixed(1)}s</b>
        </div>
      )}
    </div>
  )
}
