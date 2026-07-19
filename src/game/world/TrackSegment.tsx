import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, GAME_CONFIG } from '../config/gameConfig'
import { SolCollectible } from '../collectibles/SolCollectible'
import { ObstacleVisual } from '../obstacles/ObstacleVisual'
import { PowerUpVisual } from '../powerups/PowerUpVisual'
import type { SegmentDefinition, TrackEntity } from '../types/game'
import { SCENERY_VARIANT_COUNT, TrackScenery } from './TrackScenery'

export interface TrackSegmentHandle {
  group: THREE.Group | null
  entityGroups: Map<string, THREE.Group>
  sceneryVariants: Map<number, THREE.Group>
}

interface TrackSegmentProps {
  definition: SegmentDefinition
}

function EntityVisual({ entity }: { entity: TrackEntity }) {
  if (entity.kind === 'sol') return <SolCollectible />
  if (entity.kind === 'powerup' && entity.powerUpType) return <PowerUpVisual type={entity.powerUpType} />
  if (entity.kind === 'obstacle' && entity.obstacleType) {
    return <ObstacleVisual type={entity.obstacleType} moving={entity.moving} />
  }
  return null
}

const ROAD_WIDTH = 8.8

const ROAD_PALETTES = [
  ['#171322', '#1d172b', '#131b29', '#21172f'],
  ['#111b25', '#15232d', '#15172a', '#1b1930'],
  ['#1b1421', '#23172a', '#151a28', '#28192b'],
] as const

function createRoadGeometry(seed: number): THREE.BufferGeometry {
  const palette = ROAD_PALETTES[Math.abs(seed) % ROAD_PALETTES.length] ?? ROAD_PALETTES[0]
  const indexed = new THREE.PlaneGeometry(ROAD_WIDTH - 0.08, GAME_CONFIG.segmentLength - 0.04, 4, 10)
  indexed.rotateX(-Math.PI / 2)
  indexed.translate(0, -0.052, -GAME_CONFIG.segmentLength / 2)
  const geometry = indexed.toNonIndexed()
  indexed.dispose()

  const position = geometry.getAttribute('position')
  const colors: number[] = []
  for (let index = 0; index < position.count / 3; index += 1) {
    const color = new THREE.Color(palette[(index * 7 + seed * 3) % palette.length] ?? palette[0])
    for (let vertex = 0; vertex < 3; vertex += 1) colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

export const TrackSegment = forwardRef<TrackSegmentHandle, TrackSegmentProps>(function TrackSegment(
  { definition },
  forwardedRef,
) {
  const group = useRef<THREE.Group>(null)
  const entityGroups = useRef(new Map<string, THREE.Group>())
  const sceneryVariants = useRef(new Map<number, THREE.Group>())
  const roadGeometry = useMemo(() => createRoadGeometry(definition.id), [definition.id])

  useEffect(() => () => roadGeometry.dispose(), [roadGeometry])

  useImperativeHandle(
    forwardedRef,
    () => ({ group: group.current, entityGroups: entityGroups.current, sceneryVariants: sceneryVariants.current }),
    [],
  )

  const edgeColor = definition.environment === 'tunnel' ? COLORS.purple : definition.environment === 'dataway' ? COLORS.cyan : '#ff4fd8'

  return (
    <group ref={group}>
      <mesh receiveShadow position={[0, -0.13, -GAME_CONFIG.segmentLength / 2]} scale={[ROAD_WIDTH, 0.14, GAME_CONFIG.segmentLength]}>
        <boxGeometry />
        <meshStandardMaterial
          color="#0c0d17"
          roughness={0.9}
          metalness={0.12}
          flatShading
        />
      </mesh>
      <mesh receiveShadow geometry={roadGeometry}>
        <meshStandardMaterial vertexColors roughness={0.84} metalness={0.16} flatShading />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={`cross-${index}`} position={[0, -0.041, -(index * 2.35 + 1.05)]} scale={[ROAD_WIDTH - 0.25, 0.012, 0.025]}>
          <boxGeometry />
          <meshBasicMaterial
            color={index % 2 === 0 ? COLORS.purple : COLORS.cyan}
            transparent
            opacity={0.24}
            toneMapped={false}
          />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 4.32, 0.03, -GAME_CONFIG.segmentLength / 2]} scale={[0.11, 0.075, GAME_CONFIG.segmentLength]}>
            <boxGeometry />
            <meshBasicMaterial color={edgeColor} toneMapped={false} />
          </mesh>
          <mesh castShadow receiveShadow position={[side * 4.65, 0.38, -GAME_CONFIG.segmentLength / 2]} scale={[0.34, 0.38, GAME_CONFIG.segmentLength]}>
            <boxGeometry />
            <meshStandardMaterial color="#29243a" roughness={0.82} metalness={0.12} flatShading />
          </mesh>
        </group>
      ))}
      {[-GAME_CONFIG.laneWidth / 2, GAME_CONFIG.laneWidth / 2].map((x) => (
        <group key={x} position={[x, 0.015, -GAME_CONFIG.segmentLength / 2]}>
          {Array.from({ length: 10 }, (_, index) => (
            <mesh key={index} position={[0, 0, index * 2 - 9]} scale={[0.025, 0.012, 0.46]}>
              <boxGeometry />
              <meshBasicMaterial
                color={x < 0 ? COLORS.purple : COLORS.cyan}
                transparent
                opacity={0.68}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}

      {Array.from({ length: SCENERY_VARIANT_COUNT }, (_, variant) => (
        <group
          key={`scenery-${variant}`}
          ref={(node) => {
            if (node) sceneryVariants.current.set(variant, node)
            else sceneryVariants.current.delete(variant)
          }}
          visible={variant === definition.id % SCENERY_VARIANT_COUNT}
        >
          <TrackScenery
            environment={definition.environment}
            seed={definition.id * SCENERY_VARIANT_COUNT + variant + 1}
          />
        </group>
      ))}

      {definition.environment !== 'plaza' &&
        [-1, 1].map((side) =>
          [3, 10, 17].map((offset) => (
            <group key={`${side}-${offset}`} position={[side * 4.38, 1.45, -offset]}>
              <mesh castShadow scale={[0.16, 1.45, 0.16]}>
                <boxGeometry />
                <meshStandardMaterial color="#4e545a" roughness={0.75} flatShading />
              </mesh>
              <mesh position={[-side * 0.02, 0.55, 0]} scale={[0.19, 0.05, 0.22]}>
                <boxGeometry />
                <meshBasicMaterial color={edgeColor} toneMapped={false} />
              </mesh>
            </group>
          )),
        )}

      {definition.entities.map((entity) => (
        <group
          key={entity.id}
          ref={(node) => {
            if (node) entityGroups.current.set(entity.id, node)
            else entityGroups.current.delete(entity.id)
          }}
          position={[
            entity.lane * GAME_CONFIG.laneWidth,
            entity.kind === 'obstacle' ? 0 : (entity.height ?? 1.15),
            -entity.offset,
          ]}
        >
          <EntityVisual entity={entity} />
        </group>
      ))}
    </group>
  )
})
