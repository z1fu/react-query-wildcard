import { QueryCache } from 'react-query'

import type { Query, QueryKey } from 'react-query'

// @ts-expect-error todo
import { parseFilterArgs } from 'react-query/lib/core/utils'
import type { QueryFilters } from 'react-query/types/core/utils'

import { hashWildcardQueryKey, isWildcardQueryKey, matchQuery } from './queryKey'

export class WildcardQueryCache extends QueryCache {
  findAll(queryKey?: QueryKey, filters?: QueryFilters): Query[]
  findAll(filters?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[] {
    const [filters] = parseFilterArgs(arg1, arg2)

    if (isWildcardQueryKey(filters.queryKey)) {
      const wildcardQueryKey = hashWildcardQueryKey(filters.queryKey)
      delete filters.queryKey
      filters.predicate = (query: Query<unknown, unknown, unknown, QueryKey>) => matchQuery(wildcardQueryKey, query)
    }

    return super.findAll(filters)
  }
}
