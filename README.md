# SOL CAT RUN

SOL CAT RUN is a browser-based, third-person endless runner built around a custom low-poly orange-and-white cat with oversized headphones. Run across a Solana-inspired geometric world, switch between three lanes, clear readable hazards, collect in-game SOL, build combos, and use temporary power-ups as the pace increases.

The game is embedded in a complete responsive website with character story, controls, features, a local/demo leaderboard, optional wallet identity, FAQ, and accessibility settings. The playable cat is assembled from lightweight Three.js geometry; the reference artwork remains a local art-direction asset and is not used as a sprite.

> In-game SOL is a gameplay collectible and does not represent real cryptocurrency.

## Features

- A complete menu-to-game-over loop with countdown, pause, retry, return-to-menu, and score sharing.
- Smooth three-lane movement, jumping, sliding, input buffering, keyboard controls, mobile swipes, and touch controls.
- Recycled modular track segments with collectibles, power-ups, fair avoidance cues, and multiple low-poly obstacle types.
- Distance, SOL, combo, speed, and near-miss scoring with gradually increasing pace.
- A procedural cat with run, jump, slide, lane-lean, landing, pickup, damage, and game-over motion, plus animated ears, tail, headphones, cable, and music player.
- Five temporary power-ups: SOL Magnet, Signal Shield, Rhythm Boost, Slow Time, and Double SOL.
- Synthesized Web Audio music and effects that start only after user interaction, with a persistent audio toggle.
- Optional Solana wallet connection on Devnet for player identity only. Playing does not require a wallet or a transaction.
- Clearly labeled demo leaderboard records plus the player's best local result.
- Responsive rendering, reduced-motion support, touch-friendly UI, and a WebGL fallback that leaves the rest of the site usable.

## Technology

- React 19 and TypeScript
- Vite 8
- Three.js, React Three Fiber, and Drei
- React Three Rapier
- Zustand
- Solana Web3.js and Solana Wallet Adapter
- Modern responsive CSS

Dependency versions and the available scripts are defined in [`package.json`](./package.json).

## Prerequisites

- Node.js 24.x
- npm, included with Node.js
- A modern browser with WebGL enabled
- A compatible Solana wallet extension only if you want to use optional wallet identity

Check the installed runtime before setup:

```bash
node --version
npm --version
```

## Local setup

Install the dependencies from the repository root:

```bash
npm install
```

Create a local environment file from [`.env.example`](./.env.example). On PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite. The development server listens on the local network as well, which is useful for testing touch controls on another device.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install project dependencies and update the local package installation. |
| `npm run dev` | Start the Vite development server with hot module replacement. |
| `npm run build` | Run the TypeScript project build and create an optimized production bundle in `dist/`. |
| `npm run preview` | Serve the current production bundle locally for a final browser check. Run `npm run build` first. |
| `npm run typecheck` | Run strict TypeScript checks without creating application output. |
| `npm run check:content` | Scan project content for Cyrillic characters. |

A normal verification pass is:

```bash
npm run typecheck
npm run check:content
npm run build
npm run preview
```

`npm run preview` is a local preview server, not a production web server. Deploy the contents of `dist/` through a static host or web server for production.

## Deploy to Vercel

The repository includes [`vercel.json`](./vercel.json) with explicit Vite build settings, the `dist` output directory, and an SPA rewrite to `index.html` for direct links.

To deploy through the Vercel dashboard:

1. Import the Git repository.
2. Keep the detected framework as **Vite**.
3. Use Node.js **24.x**.
4. Optionally add `VITE_SOLANA_RPC_URL` as a project environment variable. If it is omitted, the app uses Solana Devnet.
5. Deploy. No other build overrides are required.

The committed configuration runs `npm run build` and publishes `dist`. The `.vercel` directory is intentionally ignored because it contains local project-link metadata.

## Controls

### Desktop

| Action | Controls |
| --- | --- |
| Move left | `A` or `Left Arrow` |
| Move right | `D` or `Right Arrow` |
| Jump | `W`, `Space`, or `Up Arrow` |
| Slide | `S` or `Down Arrow` |
| Pause or resume | `P` or `Escape` |

Keyboard commands are buffered briefly so fast inputs remain responsive. Lane changes interpolate smoothly instead of teleporting the cat.

### Mobile and tablet

Swipe on the game surface in the direction of the intended move:

- Swipe left or right to switch lanes.
- Swipe up to jump.
- Swipe down to slide.
- Use the visible touch controls when they are enabled.

