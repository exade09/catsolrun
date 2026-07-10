import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";

export interface HeaderProps {
  onPlay?: () => void;
  onConnect?: () => void;
  walletLabel?: string;
  isWalletConnected?: boolean;
  isWalletConnecting?: boolean;
  isWalletDisconnecting?: boolean;
}

const navigation = [
  { label: "Game", href: "#game" },
  { label: "Story", href: "#story" },
  { label: "How to Play", href: "#how-to-play" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Wallet", href: "#wallet" },
];

export function Header({
  onPlay,
  onConnect,
  walletLabel,
  isWalletConnected = false,
  isWalletConnecting = false,
  isWalletDisconnecting = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const walletBusy = isWalletConnecting || isWalletDisconnecting;

  return (
    <header className="site-header">
      <a className="site-header__brand" href="#top" onClick={closeMenu}>
        <BrandMark />
      </a>

      <button
        ref={menuButtonRef}
        className="site-header__menu-button"
        type="button"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls="site-navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>

      <div className={`site-header__panel${menuOpen ? " is-open" : ""}`} id="site-navigation">
        <nav className="site-header__nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <a
            className="button button--small button--ghost"
            href="#game"
            onClick={() => {
              closeMenu();
              onPlay?.();
            }}
          >
            <Icon name="play" />
            Play Now
          </a>
          <button
            className={`button button--small ${isWalletConnected ? "button--connected" : "button--primary"}`}
            type="button"
            onClick={() => {
              closeMenu();
              onConnect?.();
            }}
            disabled={walletBusy}
            aria-label={isWalletConnected ? "Manage connected Solana wallet" : "Connect Solana wallet"}
          >
            <Icon name="wallet" />
            {isWalletDisconnecting
              ? "Disconnecting..."
              : isWalletConnecting
              ? "Connecting..."
              : isWalletConnected
                ? walletLabel ?? "Connected"
                : "Connect Wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}
