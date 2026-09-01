/**
 * Generative retrowave / lo-fi soundtrack for the run.
 *
 * Everything is synthesised in Web Audio rather than streamed from a file, so
 * the track never repeats a fixed loop, adds nothing to the bundle, and carries
 * no third-party licensing. Notes are scheduled on a lookahead timer driven by
 * the audio clock, which keeps timing stable even when the main thread is busy
 * rendering the game.
 */

const BPM = 84
const SECONDS_PER_BEAT = 60 / BPM
const STEPS_PER_BAR = 16
const STEP_DURATION = SECONDS_PER_BEAT / 4
const BARS_IN_PHRASE = 8
const TOTAL_STEPS = STEPS_PER_BAR * BARS_IN_PHRASE

const SCHEDULER_INTERVAL_MS = 25
const LOOKAHEAD_SECONDS = 0.12
const MIN_GAIN = 0.0001

const midiToFrequency = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12)

interface Bar {
  /** Bass root, written low in the register. */
  bass: number
  /** Pad voicing; the arpeggio borrows these tones an octave up. */
  chord: [number, number, number]
}

/** i - VI - III - VII - i - VI - iv - V in A minor. */
const PHRASE: Bar[] = [
  { bass: 33, chord: [57, 60, 64] },
  { bass: 29, chord: [53, 57, 60] },
  { bass: 36, chord: [55, 60, 64] },
  { bass: 31, chord: [55, 59, 62] },
  { bass: 33, chord: [57, 60, 64] },
  { bass: 29, chord: [53, 57, 60] },
  { bass: 38, chord: [53, 57, 62] },
  { bass: 40, chord: [56, 59, 64] },
]

const KICK_STEPS = new Set([0, 10])
const SNARE_STEPS = new Set([4, 12])
const ARP_STEPS = [2, 6, 10, 14]
/** Bars that carry the arpeggio, so the phrase opens up rather than looping flat. */
const ARP_BARS = new Set([2, 3, 6, 7])

/**
 * The chord phrase is eight bars, which on its own would repeat every ~23s.
 * Four arrangement sections play over it so the material only comes back around
 * after roughly a minute and a half.
 */
interface Section {
  drums: boolean
  hats: boolean
  arp: boolean
  fills: boolean
}

const SECTIONS: Section[] = [
  { drums: false, hats: false, arp: false, fills: false },
  { drums: true, hats: true, arp: false, fills: false },
  { drums: true, hats: true, arp: true, fills: false },
  { drums: true, hats: true, arp: true, fills: true },
]

export class RetrowaveMusic {
  private readonly context: AudioContext
  private readonly output: GainNode

  private musicBus: GainNode | null = null
  private duckBus: GainNode | null = null
  private toneBus: GainNode | null = null
  private drumBus: GainNode | null = null
  private hiss: AudioBufferSourceNode | null = null
  private wobble: OscillatorNode | null = null
  private noiseBuffer: AudioBuffer | null = null

  private timer: number | null = null
  private absoluteStep = 0
  private nextStepTime = 0
  private running = false

  constructor(context: AudioContext, output: GainNode) {
    this.context = context
    this.output = output
  }

  get isRunning(): boolean {
    return this.running
  }