The game prevents page scrolling while a gesture is active on its input surface. Gestures that start outside the game continue to behave like normal page navigation.

## Game flow

SOL CAT RUN uses explicit phases so UI, input, audio, and simulation remain synchronized:

1. **Loading** prepares the 3D experience.
2. **Main menu** presents run, instructions, audio, and wallet actions.
3. **Countdown** gives the player a clear start cue.
4. **Playing** advances the track, scoring, collision checks, and difficulty.
5. **Paused** freezes the run. Losing browser focus or hiding the tab also pauses safely.
6. **Game over** reports score, distance, collected SOL, best combo, and the saved best score.
7. **Restarting** resets transient run data before a new countdown.

The first portion of a run uses simpler track patterns. Base speed rises gradually to a capped maximum, while recycled segment patterns add moving hazards and more demanding pickup lines.

## Scoring and persistence

Score combines distance, current speed, in-game SOL pickups, collection combos, and near-miss bonuses. A combo ends when its pickup window expires or the player hits an obstacle. A collision ends the run unless an active shield absorbs it.

The following data stays in the current browser through `localStorage`:

- Best score, audio preference, reduced-motion preference, and touch-control preference under `sol-cat-run-settings-v1`.
- The best submitted local leaderboard result under `sol-cat-run:leaderboard-result`.

Leaderboard rows marked **Demo** are bundled sample data. The row marked **Local** is stored only in the current browser. Neither source is presented as blockchain data.

Private browsing, disabled storage, browser cleanup, or changing browsers can remove local progress. The game remains playable when storage is unavailable.

## Power-ups

| Power-up | Effect |
| --- | --- |
| SOL Magnet | Pulls nearby in-game SOL collectibles toward the player. |
| Signal Shield | Absorbs one obstacle collision and grants a short collision grace period. |
| Rhythm Boost | Temporarily doubles applicable score gains. |
| Slow Time | Temporarily reduces effective world speed for a longer reaction window. |
| Double SOL | Counts each collected in-game SOL item twice while active. |

Power-ups are temporary, visually distinct, and shown in the game HUD with their remaining duration. Picking up a new power-up replaces the currently active effect.

## Solana Devnet and wallet identity

The app uses Solana Devnet by default. The RPC endpoint is configured with `VITE_SOLANA_RPC_URL`:

```dotenv
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Edit `.env` to use another Devnet-compatible endpoint, then restart the Vite server. If the variable is unset or blank, the application falls back to Solana's public Devnet endpoint.

Variables prefixed with `VITE_` are included in browser code. Never place private keys, seed phrases, access tokens, or other secrets in this file.

Wallet behavior is deliberately limited:

- Connecting a wallet is optional and is used only to display a shortened public address as player identity.
- The adapter does not auto-connect.
- The app never asks for or stores a private key or seed phrase.
- The app never automatically signs or sends a transaction.
- No transaction is required to play.
- Collected in-game SOL has no monetary value and cannot be deposited, withdrawn, transferred, or claimed.
- Real cryptocurrency reward distribution is disabled in this build.

A rejected, unavailable, locked, or disconnected wallet does not block gameplay. The local/demo leaderboard is not an on-chain leaderboard.

## Architecture

The application keeps frame-sensitive simulation separate from conventional website UI:

```text
src/
  app/                 Error boundary for an isolated 3D fallback
  components/          Shared navigation, hero, branding, and UI primitives
  sections/            Story, controls, features, leaderboard, wallet, and FAQ
  game/
    character/         Procedural low-poly cat and animation
    collectibles/      In-game SOL visuals
    components/        Chase camera and game-specific helpers
    config/            Central game tuning and visual constants
    effects/           Pickup particles and speed effects
    obstacles/         Readable obstacle geometry
    powerups/          Power-up visuals
    systems/           Input buffering and Web Audio
    types/             Shared game and track types
    ui/                HUD, menus, countdown, and touch controls
    world/             Recycled track segments and environment
  leaderboard/         Leaderboard presentation
  services/            Local leaderboard gateway and disabled reward service
  stores/              Persisted Zustand game state
  styles/              Global responsive design system
  wallet/              Devnet provider, status handling, and wallet controls
