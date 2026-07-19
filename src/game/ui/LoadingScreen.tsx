import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 14))
    }, 70)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="game-overlay game-loading" role="status" aria-live="polite">
      <div className="loading-cat-mark" aria-hidden="true">
        <span />
        <span />
      </div>
      <p className="game-eyebrow">TUNING THE SIGNAL</p>
      <strong>{progress}%</strong>
      <div className="loading-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>Building the dataway</p>
    </div>
  )
}
