import { Component, Suspense, useMemo, type ErrorInfo, type ReactNode } from 'react'
import { AdaptiveDpr } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { GameScene } from './GameScene'
import { GameOverlay } from './ui'
import { useGameStore } from '../stores/gameStore'
import './game.css'

interface GameCanvasErrorBoundaryProps {
  children: ReactNode
}

interface GameCanvasErrorBoundaryState {
  failed: boolean
}

class GameCanvasErrorBoundary extends Component<GameCanvasErrorBoundaryProps, GameCanvasErrorBoundaryState> {
  state: GameCanvasErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): GameCanvasErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    useGameStore.getState().setPhase('menu')
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="sol-game-fallback" role="alert">
          <div>
            <p className="game-eyebrow">3D SIGNAL INTERRUPTED</p>
            <h3>The runner could not start.</h3>
            <p>The rest of the site is still available. Reload the game after checking that hardware acceleration is enabled.</p>
            <button className="game-button game-button-primary" type="button" onClick={() => window.location.reload()}>Reload Game</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const supportsWebGL = (): boolean => {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

interface QualitySettings {
  antialias: boolean
  dpr: number
  shadows: boolean
}

const detectQuality = (): QualitySettings => {
  if (typeof window === 'undefined') return { antialias: true, dpr: 1, shadows: true }
  const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760
  return {
    antialias: !mobile,
    dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.65),
    shadows: !mobile,
  }
}

export function GameCanvas() {
  const phase = useGameStore((state) => state.phase)
  const setPhase = useGameStore((state) => state.setPhase)
  const webGLAvailable = useMemo(supportsWebGL, [])
  const quality = useMemo(detectQuality, [])

  if (!webGLAvailable) {
    return (
      <div className="sol-cat-game" id="game-runner">
        <div className="sol-game-fallback" role="alert">
          <div>
            <p className="game-eyebrow">WEBGL UNAVAILABLE</p>
            <h3>This browser cannot open the 3D runner.</h3>
            <p>Enable hardware acceleration or try a current browser with WebGL support. You can still explore every other part of the site.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className="sol-cat-game"
      id="game-runner"
      data-game-input
      aria-label="SOL CAT RUN playable 3D endless runner"
    >
      <GameCanvasErrorBoundary>
        <div className="game-canvas-shell">
          <Canvas
            aria-label="A low-poly cat running along a three-lane Solana dataway"
            camera={{ fov: 52, near: 0.1, far: 120, position: [0, 4.5, 8.35] }}
            dpr={quality.dpr}
            frameloop={phase === 'paused' ? 'demand' : 'always'}
            gl={{
              alpha: false,
              antialias: quality.antialias,
              depth: true,
              powerPreference: 'high-performance',
              stencil: false,
            }}
            performance={{ min: 0.55, debounce: 200 }}
            shadows={quality.shadows}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace
              gl.toneMapping = THREE.ACESFilmicToneMapping
              gl.toneMappingExposure = 1.08
              if (useGameStore.getState().phase === 'loading') {
                window.setTimeout(() => setPhase('menu'), 720)
              }
            }}
          >
            <AdaptiveDpr pixelated />
            <Suspense fallback={null}>
              <GameScene />
            </Suspense>
          </Canvas>
        </div>
        <GameOverlay />
      </GameCanvasErrorBoundary>
    </section>
  )
}

export default GameCanvas

export { CatCharacter } from './character/CatCharacter'
export type { GamePhase, FinalStats, RunMetrics } from '../stores/gameStore'
export type { PowerUpType } from './types/game'
