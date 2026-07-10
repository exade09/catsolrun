import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config/gameConfig'

export function GameEnvironment({ reducedMotion }: { reducedMotion: boolean }) {
  const fragments = useRef<THREE.Group>(null)
  const reactiveLight = useRef<THREE.PointLight>(null)

  useFrame(({ clock }, delta) => {
    if (fragments.current && !reducedMotion) fragments.current.rotation.z += delta * 0.012
    if (reactiveLight.current) {
      reactiveLight.current.intensity = 7 + Math.sin(clock.elapsedTime * 3.2) * (reducedMotion ? 0.4 : 1.8)
    }
  })

  return (
    <>
      <color attach="background" args={['#15191e']} />
      <fog attach="fog" args={['#171d23', 13, 76]} />
      <ambientLight intensity={1.65} color="#d8e3e4" />
      <hemisphereLight intensity={1.15} color="#d8f7ff" groundColor="#282329" />
      <directionalLight
        castShadow
        color="#fff4dc"
        intensity={2.8}
        position={[7, 12, 8]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={12}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={34}
      />
      <pointLight ref={reactiveLight} color={COLORS.purple} intensity={7} distance={22} position={[-6, 4, -16]} />
      <pointLight color={COLORS.cyan} intensity={5} distance={20} position={[7, 2.5, -34]} />

      <group ref={fragments}>
        {Array.from({ length: 22 }, (_, index) => {
          const side = index % 2 === 0 ? -1 : 1
          const x = side * (5.8 + ((index * 17) % 24) / 10)
          const y = 0.8 + ((index * 31) % 48) / 10
          const z = -2 - ((index * 43) % 680) / 10
          const scale = 0.18 + ((index * 7) % 10) / 22
          return (
            <mesh key={index} position={[x, y, z]} rotation={[index, index * 0.37, index * 0.13]} scale={scale}>
              {index % 3 === 0 ? <tetrahedronGeometry /> : <octahedronGeometry />}
              <meshStandardMaterial
                color={index % 2 ? '#4d535a' : '#676d73'}
                emissive={index % 5 === 0 ? COLORS.purple : '#000000'}
                emissiveIntensity={0.16}
                roughness={0.8}
                flatShading
              />
            </mesh>
          )
        })}
      </group>
    </>
  )
}
