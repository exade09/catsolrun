import type { ReactNode } from "react";
import { Icon, SectionIntro } from "../components";

export interface WalletSectionProps {
  children?: ReactNode;
  connected?: boolean;
  connecting?: boolean;
  disconnecting?: boolean;
  publicKey?: string;
  error?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function WalletSection({
  children,
  connected = false,
  connecting = false,
  disconnecting = false,
  publicKey,
  error,
  onConnect,
  onDisconnect,
}: WalletSectionProps) {
  const walletBusy = connecting || disconnecting;

  return (
    <section className="wallet-section section-space" id="wallet" aria-labelledby="wallet-title">
      <div className="section-shell wallet-section__layout">
        <div className="wallet-section__copy">
          <SectionIntro
            eyebrow="Player identity"
            title={<>Bring your name.<br />Leave your keys safe.</>}
            description="A wallet can identify your local score. It never changes how the game plays."
            id="wallet-title"
          />
          <ul className="wallet-section__rules">
            <li><Icon name="shield" /><span><strong>No private keys</strong>Only a public address is read.</span></li>
            <li><Icon name="pulse" /><span><strong>No automatic actions</strong>Nothing is signed or sent.</span></li>
            <li><Icon name="play" /><span><strong>Always optional</strong>The full game works without a wallet.</span></li>
          </ul>
        </div>

        <div className="wallet-console" aria-busy={walletBusy}>
          <div className="wallet-console__topline">
            <span>Identity terminal</span>
            <span className={connected ? "is-online" : ""}>
              <i aria-hidden="true" /> {disconnecting ? "Disconnecting" : connected ? "Connected" : "Standby"}
            </span>
          </div>

          <div className="wallet-console__symbol" aria-hidden="true">
            <Icon name="wallet" />
            <span /><span />
          </div>

          <div className="wallet-console__status" aria-live="polite">
            <span>Player address</span>
            <strong>{connected ? publicKey ?? "Wallet connected" : "Not connected"}</strong>
          </div>

          {children ?? (
            <button
              className={`button button--wide ${connected ? "button--ghost" : "button--primary"}`}
              type="button"
              data-wallet-connect={connected ? undefined : "true"}
              onClick={connected ? onDisconnect : onConnect}
              disabled={walletBusy}
            >
              <Icon name="wallet" />
              {disconnecting
                ? "Disconnecting..."
                : connecting
                  ? "Connecting..."
                  : connected
                    ? "Disconnect Wallet"
                    : "Connect Wallet"}
            </button>
          )}

          {error && <p className="wallet-console__error" role="alert">{error}</p>}
          <p className="wallet-console__notice">
            {connected
              ? "Wallet connected for player identity. No transaction is required to play."
              : "Wallet connection is optional. No transaction is required to play."}
          </p>
        </div>
      </div>
    </section>
  );
}
