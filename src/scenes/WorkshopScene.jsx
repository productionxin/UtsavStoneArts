import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function WorkshopScene({ mouseRef }) {
  const particlesRef = useRef()
  const shaftRef = useRef()
  const blockRef = useRef()

  const particles = useMemo(() => {
    const count = 250
    const pos = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5
      speeds[i] = 0.004 + Math.random() * 0.006
    }
    return { pos, speeds, count }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Float particles upward
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array
      for (let i = 0; i < particles.count; i++) {
        positions[i * 3 + 1] += particles.speeds[i]
        positions[i * 3] += Math.sin(t + i) * 0.001
        if (positions[i * 3 + 1] > 3.5) {
          positions[i * 3 + 1] = -3.5
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Light flicker
    if (shaftRef.current) {
      shaftRef.current.intensity = 3.5 + Math.sin(t * 2.5) * 0.4 + Math.random() * 0.2
      shaftRef.current.position.x = Math.sin(t * 0.3) * 0.3
    }

    // Block subtle rock
    if (blockRef.current) {
      blockRef.current.rotation.y = Math.sin(t * 0.2) * 0.02
    }
  })

  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: '#2A2010', roughness: 0.9, metalness: 0
  })
  const midStoneMat = new THREE.MeshStandardMaterial({
    color: '#3A3020', roughness: 0.85, metalness: 0
  })

  return (
    <>
      <ambientLight color="#1A1008" intensity={0.3} />

      {/* Main shaft spotlight */}
      <spotLight
        ref={shaftRef}
        color="#FFF5D0"
        intensity={4}
        distance={12}
        angle={Math.PI / 10}
        penumbra={0.5}
        position={[0, 7, 0]}
        castShadow
      />

      {/* Warm fill from sides */}
      <pointLight color="#C4A057" intensity={0.5} distance={6} position={[-3, 1, 2]} />
      <pointLight color="#C4A057" intensity={0.5} distance={6} position={[3, 1, 2]} />

      {/* Gold dust particles in light shaft */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.count}
            array={particles.pos}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#C4A057"
          size={0.03}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Workshop floor - rough dark stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <primitive object={darkStoneMat} />
      </mesh>

      {/* Stone block being carved */}
      <mesh ref={blockRef} position={[0, -0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.8, 0.9]} />
        <primitive object={midStoneMat} />
      </mesh>

      {/* Rough stone chips around block */}
      {[
        [-0.9, -1.45, 0.3], [0.7, -1.45, -0.2],
        [-0.4, -1.45, -0.6], [1.1, -1.45, 0.4]
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.random(), Math.random(), Math.random()]}>
          <dodecahedronGeometry args={[0.08 + Math.random() * 0.06, 0]} />
          <primitive object={midStoneMat} />
        </mesh>
      ))}

      {/* Back wall - dark stone */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <primitive object={darkStoneMat} />
      </mesh>

      {/* Side walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-5, 2, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <primitive object={darkStoneMat} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[5, 2, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <primitive object={darkStoneMat} />
      </mesh>

      {/* Tool shadows on wall */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.5, -4.9]}>
          <boxGeometry args={[0.05, 1.8, 0.05]} />
          <meshStandardMaterial color="#1A1008" />
        </mesh>
      ))}

    </>
  )
}
