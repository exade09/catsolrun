# Meowave

Meowave is a browser-based, third-person endless runner starring a custom low-poly orange-and-white cat in oversized headphones. The game is embedded inside a complete responsive site with character art, controls, features, tokenomics, social links, FAQ, and WebGL fallbacks.

> SOL notes are gameplay collectibles. Demo SOL balances, eligibility checks, and withdrawals in the Reward Lab are simulations only: they have no monetary value and never create a blockchain transaction.

## Highlights

- A complete menu, countdown, play, pause, game-over, retry, and return-to-menu loop.
- Smooth three-lane movement, jumping, sliding, keyboard input buffering, mobile swipes, and touch controls.
- A lightweight procedural cat rebuilt from four local reference poses with faceted orange-and-white markings, a striped tail, collar, and silver headphones.
- Recycled modular track segments, readable obstacles, SOL pickup trails, five power-ups, combos, near misses, and progressive difficulty.
- A persisted runner nickname and a global top-20 distance leaderboard backed by Neon Postgres.
- A transparent Reward Lab with a per-address Demo SOL profile, active-play progress, capped run credits, and simulated withdrawal receipts.
- Synthesized Web Audio music and effects that begin only after user interaction.
- A custom Meowave favicon and low-poly visual system shared by the header, hero, reference gallery, game, and tokenomics section.
- Responsive quality scaling, reduced-motion support, keyboard access, local best-score persistence, and an isolated WebGL fallback.
- No wallet connection, signature, private key, transaction, external game engine, or installation is required to play.

## Token reference

| Field | Value |
| --- | --- |
| Ticker | `$MWAVE` |
| Supply | `1B` |
| Blockchain | `Solana` |

These values are displayed as project information. The Reward Lab does not distribute `$MWAVE`, SOL, or any other cryptocurrency.

## Technology

- React 19 and TypeScript
- Vite 8
- Three.js, React Three Fiber, and Drei
- React Three Rapier
- Zustand
- Modern layered CSS

Exact dependency versions and scripts are defined in [`package.json`](./package.json).

## Requirements

- Node.js 24.x
- npm
- A current browser with WebGL enabled

Check the installed tools:

```bash
node --version
npm --version
```

## Local development

Install dependencies from the repository root:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite. The development server listens on the local network, which is useful for testing touch controls on a phone or tablet.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Start the Vite development server. |
| `npm run typecheck` | Run strict TypeScript checks. |
| `npm run check:content` | Scan project content for Cyrillic characters. |
| `npm run check:rewards` | Verify the published Demo SOL constants, rate model, and pickup count. |
| `npm run build` | Type-check and create the optimized `dist/` build. |
| `npm run preview` | Serve the current production build locally. |

A complete verification pass is:

```bash
npm run typecheck
npm run check:content
npm run check:rewards
npm run build
npm run preview
```

Do not open `index.html` or `dist/index.html` directly from the file system. Vite applications use ES modules and must be served over HTTP. Use `npm run dev` while developing or `npm run preview` after a production build.

## Controls

### Desktop

| Action | Controls |
| --- | --- |
| Move left | `A` or `Left Arrow` |
| Move right | `D` or `Right Arrow` |
| Jump | `W`, `Space`, or `Up Arrow` |
| Slide | `S` or `Down Arrow` |
| Pause or resume | `P` or `Escape` |

Lane changes interpolate instead of teleporting. Short input buffering keeps rapid commands responsive.

### Mobile and tablet

- Swipe left or right to switch lanes.
- Swipe up to jump.
- Swipe down to slide.
- Use the visible touch controls when enabled.

The game prevents browser scrolling only while a gesture is active on the game surface.

## Game flow

Meowave uses explicit phases so UI, audio, input, and simulation stay synchronized:

1. Loading prepares the 3D scene.
2. Main menu presents run, instructions, and audio actions.
3. Countdown gives the player a clear start cue.
4. Playing advances the route, score, collision checks, and difficulty.
5. Paused freezes the active run.
6. Game over reports score, distance, collected SOL notes, combo, and personal best.
7. Restarting clears transient run data before another countdown.

The opening section uses forgiving patterns. Speed and obstacle complexity increase gradually to a capped maximum.

## Scoring and persistence

Score combines distance, speed, SOL-note pickups, collection combos, and near-miss bonuses. A collision ends the run unless an active shield absorbs it.

