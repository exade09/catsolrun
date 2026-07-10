export type SocialPlatform = "telegram" | "x" | "pump" | "dexscreener";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export const socialLinks = [
  {
    platform: "telegram",
    label: "Telegram",
    href: "https://t.me/",
  },
  {
    platform: "x",
    label: "X",
    href: "https://x.com/",
  },
  {
    platform: "pump",
    label: "Pump.fun",
    href: "https://pump.fun/",
  },
  {
    platform: "dexscreener",
    label: "DEX Screener",
    href: "https://dexscreener.com/",
  },
] as const satisfies readonly SocialLink[];
