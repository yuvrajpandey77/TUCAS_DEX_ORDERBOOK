import { vi } from 'vitest'

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
})) as any

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock LibP2P modules
vi.mock('libp2p', () => ({
  createLibp2p: vi.fn().mockResolvedValue({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    peerId: { toString: () => '12D3KooWTestPeer' },
    addEventListener: vi.fn(),
    services: {
      pubsub: {
        subscribe: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      },
    },
  }),
}))

vi.mock('@libp2p/websockets', () => ({
  webSockets: vi.fn(),
}))

vi.mock('@chainsafe/libp2p-noise', () => ({
  noise: vi.fn(),
}))

vi.mock('@libp2p/mplex', () => ({
  mplex: vi.fn(),
}))

vi.mock('@libp2p/bootstrap', () => ({
  bootstrap: vi.fn(),
}))

vi.mock('@chainsafe/libp2p-gossipsub', () => ({
  gossipsub: vi.fn(),
}))

vi.mock('@libp2p/identify', () => ({
  identify: vi.fn(),
}))

vi.mock('@libp2p/ping', () => ({
  ping: vi.fn(),
}))

vi.mock('@libp2p/peer-id', () => ({
  peerIdFromString: vi.fn(),
}))

vi.mock('@multiformats/multiaddr', () => ({
  multiaddr: vi.fn(),
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}
