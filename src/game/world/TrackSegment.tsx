import { forwardRef, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, GAME_CONFIG } from '../config/gameConfig'
import { SolCollectible } from '../collectibles/SolCollectible'
import { ObstacleVisual } from '../obstacles/ObstacleVisual'
import { PowerUpVisual } from '../powerups/PowerUpVisual'
import type { SegmentDefinition, TrackEntity } from '../types/game'

export interface TrackSegmentHandle {
  group: THREE.Group | null
  entityGroups: Map<string, THREE.Group>
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

export const TrackSegment = forwardRef<TrackSegmentHandle, TrackSegmentProps>(function TrackSegment(
  { definition },
  forwardedRef,
) {
  const group = useRef<THREE.Group>(null)
  const entityGroups = useRef(new Map<string, THREE.Group>())

  useImperativeHandle(
    forwardedRef,
    () => ({ group: group.current, entityGroups: entityGroups.current }),
    [],
  )

  const edgeColor = definition.environment === 'tunnel' ? COLORS.purple : definition.environment === 'dataway' ? COLORS.cyan : '#a8afb2'

  return (
    <group ref={group}>
      <mesh receiveShadow position={[0, -0.13, -GAME_CONFIG.segmentLength / 2]} scale={[4.45, 0.13, GAME_CONFIG.segmentLength / 2]}>
        <boxGeometry />
        <meshStandardMaterial
          color={definition.environment === 'tunnel' ? '#42484f' : '#62686d'}
          roughness={0.96}
          metalness={0.02}
          flatShading
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 4.23, 0.08, -GAME_CONFIG.segmentLength / 2]} scale={[0.1, 0.08, GAME_CONFIG.segmentLength / 2]}>
            <boxGeometry />
            <meshBasicMaterial color={edgeColor} toneMapped={false} />
          </mesh>
          <mesh castShadow receiveShadow position={[side * 4.65, 0.42, -GAME_CONFIG.segmentLength / 2]} scale={[0.34, 0.42, GAME_CONFIG.segmentLength / 2]}>
            <boxGeometry />
            <meshStandardMaterial color="#373d43" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
      {[-GAME_CONFIG.laneWidth / 2, GAME_CONFIG.laneWidth / 2].map((x) => (
        <group key={x} position={[x, 0.015, -GAME_CONFIG.segmentLength / 2]}>
          {Array.from({ length: 10 }, (_, index) => (
            <mesh key={index} position={[0, 0, index * 2 - 9]} scale={[0.025, 0.012, 0.46]}>
              <boxGeometry />
              <meshBasicMaterial color="#c7ccce" transparent opacity={0.42} />
            </mesh>
          ))}
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
