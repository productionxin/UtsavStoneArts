import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function GaneshaModel({ position = [0, 0, 0], scale = 1, mouseRef }) {
  const groupRef = useRef()
  const crownRef = useRef()
  const trunkRef = useRef()

  const marbleMat = new THREE.MeshStandardMaterial({
    color: '#F5F2EE',
    roughness: 0.12,
    metalness: 0.02,
  })

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#C4A057',
    roughness: 0.15,
    metalness: 0.9,
  })

  const darkMarble = new THREE.MeshStandardMaterial({
    color: '#E8E0D8',
    roughness: 0.2,
    metalness: 0.01,
  })

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Mouse-driven rotation
    if (mouseRef?.current) {
      groupRef.current.rotation.y +=
        (mouseRef.current.nx * 0.4 - groupRef.current.rotation.y) * 0.04
      groupRef.current.rotation.x +=
        (mouseRef.current.ny * 0.15 - groupRef.current.rotation.x) * 0.04
    }

    // Subtle float
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.04

    // Crown pulse
    if (crownRef.current) {
      crownRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.02)
    }

    // Trunk sway
    if (trunkRef.current) {
      trunkRef.current.rotation.z = 0.6 + Math.sin(t * 0.8) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>

      {/* Lotus base */}
      <mesh position={[0, -1.6, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 0.9, 0.2, 16]} />
        <primitive object={darkMarble} />
      </mesh>

      {/* Lotus petals */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 1.0, -1.55, Math.cos(angle) * 0.35]}
            rotation={[0, angle, 0.3]}
          >
            <sphereGeometry args={[0.28, 10, 10]} />
            <meshStandardMaterial color="#F0E8D8" roughness={0.4} />
          </mesh>
        )
      })}

      {/* Body */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <sphereGeometry args={[0.88, 32, 32]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>
      {/* Body scale */}
      <mesh position={[0, -0.3, 0]} scale={[1, 1.15, 0.7]} castShadow>
        <sphereGeometry args={[0.88, 32, 32]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>

      {/* Belly */}
      <mesh position={[0, -0.5, 0.55]} castShadow>
        <sphereGeometry args={[0.5, 20, 20]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>

      {/* Gold waist band */}
      <mesh position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.04, 10, 40]} />
        <primitive object={goldMat} attach="material" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.85, 0]} scale={[1, 1, 0.82]} castShadow>
        <sphereGeometry args={[0.62, 32, 32]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>

      {/* Large ears */}
      <mesh position={[-0.68, 0.8, 0.05]} scale={[1, 0.75, 0.18]} castShadow>
        <sphereGeometry args={[0.44, 20, 20]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>
      <mesh position={[0.68, 0.8, 0.05]} scale={[1, 0.75, 0.18]} castShadow>
        <sphereGeometry args={[0.44, 20, 20]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 0.95, 0.5]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1C1612" roughness={0.1} metalness={0.3} />
      </mesh>
      <mesh position={[0.2, 0.95, 0.5]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1C1612" roughness={0.1} metalness={0.3} />
      </mesh>

      {/* Trunk */}
      <group ref={trunkRef}>
        <mesh position={[-0.15, 0.55, 0.42]} rotation={[0.3, 0, 0.6]} castShadow>
          <cylinderGeometry args={[0.08, 0.13, 0.9, 14]} />
          <primitive object={marbleMat} attach="material" />
        </mesh>
        {/* Trunk curl */}
        <mesh position={[-0.44, 0.12, 0.5]} rotation={[Math.PI / 2, 0.1, Math.PI / 4]}>
          <torusGeometry args={[0.2, 0.07, 10, 20, Math.PI * 1.3]} />
          <primitive object={marbleMat} attach="material" />
        </mesh>
      </group>

      {/* Tusk */}
      <mesh position={[0.3, 0.55, 0.48]} rotation={[-0.2, 0, -0.3]}>
        <cylinderGeometry args={[0.03, 0.07, 0.55, 8]} />
        <meshStandardMaterial color="#FFFDF5" roughness={0.1} metalness={0.02} />
      </mesh>

      {/* Crown base */}
      <mesh ref={crownRef} position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.36, 0.48, 0.22, 10]} />
        <primitive object={goldMat} attach="material" />
      </mesh>

      {/* Crown spires */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * 0.28,
              1.85,
              Math.cos(angle) * 0.1
            ]}
          >
            <coneGeometry args={[0.06, 0.32, 8]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        )
      })}

      {/* Centre crown jewel */}
      <mesh position={[0, 1.96, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#FF4444" roughness={0.1} metalness={0.6} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.9, 0.1, 0.2]} rotation={[0.2, 0, 0.85]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.7, 12]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>
      <mesh position={[0.9, 0.1, 0.2]} rotation={[0.2, 0, -0.85]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.7, 12]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>

      {/* Hands */}
      <mesh position={[-1.3, -0.2, 0.3]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>
      <mesh position={[1.3, -0.2, 0.3]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <primitive object={marbleMat} attach="material" />
      </mesh>

      {/* Gold ankle bangles */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -1.45, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.03, 8, 20]} />
          <primitive object={goldMat} attach="material" />
        </mesh>
      ))}

    </group>
  )
}
