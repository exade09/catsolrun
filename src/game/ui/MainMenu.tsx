import { useState, type FormEvent } from 'react'
import { audioSystem } from '../systems/audio'
import { useGameStore } from '../../stores/gameStore'
import { selectActiveRewardProfile, useRewardStore } from '../../stores/rewardStore'
import { getNicknameError, NICKNAME_MAX_LENGTH, normalizeNickname } from '../../leaderboard/types'
import { SoundIcon, SolMark } from './GameIcons'

export function MainMenu() {
  const startRun = useGameStore((state) => state.startRun)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const bestScore = useGameStore((state) => state.bestScore)
  const nickname = useGameStore((state) => state.nickname)
  const setNickname = useGameStore((state) => state.setNickname)
  const rewardProfile = useRewardStore(selectActiveRewardProfile)
  const [showInstructions, setShowInstructions] = useState(false)
  const [editingNickname, setEditingNickname] = useState(nickname.length === 0)
  const [nicknameDraft, setNicknameDraft] = useState(nickname)
  const [nicknameError, setNicknameError] = useState<string | null>(null)

  const start = (): void => {
    if (!nickname) {
      setEditingNickname(true)
      return
    }
    void audioSystem.unlock()
    audioSystem.play('ui')
    startRun()
  }

  const saveNicknameAndStart = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const error = getNicknameError(nicknameDraft)
    if (error) {
      setNicknameError(error)
      return
    }
    setNickname(normalizeNickname(nicknameDraft))
    setNicknameError(null)
    setEditingNickname(false)
    void audioSystem.unlock()
    audioSystem.play('ui')
    startRun()
  }

  if (editingNickname) {
    return (
      <div className="game-overlay nickname-overlay" role="dialog" aria-modal="true" aria-labelledby="nickname-title">
        <span className="menu-sol"><SolMark /></span>
        <p className="game-eyebrow">NEW RUNNER DETECTED</p>
        <h3 id="nickname-title">Choose your nickname</h3>
        <p className="nickname-copy">This name will identify your best run on the global leaderboard</p>
        <form className="nickname-form" onSubmit={saveNicknameAndStart}>
          <label htmlFor="runner-nickname">Runner nickname</label>
          <input
            id="runner-nickname"
            autoComplete="nickname"
            autoFocus
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder="MEOWRUNNER"
            spellCheck={false}
            value={nicknameDraft}
            aria-describedby="nickname-help"
            aria-invalid={nicknameError !== null}
            onChange={(event) => {
              setNicknameDraft(event.target.value)
              if (nicknameError) setNicknameError(null)
            }}
          />
          <p id="nickname-help" className={nicknameError ? 'nickname-help is-error' : 'nickname-help'}>
            {nicknameError ?? `2–${NICKNAME_MAX_LENGTH} characters · letters, numbers, spaces, _ or -`}
          </p>
          <div className="menu-actions">
            <button className="game-button game-button-primary" type="submit">Save &amp; Start Run</button>
            {nickname && (
              <button className="game-button game-button-quiet" type="button" onClick={() => setEditingNickname(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    )
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
        <p>Swipe on the game to move on touch devices. Follow warning arrows, chain SOL notes, and use signal power-ups</p>
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
        <p>Catch the rhythm. Outrun the fading signal</p>
      </div>
      {bestScore > 0 && <p className="menu-best"><span>PERSONAL BEST</span>{bestScore.toLocaleString('en-US')}</p>}
      <div className="menu-player">
        <span>RUNNING AS</span>
        <strong>{nickname}</strong>
        <button
          type="button"
          onClick={() => {
            setNicknameDraft(nickname)
            setEditingNickname(true)
          }}
        >
          Change
        </button>
      </div>
      <a
        className={`menu-reward-status${rewardProfile?.eligibility === 'eligible' ? ' is-eligible' : ''}`}
        href="#rewards"
      >
        <span>{rewardProfile?.eligibility === 'eligible' ? 'DEMO REWARDS ACTIVE' : 'TRIAL MODE'}</span>
        <strong>{rewardProfile?.eligibility === 'eligible' ? 'Eligible runs can add Demo SOL' : 'Play freely / no persistent run credit'}</strong>
      </a>
      <div className="menu-actions">
        <button className="game-button game-button-primary" type="button" onClick={start}>Start Run</button>
        <button className="game-button" type="button" onClick={() => setShowInstructions(true)}>How to Play</button>
        <button className="game-icon-button menu-audio" type="button" onClick={() => void audioSystem.toggle()} aria-label={audioEnabled ? 'Turn audio off' : 'Turn audio on'}>
          <SoundIcon muted={!audioEnabled} />
          <span>Audio {audioEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>
      <p className="collectible-notice">SOL notes score the run. Demo SOL rewards are simulated and never transfer cryptocurrency</p>
    </div>
  )
}
