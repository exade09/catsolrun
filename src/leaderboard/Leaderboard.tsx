import { useEffect, useState } from 'react'
import {
  localLeaderboardService,
  type LeaderboardEntry,
} from '../services/leaderboardService'
import './leaderboard.css'

export interface LeaderboardProps {
  walletAddress?: string | null
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function Leaderboard({ walletAddress = null }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const refresh = () => {
      void localLeaderboardService
        .list(walletAddress)
        .then((next) => {
          if (!active) return
          setEntries(next)
          setLoadError(null)
        })
        .catch(() => {
          if (active) setLoadError('The leaderboard could not be loaded. Your game is still available.')
        })
    }
    refresh()
    window.addEventListener('sol-cat:leaderboard-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      active = false
      window.removeEventListener('sol-cat:leaderboard-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [walletAddress])

  return (
    <div className="leaderboard-shell">
      <div className="leaderboard-note">
        <span>Demo board</span>
        Sample entries are fictional. Your best run is stored only in this browser.
      </div>
      {loadError && <p className="leaderboard-error" role="alert">{loadError}</p>}
      <div className="leaderboard-scroll" tabIndex={0} aria-label="Runner leaderboard table">
        <table className="leaderboard-table">
          <caption className="sr-only">Runner leaderboard with demo and local results</caption>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Distance</th>
              <th scope="col">SOL</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <tr key={entry.id} className={entry.source === 'local' ? 'is-local' : undefined}>
                  <td data-label="Rank"><span className="rank-index">{String(index + 1).padStart(2, '0')}</span></td>
                  <td data-label="Player">
                    <span className="player-name">{entry.player}</span>
                    {entry.source === 'local' && <span className="local-badge">Local</span>}
                  </td>
                  <td data-label="Distance">{numberFormatter.format(entry.distance)} m</td>
                  <td data-label="SOL">{numberFormatter.format(entry.sol)}</td>
                  <td data-label="Score">{numberFormatter.format(entry.score)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="leaderboard-empty" colSpan={5}>
                  {loadError ? 'Leaderboard unavailable.' : 'Loading leaderboard...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
