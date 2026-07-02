import * as THREE from 'three'

// Procedural stone texture generator
export function createStoneTexture(options = {}) {
  const {
    baseColor = '#D4C4A8',
    grainColor = '#8C7A5E',
    width = 512,
    height = 512,
    grainDensity = 150,
    grainOpacity = 0.06
  } = options

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Base
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)

  // Subtle gradient
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, 'rgba(255,255,255,0.05)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0.03)')
  grad.addColorStop(1, 'rgba(255,255,255,0.04)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // Stone grain lines
  for (let i = 0; i < grainDensity; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const len = 10 + Math.random() * 60
    const angle = Math.random() * Math.PI * 2
    const opacity = (grainOpacity * 0.5) + Math.random() * grainOpacity

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(
      x + Math.cos(angle) * len,
      y + Math.sin(angle) * len
    )
    ctx.strokeStyle = grainColor
    ctx.lineWidth = 0.5 + Math.random() * 1.5
    ctx.globalAlpha = opacity
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Subtle veins
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    let vx = Math.random() * width
    ctx.moveTo(vx, 0)
    for (let j = 0; j < 12; j++) {
      vx += (Math.random() - 0.5) * 40
      ctx.lineTo(vx, (j / 12) * height)
    }
    ctx.strokeStyle = grainColor
    ctx.lineWidth = 0.5 + Math.random() * 1
    ctx.globalAlpha = 0.03 + Math.random() * 0.04
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Standard materials
export const materials = {
  marble: (color = '#F5F2EE') => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.15,
    metalness: 0.02,
    envMapIntensity: 1.2
  }),

  sandstone: (color = '#D4C4A8') => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0
  }),

  gold: () => new THREE.MeshStandardMaterial({
    color: '#C4A057',
    roughness: 0.2,
    metalness: 0.85,
    envMapIntensity: 2
  }),

  darkStone: (color = '#3A3020') => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0
  })
}
