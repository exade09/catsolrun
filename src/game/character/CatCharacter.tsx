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
  pink: THREE.MeshStandardMaterial
  charcoal: THREE.MeshStandardMaterial
  gray: THREE.MeshStandardMaterial
  silver: THREE.MeshStandardMaterial
}

const BASE_HEAD_Y = 1.57
const BASE_HEAD_Z = -0.84

const makeMaterial = (color: string, roughness = 0.78, metalness = 0): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true })

const useCatMaterials = (): CatMaterials => {
  const materials = useMemo<CatMaterials>(
    () => ({
      orange: makeMaterial(COLORS.orange),
      orangeLight: makeMaterial(COLORS.orangeLight),
      cream: makeMaterial(COLORS.cream),
      white: makeMaterial(COLORS.white, 0.58),
      pink: makeMaterial('#d9938c', 0.72),
      charcoal: makeMaterial(COLORS.charcoal, 0.9),
      gray: makeMaterial('#737981', 0.7, 0.08),
      silver: makeMaterial('#d8dde0', 0.42, 0.22),
    }),
    [],
  )

  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])
  return materials
}

interface LegProps {
  legMaterial: THREE.Material
  pawMaterial: THREE.Material
}

function Leg({ legMaterial, pawMaterial }: LegProps) {
  return (
    <group>
      <mesh material={legMaterial} castShadow position={[0, -0.27, 0]} scale={[0.28, 0.56, 0.28]}>
        <dodecahedronGeometry args={[0.5, 0]} />
      </mesh>
      <mesh material={pawMaterial} castShadow position={[0, -0.56, -0.09]} scale={[0.33, 0.18, 0.45]}>
        <dodecahedronGeometry args={[0.5, 0]} />
      </mesh>
    </group>
  )
}

interface TailSectionProps {
  material: THREE.Material
  position: [number, number, number]
  rotation: [number, number, number]
  length: number
  radius: number
}

function TailSection({ material, position, rotation, length, radius }: TailSectionProps) {
  return (
    <mesh material={material} castShadow position={position} rotation={rotation}>
      <cylinderGeometry args={[radius * 0.82, radius, length, 7]} />
    </mesh>
  )
}

