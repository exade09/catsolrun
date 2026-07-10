interface IconProps {
  className?: string
}

export function ArrowIcon({ direction }: { direction: 'left' | 'right' | 'up' | 'down' }) {
  const rotations = { left: 0, up: 90, right: 180, down: 270 }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${rotations[direction]}deg)` }}>
      <path d="M14.8 5.2 8 12l6.8 6.8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3v14H7zm7 0h3v14h-3z" fill="currentColor" />
    </svg>
  )
}

export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function SolMark() {
  return (
    <svg viewBox="0 0 28 22" aria-hidden="true">
      <path d="M5 1h21l-4 4H1l4-4Z" fill="currentColor" />
      <path d="M5 9h21l-4 4H1l4-4Z" fill="currentColor" opacity=".8" />
      <path d="M5 17h21l-4 4H1l4-4Z" fill="currentColor" opacity=".58" />
    </svg>
  )
}
