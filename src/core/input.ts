export type GameAction = 'aim' | 'fire' | 'reload' | 'pause' | 'confirm' | 'fullscreen' | 'mute';

export type InputEvent =
  | { action: 'aim'; phase: 'change'; x: number; y: number; timestamp: number; provider: string }
  | {
      action: Exclude<GameAction, 'aim'>;
      phase: 'pressed' | 'released';
      timestamp: number;
      provider: string;
    };

export interface InputProvider {
  readonly id: string;
  connect(emit: (event: InputEvent) => void): void;
  disconnect(): void;
}

/** Browser fallback provider. Aim is normalized against the actual canvas content box. */
export class BrowserInputProvider implements InputProvider {
  readonly id = 'browser';
  private emit?: (event: InputEvent) => void;
  private readonly abort = new AbortController();

  constructor(
    private readonly surface: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {}

  connect(emit: (event: InputEvent) => void): void {
    this.emit = emit;
    const options = { signal: this.abort.signal };
    this.surface.addEventListener('pointermove', this.onPointerMove, options);
    this.surface.addEventListener('pointerdown', this.onPointerDown, options);
    this.surface.addEventListener('pointerup', this.onPointerUp, options);
    this.surface.addEventListener('pointercancel', this.onPointerUp, options);
    window.addEventListener('keydown', this.onKeyDown, options);
    window.addEventListener('keyup', this.onKeyUp, options);
  }

  disconnect(): void {
    this.abort.abort();
    this.emit = undefined;
  }

  private aim(event: PointerEvent): void {
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    this.emit?.({
      action: 'aim',
      phase: 'change',
      x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height),
      timestamp: performance.now(),
      provider: event.pointerType || this.id,
    });
  }

  private onPointerMove = (event: PointerEvent): void => this.aim(event);
  private onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    this.canvas.focus({ preventScroll: true });
    this.aim(event);
    this.emit?.({
      action: 'fire',
      phase: 'pressed',
      timestamp: performance.now(),
      provider: event.pointerType || this.id,
    });
  };
  private onPointerUp = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) return;
    this.emit?.({
      action: 'fire',
      phase: 'released',
      timestamp: performance.now(),
      provider: event.pointerType || this.id,
    });
  };
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const action = keyAction(event.key);
    if (action)
      this.emit?.({ action, phase: 'pressed', timestamp: performance.now(), provider: 'keyboard' });
  };
  private onKeyUp = (event: KeyboardEvent): void => {
    const action = keyAction(event.key);
    if (action)
      this.emit?.({
        action,
        phase: 'released',
        timestamp: performance.now(),
        provider: 'keyboard',
      });
  };
}

export interface ControllerPacket {
  type: 'trigger' | 'reload' | 'aim' | 'pause';
  pressed?: boolean;
  x?: number;
  y?: number;
  timestamp: number;
}

export function translateControllerPacket(
  packet: ControllerPacket,
  provider = 'controller',
): InputEvent {
  if (packet.type === 'aim') {
    return {
      action: 'aim',
      phase: 'change',
      x: clamp(packet.x ?? 0.5),
      y: clamp(packet.y ?? 0.5),
      timestamp: packet.timestamp,
      provider,
    };
  }
  return {
    action: packet.type === 'trigger' ? 'fire' : packet.type,
    phase: packet.pressed === false ? 'released' : 'pressed',
    timestamp: packet.timestamp,
    provider,
  };
}

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

function keyAction(key: string): Exclude<GameAction, 'aim' | 'confirm' | 'mute'> | undefined {
  if (key === ' ' || key === 'Spacebar') return 'fire';
  if (key.toLowerCase() === 'r') return 'reload';
  if (key === 'Escape') return 'pause';
  if (key.toLowerCase() === 'f') return 'fullscreen';
  return undefined;
}
