# MEOWAVE

MEOWAVE is a browser-based low-poly endless runner built around the Solana ecosystem. The player guides a headphone-wearing cat across three lanes, avoids procedural obstacles, collects SOL coins, builds combos, and competes by best distance.

## Current product

- Real-time 3D runner powered by React Three Fiber and Rapier.
- Keyboard and touch controls: switch lanes, jump, slide, and pause.
- SOL coin pickups, power-ups, combos, adaptive speed, and endless route assembly.
- Persistent nickname, personal best, settings, and a global Neon leaderboard.
- Real Phantom connection through the injected provider.
- Live Solana mainnet balance reading through JSON-RPC.
- Wallet ownership message signing without creating a transaction.
- Automatic withdrawal eligibility checks against a configured Solana token mint.
- A dedicated Withdraw window that always uses the connected Phantom address.
- A branded reward whitepaper at `/MEOWAVE-REWARD-WHITEPAPER.md`.
- Responsive retrofuturist interface with a local hero video and WebGL footer background.

## Wallet and rewards

Phantom is optional for gameplay. When connected, the site receives the selected public address, reads its mainnet SOL balance, detects account changes, and can request a message signature to confirm wallet control.

Gameplay never triggers an automatic transaction. On-chain reward claims are not active yet. A production payout flow still requires:

1. A funded treasury and audited claim program.
2. Server-authoritative run validation and anti-cheat controls.
3. Published eligibility, allocation, and claim rules.
4. Explicit Phantom confirmation for every transaction.

The interface states this deployment boundary directly and does not present a local balance or receipt as an on-chain payout.

## Stack

- React 19 and TypeScript
- Vite
- Three.js, React Three Fiber, Drei, and Rapier
- Zustand
- Neon Serverless Postgres
- Vercel Functions
- Native Phantom injected-provider API

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
VITE_SOLANA_RPC_URL=https://api.mainnet.solana.com
VITE_ELIGIBILITY_TOKEN_MINT=
```

Use a dedicated Solana RPC provider in production because the public mainnet endpoint is rate-limited.

`VITE_ELIGIBILITY_TOKEN_MINT` is optional. The published `$MWAVE` mint is compiled in through
`src/config/token.ts`, which is also the single source for the contract address rendered across the
header, hero, tokenomics section, whitepaper, and the Pump.fun / DEX Screener / Solscan links.

## Token

| Field | Value |
| --- | --- |
| Ticker | `$MWAVE` |
| Chain | Solana Mainnet |
| Mint | `5QJ6fJWzeJedcFra6pZwkU1HUz5RSAf1p7KkyooBpump` |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run typecheck` | Run the TypeScript project check. |
| `npm run build` | Typecheck and create the production bundle. |
| `npm run check:content` | Verify that published source content contains no accidental Cyrillic text. |
| `npm run preview` | Preview the production build. |

## Project layout

```text
api/                   Vercel leaderboard function
database/              Leaderboard SQL schema
public/                Static assets, including the hero video
src/
  app/                 Application boundaries and shell styles
  assets/              Character and project artwork
  components/          Header, Hero, Footer, wallet controls, shared UI
  game/                Runner scene, physics, world generation, and UI
  leaderboard/         Leaderboard API client and shared types
  sections/            Marketing and product sections
  stores/              Persistent game state
  styles/              Global responsive design system
  wallet/              Phantom provider and wallet context
  whitepaper/           Dedicated reward whitepaper page
```

## Database

The leaderboard function creates its table and ranking index on first use. The same statements are available in `database/schema.sql` for manual deployment.

## Visual asset notes

The hero uses the free Pexels clip `Retro Futuristic Neon Grid with Abstract Sunset`, downloaded into `public/meowave-hero-loop.mp4`. The animated footer is an original WebGL adaptation of the public `Scanner` shader reference supplied for the redesign, recolored and reimplemented for MEOWAVE.

Review third-party source terms before redistributing the project outside the current product.
