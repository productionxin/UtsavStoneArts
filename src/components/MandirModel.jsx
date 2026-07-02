import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function MandirModel({ position = [0, 0, 0], scale = 1, mouseRef }) {
  const groupRef = useRef()
  const innerLightRef = useRef()

  const stoneMat = new THREE.MeshStandardMaterial({ color: '#D8C8A8', roughness: 0.65, metalness: 0 })
  const goldMat = new THREE.MeshStandardMaterial({ color: '#C4A057', roughness: 0.15, metalness: 0.9 })
  const marbleMat = new THREE.MeshStandardMaterial({ color: '#F5F2EE', roughness: 0.12, metalness: 0.02 })
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2A2010', roughness: 0.9, metalness: 0 })

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (mouseRef?.current) {
      groupRef.current.rotation.y +=
        (mouseRef.current.nx * 0.5 - groupRef.current.rotation.y) * 0.04
    }

    groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.03

    if (innerLightRef.current) {
      innerLightRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>

      {/* Base platform */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.2, 1.0]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Steps */}
      {[0.14, 0.1, 0.06].map((h, i) => (
        <mesh key={i} position={[0, -1.7 + i * 0.12, 0]}>
          <boxGeometry args={[2.2 - i * 0.15, 0.12, 1.0 - i * 0.08]} />
          <primitive object={stoneMat} />
        </mesh>
      ))}

      {/* Main body */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.6, 0.8]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Interior dark recess */}
      <mesh position={[0, -0.55, 0.35]}>
        <boxGeometry args={[1.2, 1.3, 0.15]} />
        <primitive object={darkMat} />
      </mesh>

      {/* Inner warm light (diya) */}
      <pointLight
        ref={innerLightRef}
        position={[0, -0.7, 0.4]}
        color="#FFA040"
        intensity={1.5}
        distance={3}
      />

      {/* Left pillar */}
      <mesh position={[-0.76, -0.3, 0.35]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 1.8, 12]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Right pillar */}
      <mesh position={[0.76, -0.3, 0.35]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 1.8, 12]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Pillar capitals (gold) */}
      {[-0.76, 0.76].map((x, i) => (
        <mesh key={i} position={[x, 0.65, 0.35]}>
          <boxGeometry args={[0.28, 0.1, 0.28]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Jali lattice work (decorative rings) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, -0.9 + i * 0.22, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55 - i * 0.01, 0.012, 6, 24]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Horizontal jali bars */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-0.4 + i * 0.2, -0.55, 0.41]}>
          <boxGeometry args={[0.015, 1.2, 0.01]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Arch above door */}
      <mesh position={[0, 0.55, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.08, 8, 20, Math.PI]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Ganesha idol inside */}
      <mesh position={[0, -0.85, 0.25]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <primitive object={marbleMat} />
      </mesh>
      <mesh position={[0, -0.5, 0.25]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <primitive object={marbleMat} />
      </mesh>

      {/* Shikhara (tower) - main */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <coneGeometry args={[0.9, 1.4, 8]} />
        <primitive object={stoneMat} />
      </mesh>

      {/* Shikhara - stepped tiers */}
      {[0.6, 0.72, 0.84].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[1.8 - i * 0.2, 0.1, 0.8 - i * 0.08]} />
          <primitive object={stoneMat} />
        </mesh>
      ))}

      {/* Finial gold */}
      <mesh position={[0, 1.44, 0]}>
        <cylinderGeometry args={[0.06, 0.15, 0.3, 10]} />
        <primitive object={goldMat} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Side mini towers */}
      {[-0.75, 0.75].map((x, i) => (
        <group key={i} position={[x, 0.3, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.25, 0.7, 8]} />
            <primitive object={stoneMat} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.42]} />
            <primitive object={stoneMat} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <primitive object={goldMat} />
          </mesh>
        </group>
      ))}

      {/* Gold ornament strips on body */}
      {[-0.6, -0.2, 0.2, 0.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0.4]}>
          <boxGeometry args={[1.75, 0.04, 0.02]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

    </group>
  )
}
