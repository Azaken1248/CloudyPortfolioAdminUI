import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock generic browser APIs if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn(() => 0),
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn(),
})

const canvasGradientMock = {
  addColorStop: vi.fn(),
} as unknown as CanvasGradient

const canvasContextMock = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  scale: vi.fn(),
  clearRect: vi.fn(),
  createRadialGradient: vi.fn(() => canvasGradientMock),
  createLinearGradient: vi.fn(() => canvasGradientMock),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  closePath: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  setTransform: vi.fn(),
} as unknown as CanvasRenderingContext2D

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn((contextId: string) => (contextId === '2d' ? canvasContextMock : null)),
})

// Reset localStorage
afterEach(() => {
  window.localStorage.clear()
})

// Mock Dialog
if (typeof HTMLDialogElement === 'undefined') {
  (window as any).HTMLDialogElement = class HTMLDialogElement extends HTMLElement {}
}
HTMLDialogElement.prototype.showModal = vi.fn(function(this: any) { this.open = true })
HTMLDialogElement.prototype.close = vi.fn(function(this: any) { this.open = false })
