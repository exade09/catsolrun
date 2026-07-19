import { createRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GAME_CONFIG } from '../config/gameConfig'
import type { PlayerRuntime, TrackEntity } from '../types/game'
import { SEGMENTS } from './segmentData'
import { TrackSegment, type TrackSegmentHandle } from './TrackSegment'
import { SCENERY_VARIANT_COUNT } from './TrackScenery'

interface TrackManagerProps {
  phase: string
  distance: React.MutableRefObject<number>
  player: React.MutableRefObject<PlayerRuntime>
  magnetActive: boolean
  onCollectSol: (entity: TrackEntity, position: THREE.Vector3) => void
  onCollectPowerUp: (entity: TrackEntity, position: THREE.Vector3) => void
  onObstacleHit: (entity: TrackEntity) => void
  onNearMiss: () => void
}

const collisionThreshold = 0.82

export function TrackManager({
  phase,
  distance,
  player,
  magnetActive,
  onCollectSol,
  onCollectPowerUp,
  onObstacleHit,
  onNearMiss,
}: TrackManagerProps) {
  const segmentRefs = useMemo(
    () => SEGMENTS.map(() => createRef<TrackSegmentHandle>()),
    [],
  )
  const handled = useRef(new Set<string>())
  const previousAhead = useRef(new Map<string, number>())
  const previousDistance = useRef(0)
  const totalLength = GAME_CONFIG.segmentLength * SEGMENTS.length
  const worldPosition = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, delta) => {
    if (distance.current + 0.01 < previousDistance.current) {
      handled.current.clear()
      previousAhead.current.clear()
    }
    previousDistance.current = distance.current
    const distanceMod = ((distance.current % totalLength) + totalLength) % totalLength
    const cycleStart = distance.current - distanceMod

    SEGMENTS.forEach((segment, segmentIndex) => {
      const handle = segmentRefs[segmentIndex]?.current
      if (!handle?.group) return
      let absoluteStart = cycleStart + segmentIndex * GAME_CONFIG.segmentLength
      if (absoluteStart < distance.current - GAME_CONFIG.segmentLength) absoluteStart += totalLength
      const segmentAhead = absoluteStart - distance.current
      handle.group.position.z = GAME_CONFIG.playerZ - segmentAhead
      const cycleIndex = Math.floor(absoluteStart / totalLength)
      const sceneryVariant = ((cycleIndex + segmentIndex) % SCENERY_VARIANT_COUNT + SCENERY_VARIANT_COUNT) % SCENERY_VARIANT_COUNT
      handle.sceneryVariants.forEach((variantGroup, variant) => {
        variantGroup.visible = variant === sceneryVariant
      })

      segment.entities.forEach((entity, entityIndex) => {
        const entityGroup = handle.entityGroups.get(entity.id)
        if (!entityGroup) return
        const absoluteEntityDistance = absoluteStart + entity.offset
        const ahead = absoluteEntityDistance - distance.current
        const key = `${Math.round(absoluteStart)}:${entity.id}`
        const isHandled = handled.current.has(key)
        const previousEntityAhead = previousAhead.current.get(key) ?? ahead
        if (!isHandled) previousAhead.current.set(key, ahead)
        const movement = entity.moving ? Math.sin(clock.elapsedTime * 1.35 + entityIndex) * 0.38 : 0
        const effectiveX = entity.lane * GAME_CONFIG.laneWidth + movement

        entityGroup.visible = !isHandled && ahead > -3 && ahead < 110
        entityGroup.position.x = THREE.MathUtils.damp(entityGroup.position.x, effectiveX, 6, delta)
        if (entity.kind !== 'obstacle') {
          entityGroup.rotation.y += delta * (entity.kind === 'powerup' ? 1.65 : 2.2)
          entityGroup.position.y = (entity.height ?? 1.15) + Math.sin(clock.elapsedTime * 3 + entityIndex) * 0.09
        }

        if (isHandled || phase !== 'playing') return
        const isBeam = entity.obstacleType === 'beam'
        const renderedX = entityGroup.position.x
        const xDifference = isBeam ? 0 : Math.abs(player.current.x - renderedX)

        if (entity.kind === 'sol') {
          const verticalDifference = Math.abs(player.current.y + 1 - (entity.height ?? 1.15))
          const crossedPickupZone = previousEntityAhead >= -0.78 && ahead <= 0.78
          const regularPickup = crossedPickupZone && xDifference < 0.92 && verticalDifference < 1.12
          const magneticPickup = magnetActive && ahead > -0.5 && ahead < 6.2 && xDifference < 4.1
          if (regularPickup || magneticPickup) {
            handled.current.add(key)
            previousAhead.current.delete(key)
            entityGroup.visible = false
            entityGroup.getWorldPosition(worldPosition)
            onCollectSol(entity, worldPosition.clone())
          }
          if (ahead < -0.9) {
            handled.current.add(key)
            previousAhead.current.delete(key)
          }
          return
        }

        if (entity.kind === 'powerup') {
          const crossedPickupZone = previousEntityAhead >= -0.82 && ahead <= 0.82
          if (crossedPickupZone && xDifference < 0.92) {
            handled.current.add(key)
            previousAhead.current.delete(key)
            entityGroup.visible = false
            entityGroup.getWorldPosition(worldPosition)
            onCollectPowerUp(entity, worldPosition.clone())
          }
          if (ahead < -0.95) {
            handled.current.add(key)
            previousAhead.current.delete(key)
          }
          return
        }

        if (entity.kind === 'obstacle') {
          const inCollisionWindow = previousEntityAhead >= -0.52 && ahead <= 0.62
          const laneCollision = xDifference < collisionThreshold
          const safelyJumping = entity.avoidance === 'jump' && player.current.y > 0.72
          const safelySliding = entity.avoidance === 'slide' && player.current.sliding
          const avoided = safelyJumping || safelySliding || !laneCollision

          if (inCollisionWindow && laneCollision && !avoided) {
            handled.current.add(key)
            previousAhead.current.delete(key)
            onObstacleHit(entity)
          } else if (ahead < -0.58) {
            handled.current.add(key)
            previousAhead.current.delete(key)
            if (laneCollision && avoided) onNearMiss()
          }
        }
      })
    })

    if (handled.current.size > 600) {
      const oldestAllowed = distance.current - totalLength * 2
      for (const key of handled.current) {
        const separator = key.indexOf(':')
        const start = Number(key.slice(0, separator))
        if (Number.isFinite(start) && start < oldestAllowed) {
          handled.current.delete(key)
          previousAhead.current.delete(key)
        }
      }
    }
  })

  return (
    <group>
      <mesh receiveShadow position={[0, -0.24, -45]} scale={[18, 0.16, 110]}>
        <boxGeometry />
        <meshStandardMaterial color="#111620" roughness={0.98} flatShading />
      </mesh>
      {SEGMENTS.map((definition, index) => (
        <TrackSegment
          key={definition.id}
          ref={segmentRefs[index]}
          definition={definition}
          initialPositionZ={GAME_CONFIG.playerZ - index * GAME_CONFIG.segmentLength}
        />
      ))}
    </group>
  )
}
