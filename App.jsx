import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import Cursor from './components/Cursor'
import CorridorScene from './scenes/CorridorScene'
import WorkshopScene from './scenes/WorkshopScene'
import GaneshaModel from './components/GaneshaModel'
import MandirModel from './components/MandirModel'
import WallPanel from './components/WallPanel'
import ColumnModel from './components/ColumnModel'
import { useMouse } from './hooks/useMouse'
import { useScrollProgress } from './hooks/useScrollProgress'

// ─── STYLES ──────────────────────────────────────────────
const S = {
  // Layout
  fixed: { position: 'fixed', inset: 0 },
  fullscreen: { width: '100%', height: '100vh' },

  // Colors
  cream: '#FAF6F0',
  cream2: '#F2EAE0',
  sand: '#E8D9C4',
  gold: '#C4A057',
  charcoal: '#1C1612',
  muted: '#9A8A78',
  brown: '#6B5A45',

  // Text styles
  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: '#C4A057',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(38px, 4.5vw, 58px)',
    fontWeight: 300,
    lineHeight: 1.1,
    color: '#1C1612',
    marginBottom: 20,
  },
  sub: {
    fontSize: 13,
    fontWeight: 300,
    color: '#9A8A78',
    lineHeight: 1.9,
    maxWidth: 480,
  },
}

// ─── DEMO BANNER ─────────────────────────────────────────
function DemoBanner() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#C4A057', color: '#1C1612',
      textAlign: 'center', padding: '7px 20px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
      textTransform: 'uppercase',
    }}>
      ✦ Website Preview — Built by Production X — productionx.in
    </div>
  )
}

