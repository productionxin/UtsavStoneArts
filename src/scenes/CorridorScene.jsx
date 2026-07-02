import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import GaneshaModel from '../components/GaneshaModel'
import MandirModel from '../components/MandirModel'
import WallPanel from '../components/WallPanel'
import ColumnModel from '../components/ColumnModel'
import { createStoneTexture } from '../components/StoneMaterials'

export default function CorridorScene({ scrollProgress, mouseRef }) {
  const { camera } = useThree()
  const particlesRef = useRef()
  const hallLightsRef = useRef([])

  // Camera path points
  const cameraPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.3, 18),   // 0%  - start (prologue)
      new THREE.Vector3(0, 0.3, 12),   // 10% - enter corridor
      new THREE.Vector3(0, 0.2, 4),    // 25% - mid corridor
      new THREE.Vector3(0, 0.2, -4),   // 40% - approach hall
      new THREE.Vector3(0, 0.5, -10),  // 55% - hall centre
      new THREE.Vector3(0, 0.8, -10),  // 70% - rise up slightly
      new THREE.Vector3(0, 0.5, -10),  // 85% - workshop
      new THREE.Vector3(0, 0.3, -10),  // 100% - exit
    ])
  }, [])

  // Look-at path
  const lookPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(0, 0, -4),
      new THREE.Vector3(0, 0, -12),
      new THREE.Vector3(0, 0.2, -18),
      new THREE.Vector3(0, 0, -14),
      new THREE.Vector3(0, 0, -14),
      new THREE.Vector3(0, 0, -14),
    ])
  }, [])

  // Stone textures
  const wallTex = useMemo(() => {
    const t = createStoneTexture({ baseColor: '#D4C4A8', grainColor: '#8C7A5E', grainDensity: 160 })
    t.repeat.set(3, 2)
    return t
  }, [])

  const floorTex = useMemo(() => {
    const t = createStoneTexture({ baseColor: '#C8B898', grainColor: '#6B5A45', grainDensity: 200 })
    t.repeat.set(4, 12)
    return t
  }, [])

  // Gold dust particles
  const particles = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6
      pos[i * 3 + 1] = Math.random() * 4 - 0.5
      pos[i * 3 + 2] = -Math.random() * 28
      speeds[i] = 0.003 + Math.random() * 0.004
    }
    return { pos, speeds, count }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = Math.max(0, Math.min(1, scrollProgress))

    // Camera follow path
    const camPos = cameraPath.getPoint(p)
    const lookAt = lookPath.getPoint(p)

    // Smooth camera movement
    camera.position.lerp(camPos, 0.06)

    // Mouse sway on camera
    if (mouseRef?.current) {
      camera.position.x += mouseRef.current.nx * 0.12
      camera.position.y += mouseRef.current.ny * 0.06
    }

    const lookTarget = new THREE.Vector3()
    lookTarget.lerp(lookAt, 0.06)
    camera.lookAt(lookAt)

    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array
      for (let i = 0; i < particles.count; i++) {
        positions[i * 3 + 1] += particles.speeds[i]
        if (positions[i * 3 + 1] > 4) {
          positions[i * 3 + 1] = -0.5
          positions[i * 3] = (Math.random() - 0.5) * 6
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.rotation.y = t * 0.005
    }
  })

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    color: '#D4C4A8',
    roughness: 0.75,
    metalness: 0.0,
  })

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    color: '#C8B898',
    roughness: 0.8,
    metalness: 0.0,
  })

  const ceilMat = new THREE.MeshStandardMaterial({
    color: '#E8D9C4',
    roughness: 0.8,
  })

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#C4A057',
    roughness: 0.15,
    metalness: 0.9,
  })

  return (
    <>
      {/* Environment for PBR reflections */}
      <Environment preset="apartment" />

      {/* Global lighting */}
      <ambientLight color="#FFF8F0" intensity={0.4} />

      {/* Main warm sun light */}
      <directionalLight
        color="#FFF5D0"
        intensity={1.0}
        position={[2, 8, 6]}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Corridor lights along the path */}
      {[8, 4, 0, -4, -8, -12].map((z, i) => (
        <pointLight
          key={i}
          color={i % 2 === 0 ? '#FFF0D0' : '#C4A057'}
          intensity={1.5}
          distance={7}
          position={[0, 2.2, z]}
        />
      ))}

      {/* Gold dust particles */}
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
          size={0.035}
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>

      {/* ══ CORRIDOR ══ */}
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -8]} receiveShadow>
        <planeGeometry args={[5, 36]} />
        <primitive object={floorMat} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.8, -8]}>
        <planeGeometry args={[5, 36]} />
        <primitive object={ceilMat} />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-2.5, 0.9, -8]} receiveShadow>
        <planeGeometry args={[36, 4]} />
        <primitive object={wallMat} />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[2.5, 0.9, -8]} receiveShadow>
        <planeGeometry args={[36, 4]} />
        <primitive object={wallMat} />
      </mesh>

      {/* Gold skirting boards along corridor */}
      {[-2.48, 2.48].map((x, i) => (
        <mesh key={i} position={[x, -0.85, -8]}>
          <boxGeometry args={[0.04, 0.25, 36]} />
          <primitive object={goldMat} />
        </mesh>
      ))}

      {/* Carved text panels on walls */}
      {[
        { pos: [-2.44, 0.5, 2], text: true },
        { pos: [-2.44, 0.5, -4], text: true },
        { pos: [-2.44, 0.5, -10], text: true },
      ].map((item, i) => (
        <mesh key={i} position={item.pos}>
          <boxGeometry args={[0.04, 0.8, 2.4]} />
          <meshStandardMaterial color="#C4B090" roughness={0.5} />
        </mesh>
      ))}

      {/* Arch details along corridor */}
      {[6, 2, -2, -6].map((z, i) => (
        <group key={i}>
          {/* Left arch */}
          <mesh position={[-2.4, 1.8, z]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.6, 0.06, 8, 20, Math.PI]} />
            <primitive object={goldMat} />
          </mesh>
          {/* Right arch */}
          <mesh position={[2.4, 1.8, z]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.6, 0.06, 8, 20, Math.PI]} />
            <primitive object={goldMat} />
          </mesh>
        </group>
      ))}

      {/* ══ HALL ══ */}
      {/* Hall floor - much wider */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -18]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <primitive object={floorMat} />
      </mesh>

      {/* Hall ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -18]}>
        <planeGeometry args={[16, 14]} />
        <primitive object={ceilMat} />
      </mesh>

      {/* Hall back wall */}
      <mesh position={[0, 2, -26]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <primitive object={wallMat} />
      </mesh>

      {/* Hall side walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-8, 2, -18]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <primitive object={wallMat} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[8, 2, -18]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <primitive object={wallMat} />
      </mesh>

      {/* Hall ceiling chandelier-style light ring */}
      <mesh position={[0, 4.5, -18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.06, 10, 40]} />
        <primitive object={goldMat} />
      </mesh>
      <pointLight color="#FFF5D0" intensity={3} distance={12} position={[0, 4, -18]} />

      {/* THREE ARCHWAYS */}
      {/* Left arch - HOME */}
      <group position={[-4.2, 0, -24]}>
        <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.1, 10, 30, Math.PI]} />
          <primitive object={goldMat} />
        </mesh>
        <mesh position={[-1.1, 0.9, 0]}>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          <primitive object={goldMat} />
        </mesh>
        <mesh position={[1.1, 0.9, 0]}>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          <primitive object={goldMat} />
        </mesh>
        <pointLight color="#FFA040" intensity={2} distance={5} position={[0, 2, 0.5]} />
        {/* Mandir preview inside */}
        <Float speed={1} floatIntensity={0.3} rotationIntensity={0.1}>
          <MandirModel position={[0, 0.5, -0.5]} scale={0.38} mouseRef={mouseRef} />
        </Float>
      </group>

      {/* Centre arch - SPACE */}
      <group position={[0, 0, -24]}>
        <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.12, 10, 30, Math.PI]} />
          <primitive object={goldMat} />
        </mesh>
        <mesh position={[-1.38, 1.1, 0]}>
          <boxGeometry args={[0.12, 2.2, 0.12]} />
          <primitive object={goldMat} />
        </mesh>
        <mesh position={[1.38, 1.1, 0]}>
          <boxGeometry args={[0.12, 2.2, 0.12]} />
          <primitive object={goldMat} />
        </mesh>
        <pointLight color="#FFF5E0" intensity={2.5} distance={6} position={[0, 3, 0.5]} />
        {/* Ganesha preview - hero */}
        <Float speed={0.8} floatIntensity={0.4} rotationIntensity={0.05}>
          <GaneshaModel position={[0, 0.3, -0.5]} scale={0.42} mouseRef={mouseRef} />
        </Float>
      </group>

      {/* Right arch - PROJECT */}
      <group position={[4.2, 0, -24]}>
        <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.1, 10, 30, Math.PI]} />
          <primitive object={goldMat} />
        </mesh>
        <mesh position={[-1.1, 0.9, 0]}>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          <primitive object={goldMat} />
        </mesh>
        <mesh position={[1.1, 0.9, 0]}>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          <primitive object={goldMat} />
        </mesh>
        <pointLight color="#D0E8C4" intensity={2} distance={5} position={[0, 2, 0.5]} />
        {/* Column preview */}
        <Float speed={1.2} floatIntensity={0.3} rotationIntensity={0.1}>
          <ColumnModel position={[0, 0.8, -0.5]} scale={0.42} mouseRef={mouseRef} />
        </Float>
      </group>

    </>
  )
}
