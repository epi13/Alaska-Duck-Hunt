export type GameAction = 'aim' | 'fire' | 'reload' | 'pause' | 'confirm' | 'fullscreen' | 'mute';

export type InputEvent =
  | { action: 'aim'; phase: 'change'; x: number; y: number; timestamp: number; provider: string }
  | { action: Exclude<GameAction, 'aim'>; phase: 'pressed' | 'released'; timestamp: number; provider: string };

export interface InputProvider {
  readonly id: string;
  connect(emit: (event: InputEvent) => void): void;
  disconnect(): void;
}

export interface ControllerPacket {
  type: 'trigger' | 'reload' | 'aim' | 'pause';
  pressed?: boolean;
  x?: number;
  y?: number;
  timestamp: number;
}

export function translateControllerPacket(packet: ControllerPacket, provider = 'controller'): InputEvent {
  if (packet.type === 'aim') {
    return { action: 'aim', phase: 'change', x: clamp(packet.x ?? 0.5), y: clamp(packet.y ?? 0.5), timestamp: packet.timestamp, provider };
  }
  return {
    action: packet.type === 'trigger' ? 'fire' : packet.type,
    phase: packet.pressed === false ? 'released' : 'pressed',
    timestamp: packet.timestamp,
    provider,
  };
}

const clamp = (value: number): number => Math.max(0, Math.min(1, value));
