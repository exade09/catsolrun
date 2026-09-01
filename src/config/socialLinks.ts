import { tokenLinks } from "./token";

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
    href: "https://x.com/PlayMeowave",
  },
  {
    platform: "pump",
    label: "Pump.fun",
    href: tokenLinks.pumpFun,
  },
  {
    platform: "dexscreener",
    label: "DEX Screener",
    href: tokenLinks.dexScreener,
  },
] as const satisfies readonly SocialLink[];
