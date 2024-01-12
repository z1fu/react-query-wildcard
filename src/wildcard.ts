export class Wildcard {
  toJSON() {
    return '*'
  }

  static is(val: any): val is Wildcard {
    return val instanceof Wildcard
  }
}

export function wildcard<T>(v: T): T | Wildcard {
  if (v !== '*')
    return v

  return new Wildcard()
}
