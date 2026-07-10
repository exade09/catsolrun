# Meowave

Meowave is a browser-based, third-person endless runner starring a custom low-poly orange-and-white cat in oversized headphones. The game is embedded inside a complete responsive site with character art, controls, features, tokenomics, social links, FAQ, and WebGL fallbacks.

> In-game SOL is a gameplay collectible and does not represent real cryptocurrency.

## Highlights

- A complete menu, countdown, play, pause, game-over, retry, and return-to-menu loop.
- Smooth three-lane movement, jumping, sliding, keyboard input buffering, mobile swipes, and touch controls.
- A lightweight procedural cat rebuilt from four local reference poses with faceted orange-and-white markings, a striped tail, collar, and silver headphones.
- Recycled modular track segments, readable obstacles, SOL pickup trails, five power-ups, combos, near misses, and progressive difficulty.
- Synthesized Web Audio music and effects that begin only after user interaction.
- A custom Meowave favicon and low-poly visual system shared by the header, hero, reference gallery, game, and tokenomics section.
- Responsive quality scaling, reduced-motion support, keyboard access, local best-score persistence, and an isolated WebGL fallback.
- No account, transaction, external game engine, or installation is required to play.

## Token reference

| Field | Value |
| --- | --- |
| Ticker | `$MWAVE` |
| Supply | `1B` |
| Blockchain | `Solana` |

These values are displayed as project information. The game does not distribute cryptocurrency rewards.

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
| `npm run build` | Type-check and create the optimized `dist/` build. |
| `npm run preview` | Serve the current production build locally. |

A complete verification pass is:

```bash
npm run typecheck
npm run check:content
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
6. Game over reports score, distance, collected SOL, combo, and personal best.
7. Restarting clears transient run data before another countdown.

The opening section uses forgiving patterns. Speed and obstacle complexity increase gradually to a capped maximum.

## Scoring and persistence

Score combines distance, speed, in-game SOL pickups, collection combos, and near-miss bonuses. A collision ends the run unless an active shield absorbs it.

The browser stores only gameplay preferences and the personal best under `meowave-settings-v1`:

- Best score
- Audio preference
- Reduced-motion preference
- Touch-control preference

Private browsing, disabled storage, clearing site data, or changing browser origins can reset local progress. Gameplay remains available when storage is unavailable.

## Power-ups

| Power-up | Effect |
| --- | --- |
| SOL Magnet | Pulls nearby in-game SOL toward the player. |
| Signal Shield | Absorbs one collision and grants a short grace period. |
| Rhythm Boost | Temporarily increases applicable score gains. |
| Slow Time | Briefly reduces effective world speed. |
| Double SOL | Counts each collected in-game SOL item twice while active. |

## Project structure

```text
public/
  meowave-mark.svg       Shared favicon and brand mark
src/
  app/                   App-level error boundary and loading styles
  assets/poses/          Four local Meowave reference angles
  components/            Header, hero, social marks, branding, and primitives
  config/                External social link configuration
  sections/              Game, story, controls, features, tokenomics, and FAQ
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
  stores/                Persisted Zustand game state
  styles/                Global responsive low-poly design system
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
4. Deploy without environment variables.

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
