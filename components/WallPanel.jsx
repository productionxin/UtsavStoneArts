import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function WallPanel({ position = [0, 0, 0], scale = 1, mouseRef }) {
  const groupRef = useRef()
  const innerRingRef = useRef()
  const outerRingRef = useRef()

  const stoneMat = new THREE.MeshStandardMaterial({ color: '#D4C4A8', roughness: 0.7, metalness: 0 })
  const goldMat = new THREE.MeshStandardMaterial({ color: '#C4A057', roughness: 0.15, metalness: 0.9 })
  const lightStoneMat = new THREE.MeshStandardMaterial({ color: '#E0D0B8', roughness: 0.6, metalness: 0 })

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (mouseRef?.current) {
      groupRef.current.rotation.y +=
        (mouseRef.current.nx * 0.6 - groupRef.current.rotation.y) * 0.04
      groupRef.current.rotation.x +=
        (mouseRef.current.ny * 0.3 - groupRef.current.rotation.x) * 0.04
    }

    if (innerRingRef.current) innerRingRef.current.rotation.z = t * 0.3
    if (outerRingRef.current) outerRingRef.current.rotation.z = -t * 0.18
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>

      {/* Main panel slab */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.0, 4.2, 0.18]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Gold border frame */}
      {[
        [0, 2.16, 0.1, 3.2, 0.1, 0.12],
        [0, -2.16, 0.1, 3.2, 0.1, 0.12],
        [-1.56, 0, 0.1, 0.1, 4.42, 0.12],
        [1.56, 0, 0.1, 0.1, 4.42, 0.12]
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Corner ornaments */}
      {[[-1.46, 2.06], [1.46, 2.06], [-1.46, -2.06], [1.46, -2.06]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.12]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Diamond relief pattern - 4x5 grid */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[-1.05 + col * 0.72, -1.5 + row * 0.78, 0.12]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <octahedronGeometry args={[0.22, 0]} />
            <primitive object={lightStoneMat} />
          </mesh>
        ))
      )}

      {/* Centre ring decoration */}
      <mesh ref={outerRingRef} position={[0, 0, 0.16]}>
        <torusGeometry args={[0.55, 0.05, 10, 36]} />
        <primitive object={goldMat} />
      </mesh>
      <mesh ref={innerRingRef} position={[0, 0, 0.17]}>
        <torusGeometry args={[0.35, 0.035, 10, 28]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Centre lotus flower */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.22, Math.cos(angle) * 0.22, 0.18]}
            rotation={[0, 0, angle]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <primitive object={goldMat} />
          </mesh>
        )
      })}
      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Horizontal decorative bands */}
      {[-1.0, -0.5, 0.5, 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0.1]}>
          <boxGeometry args={[2.8, 0.03, 0.04]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Vertical decorative lines */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.1]}>
          <boxGeometry args={[0.03, 3.8, 0.04]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

    </group>
  )
}
