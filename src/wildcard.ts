import { isMatch } from 'matcher'

export class Wildcard {
  constructor(private patterns: string) {}

  toJSON() {
    return this.patterns
  }

  isMatch(val: string) {
    return isMatch(val, this.patterns)
  }
}

export function wildcard<T>(v: T, {
  patterns = '*',
}: {
  patterns?: string
}): T | Wildcard {
  if (v !== patterns)
    return v

  return new Wildcard(patterns)
}
