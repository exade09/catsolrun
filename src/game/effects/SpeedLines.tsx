import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, GAME_CONFIG } from '../config/gameConfig'

export function SpeedLines({ speed, visible }: { speed: React.MutableRefObject<number>; visible: boolean }) {
  const group = useRef<THREE.Group>(null)
  const lines = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        x: ((index * 37) % 100) / 10 - 5,
        y: 0.35 + ((index * 53) % 35) / 10,
        z: -((index * 71) % 180) / 10,
        length: 0.35 + ((index * 13) % 10) / 10,
      })),
    [],
  )

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.visible = visible && speed.current > GAME_CONFIG.baseSpeed + 4
    if (!group.current.visible) return
    group.current.children.forEach((child) => {
      child.position.z += delta * speed.current * 1.8
      if (child.position.z > 5) child.position.z -= 24
    })
  })

  return (
    <group ref={group} visible={visible}>
      {lines.map((line, index) => (
        <mesh key={index} position={[line.x, line.y, line.z]} scale={[0.012, 0.012, line.length]}>
          <boxGeometry />
          <meshBasicMaterial color={index % 2 ? COLORS.cyan : COLORS.purple} transparent opacity={0.26} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
