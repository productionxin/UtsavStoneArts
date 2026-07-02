import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Float } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ── SUPABASE MODEL URLS ──────────────────────────────────
const BASE = 'https://uozvukypycqqrdelndhr.supabase.co/storage/v1/object/public/models/'
const URLS = {
  radhakrishna:   BASE + 'lord_krishna_and_radha.glb',
  ganesha:        BASE + 'lord_ganesha_statue_3d_scanned.glb',
  buddha:         BASE + 'meditating_buddha.glb',
  fountain:       BASE + 'simple_marble_fountain.glb',
  wall:           BASE + 'wall.glb',
  krishna:        BASE + 'lord_krishna_3d_model.glb',
  elephant:       BASE + 'dharmasthala_-_bahubali_elephant.glb',
  mural:          BASE + 'pintura_mural_al_fresc_-_mnat_45096-2.glb',
  krishnaSitting: BASE + 'bhagwan_krishna_sitting.glb',
}
Object.values(URLS).forEach(u => useGLTF.preload(u))

// ── COLORS ───────────────────────────────────────────────
const GOLD   = '#C4A057'
const SAND   = '#E8D5B0'
const CREAM  = '#F5F0E8'
const SHADOW = '#1C1208'

// ── SCROLL WORLDS ─────────────────────────────────────────
// Each world: [startProgress, endProgress]
const WORLDS = {
  landing:      [0.00, 0.08],
  radhakrishna: [0.08, 0.25],
  wall:         [0.25, 0.40],
  ganesha:      [0.40, 0.53],
  buddha:       [0.53, 0.65],
  fountain:     [0.65, 0.76],
  workshop:     [0.76, 0.88],
  signature:    [0.88, 1.00],
}

function inWorld(p, world) {
  const [s, e] = WORLDS[world]
  return p >= s && p <= e
}

function worldOpacity(p, world, fadeIn = 0.03, fadeOut = 0.03) {
  const [s, e] = WORLDS[world]
  if (p < s) return 0
  if (p > e) return 0
  const fi = Math.min(1, (p - s) / fadeIn)
  const fo = Math.min(1, (e - p) / fadeOut)
  return Math.min(fi, fo)
}

