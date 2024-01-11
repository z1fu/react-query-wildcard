export class Wildcard {
  private val: any

  constructor() {}

  toJSON() {
    return this.val || '*'
  }

  exec<R>(val: any, fn: () => R): R {
    const _ = this.val
    this.val = val
    const ret = fn()
    this.val = _
    return ret
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