The browser stores the anonymous runner profile, gameplay preferences, and personal best under `meowave-settings-v1`:

- Random player ID
- Runner nickname
- Best score
- Audio preference
- Reduced-motion preference
- Touch-control preference

Private browsing, disabled storage, clearing site data, or changing browser origins can reset local progress. Gameplay remains available when storage is unavailable.

## Reward Lab simulation

The Reward Lab is a working product simulation, not a cryptocurrency payout system. It deliberately separates the runner's **SOL notes** from a profile's **Demo SOL** balance.

1. A player can try every part of the runner without linking anything.
2. To enable future run credits, the player enters a public Solana address. The app validates only the address format; it does not prove ownership.
3. The player explicitly runs a `$10+ eligibility simulation`. This button records a demo pass and does not query an RPC endpoint, token account, oracle, wallet balance, or price feed.
4. Eligible, meaningful completed runs credit Demo SOL once per unique run ID. Trial pickups are never credited retroactively.
5. Withdrawal controls unlock after 7,200 seconds of eligible active play and when the balance reaches at least 0.25 Demo SOL.
6. A withdrawal deducts 0.25 Demo SOL and creates a local/server simulated receipt. It never creates a transaction, signature request, or transaction hash.

### Published economy

All accounting uses integer simulated lamport-like units so UI rounding cannot create value.

| Rule | Value |
| --- | ---: |
| One physical reward note | `0.0001 Demo SOL` (`100,000` units) |
| Track density | `5 notes / 280 m` |
| Average active distance | `70,000 m / hour` |
| Modeled collection rate | `66.7%` |
| Modeled average | about `0.0833 Demo SOL / hour` |
| Maximum credit rate | `0.125 Demo SOL / hour` |
| Daily credit cap | `0.30 Demo SOL` |
| Withdrawal activity gate | `2 active hours` |
| Minimum simulated withdrawal | `0.25 Demo SOL` |

The 70,000-meter assumption is derived from repeated four-minute runs under the actual speed curve: roughly 4.69 km per run and 70.3 km per active hour, rounded for the public model. That yields `70,000 / 280 × 5 × 0.667 ≈ 833` collected reward notes per hour, or about `0.0833 Demo SOL`. Therefore an average active player reaches `0.25 Demo SOL` in roughly three hours. Longer expert runs can average faster because they spend more time at the speed cap; shorter runs take longer. The two-hour gate unlocks the control, while hourly and daily caps preserve the maximum. Double SOL can increase the run score display, but never multiplies physical reward-note credits.

The full English specification is in [`public/MEOWAVE-REWARD-WHITEPAPER.md`](./public/MEOWAVE-REWARD-WHITEPAPER.md) and is also served at `/MEOWAVE-REWARD-WHITEPAPER.md` by the site.

Meaningful active time requires a run of at least 20 seconds, at least two accepted movement commands, and an average of at least one command per 30 seconds for longer runs. Reward eligibility and the destination address are bound when the run starts, so linking or changing an address mid-run cannot credit earlier trial pickups.

Local persistence makes the demo usable with the plain Vite development server and remains the authority for the displayed balance. When the Vercel API and Neon database are available, public addresses and simulated run, ledger, and withdrawal records are sent to a best-effort server mirror. Offline requests can make that mirror differ from the browser ledger, and all run metrics are client-reported prototype telemetry. A typed address is not authentication; a real implementation would require signed-message ownership, a named qualifying token, authoritative balance and price data, server-authoritative anti-cheat telemetry, a funded treasury, legal review, and an explicit transaction confirmation flow.

## Power-ups

| Power-up | Effect |
| --- | --- |
| SOL Magnet | Pulls nearby SOL notes toward the player. |
| Signal Shield | Absorbs one collision and grants a short grace period. |
| Rhythm Boost | Temporarily increases applicable score gains. |
| Slow Time | Briefly reduces effective world speed. |
| Double SOL | Counts each collected SOL note twice for the run score only. |

## Project structure

