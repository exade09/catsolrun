import { useCallback, useEffect, useState } from 'react'
import { Icon, SectionIntro } from '../components'
import { fetchLeaderboard, LEADERBOARD_UPDATED_EVENT } from '../leaderboard/leaderboardApi'
import type { LeaderboardEntry, LeaderboardResponse } from '../leaderboard/types'
import { useGameStore } from '../stores/gameStore'

const EMPTY_LEADERBOARD: LeaderboardResponse = { entries: [], currentEntry: null }

function formatDistance(distance: number): string {
  return `${Math.max(0, Math.floor(distance)).toLocaleString('en-US')} m`
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <tr className={entry.isCurrent ? 'is-current' : undefined}>
      <td className="leaderboard-rank"><span><b>{String(entry.rank).padStart(2, '0')}</b></span></td>
      <th scope="row">
        <strong>{entry.nickname}</strong>
        {entry.isCurrent && <small>YOU</small>}
      </th>
      <td className="leaderboard-distance">{formatDistance(entry.distance)}</td>
      <td className="leaderboard-sol"><Icon name="coin" />{entry.sol.toLocaleString('en-US')}</td>
    </tr>
  )
}

export function LeaderboardSection() {
  const playerId = useGameStore((state) => state.playerId)
  const nickname = useGameStore((state) => state.nickname)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse>(EMPTY_LEADERBOARD)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const loadLeaderboard = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading')
    try {
      const result = await fetchLeaderboard(playerId, signal)
      setLeaderboard(result)
      setStatus('ready')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('error')
    }
  }, [playerId])

  useEffect(() => {
    const controller = new AbortController()
    void loadLeaderboard(controller.signal)
    const refresh = () => void loadLeaderboard()
    window.addEventListener(LEADERBOARD_UPDATED_EVENT, refresh)
    return () => {
      controller.abort()
      window.removeEventListener(LEADERBOARD_UPDATED_EVENT, refresh)
    }
  }, [loadLeaderboard])

  const currentOutsideTop = leaderboard.currentEntry && !leaderboard.entries.some((entry) => entry.isCurrent)

  return (
    <section className="leaderboard-section section-space" id="leaderboard" aria-labelledby="leaderboard-title">
      <div className="leaderboard-section__grid" aria-hidden="true" />
      <div className="section-shell leaderboard-section__layout">
        <div className="leaderboard-section__copy">
          <SectionIntro
            eyebrow="Global leaderboard"
            title={<>Twenty runners<br />One clean line</>}
            description="The fastest signals are ranked by their best distance. Every finished run also records the in-game SOL collected along the way"
            id="leaderboard-title"
          />
          <div className="leaderboard-profile">
            <span>Your signal</span>
            <strong>{nickname || 'Choose a nickname in the game'}</strong>
            <a href="#game">{nickname ? 'Start another run' : 'Create runner profile'} <Icon name="arrow-up" /></a>
          </div>
        </div>

        <div className="leaderboard-board" aria-live="polite" aria-busy={status === 'loading'}>
          <header className="leaderboard-board__header">
            <div>
              <span>LIVE / TOP 20</span>
              <strong>Distance ranking</strong>
            </div>
            <button type="button" onClick={() => void loadLeaderboard()} disabled={status === 'loading'}>
              {status === 'loading' ? 'Syncing' : 'Refresh'}
            </button>
          </header>

          {status === 'error' && (
            <div className="leaderboard-state">
              <Icon name="pulse" />
              <strong>Leaderboard signal is warming up</strong>
              <p>The game remains playable. Rankings will appear as soon as the Neon database is connected</p>
              <button className="button button--ghost" type="button" onClick={() => void loadLeaderboard()}>Try again</button>
            </div>
          )}

          {status === 'ready' && leaderboard.entries.length === 0 && (
            <div className="leaderboard-state">
              <Icon name="speed" />
              <strong>The first line is still open</strong>
              <p>Finish a run to become the first signal on the board</p>
              <a className="button button--primary" href="#game">Start a run</a>
            </div>
          )}

          {(status === 'loading' || (status === 'ready' && leaderboard.entries.length > 0)) && (
            <div className="leaderboard-table-wrap">
              {status === 'loading' ? (
                <div className="leaderboard-loading" aria-label="Loading leaderboard">
                  {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
                </div>
              ) : (
                <table>
                  <caption className="sr-only">Top 20 Meowave runners ranked by best distance</caption>
                  <thead>
                    <tr><th>Rank</th><th>Runner</th><th>Distance</th><th>In-game SOL</th></tr>
                  </thead>
                  <tbody>{leaderboard.entries.map((entry) => <LeaderboardRow key={`${entry.rank}-${entry.nickname}`} entry={entry} />)}</tbody>
                </table>
              )}
            </div>
          )}

          {status === 'ready' && currentOutsideTop && (
            <div className="leaderboard-current">
              <span>Your position</span>
              <strong>#{leaderboard.currentEntry?.rank}</strong>
              <b>{leaderboard.currentEntry?.nickname}</b>
              <em>{formatDistance(leaderboard.currentEntry?.distance ?? 0)}</em>
            </div>
          )}
          <footer>One best distance per runner profile · Updated after every completed run</footer>
        </div>
      </div>
    </section>
  )
}
