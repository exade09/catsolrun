import type { ReactNode } from "react";
import { SectionIntro } from "../components";

export interface LeaderboardSectionProps {
  children: ReactNode;
  dataLabel?: string;
  note?: string;
}

export function LeaderboardSection({
  children,
  dataLabel = "Demo + local records",
  note = "Your best run stays on this device.",
}: LeaderboardSectionProps) {
  return (
    <section className="leaderboard-section section-space" id="leaderboard" aria-labelledby="leaderboard-title">
      <div className="section-shell">
        <div className="leaderboard-section__heading">
          <SectionIntro
            eyebrow="Signal board"
            title={<>How far can the<br />frequency carry?</>}
            description="Compare a local best against a transparent set of demo runners."
            id="leaderboard-title"
          />
          <div className="leaderboard-section__meta">
            <span>{dataLabel}</span>
            <p>{note}</p>
          </div>
        </div>
        <div className="leaderboard-section__content">{children}</div>
        <p className="leaderboard-section__disclaimer">
          Demo entries are illustrative and are not sourced from a blockchain.
        </p>
      </div>
    </section>
  );
}
