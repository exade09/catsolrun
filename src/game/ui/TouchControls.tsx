import { audioSystem } from '../systems/audio'
import { queueGameInput, type MovementInputCommand } from '../systems/useGameInput'
import { useGameStore } from '../../stores/gameStore'
import { ArrowIcon } from './GameIcons'

const send = (command: MovementInputCommand): void => {
  void audioSystem.unlock()
  queueGameInput(command, 400)
}

export function TouchControls() {
  const enabled = useGameStore((state) => state.touchControls)
  if (!enabled) return null

  return (
    <div className="touch-controls" aria-label="Touch controls">
      <div className="touch-cluster touch-lanes">
        <button type="button" data-touch-command onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); send('left') }} aria-label="Move left"><ArrowIcon direction="left" /></button>
        <button type="button" data-touch-command onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); send('right') }} aria-label="Move right"><ArrowIcon direction="right" /></button>
      </div>
      <div className="touch-cluster touch-actions">
        <button type="button" data-touch-command onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); send('jump') }} aria-label="Jump"><ArrowIcon direction="up" /><span>JUMP</span></button>
        <button type="button" data-touch-command onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); send('slide') }} aria-label="Slide"><ArrowIcon direction="down" /><span>SLIDE</span></button>
      </div>
    </div>
  )
}
