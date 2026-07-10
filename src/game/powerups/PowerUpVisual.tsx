import { COLORS } from '../config/gameConfig'
import type { PowerUpType } from '../types/game'

const colors: Record<PowerUpType, string> = {
  magnet: COLORS.cyan,
  shield: '#78a9ff',
  rhythm: COLORS.purple,
  slowTime: '#fff08c',
  doubleSol: COLORS.green,
}

function PowerUpGlyph({ type }: { type: PowerUpType }) {
  if (type === 'shield') {
    return (
      <mesh position={[0, 0, 0.34]} rotation={[0, 0, Math.PI / 4]} scale={[0.22, 0.3, 0.04]}>
        <boxGeometry />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    )
  }
  if (type === 'magnet') {
    return (
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.19, 0.055, 5, 10, Math.PI]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    )
  }
  if (type === 'slowTime') {
    return (
      <group position={[0, 0, 0.35]}>
        <mesh>
          <torusGeometry args={[0.2, 0.035, 5, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0.05, 0.05, 0]} rotation={[0, 0, -0.6]} scale={[0.025, 0.14, 0.025]}>
          <boxGeometry />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[0, 0, 0.35]}>
      <mesh rotation={[0, 0, Math.PI / 4]} scale={[0.12, 0.3, 0.04]}>
        <boxGeometry />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} scale={[0.12, 0.3, 0.04]}>
        <boxGeometry />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

export function PowerUpVisual({ type }: { type: PowerUpType }) {
  const color = colors[type]
  return (
    <group>
      <mesh castShadow rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <dodecahedronGeometry args={[0.43, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          metalness={0.32}
          roughness={0.28}
          flatShading
        />
      </mesh>
      <PowerUpGlyph type={type} />
      <mesh scale={0.62}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  )
}
