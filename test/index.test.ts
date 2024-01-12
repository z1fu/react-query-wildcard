import { expect, it } from 'vitest'
import { QueryClient } from 'react-query'

import { WildcardQueryCache, wildcard } from '../src'

const queryCache = new WildcardQueryCache()
const queryClient = new QueryClient({ queryCache })

const promises = []

// post categories
for (const category of ['tech', 'life', 'game']) {
  for (let index = 0; index < 10; index++) {
    promises.push(queryClient.fetchQuery({
      queryKey: ['post', category, index],
      queryFn: () => {
        return Promise.resolve({
          id: index,
          category,
          time: Date.now(),
        })
      },
    }))
  }
}

await Promise.allSettled(promises)

const createKey = (category: 'tech' | 'life' | 'game' | '*', id?: number | '*') => ['post', wildcard(category), ...(typeof id === 'number' ? [wildcard(id)] : [])]

it('getQueriesData standard', () => {
  expect(queryClient.getQueriesData(createKey('life')).length).toEqual(10)
  expect(queryClient.getQueriesData(createKey('game', 1)).length).toEqual(1)
})

it('getQueriesData wildcard', () => {
  expect(queryClient.getQueriesData(createKey('*')).length).toEqual(30)
  expect(queryClient.getQueriesData(createKey('*', 2)).length).toEqual(3)
  expect(queryClient.getQueriesData(createKey('tech', '*')).length).toEqual(10)
  expect(queryClient.getQueriesData(createKey('*', '*')).length).toEqual(30)
})
