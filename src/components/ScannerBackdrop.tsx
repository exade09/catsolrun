import { useEffect, useRef } from 'react'

const vertexSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentSource = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
    local.y
  );
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; octave++) {
    value += noise(point) * amplitude;
    point = point * 2.03 + vec2(3.1, 1.7);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  float horizon = smoothstep(-0.88, 0.6, uv.y);
  float ridge = fbm(vec2(uv.x * 1.25 + u_time * 0.035, 1.4));
  float mountain = smoothstep(0.035, 0.0, abs(uv.y + 0.08 - ridge * 0.62));
  float scan = 0.0;

  for (int band = 0; band < 64; band++) {
    float fi = float(band);
    float depth = fract(fi / 64.0 - u_time * 0.055);
    float perspectiveY = -0.86 + pow(depth, 2.35) * 1.02;
    float terrain = fbm(vec2(uv.x * (1.0 + depth * 5.0), fi * 0.23)) * 0.10 * depth;
    scan += smoothstep(0.016, 0.0, abs(uv.y - perspectiveY - terrain)) * depth;
  }

  float roadMask = smoothstep(0.78, 0.05, abs(uv.x) / max(0.12, -uv.y + 0.28));
  float roadLines = smoothstep(0.018, 0.0, abs(fract((uv.x / max(0.12, -uv.y + 0.32) + 1.0) * 4.0) - 0.5));
  float glow = exp(-8.0 * abs(uv.y + 0.08)) * 0.24;
  vec3 violet = vec3(0.43, 0.08, 0.82);
  vec3 cyan = vec3(0.02, 0.86, 0.98);
  vec3 magenta = vec3(1.0, 0.08, 0.58);
  vec3 color = vec3(0.012, 0.008, 0.045);
  color += violet * scan * 0.72;
  color += mix(violet, cyan, v_uv.x) * mountain * 0.9;
  color += magenta * glow;
  color += cyan * roadLines * roadMask * smoothstep(0.1, 0.8, -uv.y) * 0.38;
  color += mix(violet, cyan, v_uv.y) * horizon * 0.045;
  color *= 1.0 - smoothstep(0.42, 1.35, length(uv)) * 0.62;
  outColor = vec4(color, 1.0);
}
`

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
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

export function ScannerBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
    if (!gl) return undefined

    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertex || !fragment) return undefined
    const program = gl.createProgram()
    if (!program) return undefined
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return undefined
    }

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const time = gl.getUniformLocation(program, 'u_time')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio))
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
    }

    const draw = (now: number) => {
      resize()
      gl.useProgram(program)
      gl.uniform2f(resolution, canvas.width, canvas.height)
      gl.uniform1f(time, reducedMotion ? 4.0 : now * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!reducedMotion) frame = window.requestAnimationFrame(draw)
    }

    frame = window.requestAnimationFrame(draw)
    return () => {
      window.cancelAnimationFrame(frame)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return <canvas ref={canvasRef} className='scanner-backdrop' aria-hidden='true' />
}
