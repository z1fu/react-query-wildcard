import { QueryCache } from 'react-query'

import type { Query, QueryKey } from 'react-query'
import { type QueryFilters, parseFilterArgs } from 'react-query/types/core/utils'

import { isWildcardQueryKey } from './queryKey'
import { Wildcard } from './wildcard'

export class WildcardQueryCache extends QueryCache {
  findAll(queryKey?: QueryKey, filters?: QueryFilters): Query[]
  findAll(filters?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[] {
    const [filters] = parseFilterArgs(arg1, arg2)

    if (isWildcardQueryKey(filters.queryKey)) {
      const wildcardQueryKey = [...filters.queryKey]
      delete filters.queryKey
      filters.predicate = query => Array.isArray(query.queryKey)
      && query.queryKey.every((item, index) => Wildcard.is(wildcardQueryKey[index]) && item === wildcardQueryKey[index])
    }

    return super.findAll(filters)
  }
}
