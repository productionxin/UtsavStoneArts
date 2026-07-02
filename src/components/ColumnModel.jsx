import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ColumnModel({ position = [0, 0, 0], scale = 1, mouseRef }) {
  const groupRef = useRef()

  const stoneMat = new THREE.MeshStandardMaterial({ color: '#D4C4A8', roughness: 0.65, metalness: 0 })
  const goldMat = new THREE.MeshStandardMaterial({ color: '#C4A057', roughness: 0.15, metalness: 0.9 })
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#B8A888', roughness: 0.75, metalness: 0 })

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (mouseRef?.current) {
      groupRef.current.rotation.y +=
        (mouseRef.current.nx * 0.5 - groupRef.current.rotation.y) * 0.04
    }
    groupRef.current.position.y = position[1] + Math.sin(t * 0.4) * 0.02
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>

      {/* Base steps */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, -2.1 + i * 0.15, 0]}>
          <boxGeometry args={[1.4 - i * 0.15, 0.15, 1.4 - i * 0.15]} />
          <primitive object={stoneMat} />
        </mesh>
      ))}

      {/* Main shaft - fluted cylinder */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 3.8, 20]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Fluting lines on shaft */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.29, 0, Math.cos(angle) * 0.29]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.025, 3.7, 0.02]} />
            <primitive object={darkStoneMat} />
          </mesh>
        )
      })}

      {/* Gold rings at intervals */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.04, 10, 30]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Capital base */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.45, 0.29, 0.25, 12]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Capital top plate */}
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[1.0, 0.15, 1.0]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Capital volute scrolls */}
      {[[-0.36, 2.1, 0.36], [0.36, 2.1, 0.36], [-0.36, 2.1, -0.36], [0.36, 2.1, -0.36]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.035, 8, 16, Math.PI * 1.5]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Gold capital ornaments */}
      <mesh position={[0, 2.24, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.95]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Top finial */}
      <mesh position={[0, 2.35, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Carved relief band mid-shaft */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.32, 0.1, Math.cos(angle) * 0.32]}
          >
            <sphereGeometry args={[0.055, 8, 8]} />
            <primitive object={goldMat} />
          </mesh>
        )
      })}

    </group>
  )
}
