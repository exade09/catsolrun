import type { SegmentDefinition } from '../types/game'

type SegmentEnvironment = SegmentDefinition['environment']
type SceneryKind = 'billboard' | 'crystal' | 'fin' | 'monolith' | 'rock' | 'spire'

interface SceneryPalette {
  ground: string
  structure: string
  highlight: string
  accent: string
}

interface SceneryPieceDefinition {
  kind: SceneryKind
  position: [number, number, number]
  rotation: number
  scale: number
}

interface TrackSceneryProps {
  environment: SegmentEnvironment
  seed: number
}

export const SCENERY_VARIANT_COUNT = 3

const PALETTES: Record<SegmentEnvironment, readonly SceneryPalette[]> = {
  plaza: [
    { ground: '#171323', structure: '#493d62', highlight: '#8e67c7', accent: '#ff4fd8' },
    { ground: '#101a24', structure: '#34545d', highlight: '#65a5a8', accent: '#14f1d9' },
    { ground: '#1c1421', structure: '#5f3f55', highlight: '#a96f83', accent: '#ff8fd8' },
  ],
  dataway: [
    { ground: '#101a23', structure: '#294d5b', highlight: '#4d8b98', accent: '#14f1d9' },
    { ground: '#151326', structure: '#443569', highlight: '#7659ad', accent: '#9945ff' },
    { ground: '#111d20', structure: '#315658', highlight: '#5c8f86', accent: '#65ffc5' },
  ],
  tunnel: [
    { ground: '#151220', structure: '#49345e', highlight: '#7f5b9c', accent: '#9945ff' },
    { ground: '#101923', structure: '#355260', highlight: '#5c8998', accent: '#14f1d9' },
    { ground: '#1b1420', structure: '#604254', highlight: '#a3687e', accent: '#ff4fa3' },
  ],
}

const KINDS: Record<SegmentEnvironment, readonly SceneryKind[]> = {
  plaza: ['crystal', 'rock', 'billboard', 'fin', 'monolith'],
  dataway: ['spire', 'billboard', 'monolith', 'fin', 'crystal'],
  tunnel: ['monolith', 'spire', 'rock', 'crystal', 'fin'],
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function createLayout(seed: number, environment: SegmentEnvironment): SceneryPieceDefinition[] {
  const random = seededRandom(seed * 7919 + 104729)
  const kinds = KINDS[environment]
  const pieces: SceneryPieceDefinition[] = []

  for (const side of [-1, 1] as const) {
    for (let slot = 0; slot < 2; slot += 1) {
      const kindIndex = Math.floor(random() * kinds.length)
      pieces.push({
        kind: kinds[kindIndex] ?? 'rock',
        position: [side * (5.45 + random() * 2.15), 0, -(3.2 + slot * 9.2 + random() * 4.1)],
        rotation: random() * Math.PI * 2,
        scale: 0.72 + random() * 0.66,
      })
    }
  }

  return pieces
}

function Crystal({ palette }: { palette: SceneryPalette }) {
  return (
    <group>
      {[
        { x: 0, y: 0.82, scale: 1 },
        { x: -0.42, y: 0.45, scale: 0.58 },
        { x: 0.46, y: 0.55, scale: 0.7 },
      ].map((piece, index) => (
        <mesh
          key={index}
          castShadow
          position={[piece.x, piece.y, index * -0.08]}
          rotation={[0.12 * index, index * 0.7, index % 2 ? -0.18 : 0.12]}
          scale={[piece.scale * 0.42, piece.scale, piece.scale * 0.42]}
        >
          <octahedronGeometry />
          <meshStandardMaterial
            color={index === 0 ? palette.highlight : palette.structure}
            emissive={index === 0 ? palette.accent : '#000000'}
            emissiveIntensity={index === 0 ? 0.22 : 0}
            roughness={0.62}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Rock({ palette }: { palette: SceneryPalette }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.58, 0]} rotation={[0.18, 0.42, -0.08]} scale={[1.15, 0.7, 0.82]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={palette.structure} roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[0.78, 0.28, -0.18]} rotation={[0, 0.9, 0]} scale={[0.52, 0.36, 0.58]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={palette.highlight} roughness={0.92} flatShading />
      </mesh>
    </group>
  )
}

function Billboard({ palette }: { palette: SceneryPalette }) {
  return (
    <group>
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} castShadow position={[x, 0.85, 0]} scale={[0.12, 0.86, 0.12]}>
          <boxGeometry />
          <meshStandardMaterial color={palette.structure} roughness={0.75} flatShading />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.45, 0]} scale={[1.52, 0.68, 0.14]}>
        <boxGeometry />
        <meshStandardMaterial color={palette.ground} roughness={0.55} metalness={0.18} flatShading />
      </mesh>
      <mesh position={[0, 1.45, 0.081]} scale={[1.22, 0.08, 0.02]}>
        <boxGeometry />
        <meshBasicMaterial color={palette.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.35, 1.18, 0.082]} scale={[0.52, 0.035, 0.02]}>
        <boxGeometry />
        <meshBasicMaterial color={palette.highlight} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Fin({ palette }: { palette: SceneryPalette }) {
  return (
    <group>
      {[0, 0.48, 0.91].map((x, index) => (
        <mesh
          key={x}
          castShadow
          position={[x, 0.72 + index * 0.18, index * -0.22]}
          rotation={[0, 0.2, -0.08]}
          scale={[0.54, 1.35 + index * 0.32, 0.28]}
        >
          <coneGeometry args={[1, 2, 3]} />
          <meshStandardMaterial
            color={index === 2 ? palette.highlight : palette.structure}
            roughness={0.78}
            flatShading
          />
        </mesh>
      ))}
      <mesh position={[0.45, 0.08, 0.08]} scale={[1.55, 0.035, 0.05]}>
        <boxGeometry />
        <meshBasicMaterial color={palette.accent} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Monolith({ palette }: { palette: SceneryPalette }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.25, 0]} rotation={[0, 0.4, 0]} scale={[0.62, 1.25, 0.5]}>
        <boxGeometry />
        <meshStandardMaterial color={palette.structure} roughness={0.72} metalness={0.12} flatShading />
      </mesh>
      {[0.58, 1.28, 1.93].map((y, index) => (
        <mesh key={y} position={[0, y, 0.52]} rotation={[0, 0.4, 0]} scale={[0.43 - index * 0.06, 0.025, 0.025]}>
          <boxGeometry />
          <meshBasicMaterial color={index % 2 ? palette.highlight : palette.accent} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Spire({ palette }: { palette: SceneryPalette }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.24, 0]} scale={[0.9, 0.24, 0.78]}>
        <boxGeometry />
        <meshStandardMaterial color={palette.structure} roughness={0.78} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.16, 0.52, 2.45, 5]} />
        <meshStandardMaterial color={palette.highlight} roughness={0.64} metalness={0.12} flatShading />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.055, 4, 8]} />
        <meshBasicMaterial color={palette.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.82, 0]} scale={0.22}>
        <octahedronGeometry />
        <meshBasicMaterial color={palette.accent} toneMapped={false} />
      </mesh>
    </group>
  )
}

