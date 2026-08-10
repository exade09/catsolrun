import { useEffect, useState } from 'react'
import { audioSystem } from '../systems/audio'
import { SIMULATED_LAMPORTS_PER_SOL } from '../../rewards/rewardRules'
import { useGameStore } from '../../stores/gameStore'
import { useRewardStore } from '../../stores/rewardStore'
import { submitRun } from '../../leaderboard/leaderboardApi'
import { SolMark } from './GameIcons'

type RewardRunMessage = { tone: 'earned' | 'trial'; text: string }

const rewardRunMessages = new Map<string, RewardRunMessage>()

const formatDemoSol = (lamports: number): string =>
  (lamports / SIMULATED_LAMPORTS_PER_SOL).toFixed(4)

export function GameOverScreen() {
  const finalStats = useGameStore((state) => state.finalStats)
  const bestScore = useGameStore((state) => state.bestScore)
  const restartRun = useGameStore((state) => state.restartRun)
  const returnToMenu = useGameStore((state) => state.returnToMenu)
  const playerId = useGameStore((state) => state.playerId)
  const nickname = useGameStore((state) => state.nickname)
  const [shareStatus, setShareStatus] = useState('Share Score')
  const [syncStatus, setSyncStatus] = useState<'saving' | 'saved' | 'failed'>('saving')
  const [rewardMessage, setRewardMessage] = useState<RewardRunMessage>(() =>
    rewardRunMessages.get(finalStats.runId) ?? {
      tone: 'trial',
      text: 'Checking the local Demo SOL simulation',
    },
  )

  useEffect(() => {
    let active = true
    setSyncStatus('saving')
    void submitRun({
      playerId,
      nickname,
      distance: Math.floor(finalStats.distance),
      sol: finalStats.sol,
    }).then(() => {
      if (active) setSyncStatus('saved')
    }).catch(() => {
      if (active) setSyncStatus('failed')
    })
    return () => {
      active = false
    }
  }, [finalStats.distance, finalStats.sol, nickname, playerId])

  useEffect(() => {
    const cachedMessage = rewardRunMessages.get(finalStats.runId)
    if (cachedMessage) {
      setRewardMessage(cachedMessage)
      return
    }

    const result = useRewardStore.getState().creditCompletedRun({
      runId: finalStats.runId,
      rewardAddress: finalStats.rewardAddress,
      activeSeconds: Math.floor(finalStats.elapsedTime),
      rawPickups: finalStats.rawSol,
      actions: finalStats.actions,
    })
    let nextMessage: RewardRunMessage
    if (result.credited) {
      nextMessage = {
        tone: 'earned',
        text: `+${formatDemoSol(result.lamports)} Demo SOL added to the simulated balance`,
      }
    } else if (result.reason === 'trial') {
      nextMessage = { tone: 'trial', text: 'Trial run: SOL notes counted for score only' }
    } else if (result.reason === 'not-meaningful') {
      nextMessage = { tone: 'trial', text: 'Run too short for active-time credit. Keep moving and use the controls' }
    } else if (result.reason === 'daily-cap') {
      nextMessage = { tone: 'earned', text: 'Active time recorded. The daily Demo SOL cap is already reached' }
    } else if (result.reason === 'zero-credit') {
      nextMessage = { tone: 'earned', text: 'Active time recorded. Collect a reward note to add Demo SOL' }
    } else {
      nextMessage = { tone: 'earned', text: 'This run is already recorded in the Demo SOL simulation' }
    }
    rewardRunMessages.set(finalStats.runId, nextMessage)
    setRewardMessage(nextMessage)
  }, [finalStats.actions, finalStats.elapsedTime, finalStats.rawSol, finalStats.rewardAddress, finalStats.runId])

  const retry = (): void => {
    audioSystem.play('ui')
    restartRun()
  }

  const share = async (): Promise<void> => {
    const text = `I scored ${finalStats.score.toLocaleString('en-US')} in MEOWAVE and collected ${finalStats.sol} SOL notes`
    try {
      if (navigator.share) await navigator.share({ title: 'MEOWAVE', text, url: window.location.href })
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`)
        setShareStatus('Score Copied')
      }
    } catch {
      setShareStatus('Share Cancelled')
    }
  }

  return (
    <div className="game-overlay gameover-overlay" role="dialog" aria-modal="true" aria-labelledby="gameover-heading">
      <p className="game-eyebrow">SIGNAL LOST</p>
      <h3 id="gameover-heading">Run Complete</h3>
      <strong className="final-score">{finalStats.score.toLocaleString('en-US')}</strong>
      <span className="final-score-label">FINAL SCORE</span>
      <div className="final-stats">
        <span><b>{Math.floor(finalStats.distance)} m</b><small>Distance</small></span>
        <span><b className="sol-value"><SolMark />{finalStats.sol}</b><small>SOL Notes</small></span>
        <span><b>{finalStats.bestCombo}</b><small>Best Combo</small></span>
        <span><b>{bestScore.toLocaleString('en-US')}</b><small>Best Score</small></span>
      </div>
      <p className={`leaderboard-sync is-${syncStatus}`}>
        {syncStatus === 'saving' && 'Sending run to the leaderboard'}
        {syncStatus === 'saved' && `Best run synced for ${nickname}`}
        {syncStatus === 'failed' && 'Run saved locally. Leaderboard sync will return when the database is online'}
      </p>
      <p className={`reward-run-sync is-${rewardMessage.tone}`}>{rewardMessage.text}</p>
      <div className="menu-actions gameover-actions">
        <button className="game-button game-button-primary" type="button" onClick={retry}>Retry</button>
        <button className="game-button" type="button" onClick={() => void share()}>{shareStatus}</button>
        <button className="game-button game-button-quiet" type="button" onClick={returnToMenu}>Return to Menu</button>
      </div>
      <p className="collectible-notice">Demo rewards are simulated. No real SOL or transaction is created</p>
    </div>
  )
}
