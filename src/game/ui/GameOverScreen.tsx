import { useEffect, useState } from 'react'

import { submitRun } from '../../leaderboard/leaderboardApi'
import { useGameStore } from '../../stores/gameStore'
import { useWallet } from '../../wallet/WalletProvider'
import { shortenWalletAddress } from '../../wallet/phantom'
import { audioSystem } from '../systems/audio'
import { SolMark } from './GameIcons'

export function GameOverScreen() {
  const finalStats = useGameStore((state) => state.finalStats)
  const bestScore = useGameStore((state) => state.bestScore)
  const restartRun = useGameStore((state) => state.restartRun)
  const returnToMenu = useGameStore((state) => state.returnToMenu)
  const playerId = useGameStore((state) => state.playerId)
  const nickname = useGameStore((state) => state.nickname)
  const { address, verified } = useWallet()
  const [shareStatus, setShareStatus] = useState('Share Score')
  const [syncStatus, setSyncStatus] = useState<'saving' | 'saved' | 'failed'>('saving')

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

  const retry = (): void => {
    audioSystem.play('ui')
    restartRun()
  }

  const share = async (): Promise<void> => {
    const text = 'I scored ' + finalStats.score.toLocaleString('en-US')
      + ' in MEOWAVE and collected ' + finalStats.sol + ' SOL coins'
    try {
      if (navigator.share) await navigator.share({ title: 'MEOWAVE', text, url: window.location.href })
      else {
        await navigator.clipboard.writeText(text + ' ' + window.location.href)
        setShareStatus('Score Copied')
      }
    } catch {
      setShareStatus('Share Cancelled')
    }
  }

  return (
    <div className='game-overlay gameover-overlay' role='dialog' aria-modal='true' aria-labelledby='gameover-heading'>
      <p className='game-eyebrow'>SIGNAL LOST</p>
      <h3 id='gameover-heading'>Run Complete</h3>
      <strong className='final-score'>{finalStats.score.toLocaleString('en-US')}</strong>
      <span className='final-score-label'>FINAL SCORE</span>
      <div className='final-stats'>
        <span><b>{Math.floor(finalStats.distance)} m</b><small>Distance</small></span>
        <span><b className='sol-value'><SolMark />{finalStats.sol}</b><small>SOL Coins</small></span>
        <span><b>{finalStats.bestCombo}</b><small>Best Combo</small></span>
        <span><b>{bestScore.toLocaleString('en-US')}</b><small>Best Score</small></span>
      </div>
      <p className={'leaderboard-sync is-' + syncStatus}>
        {syncStatus === 'saving' && 'Sending run to the leaderboard'}
        {syncStatus === 'saved' && ('Best run synced for ' + nickname)}
        {syncStatus === 'failed' && 'Run saved locally. Leaderboard sync will return when the database is online'}
      </p>
      <p className={'reward-run-sync is-' + (verified ? 'earned' : 'trial')}>
        {address
          ? (verified ? 'Verified runner / ' : 'Connected wallet / ') + shortenWalletAddress(address)
          : 'Connect Phantom in the Wallet Hub to link your public identity'}
      </p>
      <div className='menu-actions gameover-actions'>
        <button className='game-button game-button-primary' type='button' onClick={retry}>Retry</button>
        <button className='game-button' type='button' onClick={() => void share()}>{shareStatus}</button>
        <button className='game-button game-button-quiet' type='button' onClick={returnToMenu}>Return to Menu</button>
      </div>
      <p className='collectible-notice'>A completed run never creates a transaction or moves wallet funds</p>
    </div>
  )
}