// ─── PROLOGUE ────────────────────────────────────────────
function Prologue({ onEnter }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        ...S.fixed,
        background: '#0D0A06',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 500,
        padding: 40,
        textAlign: 'center',
      }}
    >
      {/* Breathing amber glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 130, height: 130,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,160,87,0.45) 0%, transparent 70%)',
          margin: '0 auto 50px',
          boxShadow: '0 0 60px rgba(196,160,87,0.2)',
        }}
      />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1.2 }}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(28px, 4vw, 52px)',
          fontWeight: 300,
          color: '#FAF6F0',
          lineHeight: 1.3,
          marginBottom: 20,
          letterSpacing: '0.02em',
        }}
      >
        Some things are not made.<br />
        <em style={{ color: '#C4A057' }}>They are revealed.</em>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        style={{
          fontSize: 11, fontWeight: 300,
          color: '#6B5A45', letterSpacing: '0.2em',
          textTransform: 'uppercase', marginBottom: 52,
        }}
      >
        Utsav Stone Art · Kokapet, Hyderabad
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        whileHover={{ scale: 1.03 }}
        onClick={onEnter}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 14,
          padding: '16px 44px',
          border: '1px solid rgba(196,160,87,0.4)',
          background: 'transparent', color: '#C4A057',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 11, fontWeight: 500, letterSpacing: '0.2em',
          textTransform: 'uppercase', cursor: 'none',
        }}
      >
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4A057' }}
        />
        Enter The Stone
      </motion.button>
    </motion.div>
  )
}

// ─── CRACK SCREEN ────────────────────────────────────────
function CrackScreen({ onShatter }) {
  const canvasRef = useRef()
  const lastPos = useRef({ x: -1, y: -1 })
  const cracked = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    drawStone(ctx, canvas.width, canvas.height)

    const onMove = (e) => {
      if (cracked.current) return
      const { clientX: x, clientY: y } = e.touches ? e.touches[0] : e
      if (lastPos.current.x < 0) { lastPos.current = { x, y }; return }
      drawCracks(ctx, lastPos.current.x, lastPos.current.y, x, y)
      lastPos.current = { x, y }
    }

    const onClick = () => {
      if (cracked.current) return
      cracked.current = true
      shatter(ctx, canvas.width, canvas.height, onShatter)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchmove', onMove, { passive: true })
    canvas.addEventListener('touchend', onClick)

    return () => {
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [onShatter])

  function drawStone(ctx, w, h) {
    // Warm sandstone gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#E8D9C4')
    grad.addColorStop(0.4, '#D4C4A8')
    grad.addColorStop(0.7, '#C8B898')
    grad.addColorStop(1, '#D4C4A8')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Stone grain
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * w, y = Math.random() * h
      const len = 15 + Math.random() * 70
      const angle = Math.random() * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.strokeStyle = '#8C7A5E'
      ctx.lineWidth = 0.5 + Math.random() * 1.5
      ctx.globalAlpha = 0.03 + Math.random() * 0.07
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Stone veins
    for (let i = 0; i < 10; i++) {
      ctx.beginPath()
      let vx = Math.random() * w
      ctx.moveTo(vx, 0)
      for (let j = 0; j < 15; j++) {
        vx += (Math.random() - 0.5) * 50
        ctx.lineTo(vx, (j / 15) * h)
      }
      ctx.strokeStyle = '#9A8A6E'
      ctx.lineWidth = 0.8
      ctx.globalAlpha = 0.04 + Math.random() * 0.05
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(28,22,18,0.5)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, w, h)
  }

  function drawCracks(ctx, x1, y1, x2, y2) {
    // Main crack
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(196,160,87,0.9)'
    ctx.strokeStyle = 'rgba(196,160,87,0.95)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    const cpx1 = x1 + (x2 - x1) * 0.33 + (Math.random() - 0.5) * 12
    const cpy1 = y1 + (y2 - y1) * 0.33 + (Math.random() - 0.5) * 12
    const cpx2 = x1 + (x2 - x1) * 0.66 + (Math.random() - 0.5) * 12
    const cpy2 = y1 + (y2 - y1) * 0.66 + (Math.random() - 0.5) * 12
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2)
    ctx.stroke()
    ctx.restore()

    // Outer glow
    ctx.save()
    ctx.strokeStyle = 'rgba(255,220,120,0.25)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2)
    ctx.stroke()
    ctx.restore()

    // Branch cracks
    if (Math.random() < 0.4) {
      const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.PI / 4) * (Math.random() < 0.5 ? 1 : -1)
      const len = 12 + Math.random() * 35
      ctx.save()
      ctx.strokeStyle = 'rgba(196,160,87,0.55)'
      ctx.lineWidth = 0.8
      ctx.shadowBlur = 5
      ctx.shadowColor = 'rgba(196,160,87,0.5)'
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 + Math.cos(angle) * len, y2 + Math.sin(angle) * len)
      ctx.stroke()
      ctx.restore()
    }
  }

  function shatter(ctx, w, h, callback) {
    let alpha = 0
    const interval = setInterval(() => {
      alpha += 0.07
      const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h))
      grd.addColorStop(0, `rgba(255,248,235,${Math.min(alpha, 1)})`)
      grd.addColorStop(0.4, `rgba(240,225,200,${Math.min(alpha * 0.85, 0.85)})`)
      grd.addColorStop(1, `rgba(250,246,240,${Math.min(alpha, 1)})`)
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, w, h)
      if (alpha >= 1.3) {
        clearInterval(interval)
        setTimeout(callback, 150)
      }
    }, 16)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ ...S.fixed, zIndex: 400 }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          position: 'absolute', bottom: 60, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10, fontWeight: 600,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#6B5A45', textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        Move your cursor to carve ·{' '}
        <span style={{ color: '#C4A057' }}>Click to enter</span>
      </motion.div>
    </motion.div>
  )
}

// ─── 3D CANVAS (Corridor Journey) ────────────────────────
function JourneyCanvas({ scrollProgress, mouseRef }) {
  return (
    <div style={{ ...S.fixed, zIndex: 1 }}>
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, 0.3, 18] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#FAF6F0' }}
      >
        <AdaptiveDpr pixelated />
        <PerformanceMonitor />
        <Suspense fallback={null}>
          <CorridorScene scrollProgress={scrollProgress} mouseRef={mouseRef} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// ─── SCROLL OVERLAY TEXT ──────────────────────────────────
function ScrollOverlays({ scrollProgress }) {
  // Text appears based on scroll zones
  const inCorridor = scrollProgress > 0.08 && scrollProgress < 0.45
  const inHall = scrollProgress > 0.45 && scrollProgress < 0.65
  const showDoors = scrollProgress > 0.5 && scrollProgress < 0.65

  return (
    <>
      {/* Corridor carved text */}
      <AnimatePresence>
        {inCorridor && (
          <motion.div
            key="corridor-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', bottom: 80, left: 0, right: 0,
              textAlign: 'center', zIndex: 50, pointerEvents: 'none',
            }}
          >
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(13px, 1.8vw, 17px)',
              fontWeight: 300,
              color: 'rgba(196,160,87,0.8)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}>
              Kokapet, Hyderabad · Est. 2023 · 4.9 ★ · Crafted by hand. Built to last.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hall doorway labels */}
      <AnimatePresence>
        {showDoors && (
          <motion.div
            key="hall-doors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', bottom: 60, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
              gap: 60, zIndex: 50,
            }}
          >
            {[
              { label: 'For Your Home', sub: 'Mandirs & Idols', icon: '🙏' },
              { label: 'For Your Space', sub: 'Wall Art & Elevations', icon: '🏛️' },
              { label: 'For Your Project', sub: 'Commercial & Exterior', icon: '🌿' },
            ].map((door, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ textAlign: 'center', cursor: 'none' }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{door.icon}</div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(212,200,168,0.9)', marginBottom: 3,
                }}>
                  {door.label}
                </div>
                <div style={{
                  fontSize: 9, color: 'rgba(212,200,168,0.55)',
                  letterSpacing: '0.1em',
                }}>
                  {door.sub}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll instruction */}
      <AnimatePresence>
        {scrollProgress < 0.08 && scrollProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', bottom: 50, right: 60,
              zIndex: 50, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10,
            }}
          >
            <motion.div
              animate={{ scaleY: [0, 1, 0], originY: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 1, height: 60,
                background: 'linear-gradient(180deg, #C4A057, transparent)',
              }}
            />
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#9A8A78',
              writingMode: 'vertical-rl',
            }}>
              Scroll
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── SECTION: AUDIENCE ROOM ───────────────────────────────
function AudienceSection({ id, bg, tag, headingHTML, quote, items, ctaText, ctaHref, reverse, Model }) {
  const mouseRef = useMouse()

  return (
    <section id={id} style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      padding: '100px 60px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        direction: reverse ? 'rtl' : 'ltr',
      }}>
        {/* 3D Canvas */}
        <div style={{ height: 520, direction: 'ltr' }}>
          <Canvas
            shadows
            camera={{ fov: 50, near: 0.1, far: 50, position: [0, 0.5, 5] }}
            style={{ background: bg, borderRadius: 2 }}
          >
            <ambientLight color="#FFF8F0" intensity={0.5} />
            <directionalLight color="#FFF5D0" intensity={1.2} position={[2, 5, 4]} castShadow />
            <pointLight color="#C4A057" intensity={1} distance={8} position={[-2, 2, 3]} />
            <Suspense fallback={null}>
              <Model mouseRef={mouseRef} />
            </Suspense>
          </Canvas>
        </div>

        {/* Content */}
        <div style={{ direction: 'ltr' }}>
          <div style={S.eyebrow}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: '#C4A057' }} />
            {tag}
          </div>
          <h2
            style={S.heading}
            dangerouslySetInnerHTML={{ __html: headingHTML }}
          />
          <blockquote style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 19,
            fontStyle: 'italic',
            fontWeight: 300,
            color: '#6B5A45',
            lineHeight: 1.65,
            marginBottom: 32,
            paddingLeft: 20,
            borderLeft: '2px solid #C4A057',
          }}>
            {quote}
          </blockquote>
          <div style={{ marginBottom: 36 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 6, height: 6, background: '#C4A057',
                  borderRadius: '50%', flexShrink: 0, marginTop: 7,
                }} />
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: '#1C1612', marginBottom: 3 }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: 11, color: '#9A8A78', lineHeight: 1.75 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <a
            href={ctaHref}
            target="_blank"
            rel="noreferrer"
            data-cursor
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '15px 34px',
              background: '#1C1612', color: '#FAF6F0',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.15em',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'all 0.3s', cursor: 'none',
            }}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── WORKSHOP SECTION ────────────────────────────────────
