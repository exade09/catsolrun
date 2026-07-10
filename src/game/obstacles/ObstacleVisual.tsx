import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config/gameConfig'
import type { ObstacleType } from '../types/game'

interface ObstacleVisualProps {
  type: ObstacleType
  moving?: boolean
}

function WarningMark({ mode }: { mode: 'up' | 'down' | 'side' }) {
  const rotation = mode === 'up' ? 0 : mode === 'down' ? Math.PI : -Math.PI / 2
  return (
    <group position={[0, 0.12, 0.53]} rotation={[0, 0, rotation]}>
      <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.11, 0, 0]} scale={[0.06, 0.28, 0.03]}>
        <boxGeometry />
        <meshBasicMaterial color={COLORS.warning} toneMapped={false} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} position={[0.11, 0, 0]} scale={[0.06, 0.28, 0.03]}>
        <boxGeometry />
        <meshBasicMaterial color={COLORS.warning} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function ObstacleVisual({ type, moving = false }: ObstacleVisualProps) {
  const animated = useRef<THREE.Group>(null)

  useFrame(({ clock }, delta) => {
    if (!animated.current) return
    if (type === 'beam') animated.current.rotation.y += delta * 2.2
    if (type === 'roller') {
      animated.current.rotation.x -= delta * 3.4
      animated.current.position.y = 0.55 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.08
    }
    if (type === 'pulse') {
      const pulse = 1 + Math.sin(clock.elapsedTime * 5) * 0.08
      animated.current.scale.setScalar(pulse)
    }
    if (moving && type === 'crate') animated.current.rotation.y = Math.sin(clock.elapsedTime * 1.6) * 0.12
  })

  if (type === 'gate') {
    return (
      <group ref={animated}>
        <mesh castShadow position={[-0.78, 1.05, 0]} scale={[0.18, 1.08, 0.28]}>
          <boxGeometry />
          <meshStandardMaterial color={COLORS.concreteDark} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.78, 1.05, 0]} scale={[0.18, 1.08, 0.28]}>
          <boxGeometry />
          <meshStandardMaterial color={COLORS.concreteDark} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0, 1.72, 0]} scale={[0.96, 0.34, 0.3]}>
          <boxGeometry />
          <meshStandardMaterial color="#60666d" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0, 1.7, 0.32]} scale={[0.6, 0.08, 0.02]}>
          <boxGeometry />
          <meshBasicMaterial color={COLORS.cyan} toneMapped={false} />
        </mesh>
        <WarningMark mode="down" />
      </group>
    )
  }

  if (type === 'speakers') {
    return (
      <group ref={animated}>
        {[0.46, 1.2].map((height) => (
          <group key={height} position={[0, height, 0]}>
            <mesh castShadow scale={[0.72, 0.56, 0.42]}>
              <boxGeometry />
              <meshStandardMaterial color="#20242a" roughness={0.86} flatShading />
            </mesh>
            <mesh position={[0, 0, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, 10]} />
              <meshStandardMaterial color="#50565d" emissive={COLORS.purple} emissiveIntensity={0.18} />
            </mesh>
          </group>
        ))}
        <WarningMark mode="side" />
      </group>
    )
  }

  if (type === 'beam') {
    return (
      <group ref={animated} position={[0, 0.52, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 5.6, 8]} />
          <meshStandardMaterial color={COLORS.charcoal} roughness={0.65} flatShading />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.28, 0.34, 0.9, 8]} />
          <meshStandardMaterial color={COLORS.warning} emissive={COLORS.warning} emissiveIntensity={0.22} flatShading />
        </mesh>
        <WarningMark mode="up" />
      </group>
    )
  }

  if (type === 'gap') {
    return (
      <group ref={animated}>
        <mesh position={[0, 0.025, 0]} scale={[1.2, 0.04, 1.05]}>
          <boxGeometry />
          <meshStandardMaterial color="#10151a" roughness={1} />
        </mesh>
        {[-0.8, 0.8].map((z) => (
          <mesh key={z} position={[0, 0.06, z]} scale={[1.15, 0.035, 0.05]}>
            <boxGeometry />
            <meshBasicMaterial color={COLORS.warning} toneMapped={false} />
          </mesh>
        ))}
        <WarningMark mode="up" />
      </group>
    )
  }

  if (type === 'roller') {
    return (
      <group ref={animated} position={[0, 0.55, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <dodecahedronGeometry args={[0.68, 0]} />
          <meshStandardMaterial color="#555c63" roughness={0.7} metalness={0.15} flatShading />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.48, 0.06, 5, 10]} />
          <meshBasicMaterial color={COLORS.purple} toneMapped={false} />
        </mesh>
        <WarningMark mode="side" />
      </group>
    )
  }

  if (type === 'pulse') {
    return (
      <group ref={animated} position={[0, 0.9, 0]}>
        <mesh castShadow scale={[0.83, 0.85, 0.18]}>
          <boxGeometry />
          <meshStandardMaterial
            color={COLORS.purple}
            emissive={COLORS.purple}
            emissiveIntensity={0.45}
            transparent
            opacity={0.76}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0, 0.2]} scale={[0.54, 0.08, 0.02]}>
          <boxGeometry />
          <meshBasicMaterial color={COLORS.cyan} toneMapped={false} />
        </mesh>
        <WarningMark mode="side" />
      </group>
    )
  }

  if (type === 'platform') {
    return (
      <group ref={animated} position={[0, 0.24, 0]}>
        <mesh castShadow receiveShadow scale={[0.92, 0.22, 0.78]}>
          <boxGeometry />
          <meshStandardMaterial color="#525c65" metalness={0.22} roughness={0.65} flatShading />
        </mesh>
        <mesh position={[0, 0.24, 0]} scale={[0.7, 0.035, 0.58]}>
          <boxGeometry />
          <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.68} toneMapped={false} />
        </mesh>
        <WarningMark mode="side" />
      </group>
    )
  }

  const isWall = type === 'wall'
  const isCrate = type === 'crate'
  return (
    <group ref={animated} position={[0, isWall ? 0.34 : 0.48, 0]}>
      <mesh castShadow receiveShadow scale={isWall ? [1.12, 0.34, 0.34] : isCrate ? [0.64, 0.62, 0.58] : [0.83, 0.48, 0.42]}>
        {isCrate ? <dodecahedronGeometry args={[1, 0]} /> : <boxGeometry />}
        <meshStandardMaterial color={isCrate ? '#6c5b4b' : '#73797e'} roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.62]} scale={[0.52, 0.065, 0.025]}>
        <boxGeometry />
        <meshBasicMaterial color={COLORS.warning} toneMapped={false} />
      </mesh>
      <WarningMark mode={isCrate ? 'side' : 'up'} />
    </group>
  )
}