function Whiskers({ side, material }: { side: -1 | 1; material: THREE.Material }) {
  return (
    <group position={[side * 0.35, -0.07, -0.53]} scale={[side, 1, 1]}>
      {[-0.14, 0, 0.14].map((angle, index) => (
        <mesh
          key={angle}
          material={material}
          position={[0.2, (index - 1) * 0.06, 0]}
          rotation={[0, 0, Math.PI / 2 + angle]}
        >
          <cylinderGeometry args={[0.007, 0.007, 0.46, 5]} />
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
  const frontLeft = useRef<THREE.Group>(null)
  const frontRight = useRef<THREE.Group>(null)
  const backLeft = useRef<THREE.Group>(null)
  const backRight = useRef<THREE.Group>(null)
  const materials = useCatMaterials()

  useFrame(({ clock }, delta) => {
    const rootGroup = root.current
    if (!rootGroup) return

    const now = clock.elapsedTime
    const isPlaying = phase === 'playing'
    const isGameOver = phase === 'gameover'
    const gait = now * Math.min(14, 7 + speed.current * 0.42)
    const runAmount = isPlaying ? 1 : 0.16
    const stride = Math.sin(gait) * 0.66 * runAmount
    const bob = Math.abs(Math.sin(gait)) * 0.06 * runAmount
    const sliding = runtime.current.sliding
    const airborne = !runtime.current.grounded
    const slideScale = sliding ? 0.59 : 1
    collectionPulse.current = Math.max(0, collectionPulse.current - delta)
    const collect = collectionPulse.current
    const hit = performance.now() / 1000 - runtime.current.damagedAt < 0.5

    rootGroup.position.x = runtime.current.x
    rootGroup.position.y = runtime.current.y + bob
    rootGroup.position.z = 2.2
    rootGroup.rotation.z = THREE.MathUtils.damp(
      rootGroup.rotation.z,
      isGameOver ? -1.12 : (runtime.current.lane * 2.55 - runtime.current.x) * -0.13,
      8,
      delta,
    )
    rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, sliding ? -0.2 : 0, 11, delta)

    const landingSquash = runtime.current.landingPulse * 0.13
    rootGroup.scale.y = THREE.MathUtils.damp(
      rootGroup.scale.y,
      slideScale - landingSquash + Math.min(0.1, collect * 0.5),
      16,
      delta,
    )
    rootGroup.scale.x = THREE.MathUtils.damp(
      rootGroup.scale.x,
      (sliding ? 1.11 : 1) + landingSquash * 0.55,
      16,
      delta,
    )
    rootGroup.scale.z = THREE.MathUtils.damp(rootGroup.scale.z, sliding ? 1.08 : 1, 16, delta)

    if (body.current) {
      body.current.rotation.x = THREE.MathUtils.damp(
        body.current.rotation.x,
        Math.sin(gait) * 0.035 * runAmount + (airborne ? 0.06 : 0),
        12,
        delta,
      )
    }

    if (head.current) {
      head.current.position.y = THREE.MathUtils.damp(
        head.current.position.y,
        BASE_HEAD_Y - (sliding ? 0.17 : 0) + Math.min(0.08, collect * 0.38),
        12,
        delta,
      )
      head.current.position.z = THREE.MathUtils.damp(
        head.current.position.z,
        BASE_HEAD_Z + (sliding ? 0.12 : 0),
        12,
        delta,
      )
      head.current.rotation.y = Math.sin(now * 1.7) * (isPlaying ? 0.025 : 0.075)
      head.current.rotation.x = runtime.current.grounded ? -0.015 : -runtime.current.verticalVelocity * 0.018
      head.current.rotation.z = THREE.MathUtils.damp(
        head.current.rotation.z,
        hit ? Math.sin(now * 38) * 0.08 : isGameOver ? -0.18 : 0,
        18,
        delta,
      )
    }

    if (tail.current) {
      tail.current.rotation.y = THREE.MathUtils.damp(
        tail.current.rotation.y,
        Math.sin(now * 3.15) * 0.31 + rootGroup.rotation.z * 0.22,
        7,
        delta,
      )
      tail.current.rotation.x = THREE.MathUtils.damp(
        tail.current.rotation.x,
        -0.08 + Math.sin(now * 2.05) * 0.09 + (airborne ? -0.16 : 0),
        7,
        delta,
      )
    }

    if (headphones.current) {
      headphones.current.position.y = THREE.MathUtils.damp(
        headphones.current.position.y,
        Math.abs(Math.sin(gait)) * 0.035 * runAmount,
        14,
        delta,
      )
      headphones.current.rotation.z = Math.sin(now * 2.4) * 0.025
    }

    if (leftEar.current) leftEar.current.rotation.z = -0.12 + Math.sin(now * 2.7) * 0.035
    if (rightEar.current) rightEar.current.rotation.z = 0.12 - Math.sin(now * 2.7) * 0.035

    const frontTuck = airborne ? -0.52 : sliding ? -0.72 : 0
    const backTuck = airborne ? 0.56 : sliding ? 0.68 : 0
    if (frontLeft.current) {
      frontLeft.current.rotation.x = THREE.MathUtils.damp(frontLeft.current.rotation.x, stride + frontTuck, 18, delta)
    }
    if (backRight.current) {
      backRight.current.rotation.x = THREE.MathUtils.damp(backRight.current.rotation.x, stride + backTuck, 18, delta)
    }
    if (frontRight.current) {
      frontRight.current.rotation.x = THREE.MathUtils.damp(frontRight.current.rotation.x, -stride + frontTuck, 18, delta)
    }
    if (backLeft.current) {
      backLeft.current.rotation.x = THREE.MathUtils.damp(backLeft.current.rotation.x, -stride + backTuck, 18, delta)
    }

    materials.orange.emissive.set(hit ? COLORS.danger : '#000000')
    materials.orange.emissiveIntensity = hit ? 0.7 + Math.sin(now * 40) * 0.25 : 0
    materials.orangeLight.emissive.set(hit ? COLORS.danger : '#000000')
    materials.orangeLight.emissiveIntensity = hit ? 0.42 + Math.sin(now * 40) * 0.18 : 0
  })

  return (
    <group ref={root}>
      <group scale={0.88}>
        <group ref={body}>
          <mesh material={materials.cream} castShadow position={[0, 0.93, 0.12]} scale={[0.7, 0.68, 1.24]}>
            <dodecahedronGeometry args={[0.72, 1]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, 0.66, 0.14]} scale={[0.65, 0.33, 1.08]}>
            <dodecahedronGeometry args={[0.67, 1]} />
          </mesh>
          <mesh material={materials.orange} castShadow position={[0, 1.22, -0.38]} scale={[0.86, 0.48, 0.9]} rotation={[0.03, 0, 0]}>
            <dodecahedronGeometry args={[0.55, 0]} />
          </mesh>
          <mesh material={materials.orangeLight} castShadow position={[0, 1.18, 0.53]} scale={[0.9, 0.52, 0.86]} rotation={[-0.04, 0, 0]}>
            <dodecahedronGeometry args={[0.55, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, 1.04, -0.7]} scale={[0.78, 0.75, 0.48]}>
            <dodecahedronGeometry args={[0.58, 1]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, 1.3, -0.64]} scale={[0.59, 0.58, 0.52]}>
            <dodecahedronGeometry args={[0.58, 1]} />
          </mesh>
        </group>

        <group ref={head} position={[0, BASE_HEAD_Y, BASE_HEAD_Z]}>
          <mesh material={materials.orange} castShadow scale={[0.78, 0.69, 0.73]}>
            <dodecahedronGeometry args={[0.72, 1]} />
          </mesh>

          <mesh material={materials.white} castShadow position={[0, 0.2, -0.51]} scale={[0.24, 0.5, 0.17]}>
            <dodecahedronGeometry args={[0.58, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, -0.03, -0.57]} scale={[0.18, 0.36, 0.14]}>
            <dodecahedronGeometry args={[0.58, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[-0.28, -0.14, -0.51]} scale={[0.5, 0.37, 0.31]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0.28, -0.14, -0.51]} scale={[0.5, 0.37, 0.31]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, -0.31, -0.39]} scale={[0.48, 0.24, 0.37]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>

          <group ref={leftEar} position={[-0.39, 0.48, -0.04]} rotation={[0.02, 0, -0.12]}>
            <mesh material={materials.orange} castShadow>
              <coneGeometry args={[0.3, 0.7, 3]} />
            </mesh>
            <mesh material={materials.pink} position={[0, -0.035, -0.035]} scale={0.56}>
              <coneGeometry args={[0.3, 0.7, 3]} />
            </mesh>
          </group>
          <group ref={rightEar} position={[0.39, 0.48, -0.04]} rotation={[0.02, 0, 0.12]}>
            <mesh material={materials.orange} castShadow>
              <coneGeometry args={[0.3, 0.7, 3]} />
            </mesh>
            <mesh material={materials.pink} position={[0, -0.035, -0.035]} scale={0.56}>
              <coneGeometry args={[0.3, 0.7, 3]} />
            </mesh>
          </group>

          <mesh material={materials.charcoal} position={[-0.25, 0.01, -0.6]} rotation={[0.18, 0, -0.1]} scale={[0.23, 0.024, 0.025]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.charcoal} position={[0.25, 0.01, -0.6]} rotation={[0.18, 0, 0.1]} scale={[0.23, 0.024, 0.025]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.pink} castShadow position={[0, -0.2, -0.69]} rotation={[Math.PI / 4, 0, 0]} scale={[0.17, 0.12, 0.13]}>
            <octahedronGeometry args={[0.65, 0]} />
          </mesh>
          <mesh material={materials.white} castShadow position={[0, -0.29, -0.58]} scale={[0.24, 0.12, 0.16]}>
            <dodecahedronGeometry args={[0.5, 0]} />
          </mesh>
          <mesh material={materials.charcoal} position={[0, -0.35, -0.64]} scale={[0.23, 0.045, 0.035]}>
            <boxGeometry />
          </mesh>
          <group ref={headphones}>
            <mesh material={materials.white} position={[0, 0.28, 0.06]}>
              <torusGeometry args={[0.59, 0.07, 5, 12, Math.PI]} />
            </mesh>
            <mesh material={materials.silver} position={[0, 0.28, 0.065]} scale={[0.88, 0.88, 0.72]}>
              <torusGeometry args={[0.59, 0.035, 5, 12, Math.PI]} />
            </mesh>
            {([-1, 1] as const).map((side) => (
              <group key={side} position={[side * 0.67, -0.07, 0.02]} rotation={[0, 0, Math.PI / 2]}>
                <mesh material={materials.white} castShadow>
                  <cylinderGeometry args={[0.29, 0.31, 0.18, 8]} />
                </mesh>
                <mesh material={materials.gray} castShadow position={[0, -side * 0.1, 0]}>
                  <cylinderGeometry args={[0.22, 0.24, 0.1, 8]} />
                </mesh>
                <mesh material={materials.silver} position={[0, -side * 0.158, 0]}>
                  <cylinderGeometry args={[0.13, 0.15, 0.025, 8]} />
                </mesh>
              </group>
            ))}
          </group>

          <mesh material={materials.charcoal} castShadow position={[0, -0.27, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.43, 0.075, 5, 12]} />
          </mesh>

          <Whiskers side={-1} material={materials.silver} />
          <Whiskers side={1} material={materials.silver} />
        </group>

        <group ref={frontLeft} position={[-0.34, 0.67, -0.55]}>
          <Leg legMaterial={materials.cream} pawMaterial={materials.white} />
        </group>
        <group ref={frontRight} position={[0.34, 0.67, -0.55]}>
          <Leg legMaterial={materials.white} pawMaterial={materials.white} />
        </group>
        <group ref={backLeft} position={[-0.36, 0.65, 0.62]}>
          <Leg legMaterial={materials.cream} pawMaterial={materials.white} />
        </group>
        <group ref={backRight} position={[0.36, 0.65, 0.62]}>
          <Leg legMaterial={materials.white} pawMaterial={materials.white} />
        </group>

        <group ref={tail} position={[-0.16, 0.92, 0.94]}>
          <TailSection material={materials.orange} position={[0, -0.02, 0.22]} rotation={[1.52, 0, 0]} length={0.48} radius={0.16} />
          <TailSection material={materials.cream} position={[0, -0.1, 0.61]} rotation={[1.78, 0, 0]} length={0.42} radius={0.145} />
          <TailSection material={materials.orangeLight} position={[0, -0.22, 0.96]} rotation={[1.9, 0, 0]} length={0.4} radius={0.13} />
          <TailSection material={materials.cream} position={[0, -0.36, 1.29]} rotation={[2, 0, 0]} length={0.36} radius={0.115} />
          <mesh material={materials.orange} castShadow position={[0, -0.48, 1.54]} scale={[0.13, 0.13, 0.28]} rotation={[0.18, 0, 0]}>
            <dodecahedronGeometry args={[0.65, 0]} />
          </mesh>
        </group>

      </group>
    </group>
  )
}
