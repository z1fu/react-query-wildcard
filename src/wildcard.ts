export const WILDCARD = '*'

export class Wildcard {
  constructor(private tag: string) {}

  toJSON() {
    return this.tag
  }

  static is(val: unknown): val is Wildcard {
    return val instanceof Wildcard
  }
}

export function wildcard<T>(v: T): T | Wildcard {
  if (v !== WILDCARD)
    return v

  return new Wildcard(WILDCARD)
}