  start(): void {
    if (this.running) return
    const { context, output } = this

    const musicBus = context.createGain()
    musicBus.gain.setValueAtTime(MIN_GAIN, context.currentTime)
    musicBus.gain.linearRampToValueAtTime(0.16, context.currentTime + 2.4)
    musicBus.connect(output)

    // Pads and bass duck under the kick; drums bypass the duck.
    const duckBus = context.createGain()
    duckBus.gain.value = 1
    duckBus.connect(musicBus)

    const toneBus = context.createGain()
    toneBus.gain.value = 1
    toneBus.connect(duckBus)

    const drumBus = context.createGain()
    drumBus.gain.value = 1
    drumBus.connect(musicBus)

    this.musicBus = musicBus
    this.duckBus = duckBus
    this.toneBus = toneBus
    this.drumBus = drumBus

    this.startHiss()
    this.startWobble()

    this.absoluteStep = 0
    this.nextStepTime = context.currentTime + 0.15
    this.running = true
    this.timer = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS)
  }

  stop(): void {
    if (!this.running) return
    this.running = false

    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }

    const { context } = this
    const now = context.currentTime
    const musicBus = this.musicBus

    if (musicBus) {
      musicBus.gain.cancelScheduledValues(now)
      musicBus.gain.setValueAtTime(Math.max(MIN_GAIN, musicBus.gain.value), now)
      musicBus.gain.exponentialRampToValueAtTime(MIN_GAIN, now + 0.35)
    }

    const hiss = this.hiss
    const wobble = this.wobble
    const nodes = [this.musicBus, this.duckBus, this.toneBus, this.drumBus]
    this.musicBus = null
    this.duckBus = null
    this.toneBus = null
    this.drumBus = null
    this.hiss = null
    this.wobble = null

    // Let the fade finish before tearing the graph down.
    window.setTimeout(() => {
      for (const source of [hiss, wobble]) {
        if (!source) continue
        try {
          source.stop()
        } catch {
          // Already stopped by the browser during teardown.
        }
        source.disconnect()
      }
      for (const node of nodes) node?.disconnect()
    }, 420)
  }

  private schedule(): void {
    if (!this.running) return
    const horizon = this.context.currentTime + LOOKAHEAD_SECONDS
    while (this.nextStepTime < horizon) {
      this.scheduleStep(this.absoluteStep, this.nextStepTime)
      this.absoluteStep += 1
      this.nextStepTime += STEP_DURATION
    }
  }

  private scheduleStep(absoluteStep: number, time: number): void {
    const step = absoluteStep % TOTAL_STEPS
    const section = SECTIONS[Math.floor(absoluteStep / TOTAL_STEPS) % SECTIONS.length]
    const barIndex = Math.floor(step / STEPS_PER_BAR)
    const stepInBar = step % STEPS_PER_BAR
    const bar = PHRASE[barIndex]
    if (!bar || !section) return

    if (stepInBar === 0) {
      this.playPad(bar.chord, time)
      this.playBass(bar.bass, time, SECONDS_PER_BEAT * 2.1)
    }
    if (stepInBar === 10) {
      this.playBass(bar.bass + 12, time, SECONDS_PER_BEAT * 0.7)
    }

    if (section.drums) {
      if (KICK_STEPS.has(stepInBar)) {
        this.playKick(time)
        this.duck(time)
      }
      // A pickup kick before the phrase turns around.
      if (section.fills && stepInBar === 14 && (barIndex === 3 || barIndex === 7)) {
        this.playKick(time)
        this.duck(time)
      }
      if (SNARE_STEPS.has(stepInBar)) this.playSnare(time)
    }

    if (section.hats && stepInBar % 2 === 0) {
      this.playHat(time, stepInBar % 4 === 0 ? 0.05 : 0.03)
    }

    if (section.arp && ARP_BARS.has(barIndex)) {
      const arpIndex = ARP_STEPS.indexOf(stepInBar)
      if (arpIndex !== -1) {
        const note = bar.chord[arpIndex % bar.chord.length] + 12
        this.playArp(note, time)
      }
    }
  }

  private playPad(chord: [number, number, number], time: number): void {
    const context = this.context
    const bus = this.toneBus
    if (!bus) return

    const duration = SECONDS_PER_BEAT * 4
    const envelope = context.createGain()
    const filter = context.createBiquadFilter()

    filter.type = 'lowpass'
    filter.Q.value = 0.6
    filter.frequency.setValueAtTime(520, time)
    filter.frequency.linearRampToValueAtTime(1180, time + duration * 0.45)
    filter.frequency.linearRampToValueAtTime(620, time + duration)

    envelope.gain.setValueAtTime(MIN_GAIN, time)
    envelope.gain.linearRampToValueAtTime(0.22, time + 0.75)
    envelope.gain.setValueAtTime(0.22, time + duration * 0.7)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration + 0.3)

    filter.connect(envelope)
    envelope.connect(bus)

    const oscillators: OscillatorNode[] = []
    for (const note of chord) {
      // Two slightly detuned saws per tone give the pad its width.
      for (const detune of [-6, 7]) {
        const oscillator = context.createOscillator()
        oscillator.type = 'sawtooth'
        oscillator.frequency.value = midiToFrequency(note)
        oscillator.detune.value = detune
        oscillator.connect(filter)
        oscillator.start(time)
        oscillator.stop(time + duration + 0.4)
        oscillators.push(oscillator)
      }
    }

    const last = oscillators[oscillators.length - 1]
    last?.addEventListener('ended', () => {
      for (const oscillator of oscillators) oscillator.disconnect()
      filter.disconnect()
      envelope.disconnect()
    })
  }

  private playBass(note: number, time: number, duration: number): void {
    const context = this.context
    const bus = this.toneBus
    if (!bus) return

    const oscillator = context.createOscillator()
    const harmonic = context.createOscillator()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.value = midiToFrequency(note)
    harmonic.type = 'sine'
    harmonic.frequency.value = midiToFrequency(note + 12)

    const harmonicGain = context.createGain()
    harmonicGain.gain.value = 0.3

    filter.type = 'lowpass'
    filter.frequency.value = 320
    filter.Q.value = 1.1

    envelope.gain.setValueAtTime(MIN_GAIN, time)
    envelope.gain.linearRampToValueAtTime(0.5, time + 0.03)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration)

    oscillator.connect(filter)
    harmonic.connect(harmonicGain)
    harmonicGain.connect(filter)
    filter.connect(envelope)
    envelope.connect(bus)

    oscillator.start(time)
    harmonic.start(time)
    oscillator.stop(time + duration + 0.05)
    harmonic.stop(time + duration + 0.05)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      harmonic.disconnect()
      harmonicGain.disconnect()
      filter.disconnect()
      envelope.disconnect()
    })
  }

  private playArp(note: number, time: number): void {
    const context = this.context
    const bus = this.toneBus
    if (!bus) return

    const oscillator = context.createOscillator()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    const duration = 0.42

    oscillator.type = 'triangle'
    oscillator.frequency.value = midiToFrequency(note)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2600, time)
    filter.frequency.exponentialRampToValueAtTime(900, time + duration)

    envelope.gain.setValueAtTime(MIN_GAIN, time)
    envelope.gain.linearRampToValueAtTime(0.1, time + 0.012)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration)

    oscillator.connect(filter)
    filter.connect(envelope)
    envelope.connect(bus)
    oscillator.start(time)
    oscillator.stop(time + duration + 0.05)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      filter.disconnect()
      envelope.disconnect()
    })
  }

  private playKick(time: number): void {
    const context = this.context
    const bus = this.drumBus
    if (!bus) return

    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const duration = 0.42

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(150, time)
    oscillator.frequency.exponentialRampToValueAtTime(44, time + 0.13)

    envelope.gain.setValueAtTime(MIN_GAIN, time)
    envelope.gain.linearRampToValueAtTime(0.62, time + 0.006)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration)

    oscillator.connect(envelope)
    envelope.connect(bus)
    oscillator.start(time)
    oscillator.stop(time + duration + 0.02)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      envelope.disconnect()
    })
  }

  private playSnare(time: number): void {
    const context = this.context
    const bus = this.drumBus
    if (!bus) return

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    const duration = 0.2

    source.buffer = this.ensureNoiseBuffer()
    filter.type = 'bandpass'
    filter.frequency.value = 1750
    filter.Q.value = 0.8

    envelope.gain.setValueAtTime(0.22, time)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration)

    source.connect(filter)
    filter.connect(envelope)
    envelope.connect(bus)
    source.start(time)
    source.stop(time + duration)
    source.addEventListener('ended', () => {
      source.disconnect()
      filter.disconnect()
      envelope.disconnect()
    })
  }

  private playHat(time: number, volume: number): void {
    const context = this.context
    const bus = this.drumBus
    if (!bus) return

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    const duration = 0.06

    source.buffer = this.ensureNoiseBuffer()
    filter.type = 'highpass'
    filter.frequency.value = 7200

    envelope.gain.setValueAtTime(volume, time)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration)

    source.connect(filter)
    filter.connect(envelope)
    envelope.connect(bus)
    source.start(time)
    source.stop(time + duration)
    source.addEventListener('ended', () => {
      source.disconnect()
      filter.disconnect()
      envelope.disconnect()
    })
  }

  /** Pulls the pads and bass down on each kick, the usual synthwave pump. */
  private duck(time: number): void {
    const duckBus = this.duckBus
    if (!duckBus) return
    duckBus.gain.cancelScheduledValues(time)
    duckBus.gain.setValueAtTime(1, time)
    duckBus.gain.linearRampToValueAtTime(0.55, time + 0.03)
    duckBus.gain.linearRampToValueAtTime(1, time + 0.3)
  }

  /** Quiet broadband noise standing in for tape/vinyl floor. */
  private startHiss(): void {
    const context = this.context
    const bus = this.musicBus
    if (!bus) return

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()

    source.buffer = this.ensureNoiseBuffer()
    source.loop = true
    filter.type = 'highpass'
    filter.frequency.value = 5200
    gain.gain.value = 0.012

    source.connect(filter)
    filter.connect(gain)
    gain.connect(bus)
    source.start()
    this.hiss = source
  }

  /** Slow detune drift so sustained voices are not perfectly in tune. */
  private startWobble(): void {
    const context = this.context
    const bus = this.toneBus
    if (!bus) return

    const lfo = context.createOscillator()
    const depth = context.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.14
    depth.gain.value = 0.035
    lfo.connect(depth)
    depth.connect(bus.gain)
    lfo.start()
    this.wobble = lfo
  }

  private ensureNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer
    const context = this.context
    const frameCount = Math.floor(context.sampleRate * 2)
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1
    this.noiseBuffer = buffer
    return buffer
  }
}
