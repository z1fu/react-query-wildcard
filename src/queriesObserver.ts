import { QueriesObserver } from 'react-query'
import type { QueryClient, QueryObserverOptions, QueryObserverResult } from 'react-query'
import type { NotifyOptions } from 'react-query/types/core/queryObserver'

import { isWildcardQueryKey } from './queryKey'
import { WildcardQueryCache } from './queryCache'

export class WildcardQueriesObserver extends QueriesObserver {
  private wildcardCacheClient: QueryClient | undefined

  constructor(client: QueryClient, queries?: QueryObserverOptions[]) {
    super(client)

    if (client.getQueryCache() instanceof WildcardQueryCache)
      this.wildcardCacheClient = client

    if (queries)
      this.setQueries(queries)
  }

  setQueries(
    queries: QueryObserverOptions[],
    notifyOptions?: NotifyOptions,
  ): void {
    super.setQueries(this.resolve(queries), notifyOptions)
  }

  getOptimisticResult(queries: QueryObserverOptions[]): QueryObserverResult[] {
    return super.getOptimisticResult(this.resolve(queries))
  }

  private resolve(queries: QueryObserverOptions[]): QueryObserverOptions[] {
    const client = this.wildcardCacheClient

    if (!client)
      return queries

    return queries.flatMap((item) => {
      if (!isWildcardQueryKey(item.queryKey))
        return item

      return client.getQueriesData(item.queryKey).map(([queryKey]) => ({
        ...item,
        queryKey,
      }))
    })
  }
}