```text
public/
  meowave-mark.svg       Shared favicon and brand mark
src/
  app/                   App-level error boundary and loading styles
  assets/poses/          Four local Meowave reference angles
  components/            Header, hero, social marks, branding, and primitives
  config/                External social link configuration
  rewards/               Shared simulation rules, types, and API client
  sections/              Game, rewards, leaderboard, story, controls, features, tokenomics, and FAQ
  game/
    character/           Procedural low-poly cat and animation
    collectibles/        In-game SOL visuals
    components/          Chase camera and game helpers
    config/              Central game tuning
    effects/             Pickup particles and speed effects
    obstacles/           Readable obstacle geometry
    powerups/            Power-up visuals
    systems/             Input buffering and Web Audio
    types/               Shared game and track types
    ui/                  HUD, menus, countdown, and touch controls
    world/               Recycled track segments and environment
  leaderboard/           Nickname validation, API client, and leaderboard types
  sections/              Page sections including the global leaderboard
  stores/                Persisted Zustand game and per-address reward state
  styles/                Global responsive low-poly design system
api/                     Separate Vercel Functions for leaderboard and reward simulation data
database/                PostgreSQL schema reference
```

[`App.tsx`](./src/App.tsx) composes the site and lazy-loads the embedded game. [`GameCanvas.tsx`](./src/game/GameCanvas.tsx) owns WebGL detection and device-aware rendering. [`GameScene.tsx`](./src/game/GameScene.tsx) coordinates the active run. [`TrackManager.tsx`](./src/game/world/TrackManager.tsx) recycles a bounded set of track segments and performs gameplay collision checks. [`gameStore.ts`](./src/stores/gameStore.ts) owns phases, metrics, settings, and persistence without forcing React updates on every frame.

## Character references

The playable character is assembled from optimized Three.js primitives and is not a flat sprite. Its proportions, coat pattern, striped tail, collar, and headphone placement follow the four local reference views:

- `src/assets/poses/meowave-front.jpg`
- `src/assets/poses/meowave-profile.jpg`
- `src/assets/poses/meowave-rear.jpg`
- `src/assets/poses/meowave-rest.jpg`

The images are also used in separate website compositions so the art direction stays visible outside the game.

## Performance and accessibility

- Reusable low-poly meshes and materials keep geometry bounded.
- Track segments are repositioned instead of growing the scene indefinitely.
- Device pixel ratio is capped, and shadows and antialiasing are reduced on mobile-class devices.
- Game-loop values use refs and controlled store synchronization.
- Hiding the browser tab pauses active gameplay.
- Website controls support keyboard navigation and visible focus states.
- Instructions remain available as regular content outside the 3D canvas.
- Audio can be disabled and never begins loudly before interaction.
- Reduced-motion mode softens camera and decorative motion.
- Obstacles use silhouette, placement, movement, and warning marks rather than color alone.
- A WebGL failure is isolated to the game area; the rest of the site remains usable.

## Deploy to Vercel

The repository includes [`vercel.json`](./vercel.json) with the Vite framework, `npm run build`, the `dist` output directory, and an SPA rewrite.

1. Import the repository into Vercel.
2. Keep the detected framework as Vite.
3. Use Node.js 24.x.
4. Add the Neon integration for Production, Preview, and Development.
5. Confirm that the integration created the pooled `DATABASE_URL` environment variable.
6. Deploy or redeploy the project after connecting the database.

The `/api/leaderboard` Vercel Function creates the ranking table and index on its first database request. The independent `/api/rewards` function owns the simulated accounts, run records, ledger entries, and withdrawal receipts; leaderboard submissions are never trusted as reward events. The same statements are available in [`database/schema.sql`](./database/schema.sql) for manual setup or review.

For local API development, copy `.env.example` to `.env.local`, insert a development connection string, and run `npx vercel dev`. Keep real database credentials out of Git.

The same configuration can be verified locally with:

```bash
npm install
npm run build
npm run preview
```

## Troubleshooting

### The page does not open from an index file

Do not double-click `index.html`. Run `npm run dev`, then open the HTTP address shown in the terminal. For a production build, run `npm run build` followed by `npm run preview`.

### The browser shows the WebGL fallback

Use a current browser, enable hardware acceleration, and update the graphics driver when applicable. Remote desktop sessions and strict browser policies can disable WebGL.

### Audio is silent

Interact with the page once, confirm Audio is enabled in the game menu, and check the browser's site-audio permission.

### Controls do not respond

Start or resume the run first. Keyboard input is ignored while focus is inside an interactive page control. On touch devices, begin the swipe inside the game surface.

### A run paused unexpectedly

The game pauses intentionally when the tab is hidden or the browser window loses focus. Return to the game and choose Resume.

## Content verification

All player-facing copy is English. Run this check before delivery:

```bash
npm run check:content
```
