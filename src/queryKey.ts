import { type Query, type QueryKey, hashQueryKey } from 'react-query'
import { isMatch } from 'matcher'

import { Wildcard } from './wildcard'

export function isWildcardQueryKey(queryKey: QueryKey | undefined): queryKey is Exclude<QueryKey, string> {
  return Array.isArray(queryKey) && queryKey.some(Wildcard.is)
}

export function hashWildcardQueryKey(queryKey: readonly unknown[]): string {
  return hashQueryKey([...queryKey]).replaceAll(/,"\*"(,|])/g, ',*$1')
}

export function matchQuery(wildcardQueryKey: string, query: Query<unknown, unknown, unknown, QueryKey>): boolean {
  return Array.isArray(query.queryKey) && isMatch(query.queryHash, wildcardQueryKey)
}
