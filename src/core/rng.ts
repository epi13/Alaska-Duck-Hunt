/** A compact deterministic PRNG suitable for reproducible gameplay (not cryptography). */
export class SeededRandom {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
    if (this.state === 0) this.state = 0x6d2b79f5;
  }

  next(): number {
    // Mulberry32: stable across JS engines because all operations are 32-bit.
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  int(min: number, maxInclusive: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(maxInclusive) || maxInclusive < min) {
      throw new RangeError('Expected an integer range where max >= min');
    }
    return min + Math.floor(this.next() * (maxInclusive - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Cannot pick from an empty collection');
    return items[this.int(0, items.length - 1)] as T;
  }

  weighted<T>(items: readonly { value: T; weight: number }[]): T {
    const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
    if (total <= 0) throw new RangeError('At least one positive weight is required');
    let cursor = this.next() * total;
    for (const item of items) {
      cursor -= Math.max(0, item.weight);
      if (cursor < 0) return item.value;
    }
    return items[items.length - 1]!.value;
  }

  fork(namespace: string): SeededRandom {
    return new SeededRandom(`${this.state}:${namespace}`);
  }
}

export function hashSeed(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function dailySeed(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
