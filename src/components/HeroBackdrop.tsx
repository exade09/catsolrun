import { useEffect, useRef, useState } from 'react'

const VERTEX_SHADER = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

/**
 * Meowave signal field: layered beat waves over a synthwave horizon grid.
 * Deliberately analytic (no raymarching) so the hero stays cheap to composite.
 */
const FRAGMENT_SHADER = `precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

const vec3 CYAN = vec3(0.259, 0.910, 0.827);
const vec3 VIOLET = vec3(0.604, 0.424, 1.000);
const vec3 ORANGE = vec3(0.953, 0.710, 0.404);
const vec3 BG_TOP = vec3(0.027, 0.016, 0.078);
const vec3 BG_BOTTOM = vec3(0.051, 0.033, 0.133);

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  float t = u_time;

  vec3 col = mix(BG_BOTTOM, BG_TOP, smoothstep(0.0, 1.05, uv.y));

  // Beat envelope: a fast attack with an exponential tail, ~34 bpm-feel pulse.
  float beat = fract(t * 0.56);
  float pulse = exp(-4.2 * beat);

  float horizon = -0.16;

  // Perspective grid below the horizon line.
  if (p.y < horizon) {
    float depth = 1.0 / (horizon - p.y + 0.055);
    vec2 g = vec2(p.x * depth * 0.62, depth * 0.5 - t * 0.42);
    vec2 gf = abs(fract(g) - 0.5);
    float gridLine = smoothstep(0.06, 0.0, min(gf.x, gf.y));
    float fade = smoothstep(0.0, 1.5, depth) * exp(-depth * 0.17);
    col += mix(VIOLET, CYAN, 0.42) * gridLine * fade * (0.20 + pulse * 0.10);
  }

  // Four stacked signal waves reading as an equaliser ribbon.
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float amp = 0.26 - fi * 0.042;
    float freq = 1.55 + fi * 0.85;
    float phase = t * (0.34 + fi * 0.13) + fi * 1.73;
    float y = sin(p.x * freq + phase) * amp * (0.78 + pulse * 0.42);
    y += sin(p.x * freq * 0.5 - phase * 0.68) * amp * 0.38;
    y += horizon + 0.20 + fi * 0.035;
    float d = abs(p.y - y);
    float line = 0.016 / (d + 0.016);
    line *= line * 0.5;
    vec3 c = mix(CYAN, VIOLET, fi / 3.0);
    c = mix(c, ORANGE, pulse * 0.22 * (fi / 3.0));
    col += c * line * 0.62;
  }

  // Ambient bloom so the corners are not flat black.
  vec2 o1 = p - vec2(0.92, 0.46);
  col += CYAN * 0.052 / (dot(o1, o1) + 0.36);
  vec2 o2 = p - vec2(-0.82, -0.34);
  col += VIOLET * 0.060 / (dot(o2, o2) + 0.42);

  float vignette = smoothstep(1.75, 0.32, length(p * vec2(0.72, 1.0)));
  col *= 0.54 + 0.46 * vignette;

  gl_FragColor = vec4(col, 1.0);
}`

const compile = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Animated WebGL hero backdrop. Falls back to the CSS gradient underneath when
 * WebGL is unavailable, and holds a single static frame under reduced motion.
 */
export function HeroBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    } as WebGLContextAttributes)
    if (!gl) return undefined

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertex || !fragment) return undefined

    const program = gl.createProgram()
    if (!program) return undefined
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined

    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(program, 'u_time')

    // Fill rate, not instruction count, is the cost driver for a full-bleed
    // hero, so render below native resolution and let the browser upscale.
    const RENDER_SCALE = 0.62
    const MAX_DPR = 1.5

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr * RENDER_SCALE))
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr * RENDER_SCALE))
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform2f(resolutionLocation, width, height)
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let start = performance.now()
    let visible = true
    let running = false

    const draw = (time: number) => {
      gl.uniform1f(timeLocation, time)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = () => {
      resize()
      draw((performance.now() - start) / 1000)
      frame = window.requestAnimationFrame(loop)
    }

    const stop = () => {
      if (!running) return
      running = false
      window.cancelAnimationFrame(frame)
    }

    const play = () => {
      if (running || !visible || document.hidden) return
      if (motionQuery.matches) {
        resize()
        draw(0)
        return
      }
      running = true
      start = performance.now()
      frame = window.requestAnimationFrame(loop)
    }

    resize()
    draw(0)
    setReady(true)

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) play()
        else stop()
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) stop()
      else play()
    }
    const onMotionChange = () => {
      stop()
      play()
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      stop()
    }

    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onMotionChange)
    canvas.addEventListener('webglcontextlost', onContextLost)
    window.addEventListener('resize', resize)
    play()

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('resize', resize)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={'hero__backdrop' + (ready ? ' is-ready' : '')}
      aria-hidden='true'
    />
  )
}
