import type { QueryKey } from 'react-query'

import { Wildcard } from './wildcard'

export function isWildcardQueryKey(queryKey: QueryKey | undefined): queryKey is Exclude<QueryKey, string> {
  return Array.isArray(queryKey) && queryKey.some(item => item instanceof Wildcard)
}
