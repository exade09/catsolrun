import { useState } from 'react'
import { audioSystem } from '../systems/audio'
import { useGameStore } from '../../stores/gameStore'
import { SoundIcon, SolMark } from './GameIcons'

export function MainMenu() {
  const startRun = useGameStore((state) => state.startRun)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const bestScore = useGameStore((state) => state.bestScore)
  const [showInstructions, setShowInstructions] = useState(false)

  const start = (): void => {
    void audioSystem.unlock()
    audioSystem.play('ui')
    startRun()
  }

  if (showInstructions) {
    return (
      <div className="game-overlay menu-overlay instruction-panel" role="dialog" aria-modal="false" aria-labelledby="quick-guide-title">
        <p className="game-eyebrow">RUNNER FIELD GUIDE</p>
        <h3 id="quick-guide-title">Stay with the rhythm</h3>
        <div className="quick-guide-grid">
          <span><kbd>A</kbd><kbd>D</kbd><b>Switch lanes</b></span>
          <span><kbd>W</kbd><kbd>Space</kbd><b>Jump</b></span>
          <span><kbd>S</kbd><b>Slide</b></span>
          <span><kbd>P</kbd><b>Pause</b></span>
        </div>
        <p>Swipe on the game to move on touch devices. Follow warning arrows, chain SOL pickups, and use signal power-ups.</p>
        <button className="game-button game-button-primary" type="button" onClick={() => setShowInstructions(false)}>Back to menu</button>
      </div>
    )
  }

  return (
    <div className="game-overlay menu-overlay">
      <div className="menu-lockup">
        <span className="menu-sol"><SolMark /></span>
        <p className="game-eyebrow">THE SIGNAL IS LIVE</p>
        <h2>MEOWAVE</h2>
        <p>Catch the rhythm. Outrun the fading signal.</p>
      </div>
      {bestScore > 0 && <p className="menu-best"><span>PERSONAL BEST</span>{bestScore.toLocaleString('en-US')}</p>}
      <div className="menu-actions">
        <button className="game-button game-button-primary" type="button" onClick={start}>Start Run</button>
        <button className="game-button" type="button" onClick={() => setShowInstructions(true)}>How to Play</button>
        <button className="game-icon-button menu-audio" type="button" onClick={() => void audioSystem.toggle()} aria-label={audioEnabled ? 'Turn audio off' : 'Turn audio on'}>
          <SoundIcon muted={!audioEnabled} />
          <span>Audio {audioEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>
      <p className="collectible-notice">In-game SOL is a gameplay collectible and does not represent real cryptocurrency.</p>
    </div>
  )
}
