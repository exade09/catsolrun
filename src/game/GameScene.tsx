import { useCallback, useEffect, useRef } from 'react'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CatCharacter } from './character/CatCharacter'
import { ChaseCamera } from './components/ChaseCamera'
import { GAME_CONFIG } from './config/gameConfig'
import { PickupParticles } from './effects/PickupParticles'
import { SpeedLines } from './effects/SpeedLines'
import { audioSystem } from './systems/audio'
import { useGameInput } from './systems/useGameInput'
import type { ParticleBurstHandle, PlayerRuntime, TrackEntity } from './types/game'
import { GameEnvironment } from './world/GameEnvironment'
import { TrackManager } from './world/TrackManager'
import { useGameStore } from '../stores/gameStore'

const initialPlayer = (): PlayerRuntime => ({
  lane: 0,
  x: 0,
  y: 0,
  verticalVelocity: 0,
  grounded: true,
  sliding: false,
  landingPulse: 0,
  damagedAt: -100,
})

export function GameScene() {
  const phase = useGameStore((state) => state.phase)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const activePowerUp = useGameStore((state) => state.activePowerUp)
  const updateRun = useGameStore((state) => state.updateRun)
  const collectSol = useGameStore((state) => state.collectSol)
  const registerNearMiss = useGameStore((state) => state.registerNearMiss)
  const activatePowerUp = useGameStore((state) => state.activatePowerUp)
  const consumeShield = useGameStore((state) => state.consumeShield)
  const breakCombo = useGameStore((state) => state.breakCombo)
  const endGame = useGameStore((state) => state.endGame)
  const { consumeNextReadyInput, clearInputs } = useGameInput({ enabled: true })
  const player = useRef<PlayerRuntime>(initialPlayer())
  const distance = useRef(0)
  const elapsed = useRef(0)
  const speed = useRef<number>(GAME_CONFIG.baseSpeed)
  const slideRemaining = useRef(0)
  const storeSyncTimer = useRef(0)
  const distanceScore = useRef(0)
  const lastPickupAt = useRef(-100)
  const hitGraceUntil = useRef(0)
  const footstepTimer = useRef(0)
  const particles = useRef<ParticleBurstHandle>(null)
  const collectionPulse = useRef(0)

  useEffect(() => {
    if (phase === 'countdown' || phase === 'restarting' || phase === 'menu') {
      player.current = initialPlayer()
      distance.current = 0
      elapsed.current = 0
      speed.current = GAME_CONFIG.baseSpeed
      slideRemaining.current = 0
      storeSyncTimer.current = 0
      distanceScore.current = 0
      lastPickupAt.current = -100
      hitGraceUntil.current = 0
      clearInputs()
    }
    if (phase === 'playing') audioSystem.startMusic()
    else audioSystem.stopMusic()
  }, [clearInputs, phase])

  const handleCollectSol = useCallback(
    (_entity: TrackEntity, position: THREE.Vector3) => {
      collectSol(1)
      lastPickupAt.current = elapsed.current
      collectionPulse.current = 0.28
      particles.current?.burst(position.x, position.y, position.z)
      audioSystem.play('sol')
    },
    [collectSol],
  )

  const handleCollectPowerUp = useCallback(
    (entity: TrackEntity, position: THREE.Vector3) => {
      if (!entity.powerUpType) return
      activatePowerUp(entity.powerUpType)
      particles.current?.burst(position.x, position.y, position.z, '#9945ff')
      audioSystem.play('powerup')
    },
    [activatePowerUp],
  )

  const handleObstacleHit = useCallback(
    (_entity: TrackEntity) => {
      if (useGameStore.getState().phase !== 'playing' || elapsed.current < hitGraceUntil.current) return
      player.current.damagedAt = performance.now() / 1000
      breakCombo()
      if (consumeShield()) {
        hitGraceUntil.current = elapsed.current + GAME_CONFIG.collisionGrace
        particles.current?.burst(player.current.x, player.current.y + 1, GAME_CONFIG.playerZ, '#78a9ff')
        audioSystem.play('shield')
        return
      }
      const current = useGameStore.getState()
      updateRun({
        distance: distance.current,
        elapsedTime: elapsed.current,
        speed: speed.current,
        score: current.score + Math.floor(distanceScore.current),
      })
      distanceScore.current = 0
      hitGraceUntil.current = Number.POSITIVE_INFINITY
      audioSystem.play('collision')
      endGame()
      window.setTimeout(() => audioSystem.play('gameover'), 180)
    },
    [breakCombo, consumeShield, endGame, updateRun],
  )

  const handleNearMiss = useCallback(() => {
    registerNearMiss()
    audioSystem.play('nearMiss')
  }, [registerNearMiss])

  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05)
    const runtime = player.current
    if (phase !== 'playing') {
      runtime.landingPulse = Math.max(0, runtime.landingPulse - delta * 3.5)
      return
    }

    const command = consumeNextReadyInput((queued) =>
      queued === 'left' || queued === 'right' || runtime.grounded,
    )
    if (command === 'left') runtime.lane = Math.max(-1, runtime.lane - 1) as -1 | 0 | 1
    if (command === 'right') runtime.lane = Math.min(1, runtime.lane + 1) as -1 | 0 | 1
    if (command === 'jump') {
      runtime.verticalVelocity = GAME_CONFIG.jumpVelocity
      runtime.grounded = false
      runtime.sliding = false
      slideRemaining.current = 0
      audioSystem.play('jump')
    }
    if (command === 'slide') {
      runtime.sliding = true
      slideRemaining.current = GAME_CONFIG.slideDuration
      audioSystem.play('ui')
    }

    const targetX = runtime.lane * GAME_CONFIG.laneWidth
    runtime.x = THREE.MathUtils.damp(runtime.x, targetX, GAME_CONFIG.laneLerp, delta)
    if (!runtime.grounded) {
      runtime.verticalVelocity -= GAME_CONFIG.gravity * delta
      runtime.y += runtime.verticalVelocity * delta
      if (runtime.y <= 0) {
        runtime.y = 0
        runtime.verticalVelocity = 0
        runtime.grounded = true
        runtime.landingPulse = 1
        audioSystem.play('land')
      }
    }
    if (runtime.sliding) {
      slideRemaining.current -= delta
      if (slideRemaining.current <= 0) runtime.sliding = false
    }
    runtime.landingPulse = Math.max(0, runtime.landingPulse - delta * 3.7)

    elapsed.current += delta
    speed.current = Math.min(
      GAME_CONFIG.maxSpeed,
      GAME_CONFIG.baseSpeed + elapsed.current * GAME_CONFIG.speedRampPerSecond,
    )
    const slowed = activePowerUp?.type === 'slowTime' && activePowerUp.expiresAt > Date.now()
    const effectiveSpeed = slowed ? speed.current * 0.72 : speed.current
    const distanceDelta = effectiveSpeed * delta
    distance.current += distanceDelta
    const rhythm = activePowerUp?.type === 'rhythm' && activePowerUp.expiresAt > Date.now() ? 2 : 1
    distanceScore.current += distanceDelta * (10 + speed.current * 0.35) * rhythm

    if (elapsed.current - lastPickupAt.current > GAME_CONFIG.comboWindow) {
      const currentCombo = useGameStore.getState().combo
      if (currentCombo > 0) breakCombo()
      lastPickupAt.current = -100
    }

    footstepTimer.current -= delta
    if (runtime.grounded && !runtime.sliding && footstepTimer.current <= 0) {
      audioSystem.play('footstep')
      footstepTimer.current = Math.max(0.18, 0.36 - speed.current * 0.006)
    }

    storeSyncTimer.current += delta
    if (storeSyncTimer.current >= 0.1) {
      const current = useGameStore.getState()
      updateRun({
        distance: distance.current,
        elapsedTime: elapsed.current,
        speed: speed.current,
        score: current.score + Math.floor(distanceScore.current),
      })
      distanceScore.current = 0
      storeSyncTimer.current = 0
    }
  })

  const magnetActive = activePowerUp?.type === 'magnet' && activePowerUp.expiresAt > Date.now()

  return (
    <>
      <GameEnvironment reducedMotion={reducedMotion} />
      <Physics gravity={[0, -GAME_CONFIG.gravity, 0]} timeStep="vary" paused={phase !== 'playing'}>
        <RigidBody type="fixed" colliders={false} position={[0, -0.2, 0]}>
          <CuboidCollider args={[4.4, 0.1, 72]} />
        </RigidBody>
      </Physics>
      <TrackManager
        phase={phase}
        distance={distance}
        player={player}
        magnetActive={magnetActive}
        onCollectSol={handleCollectSol}
        onCollectPowerUp={handleCollectPowerUp}
        onObstacleHit={handleObstacleHit}
        onNearMiss={handleNearMiss}
      />
      <CatCharacter runtime={player} phase={phase} speed={speed} collectionPulse={collectionPulse} />
      <PickupParticles ref={particles} />
      <SpeedLines speed={speed} visible={phase === 'playing' && !reducedMotion} />
      <ChaseCamera player={player} speed={speed} reducedMotion={reducedMotion} />
    </>
  )
}