function WorkshopSection() {
  return (
    <section style={{
      minHeight: '80vh', background: '#1C1612',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '100px 60px',
    }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Canvas
          camera={{ fov: 50, near: 0.1, far: 50, position: [0, 0.5, 5] }}
          style={{ background: '#0D0A06' }}
        >
          <Suspense fallback={null}>
            <WorkshopScene />
          </Suspense>
        </Canvas>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true }}
        style={{
          position: 'relative', zIndex: 2,
          maxWidth: 700, textAlign: 'center',
        }}
      >
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(20px, 2.8vw, 32px)',
          fontStyle: 'italic', fontWeight: 300,
          color: '#FAF6F0', lineHeight: 1.75,
          marginBottom: 40,
        }}>
          "Every piece that leaves our studio in Kokapet began as a raw block of stone.
          It was cut, carved, shaped and finished by hands that have spent years learning
          how stone behaves — how it takes light, how it holds a line, how it can be made
          to feel both ancient and completely new. We do not have a catalogue.
          We have conversations. Then we begin."
        </p>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ width: 60, height: 1, background: '#C4A057', margin: '0 auto' }}
        />
      </motion.div>
    </section>
  )
}

// ─── EXIT SECTION ────────────────────────────────────────
function ExitSection() {
  return (
    <section style={{
      minHeight: '100vh', background: '#FAF6F0',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      padding: '100px 60px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(196,160,87,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', maxWidth: 640, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: '#C4A057', marginBottom: 24,
          }}
        >
          Come see it in person
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 300, lineHeight: 1.05,
            color: '#1C1612', marginBottom: 20,
          }}
        >
          You have seen<br />
          what stone <em style={{ color: '#C4A057' }}>can become.</em>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{ ...S.sub, margin: '0 auto 56px', textAlign: 'center' }}
        >
          Now imagine it in your home, your temple, your space.
          Visit our studio in Kokapet — bring your vision. We will take it from there.
        </motion.p>

        {/* Three doors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}
        >
          {[
            { icon: '💬', title: 'WhatsApp Anup', sub: 'Start a conversation', href: 'https://wa.me/919032463247' },
            { icon: '📞', title: 'Call the Studio', sub: '090324 63247', href: 'tel:09032463247' },
            { icon: '📍', title: 'Visit Us', sub: 'Kokapet, Gandipet', href: '#' },
          ].map((door, i) => (
            <motion.a
              key={i}
              href={door.href}
              whileHover={{ background: '#1C1612', borderColor: '#1C1612' }}
              data-cursor
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 12,
                padding: '32px 40px',
                border: '1px solid rgba(196,160,87,0.3)',
                background: 'transparent',
                textDecoration: 'none', minWidth: 180,
                transition: 'all 0.4s', cursor: 'none',
              }}
            >
              <span style={{ fontSize: 36 }}>{door.icon}</span>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 20, fontWeight: 600, color: '#1C1612',
              }}>
                {door.title}
              </span>
              <span style={{ fontSize: 10, color: '#9A8A78', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {door.sub}
              </span>
            </motion.a>
          ))}
        </motion.div>

        {/* Info strip */}
        <div style={{
          display: 'flex', gap: 48, justifyContent: 'center',
          flexWrap: 'wrap', paddingTop: 48,
          borderTop: '1px solid rgba(196,160,87,0.2)',
        }}>
          {[
            { label: 'Address', value: 'Beside Tasca Bar & Kitchen\nKokapet, Gandipet\nHyderabad 500075' },
            { label: 'Hours', value: 'Open Daily\n10:00 AM – 8:00 PM\nSunday included' },
            { label: 'Find Us', value: '⭐ 4.9 / 5 Stars\n84 Google Reviews\n@utsav_stoneart' },
          ].map((info, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#1C1612', marginBottom: 10,
              }}>
                {info.label}
              </div>
              <div style={{ fontSize: 12, color: '#9A8A78', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                {info.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#0D0A06', padding: '60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 40 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#FAF6F0', marginBottom: 4 }}>
            Utsav Stone Art
          </div>
          <div style={{ fontSize: 10, color: '#C4A057', letterSpacing: '0.12em', marginBottom: 16 }}>
            A Place for Everything to Décor
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.8, marginBottom: 24 }}>
            Hand and machine-crafted marble, granite and sandstone. Serving Hyderabad and Telangana with devotion since 2023.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {['📸', '💬', '📌'].map((icon, i) => (
              <a key={i} href="#" data-cursor style={{
                width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, cursor: 'none', textDecoration: 'none',
                color: 'rgba(255,255,255,0.4)', transition: 'all 0.3s',
              }}>
                {icon}
              </a>
            ))}
          </div>
        </div>
        {[
          { title: 'Collections', links: ['Pooja Mandirs', 'Deity Sculptures', 'Wall Elevations', 'Garden Structures', 'Custom Wall Art'] },
          { title: 'Studio', links: ['About Us', 'Our Work', 'Process', 'Reviews', 'Contact'] },
          { title: 'Contact', links: ['090324 63247', 'WhatsApp Us', 'Get Directions', '@utsav_stoneart'] },
        ].map((col, i) => (
          <div key={i}>
            <h4 style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>
              {col.title}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map((link, j) => (
                <li key={j}>
                  <a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: 'rgba(255,255,255,0.2)',
      }}>
        <span>© 2026 Utsav Stone Art, Kokapet, Hyderabad.</span>
        <span>Website by <a href="https://productionx.in" style={{ color: '#C4A057', textDecoration: 'none' }}>Production X</a> · Every frame earns its place.</span>
      </div>
    </footer>
  )
}

// ─── MAIN NAV ────────────────────────────────────────────
function Nav({ visible }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <nav style={{
      position: 'fixed',
      top: 32, left: 0, right: 0,
      zIndex: 1000,
      padding: scrolled ? '13px 60px' : '20px 60px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: scrolled ? 'rgba(250,246,240,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(196,160,87,0.2)' : 'none',
      transition: 'all 0.4s',
    }}>
      <a href="#" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20, fontWeight: 600,
        color: scrolled ? '#1C1612' : '#FAF6F0',
        textDecoration: 'none',
        transition: 'color 0.4s',
        cursor: 'none',
      }}>
        Utsav <span style={{ color: '#C4A057' }}>Stone Art</span>
      </a>
      <ul style={{ display: 'flex', gap: 32, listStyle: 'none' }}>
        {['Home & Temple', 'Wall & Interior', 'Commercial', 'Contact'].map((item, i) => (
          <li key={i}>
            <a href="#" data-cursor style={{
              fontSize: 10, fontWeight: 500,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: scrolled ? '#9A8A78' : 'rgba(250,246,240,0.7)',
              textDecoration: 'none', cursor: 'none',
              transition: 'color 0.3s',
            }}>
              {item}
            </a>
          </li>
        ))}
      </ul>
      <a href="https://wa.me/919032463247" data-cursor target="_blank" rel="noreferrer" style={{
        background: '#1C1612', color: '#FAF6F0',
        padding: '11px 24px', fontSize: 10,
        fontWeight: 600, letterSpacing: '0.14em',
        textTransform: 'uppercase', textDecoration: 'none',
        cursor: 'none', transition: 'all 0.3s',
      }}>
        Get a Quote
      </a>
    </nav>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('prologue') // prologue | crack | journey | site
  const scrollProgress = useScrollProgress()
  const mouseRef = useMouse()

  // Total scroll height for journey section
  const journeyHeight = '600vh' // 6 screens of scroll for corridor

  return (
    <>
      <DemoBanner />
      <Cursor />

      {/* ── PHASE: PROLOGUE ── */}
      <AnimatePresence>
        {phase === 'prologue' && (
          <Prologue onEnter={() => setPhase('crack')} />
        )}
      </AnimatePresence>

      {/* ── PHASE: CRACK ── */}
      <AnimatePresence>
        {phase === 'crack' && (
          <CrackScreen onShatter={() => setPhase('journey')} />
        )}
      </AnimatePresence>

      {/* ── PHASE: JOURNEY ── */}
      {phase === 'journey' && (
        <>
          {/* Fixed 3D canvas */}
          <JourneyCanvas scrollProgress={scrollProgress} mouseRef={mouseRef} />

          {/* Scroll overlays */}
          <ScrollOverlays scrollProgress={scrollProgress} />

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => setPhase('site')}
            style={{
              position: 'fixed', top: 60, right: 40, zIndex: 200,
              background: 'transparent',
              border: '1px solid rgba(196,160,87,0.3)',
              color: '#C4A057',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              padding: '8px 18px', cursor: 'none',
            }}
          >
            Skip Experience →
          </motion.button>

          {/* Tall scroll container to drive camera */}
          <div style={{ height: journeyHeight, position: 'relative', zIndex: 0 }} />

          {/* When scrolled far enough, auto-advance */}
          {scrollProgress > 0.9 && (() => {
            setTimeout(() => setPhase('site'), 800)
            return null
          })()}
        </>
      )}

      {/* ── PHASE: MAIN SITE ── */}
      <AnimatePresence>
        {phase === 'site' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <Nav visible />

            {/* WhatsApp float */}
            <a href="https://wa.me/919032463247" target="_blank" rel="noreferrer" data-cursor
              style={{
                position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
                width: 56, height: 56, background: '#25D366',
                borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 24, textDecoration: 'none', cursor: 'none',
                boxShadow: '0 4px 24px rgba(37,211,102,0.35)',
              }}
            >
              💬
            </a>

            {/* Audience Sections */}
            <AudienceSection
              id="home-room"
              bg="#FAF6F0"
              tag="For Your Home"
              headingHTML="Where your home<br/>becomes a <em style='font-style:italic;color:#C4A057'>temple.</em>"
              quote="A Pooja mandir is not furniture. It is the soul of your home. It deserves to be made like one."
              items={[
                { title: 'Pooja Mandirs', desc: 'Carving mandirs, Jali work, Meenakari, MOP work — crafted to become the centrepiece of your home for generations.' },
                { title: 'Deity Sculptures', desc: 'White marble Ganesha, Radha Krishna and other idols — hand finished with gold detailing, made to your exact dimensions.' },
                { title: 'Wall Murals', desc: 'Sandstone and marble wall art — sacred motifs and decorative panels that transform ordinary walls into art.' },
              ]}
              ctaText="💬 WhatsApp Anup to Begin Yours"
              ctaHref="https://wa.me/919032463247"
              Model={(props) => <MandirModel position={[0, 0, 0]} scale={0.7} {...props} />}
            />

            <AudienceSection
              id="space-room"
              bg="#F2EAE0"
              tag="For Your Space"
              headingHTML="The wall that makes<br/>everything else <em style='font-style:italic;color:#C4A057'>make sense.</em>"
              quote="Great interiors are composed — around one piece that sets the tone for everything else."
              items={[
                { title: 'Wall Elevations', desc: 'Stone relief panels and cladding that transform a living room, lobby or entrance into something architectural.' },
                { title: 'Custom Wall Art', desc: 'Bespoke carved stone artwork — designed around your space, your taste and the story you want your home to tell.' },
                { title: 'Flooring & Mosaics', desc: 'Stone flooring, mosaic inlays and entrance patterns — surfaces that ground a space with permanence.' },
              ]}
              ctaText="Send Your Brief →"
              ctaHref="https://wa.me/919032463247"
              reverse
              Model={(props) => <WallPanel position={[0, 0, 0]} scale={0.65} {...props} />}
            />

            <AudienceSection
              id="project-room"
              bg="#E8D9C4"
              tag="For Your Project"
              headingHTML="Built to outlast<br/>the <strong style='font-weight:600'>building</strong> <em style='font-style:italic;color:#C4A057'>it stands in.</em>"
              quote="Builders, architects and interior designers across Hyderabad trust us for one reason — we deliver exactly what we promise."
              items={[
                { title: 'Garden & Exterior Structures', desc: 'Stone gazebos, fountains, columns and garden sculptures — permanent features for premium spaces.' },
                { title: 'Staircase & Facade Cladding', desc: 'Marble and granite cladding that elevates the architectural character of any building.' },
                { title: 'Scale Capability', desc: 'From single residences to large commercial commissions — we handle the full scope with on-site installation.' },
              ]}
              ctaText="Discuss Your Project"
              ctaHref="https://wa.me/919032463247"
              Model={(props) => <ColumnModel position={[0, -0.5, 0]} scale={0.72} {...props} />}
            />

            <WorkshopSection />
            <ExitSection />
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
