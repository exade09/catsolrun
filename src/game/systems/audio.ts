import { useGameStore } from '../../stores/gameStore'
import { RetrowaveMusic } from './music'

export type AudioCue =
  | 'ui'
  | 'countdown'
  | 'start'
  | 'footstep'
  | 'jump'
  | 'land'
  | 'pickup'
  | 'sol'
  | 'powerup'
  | 'nearMiss'
  | 'shield'
  | 'hit'
  | 'collision'
  | 'gameover'

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext
type BrowserWindow = Window & {
  AudioContext?: AudioContextConstructor
  webkitAudioContext?: AudioContextConstructor
}

const MIN_GAIN = 0.0001

export class GameAudioSystem {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private music: RetrowaveMusic | null = null
  private readonly unsubscribe: () => void

  constructor() {
    this.unsubscribe = useGameStore.subscribe((state, previousState) => {
      if (previousState.audioEnabled && !state.audioEnabled) {
        this.stopMusic()
        if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined)
      }
    })
  }

  get available(): boolean {
    if (typeof window === 'undefined') return false
    const browserWindow = window as BrowserWindow
    return browserWindow.AudioContext !== undefined || browserWindow.webkitAudioContext !== undefined
  }

  get unlocked(): boolean {
    return this.context?.state === 'running'
  }

  get enabled(): boolean {
    return useGameStore.getState().audioEnabled
  }

  async unlock(): Promise<boolean> {
    if (!this.enabled) return false
    const context = this.ensureContext()
    if (context === null || context.state === 'closed') return false

    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        return false
      }
    }

    return context.state === 'running'
  }

  async setEnabled(enabled: boolean): Promise<void> {
    useGameStore.getState().setAudioEnabled(enabled)
    if (!enabled) return
    await this.unlock()
    this.play('ui')
    if (useGameStore.getState().phase === 'playing') this.startMusic()
  }

  async toggle(): Promise<boolean> {
    const enabled = !this.enabled
    await this.setEnabled(enabled)
    return enabled
  }

  play(cue: AudioCue): void {
    void this.playCue(cue)
  }

  playUi(): void {
    this.play('ui')
  }

  playJump(): void {
    this.play('jump')
  }

  playLanding(): void {
    this.play('land')
  }

  playPickup(): void {
    this.play('pickup')
  }

  playPowerUp(): void {
    this.play('powerup')
  }

  playCollision(): void {
    this.play('collision')
  }

  startMusic(): void {
    void this.startMusicInternal()
  }

  stopMusic(): void {
    this.music?.stop()
  }

  dispose(): void {
    this.stopMusic()
    this.unsubscribe()
    const context = this.context
    this.context = null
    this.masterGain = null
    if (context !== null && context.state !== 'closed') void context.close().catch(() => undefined)
  }

  private ensureContext(): AudioContext | null {
    if (this.context !== null) return this.context
    if (typeof window === 'undefined') return null

    const browserWindow = window as BrowserWindow
    const Context = browserWindow.AudioContext ?? browserWindow.webkitAudioContext
    if (Context === undefined) return null

    try {
      const context = new Context({ latencyHint: 'interactive' })
      const masterGain = context.createGain()
      masterGain.gain.value = 0.2
      masterGain.connect(context.destination)
      this.context = context
      this.masterGain = masterGain
      return context
    } catch {
      return null
    }
  }

  private async playCue(cue: AudioCue): Promise<void> {
    if (!(await this.unlock())) return
    const context = this.context
    if (context === null) return
    const start = context.currentTime + 0.008

    switch (cue) {
      case 'ui':
        this.tone(420, 620, 0.08, 0.13, 'sine', start)
        break
      case 'countdown':
        this.tone(330, 330, 0.12, 0.16, 'triangle', start)
        break
      case 'start':
        this.tone(330, 660, 0.2, 0.2, 'triangle', start)
        this.tone(660, 990, 0.14, 0.11, 'sine', start + 0.1)
        break
      case 'footstep':
        this.tone(125, 78, 0.07, 0.06, 'triangle', start)
        break
      case 'jump':
        this.tone(240, 590, 0.18, 0.17, 'triangle', start)
        break
      case 'land':
        this.tone(175, 72, 0.11, 0.12, 'triangle', start)
        break
      case 'pickup':
      case 'sol':
        this.tone(720, 1160, 0.13, 0.16, 'sine', start)
        this.tone(1080, 1440, 0.09, 0.08, 'sine', start + 0.045)
        break
      case 'powerup':
        this.tone(280, 840, 0.28, 0.18, 'triangle', start)
        this.tone(560, 1120, 0.2, 0.11, 'sine', start + 0.09)
        break
      case 'nearMiss':
        this.tone(880, 510, 0.12, 0.1, 'square', start)
        break
      case 'shield':
        this.tone(190, 720, 0.3, 0.17, 'sine', start)
        break
      case 'hit':
      case 'collision':
        this.noise(0.18, 0.18, start)
        this.tone(150, 42, 0.32, 0.22, 'sawtooth', start)
        break
      case 'gameover':
        this.tone(420, 210, 0.34, 0.14, 'triangle', start)
        this.tone(280, 110, 0.45, 0.12, 'triangle', start + 0.22)
        break
    }
  }

  private tone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    startTime: number,
  ): void {
    const context = this.context
    const masterGain = this.masterGain
    if (context === null || masterGain === null) return

    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const endTime = startTime + duration
    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(20, startFrequency), startTime)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), endTime)
    envelope.gain.setValueAtTime(MIN_GAIN, startTime)
    envelope.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.018, duration * 0.2))
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, endTime)
    oscillator.connect(envelope)
    envelope.connect(masterGain)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      envelope.disconnect()
    })
    oscillator.start(startTime)
    oscillator.stop(endTime + 0.015)
  }

  private noise(duration: number, volume: number, startTime: number): void {
    const context = this.context
    const masterGain = this.masterGain
    if (context === null || masterGain === null) return

    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    filter.type = 'lowpass'
    filter.frequency.value = 620
    envelope.gain.setValueAtTime(volume, startTime)
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + duration)
    source.buffer = buffer
    source.connect(filter)
    filter.connect(envelope)
    envelope.connect(masterGain)
    source.addEventListener('ended', () => {
      source.disconnect()
      filter.disconnect()
      envelope.disconnect()
    })
    source.start(startTime)
    source.stop(startTime + duration)
  }

  private async startMusicInternal(): Promise<void> {
    if (!(await this.unlock())) return
    const context = this.context
    const masterGain = this.masterGain
    if (context === null || masterGain === null) return

    if (this.music === null) this.music = new RetrowaveMusic(context, masterGain)
    if (this.music.isRunning) return
    this.music.start()
  }
}

export const audioSystem = new GameAudioSystem()
export const gameAudio = audioSystem

export const playGameSound = (cue: AudioCue): void => audioSystem.play(cue)
export const setGameAudioEnabled = (enabled: boolean): Promise<void> => audioSystem.setEnabled(enabled)
export const primeGameAudio = (): Promise<boolean> => audioSystem.unlock()
