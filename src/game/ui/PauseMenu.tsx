import { audioSystem } from '../systems/audio'
import { useGameStore } from '../../stores/gameStore'

export function PauseMenu() {
  const resumeGame = useGameStore((state) => state.resumeGame)
  const returnToMenu = useGameStore((state) => state.returnToMenu)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const toggleReducedMotion = useGameStore((state) => state.toggleReducedMotion)

  const resume = (): void => {
    void audioSystem.unlock()
    audioSystem.play('ui')
    resumeGame()
  }

  return (
    <div className="game-overlay compact-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-heading">
      <p className="game-eyebrow">SIGNAL HELD</p>
      <h3 id="pause-heading">Run Paused</h3>
      <div className="menu-actions">
        <button className="game-button game-button-primary" type="button" onClick={resume}>Resume</button>
        <button className="game-button" type="button" onClick={toggleReducedMotion}>Reduced Motion: {reducedMotion ? 'On' : 'Off'}</button>
        <button className="game-button game-button-quiet" type="button" onClick={returnToMenu}>Return to Menu</button>
      </div>
      <p>Press P or Escape to resume</p>
    </div>
  )
}
