import { COLORS } from '../config/gameConfig'

export function SolCollectible() {
  return (
    <group>
      <mesh castShadow rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color={COLORS.charcoal}
          emissive={COLORS.purple}
          emissiveIntensity={0.28}
          metalness={0.48}
          roughness={0.28}
          flatShading
        />
      </mesh>
      <group position={[0, 0, 0.3]} rotation={[0, 0, -0.22]}>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.4, 0.075, 0.045]} />
          <meshBasicMaterial color={COLORS.purple} toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.4, 0.075, 0.045]} />
          <meshBasicMaterial color={COLORS.cyan} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.4, 0.075, 0.045]} />
          <meshBasicMaterial color={COLORS.green} toneMapped={false} />
        </mesh>
      </group>
      <mesh scale={0.5}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  )
}
