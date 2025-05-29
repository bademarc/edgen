"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"
import { inSphere } from "maath/random"

export function ModernBackground({ count = 5000 }) {
  const ref = useRef<THREE.Points>(null)

  // Generate random points within a sphere
  const particles = useMemo(() => {
    return new Float32Array(count * 3)
  }, [count])

  // Fill the array with random positions
  useMemo(() => {
    inSphere(particles, { radius: 1.5 })
  }, [particles])

  useFrame((state, delta) => {
    if (!ref.current) return

    // Rotate the point cloud
    ref.current.rotation.x = state.clock.elapsedTime * 0.05
    ref.current.rotation.y = state.clock.elapsedTime * 0.03

    // Create a wave effect by manipulating the position of points
    const positions = ref.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]

      // Create a grid-like wave pattern (non-circular)
      const time = state.clock.elapsedTime
      const offset = Math.sin(x * 2 + time) * 0.05 + Math.sin(z * 2 + time) * 0.05

      positions[i + 1] = y + offset
    }

    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#f7931a"
        size={0.01}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

export function GridLines() {
  const gridRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!gridRef.current) return

    // Subtle rotation for the grid
    gridRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    gridRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.1) * 0.1
  })

  return (
    <group ref={gridRef}>
      {/* Horizontal grid lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h-${i}`}>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([-2, (i - 10) * 0.2, 0, 2, (i - 10) * 0.2, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial attach="material" color="#f7931a" transparent opacity={0.1} />
        </line>
      ))}

      {/* Vertical grid lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`v-${i}`}>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([(i - 10) * 0.2, -2, 0, (i - 10) * 0.2, 2, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial attach="material" color="#f7931a" transparent opacity={0.1} />
        </line>
      ))}
    </group>
  )
}