// ── CUSTOM CURSOR ─────────────────────────────────────────
function Cursor() {
  const dotRef  = useRef()
  const ringRef = useRef()
  const pos     = useRef({ x: -100, y: -100 })
  const ring    = useRef({ x: -100, y: -100 })

  useEffect(() => {
    const onMove = e => { pos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    let raf
    const tick = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.1
      ring.current.y += (pos.current.y - ring.current.y) * 0.1
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px,${pos.current.y - 4}px)`
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px,${ring.current.y - 18}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div ref={dotRef}  style={{ position:'fixed', width:8,  height:8,  background:GOLD, borderRadius:'50%', pointerEvents:'none', zIndex:99999, willChange:'transform' }} />
      <div ref={ringRef} style={{ position:'fixed', width:36, height:36, border:`1.5px solid ${GOLD}`, borderRadius:'50%', pointerEvents:'none', zIndex:99998, opacity:0.55, willChange:'transform', transition:'opacity 0.3s' }} />
    </>
  )
}

// ── GOLD PARTICLES ────────────────────────────────────────
function GoldParticles({ count = 350 }) {
  const ref    = useRef()
  const speeds = useRef([])
  const data   = useRef(null)

  if (!data.current) {
    const pos = new Float32Array(count * 3)
    speeds.current = []
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5) * 14
      pos[i*3+1] = (Math.random()-0.5) * 10
      pos[i*3+2] = (Math.random()-0.5) * 8
      speeds.current.push(0.004 + Math.random() * 0.006)
    }
    data.current = pos
  }

  useFrame(() => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i*3+1] += speeds.current[i]
      if (arr[i*3+1] > 5) arr[i*3+1] = -5
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={data.current} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={GOLD} size={0.028} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

// ── CURSOR LIGHT ──────────────────────────────────────────
function CursorLight({ mouseRef }) {
  const lightRef = useRef()
  useFrame(() => {
    if (!lightRef.current || !mouseRef.current) return
    lightRef.current.position.set(mouseRef.current.nx * 4, mouseRef.current.ny * 3, 3.5)
  })
  return <pointLight ref={lightRef} color={GOLD} intensity={2.5} distance={10} />
}

// ── MODEL LOADER (safe) ───────────────────────────────────
function SafeModel({ url, scale = 1, position = [0,0,0], rotation = [0,0,0], opacity = 1, mouseRef, autoRotate = false }) {
  const { scene } = useGLTF(url)
  const groupRef  = useRef()
  const clone     = scene.clone(true)

  // Apply stone material tint + transparency
  clone.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow    = true
      obj.receiveShadow = true
      if (obj.material) {
        obj.material = obj.material.clone()
        obj.material.transparent = true
        obj.material.opacity = opacity
      }
    }
  })

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    if (autoRotate) {
      groupRef.current.rotation.y = t * 0.18
    } else if (mouseRef?.current) {
      groupRef.current.rotation.y += (mouseRef.current.nx * 0.5 - groupRef.current.rotation.y) * 0.04
      groupRef.current.rotation.x += (mouseRef.current.ny * 0.2 - groupRef.current.rotation.x) * 0.04
    }
    // Subtle float
    groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.06
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clone} />
    </group>
  )
}

// ── STONE LANDING SURFACE ─────────────────────────────────
function StoneSurface({ mouseRef, opacity = 1 }) {
  const meshRef   = useRef()
  const lightRef  = useRef()

  // Procedural stone texture
  const texture = useRef(null)
  if (!texture.current) {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')
    ctx.fillStyle = SAND
    ctx.fillRect(0,0,512,512)
    for (let i = 0; i < 180; i++) {
      const x = Math.random()*512, y = Math.random()*512
      const len = 10 + Math.random()*60
      const angle = Math.random()*Math.PI*2
      ctx.beginPath()
      ctx.moveTo(x,y)
      ctx.lineTo(x+Math.cos(angle)*len, y+Math.sin(angle)*len)
      ctx.strokeStyle = '#8C7A5E'
      ctx.lineWidth = 0.5+Math.random()*1.5
      ctx.globalAlpha = 0.03+Math.random()*0.07
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // Veins
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      let vx = Math.random()*512
      ctx.moveTo(vx, 0)
      for (let j=0;j<14;j++){vx+=(Math.random()-0.5)*50;ctx.lineTo(vx,j*36.5)}
      ctx.strokeStyle='#9A8A6E'; ctx.lineWidth=0.8; ctx.globalAlpha=0.04+Math.random()*0.04; ctx.stroke()
    }
    ctx.globalAlpha=1
    texture.current = new THREE.CanvasTexture(c)
  }

  useFrame(() => {
    if (!lightRef.current || !mouseRef.current) return
    lightRef.current.position.set(mouseRef.current.nx*3, mouseRef.current.ny*2, 2)
  })

  return (
    <group>
      <mesh ref={meshRef} position={[0,0,-0.5]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial map={texture.current} roughness={0.72} metalness={0} transparent opacity={opacity} />
      </mesh>
      <pointLight ref={lightRef} color={GOLD} intensity={3} distance={8} />
    </group>
  )
}

// ── SIGNATURE CARVING ─────────────────────────────────────
function SignatureText({ scrollProgress }) {
  const [s, e] = WORLDS.signature
  const local  = Math.max(0, Math.min(1, (scrollProgress - s) / (e - s)))
  const letters = 'UTSAV STONE ART'.split('')
  const perLetter = 1 / letters.length

  return (
    <group position={[0, 0, 0]}>
      {/* Stone bg */}
      <mesh position={[0,0,-0.3]}>
        <planeGeometry args={[14,10]} />
        <meshStandardMaterial color={SHADOW} roughness={0.9} />
      </mesh>
      {letters.map((ch, i) => {
        const progress = Math.max(0, Math.min(1, (local - i * perLetter) / perLetter))
        const depth    = progress * 0.3
        const emissive = progress * 0.4
        if (ch === ' ') return null
        const x = (i - 7) * 0.85
        return (
          <mesh key={i} position={[x, 0, depth]}>
            <boxGeometry args={[0.6, 0.8, depth + 0.01]} />
            <meshStandardMaterial
              color={CREAM}
              emissive={GOLD}
              emissiveIntensity={emissive}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ── MAIN 3D SCENE ─────────────────────────────────────────
function Scene({ scrollProgress, mouseRef }) {
  // Smooth scroll ref
  const smoothP = useRef(0)

  useFrame(({ camera }) => {
    smoothP.current += (scrollProgress - smoothP.current) * 0.06
    const p = smoothP.current

    // Camera path
    let camZ = 6, camY = 0.5, camX = 0
    if (p < 0.08)       { camZ = 6;   camY = 0.5; camX = 0 }
    else if (p < 0.25)  { camZ = 5;   camY = 0;   camX = 0 }
    else if (p < 0.40)  { camZ = 5;   camY = 0;   camX = -0.5 }
    else if (p < 0.53)  { camZ = 4.5; camY = 0;   camX = 0 }
    else if (p < 0.65)  { camZ = 5.5; camY = -0.3;camX = 0 }
    else if (p < 0.76)  { camZ = 6;   camY = 1;   camX = 0 }
    else if (p < 0.88)  { camZ = 4;   camY = 0;   camX = 0 }
    else                { camZ = 3.5; camY = 0;   camX = 0 }

    camera.position.x += (camX - camera.position.x) * 0.04
    camera.position.y += (camY - camera.position.y) * 0.04
    camera.position.z += (camZ - camera.position.z) * 0.04
    camera.lookAt(0, 0, 0)
  })

  const p = scrollProgress

  return (
    <>
      <Environment preset="apartment" />
      <ambientLight color="#FFF8F0" intensity={0.4} />
      <directionalLight color="#FFF5D0" intensity={0.8} position={[3,6,4]} castShadow />
      <CursorLight mouseRef={mouseRef} />
      <GoldParticles />

      {/* LANDING */}
      <group visible={p < 0.10}>
        <StoneSurface mouseRef={mouseRef} opacity={Math.max(0, 1 - (p - 0.06) / 0.04)} />
      </group>

      {/* WORLD 1 — RADHA KRISHNA */}
      <group visible={inWorld(p,'radhakrishna')} position={[0,0,0]}>
        <Suspense fallback={null}>
          <SafeModel
            url={URLS.radhakrishna}
            scale={1.2}
            position={[0,-1.5,0]}
            opacity={worldOpacity(p,'radhakrishna')}
            mouseRef={mouseRef}
          />
        </Suspense>
        <pointLight color="#FFF5E0" intensity={2} distance={8} position={[0,4,2]} />
        <pointLight color={GOLD} intensity={1} distance={6} position={[-3,0,2]} />
      </group>

      {/* WORLD 2 — WALL */}
      <group visible={inWorld(p,'wall')} position={[0,0,0]}>
        <Suspense fallback={null}>
          <SafeModel
            url={URLS.wall}
            scale={1.5}
            position={[0,-1,0]}
            opacity={worldOpacity(p,'wall')}
            mouseRef={mouseRef}
          />
        </Suspense>
        <pointLight color="#FFF5E0" intensity={1.5} distance={7} position={[2,3,3]} />
      </group>

      {/* WORLD 3 — GANESHA */}
      <group visible={inWorld(p,'ganesha')} position={[0,0,0]}>
        <Suspense fallback={null}>
          <Float speed={1.2} floatIntensity={0.3} rotationIntensity={0.05}>
            <SafeModel
              url={URLS.ganesha}
              scale={1.4}
              position={[0,-1.5,0]}
              opacity={worldOpacity(p,'ganesha')}
              mouseRef={mouseRef}
            />
          </Float>
        </Suspense>
        <pointLight color="#FFA040" intensity={2} distance={7} position={[0,3,2]} />
        <pointLight color={GOLD} intensity={1} distance={5} position={[-2,0,2]} />
      </group>

      {/* WORLD 4 — BUDDHA */}
      <group visible={inWorld(p,'buddha')} position={[0,0,0]}>
        <Suspense fallback={null}>
          <SafeModel
            url={URLS.buddha}
            scale={1.3}
            position={[0,-1,0]}
            opacity={worldOpacity(p,'buddha')}
            mouseRef={mouseRef}
            autoRotate
          />
        </Suspense>
        <pointLight color="#FFF5D0" intensity={2} distance={8} position={[0,4,2]} />
        <ambientLight color="#C4A057" intensity={0.2} />
      </group>

      {/* WORLD 5 — FOUNTAIN */}
      <group visible={inWorld(p,'fountain')} position={[0,0,0]}>
        <Suspense fallback={null}>
          <Float speed={0.6} floatIntensity={0.15}>
            <SafeModel
              url={URLS.fountain}
              scale={1.1}
              position={[0,-2,0]}
              opacity={worldOpacity(p,'fountain')}
              mouseRef={mouseRef}
              autoRotate
            />
          </Float>
        </Suspense>
        <pointLight color="#FFF8F0" intensity={2.5} distance={10} position={[0,5,2]} />
        <pointLight color={GOLD} intensity={0.8} distance={6} position={[3,0,2]} />
      </group>

      {/* WORLD 6 — WORKSHOP */}
      <group visible={inWorld(p,'workshop')}>
        {/* Dark stone block */}
        <mesh position={[0,-1,0]}>
          <boxGeometry args={[1.8,1,1.2]} />
          <meshStandardMaterial color="#3A3020" roughness={0.9} transparent opacity={worldOpacity(p,'workshop')} />
        </mesh>
        {/* Dramatic light shaft */}
        <spotLight color="#FFF5D0" intensity={6} distance={12} angle={Math.PI/10} penumbra={0.6} position={[0,6,0]} castShadow />
        <pointLight color={GOLD} intensity={0.4} distance={4} position={[-2,0,2]} />
      </group>

      {/* WORLD 7 — SIGNATURE */}
      <group visible={inWorld(p,'signature')}>
        <SignatureText scrollProgress={p} />
        <pointLight color={GOLD} intensity={2} distance={8} position={[0,2,3]} />
      </group>

    </>
  )
}

// ── TEXT OVERLAYS ─────────────────────────────────────────
const TEXTS = [
  { world:'radhakrishna', title:'The Sacred', body:'Crafted in white marble. Finished in gold.\nMade for homes that understand devotion.' },
  { world:'wall',         title:'The Natural', body:'Stone shaped by hands that have spent\na lifetime learning how it breathes.' },
  { world:'ganesha',      title:'The Divine',  body:'Every idol begins as a block of stone.\nIt ends as something sacred.' },
  { world:'buddha',       title:'The Serene',  body:'Stillness carved in stone.\nFor gardens that outlast everything.' },
  { world:'fountain',     title:'The Grand',   body:'Some commissions are not decorations.\nThey are destinations.' },
  { world:'workshop',     title:'The Making',  body:'Every piece that leaves Kokapet began as a block of stone\nand ended as something no one else in the world has.' },
]

function TextOverlays({ scrollProgress: p }) {
  return (
    <>
      {/* Landing */}
      <AnimatePresence>
        {p < 0.08 && (
          <motion.div
            key="landing"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50, pointerEvents:'none', textAlign:'center' }}
          >
            <motion.h1
              initial={{ opacity:0, y:30 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.5, duration:1.5 }}
              style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(48px,7vw,88px)', fontWeight:300, color:SHADOW, lineHeight:1.05, letterSpacing:'0.04em' }}
            >
              UTSAV<br /><em style={{ color:GOLD }}>STONE ART</em>
            </motion.h1>
            <motion.p
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ delay:1.2, duration:1 }}
              style={{ fontFamily:"'Montserrat',sans-serif", fontSize:12, fontWeight:300, color:'#6B5A45', letterSpacing:'0.25em', textTransform:'uppercase', marginTop:20 }}
            >
              Kokapet, Hyderabad · Est. 2023 · 4.9 ★
            </motion.p>
            <motion.p
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ delay:2, duration:1 }}
              style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontStyle:'italic', color:'#9A8A78', marginTop:32 }}
            >
              Scroll to enter the stone.
            </motion.p>
            <motion.div
              animate={{ scaleY:[0,1,0] }}
              transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:1, height:60, background:`linear-gradient(180deg,${GOLD},transparent)`, marginTop:40, transformOrigin:'top' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* World texts */}
      {TEXTS.map(({ world, title, body }) => {
        const op = worldOpacity(p, world, 0.04, 0.04)
        return op > 0 ? (
          <div
            key={world}
            style={{
              position:'fixed', left:60, bottom:80, zIndex:50, pointerEvents:'none',
              opacity:op, transition:'opacity 0.3s',
              maxWidth:480,
            }}
          >
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', color:GOLD, marginBottom:10, fontFamily:"'Montserrat',sans-serif" }}>
              {title}
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(18px,2.2vw,26px)', fontStyle:'italic', fontWeight:300, color: world==='workshop' ? CREAM : SHADOW, lineHeight:1.65, whiteSpace:'pre-line' }}>
              {body}
            </p>
          </div>
        ) : null
      })}

      {/* Signature CTA */}
      <AnimatePresence>
        {p > 0.94 && (
          <motion.div
            key="cta"
            initial={{ opacity:0, y:30 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }}
            style={{ position:'fixed', bottom:60, left:'50%', transform:'translateX(-50%)', zIndex:50, display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' }}
          >
            {[
              { label:'💬 WhatsApp Anup', href:'https://wa.me/919032463247' },
              { label:'📍 Visit Kokapet', href:'https://maps.google.com/?q=Utsav+Stone+Art+Kokapet+Hyderabad' },
              { label:'📞 090324 63247', href:'tel:09032463247' },
            ].map(btn => (
              <a key={btn.label} href={btn.href} target="_blank" rel="noreferrer"
                style={{ padding:'14px 28px', border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Montserrat',sans-serif", fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', textDecoration:'none', background:'rgba(28,18,8,0.8)', backdropFilter:'blur(8px)' }}
              >
                {btn.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final carved line */}
      <AnimatePresence>
        {p > 0.97 && (
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', fontFamily:"'Cormorant Garamond',serif", fontSize:14, fontStyle:'italic', color:'rgba(196,160,87,0.6)', whiteSpace:'nowrap', zIndex:50, letterSpacing:'0.1em' }}
          >
            Come see what stone can become.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Production X watermark */}
      <div style={{ position:'fixed', top:40, right:40, zIndex:50, fontFamily:"'Montserrat',sans-serif", fontSize:9, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(196,160,87,0.5)' }}>
        Preview · Production X
      </div>

      {/* Scroll indicator */}
      {p > 0.02 && p < 0.95 && (
        <div style={{ position:'fixed', right:40, bottom:40, zIndex:50, fontFamily:"'Montserrat',sans-serif", fontSize:9, color:'rgba(196,160,87,0.5)', letterSpacing:'0.15em', textTransform:'uppercase' }}>
          {Math.round(p * 100)}%
        </div>
      )}
    </>
  )
}

// ── LOADING SCREEN ────────────────────────────────────────
function Loading() {
  return (
    <div style={{ position:'fixed', inset:0, background:SAND, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <motion.div
        animate={{ scale:[1,1.12,1], opacity:[0.5,1,0.5] }}
        transition={{ duration:2.5, repeat:Infinity }}
        style={{ width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${GOLD}55 0%,transparent 70%)`, marginBottom:32 }}
      />
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, color:SHADOW, letterSpacing:'0.08em' }}>
        Entering the stone…
      </p>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────
