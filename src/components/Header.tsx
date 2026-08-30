import { useEffect, useRef, useState, type ReactNode } from 'react'

import { BrandMark } from './BrandMark'
import { Icon } from './Icon'
import { WalletButton } from './WalletButton'

export interface HeaderProps {
  onPlay?: () => void
  socialLinks?: ReactNode
}

const navigation = [
  { label: 'Game', href: '#game' },
  { label: 'Wallet', href: '#rewards' },
  { label: 'Leaderboard', href: '#leaderboard' },
  { label: 'Tokenomics', href: '#tokenomics' },
]

export function Header({ onPlay, socialLinks }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className='site-header'>
      <a className='site-header__brand' href='#top' onClick={closeMenu}>
        <BrandMark />
      </a>

      <button
        ref={menuButtonRef}
        className='site-header__menu-button'
        type='button'
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-controls='site-navigation'
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>

      <div className={`site-header__panel${menuOpen ? ' is-open' : ''}`} id='site-navigation'>
        <nav className='site-header__nav' aria-label='Primary navigation'>
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className='site-header__actions'>
          {socialLinks}
          <WalletButton />
          <a
            className='button button--small button--primary'
            href='#game'
            onClick={() => {
              closeMenu()
              onPlay?.()
            }}
          >
            <Icon name='play' />
            Play Now
          </a>
        </div>
      </div>
    </header>
  )
}
