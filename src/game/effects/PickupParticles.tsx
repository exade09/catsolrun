import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config/gameConfig'
import type { ParticleBurstHandle } from '../types/game'

const PARTICLE_COUNT = 90

interface ParticleState {
  active: boolean
  life: number
  velocity: THREE.Vector3
  color: THREE.Color
}

export const PickupParticles = forwardRef<ParticleBurstHandle>(function PickupParticles(_, forwardedRef) {
  const points = useRef<THREE.Points>(null)
  const cursor = useRef(0)
  const positions = useMemo(() => {
    const buffer = new Float32Array(PARTICLE_COUNT * 3)
    for (let index = 0; index < PARTICLE_COUNT; index += 1) buffer[index * 3 + 1] = -100
    return buffer
  }, [])
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const particles = useMemo<ParticleState[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        active: false,
        life: 0,
        velocity: new THREE.Vector3(),
        color: new THREE.Color(COLORS.cyan),
      })),
    [],
  )

  useImperativeHandle(
    forwardedRef,
    () => ({
      burst(x, y, z, color = COLORS.cyan) {
        for (let index = 0; index < 12; index += 1) {
          const particleIndex = cursor.current % PARTICLE_COUNT
          cursor.current += 1
          const particle = particles[particleIndex]
          if (!particle) continue
          particle.active = true
          particle.life = 0.55 + Math.random() * 0.3
          particle.velocity.set(
            (Math.random() - 0.5) * 3.8,
            Math.random() * 3.2 + 0.5,
            (Math.random() - 0.5) * 2.4,
          )
          particle.color.set(color)
          positions[particleIndex * 3] = x
          positions[particleIndex * 3 + 1] = y
          positions[particleIndex * 3 + 2] = z
          colors[particleIndex * 3] = particle.color.r
          colors[particleIndex * 3 + 1] = particle.color.g
          colors[particleIndex * 3 + 2] = particle.color.b
        }
      },
    }),
    [colors, particles, positions],
  )

  useFrame((_, delta) => {
    let changed = false
    particles.forEach((particle, index) => {
      if (!particle.active) return
      particle.life -= delta
      if (particle.life <= 0) {
        particle.active = false
        positions[index * 3 + 1] = -100
        changed = true
        return
      }
      particle.velocity.y -= delta * 5
      positions[index * 3] += particle.velocity.x * delta
      positions[index * 3 + 1] += particle.velocity.y * delta
      positions[index * 3 + 2] += particle.velocity.z * delta
      changed = true
    })
    if (changed && points.current) {
      const positionAttribute = points.current.geometry.getAttribute('position')
      positionAttribute.needsUpdate = true
      const colorAttribute = points.current.geometry.getAttribute('color')
      colorAttribute.needsUpdate = true
    }
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.13} vertexColors transparent opacity={0.9} depthWrite={false} sizeAttenuation />
    </points>
  )
})
