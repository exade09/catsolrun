import { useEffect, useMemo, useRef, type RefObject } from 'react'

import { audioSystem } from './audio'
import { useGameStore } from '../../stores/gameStore'

export type InputCommand = 'left' | 'right' | 'jump' | 'slide' | 'pause'
export type MovementInputCommand = Exclude<InputCommand, 'pause'>
export type InputCommandHandler = (command: InputCommand) => void

interface BufferedInput {
  command: MovementInputCommand
  expiresAt: number
}

const clock = (): number => (typeof performance === 'undefined' ? Date.now() : performance.now())

export class InputBuffer {
  private readonly queue: BufferedInput[] = []
  private readonly capacity: number
  private defaultWindow: number

  constructor(capacity = 8, defaultWindow = 280) {
    this.capacity = Math.max(1, Math.floor(capacity))
    this.defaultWindow = Math.max(50, defaultWindow)
  }

  setBufferWindow(milliseconds: number): void {
    this.defaultWindow = Math.max(50, milliseconds)
  }

  enqueue(command: MovementInputCommand, bufferWindow = this.defaultWindow): void {
    this.removeExpired()
    if (this.queue.length >= this.capacity) this.queue.shift()
    this.queue.push({
      command,
      expiresAt: clock() + Math.max(50, bufferWindow),
    })
  }

  consume(command: MovementInputCommand): boolean {
    this.removeExpired()
    const index = this.queue.findIndex((entry) => entry.command === command)
    if (index < 0) return false
    this.queue.splice(index, 1)
    return true
  }

  consumeNext(): MovementInputCommand | null {
    this.removeExpired()
    return this.queue.shift()?.command ?? null
  }

  consumeNextReady(predicate: (command: MovementInputCommand) => boolean): MovementInputCommand | null {
    this.removeExpired()
    const index = this.queue.findIndex((entry) => predicate(entry.command))
    if (index < 0) return null
    const entry = this.queue[index]
    this.queue.splice(index, 1)
    return entry?.command ?? null
  }

  peek(): MovementInputCommand | null {
    this.removeExpired()
    return this.queue[0]?.command ?? null
  }

  clear(): void {
    this.queue.length = 0
  }

  get size(): number {
    this.removeExpired()
    return this.queue.length
  }

  private removeExpired(): void {
    const currentTime = clock()
    for (let index = this.queue.length - 1; index >= 0; index -= 1) {
      const entry = this.queue[index]
      if (entry !== undefined && entry.expiresAt <= currentTime) this.queue.splice(index, 1)
    }
  }
}

export const gameInputBuffer = new InputBuffer()
export const inputBuffer = gameInputBuffer

export const queueGameInput = (command: MovementInputCommand, bufferWindow?: number): void => {
  gameInputBuffer.enqueue(command, bufferWindow)
}

export interface GameInputOptions {
  enabled?: boolean
  onCommand?: InputCommandHandler
  target?: HTMLElement | null | RefObject<HTMLElement | null>
  swipeThreshold?: number
  maxSwipeDuration?: number
  bufferWindow?: number
}

export interface GameInputController {
  consumeInput: (command: MovementInputCommand) => boolean
  consumeNextInput: () => MovementInputCommand | null
  consumeNextReadyInput: (predicate: (command: MovementInputCommand) => boolean) => MovementInputCommand | null
  peekInput: () => MovementInputCommand | null
  queueInput: (command: MovementInputCommand) => void
  clearInputs: () => void
}

const KEY_COMMANDS: Readonly<Record<string, InputCommand>> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
  Escape: 'pause',
  KeyP: 'pause',
}

const isEditableTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches('input, textarea, select, button, [role="textbox"]'))

const resolveTarget = (
  target: HTMLElement | null | RefObject<HTMLElement | null> | undefined,
): HTMLElement | null => {
  if (target === undefined || target === null) return null
  return 'current' in target ? target.current : target
}

const isGamePointerTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false
  return target.tagName === 'CANVAS' || target.closest('[data-game-input]') !== null
}