export default function App() {
  const [ready,          setReady]   = useState(false)
  const [scrollProgress, setScroll]  = useState(0)
  const mouseRef = useRef({ nx:0, ny:0 })

  // Track scroll
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement
      const max = el.scrollHeight - window.innerHeight
      setScroll(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', onScroll, { passive:true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Track mouse (normalized -1 to 1)
  useEffect(() => {
    const onMove = e => {
      mouseRef.current.nx = (e.clientX / window.innerWidth  - 0.5) * 2
      mouseRef.current.ny = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Scene bg color based on world
  const p = scrollProgress
  const bgColor = p > 0.76 && p < 0.88 ? '#0D0A06' : SAND

  return (
    <>
      <Cursor />

      {!ready && <Loading />}

      {/* Fixed 3D Canvas */}
      <div style={{ position:'fixed', inset:0, zIndex:1 }}>
        <Canvas
          shadows
          camera={{ fov:55, near:0.1, far:100, position:[0,0.5,6] }}
          gl={{ antialias:true, alpha:false }}
          style={{ background:bgColor, transition:'background 1s' }}
          onCreated={() => setTimeout(() => setReady(true), 800)}
        >
          <Suspense fallback={null}>
            <Scene scrollProgress={p} mouseRef={mouseRef} />
          </Suspense>
        </Canvas>
      </div>

      {/* Scroll container — drives camera via scroll */}
      <div style={{ height:'800vh', position:'relative', zIndex:0 }} />

      {/* HTML overlays */}
      <TextOverlays scrollProgress={p} />

      {/* WhatsApp float */}
      {p > 0.08 && (
        <a href="https://wa.me/919032463247" target="_blank" rel="noreferrer"
          style={{ position:'fixed', bottom:32, right:32, zIndex:1000, width:56, height:56, background:'#25D366', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, textDecoration:'none', boxShadow:'0 4px 24px rgba(37,211,102,0.4)' }}
        >
          💬
        </a>
      )}
    </>
  )
}
