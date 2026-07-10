import { useGameStore } from '../../stores/gameStore'
import { Countdown } from './Countdown'
import { GameHUD } from './GameHUD'
import { GameOverScreen } from './GameOverScreen'
import { LoadingScreen } from './LoadingScreen'
import { MainMenu } from './MainMenu'
import { PauseMenu } from './PauseMenu'
import { TouchControls } from './TouchControls'

export function GameOverlay() {
  const phase = useGameStore((state) => state.phase)

  return (
    <div className="game-ui-layer">
      {phase === 'loading' && <LoadingScreen />}
      {phase === 'menu' && <MainMenu />}
      {(phase === 'countdown' || phase === 'restarting') && <Countdown />}
      {phase === 'playing' && <><GameHUD /><TouchControls /></>}
      {phase === 'paused' && <PauseMenu />}
      {phase === 'gameover' && <GameOverScreen />}
    </div>
  )
}