export function useGameInput(onCommand?: InputCommandHandler): GameInputController
export function useGameInput(options?: GameInputOptions): GameInputController
export function useGameInput(
  optionsOrHandler: GameInputOptions | InputCommandHandler = {},
): GameInputController {
  const options = typeof optionsOrHandler === 'function' ? {} : optionsOrHandler
  const handler = typeof optionsOrHandler === 'function' ? optionsOrHandler : options.onCommand
  const enabled = options.enabled ?? true
  const swipeThreshold = Math.max(18, options.swipeThreshold ?? 42)
  const maxSwipeDuration = Math.max(150, options.maxSwipeDuration ?? 900)
  const bufferWindow = Math.max(50, options.bufferWindow ?? 280)
  const element = resolveTarget(options.target)
  const handlerRef = useRef<InputCommandHandler | undefined>(handler)

  handlerRef.current = handler

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined

    gameInputBuffer.setBufferWindow(bufferWindow)
    const pointerSurface: HTMLElement | Window = element ?? window
    let pointerId: number | null = null
    let pointerStartX = 0
    let pointerStartY = 0
    let pointerStartedAt = 0
    const previousTouchAction = element?.style.touchAction

    if (element !== null) element.style.touchAction = 'none'

    const emit = (command: InputCommand): void => {
      const state = useGameStore.getState()

      if (command === 'pause') {
        if (state.phase !== 'playing' && state.phase !== 'paused') return
        gameInputBuffer.clear()
        state.togglePause()
        handlerRef.current?.(command)
        return
      }

      if (state.phase !== 'playing' && state.phase !== 'countdown') return
      gameInputBuffer.enqueue(command, bufferWindow)
      handlerRef.current?.(command)
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat || isEditableTarget(event.target)) return
      const command = KEY_COMMANDS[event.code]
      if (command === undefined) return
      const phase = useGameStore.getState().phase
      if (phase !== 'playing' && phase !== 'paused' && phase !== 'countdown') return
      event.preventDefault()
      void audioSystem.unlock()
      emit(command)
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const touchCommand = event.target instanceof Element && event.target.closest('[data-touch-command]') !== null
      if (touchCommand || pointerId !== null || (element === null && !isGamePointerTarget(event.target))) return
      pointerId = event.pointerId
      pointerStartX = event.clientX
      pointerStartY = event.clientY
      pointerStartedAt = clock()
      void audioSystem.unlock()
      if (element !== null && event.cancelable) event.preventDefault()
    }

    const handlePointerMove = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return
      if (event.cancelable) event.preventDefault()
    }

    const resetPointer = (): void => {
      pointerId = null
      pointerStartedAt = 0
    }

    const handlePointerUp = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return
      const elapsed = clock() - pointerStartedAt
      const deltaX = event.clientX - pointerStartX
      const deltaY = event.clientY - pointerStartY
      resetPointer()

      if (event.cancelable) event.preventDefault()
      if (elapsed > maxSwipeDuration || Math.max(Math.abs(deltaX), Math.abs(deltaY)) < swipeThreshold) {
        return
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        emit(deltaX < 0 ? 'left' : 'right')
      } else {
        emit(deltaY < 0 ? 'jump' : 'slide')
      }
    }

    const handlePointerCancel = (event: PointerEvent): void => {
      if (event.pointerId === pointerId) resetPointer()
    }

    const pauseForVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        gameInputBuffer.clear()
        const state = useGameStore.getState()
        if (state.phase === 'countdown' || state.phase === 'restarting') state.returnToMenu()
        else state.pauseGame()
      }
    }

    const pauseForBlur = (): void => {
      gameInputBuffer.clear()
      const state = useGameStore.getState()
      if (state.phase === 'countdown' || state.phase === 'restarting') state.returnToMenu()
      else state.pauseGame()
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    pointerSurface.addEventListener('pointerdown', handlePointerDown as EventListener, { passive: false })
    pointerSurface.addEventListener('pointermove', handlePointerMove as EventListener, { passive: false })
    pointerSurface.addEventListener('pointerup', handlePointerUp as EventListener, { passive: false })
    pointerSurface.addEventListener('pointercancel', handlePointerCancel as EventListener)
    document.addEventListener('visibilitychange', pauseForVisibility)
    window.addEventListener('blur', pauseForBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      pointerSurface.removeEventListener('pointerdown', handlePointerDown as EventListener)
      pointerSurface.removeEventListener('pointermove', handlePointerMove as EventListener)
      pointerSurface.removeEventListener('pointerup', handlePointerUp as EventListener)
      pointerSurface.removeEventListener('pointercancel', handlePointerCancel as EventListener)
      document.removeEventListener('visibilitychange', pauseForVisibility)
      window.removeEventListener('blur', pauseForBlur)
      gameInputBuffer.clear()
      if (element !== null) element.style.touchAction = previousTouchAction ?? ''
    }
  }, [bufferWindow, element, enabled, maxSwipeDuration, swipeThreshold])

  return useMemo(
    () => ({
      consumeInput: (command: MovementInputCommand) => gameInputBuffer.consume(command),
      consumeNextInput: () => gameInputBuffer.consumeNext(),
      consumeNextReadyInput: (predicate) => gameInputBuffer.consumeNextReady(predicate),
      peekInput: () => gameInputBuffer.peek(),
      queueInput: (command: MovementInputCommand) => gameInputBuffer.enqueue(command, bufferWindow),
      clearInputs: () => gameInputBuffer.clear(),
    }),
    [bufferWindow],
  )
}

export default useGameInput
