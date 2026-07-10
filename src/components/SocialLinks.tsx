import { useId } from "react";
import { socialLinks, type SocialPlatform } from "../config/socialLinks";

export interface SocialLinksProps {
  className?: string;
  compact?: boolean;
}

interface SocialMarkProps {
  platform: SocialPlatform;
}

function PlatformGlyph({ platform }: SocialMarkProps) {
  if (platform === "telegram") {
    return (
      <>
        <path
          className="social-links__brand-shape social-links__brand-shape--telegram"
          d="m6.5 15.1 18.9-7.3-3.2 17.1-6.4-5-3.4 3.3.6-5.8 9.7-6-11.9 4.7-5.2-1Z"
          fill="#f5f7ff"
        />
        <path
          className="social-links__brand-detail"
          d="m13 17.4 9.7-6-7.9 7.6"
          stroke="#55dfff"
          strokeWidth="1.2"
          strokeLinejoin="bevel"
        />
      </>
    );
  }

  if (platform === "x") {
    return (
      <>
        <path
          className="social-links__brand-shape social-links__brand-shape--x"
          d="M8 7.5h4.5L24 24.5h-4.6L8 7.5Z"
          fill="#f5f7ff"
        />
        <path
          className="social-links__brand-detail social-links__brand-detail--x"
          d="M23.8 7.5 8.2 24.5"
          stroke="#f5f7ff"
          strokeWidth="3.1"
        />
        <path
          className="social-links__brand-facet"
          d="m11.7 7.5 3 4.5-2.1 2.2-4.6-6.7h3.7Z"
          fill="#a970ff"
        />
      </>
    );
  }

  if (platform === "pump") {
    return (
      <g className="social-links__brand-shape social-links__brand-shape--pump" transform="rotate(-32 16 16)">
        <path d="M11 6.5h10l4.5 4.5v10L21 25.5H11L6.5 21V11L11 6.5Z" fill="#17342c" />
        <path className="social-links__pump-light" d="M11 8h10l3 3v5H8v-5l3-3Z" fill="#f5f7eb" />
        <path className="social-links__pump-green" d="M8 16h16v5l-3 3H11l-3-3v-5Z" fill="#55f59b" />
        <path
          className="social-links__brand-detail"
          d="m8.2 18.6 15.3-5"
          stroke="#16382e"
          strokeWidth="1.15"
        />
      </g>
    );
  }

  return (
    <>
      <path
        className="social-links__brand-shape social-links__brand-shape--dexscreener"
        d="m5.5 10.5 10.4-5.2 10.6 2.6-6.2 3.5 5.5 1.8-7.4 2.8-3.8 9-2.6-7.5-6.8 2.8 4.2-6.2-3.9-3.6Z"
        fill="#f5f7ff"
      />
      <path
        className="social-links__brand-facet"
        d="m9.4 14.1 9-3.2-5 5.5-1.4 1.1-6.8 2.8 4.2-6.2Z"
        fill="#79ecff"
      />
      <path className="social-links__brand-eye" d="m17.2 9.2 3.5.6-2.9 1.5-.6-2.1Z" fill="#151926" />
      <path
        className="social-links__brand-detail"
        d="M20.2 19.8v4.1M23 17.8v6.1M25.8 15.9v8"
        stroke="#55f59b"
        strokeWidth="1.35"
      />
    </>
  );
}

function SocialMark({ platform }: SocialMarkProps) {
  const gradientId = `meowave-social-${useId().replace(/:/g, "")}`;

  return (
    <svg
      className={`social-links__icon social-links__icon--${platform}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a970ff" />
          <stop offset="0.48" stopColor="#39e3ff" />
          <stop offset="1" stopColor="#55f59b" />
        </linearGradient>
      </defs>
      <path
        className="social-links__plate"
        d="M8 2.5h16l5.5 5.8v15.4L24 29.5H8l-5.5-5.8V8.3L8 2.5Z"
        fill="#111522"
      />
      <path className="social-links__plate-accent" d="M8 2.5h16l5.5 5.8-8.2 2.1L8 2.5Z" fill={`url(#${gradientId})`} />
      <path className="social-links__plate-facet" d="m2.5 8.3 8.7 3.2L8 29.5l-5.5-5.8V8.3Z" fill="#20283a" />
      <path
        className="social-links__plate-edge"
        d="M8 2.5h16l5.5 5.8v15.4L24 29.5H8l-5.5-5.8V8.3L8 2.5Z"
        stroke="#91a0bd"
        strokeOpacity="0.55"
      />
      <PlatformGlyph platform={platform} />
    </svg>
  );
}

export function SocialLinks({ className, compact = false }: SocialLinksProps) {
  const classes = ["social-links", compact ? "social-links--compact" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={classes} aria-label="Social links">
      {socialLinks.map((link) => (
        <a
          className={`social-links__item social-links__item--${link.platform}`}
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${link.label} (opens in a new tab)`}
        >
          <SocialMark platform={link.platform} />
          {!compact && <span className="social-links__label">{link.label}</span>}
        </a>
      ))}
    </nav>
  );
}