function SceneryPiece({ definition, palette }: { definition: SceneryPieceDefinition; palette: SceneryPalette }) {
  const visual =
    definition.kind === 'crystal' ? <Crystal palette={palette} />
      : definition.kind === 'rock' ? <Rock palette={palette} />
        : definition.kind === 'billboard' ? <Billboard palette={palette} />
          : definition.kind === 'fin' ? <Fin palette={palette} />
            : definition.kind === 'monolith' ? <Monolith palette={palette} />
              : <Spire palette={palette} />

  return (
    <group position={definition.position} rotation={[0, definition.rotation, 0]} scale={definition.scale}>
      {visual}
    </group>
  )
}

function TunnelRibs({ seed, palette }: { seed: number; palette: SceneryPalette }) {
  const shift = (seed % 3) * 0.55
  return (
    <>
      {[4.2 + shift, 11 + shift, 17.8 + shift].map((offset, index) => (
        <group key={offset} position={[0, 0, -offset]}>
          {[-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * 4.92, 2.15, 0]} scale={[0.18, 2.2, 0.22]}>
              <boxGeometry />
              <meshStandardMaterial color={palette.structure} roughness={0.74} flatShading />
            </mesh>
          ))}
          <mesh castShadow position={[0, 4.28, 0]} scale={[10.02, 0.18, 0.22]}>
            <boxGeometry />
            <meshStandardMaterial color={palette.highlight} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 4.05, 0]} scale={[8.9, 0.045, 0.05]}>
            <boxGeometry />
            <meshBasicMaterial color={index % 2 ? palette.accent : palette.highlight} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export function TrackScenery({ environment, seed }: TrackSceneryProps) {
  const paletteOptions = PALETTES[environment]
  const palette = paletteOptions[Math.abs(seed) % paletteOptions.length] ?? paletteOptions[0]
  const layout = createLayout(seed, environment)

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} receiveShadow position={[side * 6.85, -0.22, -10]} scale={[4.45, 0.12, 20]}>
          <boxGeometry />
          <meshStandardMaterial color={palette.ground} roughness={0.96} flatShading />
        </mesh>
      ))}
      {layout.map((piece, index) => (
        <SceneryPiece key={`${piece.kind}-${index}`} definition={piece} palette={palette} />
      ))}
      {environment === 'tunnel' && <TunnelRibs seed={seed} palette={palette} />}
    </group>
  )
}