```

[`App.tsx`](./src/App.tsx) composes the site, wallet state, embedded game, and local leaderboard submission. [`GameCanvas.tsx`](./src/game/GameCanvas.tsx) owns WebGL detection, device-aware rendering quality, and the isolated canvas fallback. [`GameScene.tsx`](./src/game/GameScene.tsx) coordinates the live run. [`TrackManager.tsx`](./src/game/world/TrackManager.tsx) recycles a bounded set of segments and performs lightweight gameplay collision tests, while Rapier provides the physics scene foundation. [`gameStore.ts`](./src/stores/gameStore.ts) owns phases, run metrics, settings, and persistence without forcing React updates on every rendered frame.

The leaderboard and reward boundaries are interfaces rather than UI-only mock behavior. [`leaderboardService.ts`](./src/services/leaderboardService.ts) can later be replaced by a verified backend gateway, while [`rewardService.ts`](./src/services/rewardService.ts) explicitly keeps real rewards disabled.

## Performance and responsive behavior

- The cat, obstacles, collectibles, and scenery use low-poly primitive geometry and reusable materials.
- A fixed collection of modular track segments is repositioned instead of growing the scene indefinitely.
- Frame-loop values use refs, and game metrics are synchronized to the store at a controlled interval.
- Device pixel ratio is capped at 1.65 on desktop and 1.25 on coarse-pointer or compact devices.
- Antialiasing and dynamic shadows are disabled on mobile-class devices, while desktop keeps the higher-quality path.
- Speed lines and nonessential motion are disabled by reduced-motion mode.
- Dynamic lighting and particles are intentionally bounded.
- Animation frames, input listeners, pointer behavior, and audio nodes are cleaned up with their owning systems.
- Hiding the page or moving focus away from the window pauses active gameplay.

Portrait and landscape layouts remain usable, but landscape generally provides more track visibility on compact phones.

## Accessibility and fallbacks

- Website controls support keyboard navigation and visible focus indicators.
- A skip link moves keyboard users directly to the embedded game.
- Controls have accessible names, semantic labels, and sufficient text contrast.
- Instructions are available as normal page content outside the 3D canvas.
- Obstacles combine silhouette, placement, motion, and warning marks rather than relying on color alone.
- Audio can be disabled and does not begin loudly before user interaction.
- Reduced-motion mode softens camera reactions and removes nonessential speed effects.
- The site also honors operating-system reduced-motion and increased-contrast preferences.
- Pause is available from the keyboard and interface, and is triggered when the tab loses focus.
- If WebGL cannot initialize, the game area displays an understandable fallback while the story, controls, wallet information, leaderboard, and FAQ remain available.
- Unsupported or blocked Web Audio fails silently without blocking gameplay.
- Wallet rejection and unavailable-wallet errors are surfaced in plain English, and playing without a wallet remains supported.

## Troubleshooting

### The install or build reports an unsupported Node.js version

Run `node --version` and install Node.js 24.x if needed. Open a new terminal after upgrading, run `npm install`, then retry `npm run build`.

### The browser shows the WebGL fallback

Use an up-to-date desktop or mobile browser, enable hardware acceleration, and update the graphics driver when applicable. Remote desktop sessions and strict browser policies can disable WebGL. The non-game sections remain available while WebGL is unavailable.

### The page is blank after a production build

Serve the generated files instead of opening `dist/index.html` directly:

```bash
npm run preview
```

For deployment, configure the host to serve the `dist/` directory over HTTP or HTTPS.

### A wallet does not appear or connection is rejected

Install, unlock, or update a compatible Solana wallet, confirm the connection request in the extension, and retry. If the request was intentionally rejected, dismiss the message and continue playing without a wallet. No wallet is required for any gameplay feature.

### The RPC endpoint fails

Confirm that `.env` contains a valid `VITE_SOLANA_RPC_URL`, then restart `npm run dev`; Vite reads environment variables when the server starts. A custom endpoint may require its own browser-access policy or API key. Do not commit a secret through a `VITE_` variable.

### Audio is silent

Interact with the page once, verify that Audio is enabled in the game menu, and check the browser's site audio permission. Browsers require a user gesture before Web Audio can start.

### Controls do not respond

Start or resume the run first. Keyboard input is ignored while focus is inside a text field or button. On touch devices, begin the swipe inside the game surface and use a deliberate vertical or horizontal gesture.

### A run paused unexpectedly

The game pauses intentionally when the browser tab is hidden or the window loses focus. Return to the game and choose Resume.

### Local scores or settings disappeared

Local progress depends on browser storage. Private browsing, storage restrictions, clearing site data, or using a different browser or origin can produce a fresh local profile.

## Content verification

All player-facing copy is English. Run the repository content check before delivery:

```bash
npm run check:content
```

The local character reference is available at [`src/assets/cat-reference.png`](./src/assets/cat-reference.png).
