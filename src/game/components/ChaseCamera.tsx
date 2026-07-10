import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GAME_CONFIG } from '../config/gameConfig'
import type { PlayerRuntime } from '../types/game'

interface ChaseCameraProps {
  player: React.MutableRefObject<PlayerRuntime>
  speed: React.MutableRefObject<number>
  reducedMotion: boolean
}

export function ChaseCamera({ player, speed, reducedMotion }: ChaseCameraProps) {
  const camera = useThree((state) => state.camera)
  const targetPosition = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const runtime = player.current
    const landingImpulse = reducedMotion ? 0 : runtime.landingPulse * 0.18
    targetPosition.set(runtime.x * 0.3, 4.45 + runtime.y * 0.22 - landingImpulse, 8.35)
    camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 5.4))
    lookTarget.set(runtime.x * 0.2, 1.05 + runtime.y * 0.1, -4.8)
    camera.lookAt(lookTarget)

    if (!reducedMotion) {
      const laneLean = (runtime.lane * GAME_CONFIG.laneWidth - runtime.x) * -0.008
      camera.rotateZ(laneLean)
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const speedRatio = THREE.MathUtils.clamp(
        (speed.current - GAME_CONFIG.baseSpeed) / (GAME_CONFIG.maxSpeed - GAME_CONFIG.baseSpeed),
        0,
        1,
      )
      const targetFov = 52 + (reducedMotion ? 3 : 10) * speedRatio
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 3.5, delta)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
