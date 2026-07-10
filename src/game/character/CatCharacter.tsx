import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config/gameConfig'
import type { PlayerRuntime } from '../types/game'

interface CatCharacterProps {
  runtime: React.MutableRefObject<PlayerRuntime>
  phase: string
  speed: React.MutableRefObject<number>
  collectionPulse: React.MutableRefObject<number>
}

interface CatMaterials {
  orange: THREE.MeshStandardMaterial
  orangeLight: THREE.MeshStandardMaterial
  cream: THREE.MeshStandardMaterial
  white: THREE.MeshStandardMaterial
  charcoal: THREE.MeshStandardMaterial
  gray: THREE.MeshStandardMaterial
  silver: THREE.MeshStandardMaterial
  display: THREE.MeshStandardMaterial
}

const makeMaterial = (color: string, roughness = 0.78, metalness = 0): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true })

const useCatMaterials = (): CatMaterials => {
  const materials = useMemo<CatMaterials>(
    () => ({
      orange: makeMaterial(COLORS.orange),
      orangeLight: makeMaterial(COLORS.orangeLight),
      cream: makeMaterial(COLORS.cream),
      white: makeMaterial(COLORS.white, 0.58),
      charcoal: makeMaterial(COLORS.charcoal, 0.9),
      gray: makeMaterial('#737981', 0.7, 0.08),
      silver: makeMaterial('#d8dde0', 0.42, 0.22),
      display: new THREE.MeshStandardMaterial({
        color: '#9de1ce',
        emissive: '#12574e',
        emissiveIntensity: 0.65,
        roughness: 0.36,
      }),
    }),
    [],
  )

  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])
  return materials
}

function Paw({ x, z, material }: { x: number; z: number; material: THREE.Material }) {
  return (
    <group position={[x, 0, z]}>
      <mesh material={material} castShadow position={[0, 0.28, 0]} scale={[0.26, 0.55, 0.25]}>
        <dodecahedronGeometry args={[0.5, 0]} />
      </mesh>
      <mesh material={material} castShadow position={[0, 0.04, -0.08]} scale={[0.3, 0.13, 0.42]}>
        <dodecahedronGeometry args={[0.5, 0]} />
      </mesh>
    </group>
  )
}

function Whiskers({ side, material }: { side: -1 | 1; material: THREE.Material }) {
  return (
    <group position={[side * 0.38, 1.58, -1.02]} scale-x={side}>
      {[-0.16, 0, 0.16].map((rotation, index) => (
        <mesh key={rotation} material={material} rotation={[0, 0, rotation]} position={[0.2, (index - 1) * 0.07, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.48, 5]} />
        </mesh>
      ))}
    </group>
  )
}

export function CatCharacter({ runtime, phase, speed, collectionPulse }: CatCharacterProps) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const headphones = useRef<THREE.Group>(null)
  const leftEar = useRef<THREE.Group>(null)
  const rightEar = useRef<THREE.Group>(null)
  const cable = useRef<THREE.Mesh>(null)
  const frontLeft = useRef<THREE.Group>(null)
  const frontRight = useRef<THREE.Group>(null)
  const backLeft = useRef<THREE.Group>(null)
  const backRight = useRef<THREE.Group>(null)
  const player = useRef<THREE.Group>(null)
  const materials = useCatMaterials()

  const cableCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.57, 1.67, -0.5),
        new THREE.Vector3(0.7, 1.0, -0.25),
        new THREE.Vector3(0.72, 0.45, 0.28),
        new THREE.Vector3(0.61, 0.4, 0.67),
      ]),
    [],
  )

  useFrame(({ clock }, delta) => {
    const rootGroup = root.current
    if (!rootGroup) return

    const now = clock.elapsedTime
    const isPlaying = phase === 'playing'
    const isGameOver = phase === 'gameover'
    const gait = now * Math.min(14, 7 + speed.current * 0.42)
    const runAmount = isPlaying ? 1 : 0.18
    const stride = Math.sin(gait) * 0.68 * runAmount
    const bob = Math.abs(Math.sin(gait)) * 0.065 * runAmount
    const slideScale = runtime.current.sliding ? 0.57 : 1
    collectionPulse.current = Math.max(0, collectionPulse.current - delta)
    const collect = collectionPulse.current

    rootGroup.position.x = runtime.current.x
    rootGroup.position.y = runtime.current.y + bob
    rootGroup.position.z = 2.2
    rootGroup.rotation.z = THREE.MathUtils.damp(
      rootGroup.rotation.z,
      isGameOver ? -1.12 : (runtime.current.lane * 2.55 - runtime.current.x) * -0.13,
      8,
      delta,
    )
    rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, runtime.current.sliding ? -0.18 : 0, 11, delta)
    const landingSquash = runtime.current.landingPulse * 0.13
    rootGroup.scale.y = THREE.MathUtils.damp(rootGroup.scale.y, slideScale - landingSquash + Math.min(0.1, collect * 0.5), 16, delta)
    rootGroup.scale.x = THREE.MathUtils.damp(rootGroup.scale.x, (runtime.current.sliding ? 1.13 : 1) + landingSquash * 0.55, 16, delta)

    if (body.current) body.current.rotation.x = Math.sin(gait) * 0.035 * runAmount
    if (head.current) {
      head.current.rotation.y = Math.sin(now * 1.7) * (isPlaying ? 0.025 : 0.075)
      head.current.rotation.x = runtime.current.grounded ? -0.02 : -runtime.current.verticalVelocity * 0.018
    }
    if (tail.current) {
      tail.current.rotation.y = Math.sin(now * 3.2) * 0.34
      tail.current.rotation.x = -0.5 + Math.sin(now * 2.1) * 0.11
    }
    if (headphones.current) {
      headphones.current.position.y = 0.025 + Math.abs(Math.sin(gait)) * 0.035 * runAmount
      headphones.current.rotation.z = Math.sin(now * 2.4) * 0.025
    }
    if (leftEar.current) leftEar.current.rotation.z = -0.15 + Math.sin(now * 2.7) * 0.035
    if (rightEar.current) rightEar.current.rotation.z = 0.15 - Math.sin(now * 2.7) * 0.035
    if (cable.current) cable.current.rotation.y = Math.sin(now * 3.4) * 0.035
    if (player.current) player.current.rotation.z = Math.sin(now * 2.3) * 0.04
    if (frontLeft.current) frontLeft.current.rotation.x = stride
    if (backRight.current) backRight.current.rotation.x = stride
    if (frontRight.current) frontRight.current.rotation.x = -stride
    if (backLeft.current) backLeft.current.rotation.x = -stride

    const hit = performance.now() / 1000 - runtime.current.damagedAt < 0.5
    materials.orange.emissive.set(hit ? COLORS.danger : '#000000')
    materials.orange.emissiveIntensity = hit ? 0.7 + Math.sin(now * 40) * 0.25 : 0
  })

  return (
    <group ref={root}>
      <group scale={0.86}>
        <group ref={body}>
          <mesh material={materials.orange} castShadow position={[0, 0.88, 0.12]} scale={[0.82, 1.18, 1.22]}>
            <dodecahedronGeometry args={[0.55, 1]} />
          </mesh>
          <mesh material={materials.cream} castShadow position={[0, 0.82, -0.46]} scale={[0.56, 0.88, 0.56]}>
            <dodecahedronGeometry args={[0.5, 1]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[-0.38, 1.08, 0.2]} scale={[0.22, 0.54, 0.52]} rotation={[0.15, 0, -0.22]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>
        </group>

        <group ref={head} position={[0, 1.52, -0.62]}>
          <mesh material={materials.orange} castShadow scale={[0.72, 0.64, 0.7]}>
            <dodecahedronGeometry args={[0.72, 1]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, 0.02, -0.52]} scale={[0.28, 0.53, 0.25]} rotation={[0.05, 0, 0.02]}>
            <dodecahedronGeometry args={[0.58, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[-0.28, -0.12, -0.5]} scale={[0.46, 0.34, 0.3]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>
          <mesh material={materials.cream} castShadow position={[0.28, -0.12, -0.5]} scale={[0.46, 0.34, 0.3]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>

          <group ref={leftEar} position={[-0.38, 0.48, -0.06]} rotation={[0.02, 0, -0.15]}>
            <mesh material={materials.orange} castShadow>
              <coneGeometry args={[0.29, 0.68, 3]} />
            </mesh>
            <mesh material={materials.cream} position={[0, -0.035, -0.035]} scale={0.56}>
              <coneGeometry args={[0.29, 0.68, 3]} />
            </mesh>
          </group>
          <group ref={rightEar} position={[0.38, 0.48, -0.06]} rotation={[0.02, 0, 0.15]}>
            <mesh material={materials.orange} castShadow>
              <coneGeometry args={[0.29, 0.68, 3]} />
            </mesh>
            <mesh material={materials.cream} position={[0, -0.035, -0.035]} scale={0.56}>
              <coneGeometry args={[0.29, 0.68, 3]} />
            </mesh>
          </group>

          <mesh material={materials.charcoal} position={[-0.25, 0.01, -0.66]} rotation={[0.2, 0, -0.1]} scale={[0.24, 0.025, 0.025]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.charcoal} position={[0.25, 0.01, -0.66]} rotation={[0.2, 0, 0.1]} scale={[0.24, 0.025, 0.025]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.orangeLight} castShadow position={[0, -0.19, -0.75]} rotation={[Math.PI / 4, 0, 0]} scale={[0.18, 0.12, 0.13]}>
            <octahedronGeometry args={[0.65, 0]} />
          </mesh>
          <mesh material={materials.charcoal} position={[0, -0.31, -0.69]} scale={[0.23, 0.05, 0.04]}>
            <boxGeometry />
          </mesh>
        </group>

        <group ref={headphones} position={[0, 1.5, -0.6]}>
          <mesh material={materials.white} rotation={[0, 0, 0]} position={[0, 0.24, 0.05]}>
            <torusGeometry args={[0.57, 0.07, 5, 12, Math.PI]} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.61, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
              <mesh material={materials.gray} castShadow>
                <cylinderGeometry args={[0.25, 0.27, 0.16, 8]} />
              </mesh>
              <mesh material={materials.white} castShadow position={[0, side * 0.1, 0]}>
                <cylinderGeometry args={[0.2, 0.22, 0.08, 8]} />
              </mesh>
            </group>
          ))}
        </group>

        <mesh material={materials.charcoal} castShadow position={[0, 1.17, -0.43]} scale={[0.7, 0.12, 0.56]}>
          <torusGeometry args={[0.45, 0.095, 5, 10]} />
        </mesh>

        <Whiskers side={-1} material={materials.silver} />
        <Whiskers side={1} material={materials.silver} />

        <group ref={frontLeft} position={[-0.34, 0.47, -0.48]}>
          <Paw x={0} z={0} material={materials.white} />
        </group>
        <group ref={frontRight} position={[0.34, 0.47, -0.48]}>
          <Paw x={0} z={0} material={materials.cream} />
        </group>
        <group ref={backLeft} position={[-0.38, 0.44, 0.56]}>
          <Paw x={0} z={0} material={materials.orange} />
        </group>
        <group ref={backRight} position={[0.38, 0.44, 0.56]}>
          <Paw x={0} z={0} material={materials.white} />
        </group>

        <group ref={tail} position={[-0.42, 0.87, 0.7]} rotation={[-0.52, 0, -0.4]}>
          <mesh material={materials.orange} castShadow position={[0, 0.15, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.18, 0.95, 7]} />
          </mesh>
          <mesh material={materials.cream} castShadow position={[0, 0.2, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.115, 0.5, 7]} />
          </mesh>
        </group>

        <mesh ref={cable} material={materials.charcoal} castShadow position={[0.62, 0.55, 0.62]} rotation={[0.05, 0.12, -0.08]}>
          <tubeGeometry args={[cableCurve, 18, 0.018, 5, false]} />
        </mesh>
        <group ref={player} position={[0.61, 0.44, 0.72]} rotation={[0, -0.12, 0]}>
          <mesh material={materials.silver} castShadow scale={[0.3, 0.44, 0.08]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.display} position={[0, 0.11, -0.09]} scale={[0.21, 0.12, 0.02]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.gray} position={[0, -0.13, -0.09]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.018, 6, 12]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
