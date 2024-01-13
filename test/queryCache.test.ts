import { expect, it } from 'vitest'
import type { QueryFunction } from 'react-query'
import { QueriesObserver, QueryClient } from 'react-query'

import { WildcardQueryCache, wildcard } from '../src'

///////////////////////
// prepare test data //
///////////////////////

const queryCache = new WildcardQueryCache()
const queryClient = new QueryClient({ queryCache })

const categories = ['tech', 'life', 'game'] as const
type Category = (typeof categories)[number]

const now = Date.now()
const postKey = (category: Category | '*', id?: number | '*') => ['post', wildcard(category), ...(typeof id === 'number' ? [wildcard(id)] : [])]

async function init(time = Date.now()) {
  const promises = []

  // post categories
  for (const category of categories) {
  // post id
    for (let index = 0; index < 10; index++) {
      promises.push(queryClient.fetchQuery({
        queryKey: postKey(category, index),
        queryFn: () => {
          return Promise.resolve({
            id: index,
            category,
            time,
          })
        },
      }))
    }
  }

  await Promise.allSettled(promises)
}

await init(now)

////////////////
// test cases //
////////////////

it('getQueriesData', () => {
  // standard
  expect(queryClient.getQueriesData(postKey('life')).length).toEqual(10)
  expect(queryClient.getQueriesData({
    queryKey: postKey('life'),
    exact: true,
  }).length).toEqual(0)

  expect((queryClient.getQueriesData<{ id: number }>(postKey('game', 1))[0][1]).id).toEqual(1)
  // data not existed
  expect((queryClient.getQueriesData<{ id: number }>(postKey('tech', 11))[0]?.[1])?.id).toEqual(undefined)

  // wildcard
  expect(queryClient.getQueriesData(postKey('*')).length).toEqual(30)
  expect(queryClient.getQueriesData(postKey('*', 2)).length).toEqual(3)
  expect(queryClient.getQueriesData(postKey('tech', '*')).length).toEqual(10)
  expect(queryClient.getQueriesData(postKey('*', '*')).length).toEqual(30)
})

it('isFetching', () => {
  queryClient.fetchQuery({
    queryKey: postKey('life', 999),
    queryFn: () => {
      // pending fetch
      return new Promise(() => {})
    },
  })

  // standard
  expect(queryClient.isFetching(postKey('life', 999))).toEqual(1)
  expect(queryClient.isFetching(postKey('game'))).toEqual(0)
  expect(queryClient.isFetching(postKey('life'))).toEqual(1)

  // wildcard
  expect(queryClient.isFetching(postKey('*'))).toEqual(1)
  expect(queryClient.isFetching(postKey('game', 999))).toEqual(0)
  expect(queryClient.isFetching(postKey('life', '*'))).toEqual(1)
})

it('setQueriesData', () => {
  // standard
  queryClient.setQueriesData(postKey('game', 9), () => ({
    id: 9,
    category: 'game',
    time: Date.now(),
  }), {})

  expect(queryClient.getQueryData<{ time: number }>(postKey('game', 9))?.time).toBeGreaterThan(now)

  // wildcard
  // change post id 8 time for every category
  queryClient.setQueriesData(postKey('*', 8), (data: any) => ({
    ...data,
    time: Date.now(),
  }), {})

  // 6 not change
  expect(queryClient.getQueryData<{ time: number }>(postKey('game', 6))?.time).toEqual(now)
  expect(queryClient.getQueryData<{ time: number }>(postKey('life', 8))?.time).toBeGreaterThan(now)
  expect(queryClient.getQueryData<{ time: number }>(postKey('tech', 8))?.time).toBeGreaterThan(now)
})

it('removeQueries', async () => {
  // standard
  queryClient.removeQueries(postKey('life', 999))

  expect(queryClient.getQueryData<{ time: number }>(postKey('life', 999))).toBe(undefined)

  // wildcard
  // remove all post id 4 post
  expect(queryClient.getQueryData(postKey('life', 4))).toBeInstanceOf(Object)
  queryClient.removeQueries(postKey('*', 4))
  expect(queryClient.getQueryData(postKey('life', 4))).toBe(undefined)

  // remove all post
  queryClient.removeQueries(postKey('*', '*'))
  expect(queryClient.getQueryData(postKey('life', 9))).toBe(undefined)
  expect(queryClient.getQueriesData(postKey('life', '*')).length).toBe(0)
  expect(queryClient.getQueriesData(postKey('*', '*')).length).toBe(0)

  await init()
  expect(queryClient.getQueriesData(postKey('*', '*')).length).toBe(30)
})

it('resetQueries', async () => {
  const time = queryClient.getQueryData<{ time: number }>(postKey('life', 4))!.time
  const newTime = Date.now() + 100

  const observer = new QueriesObserver(queryClient, [{ queryKey: postKey('life', 4), queryFn: ({ queryKey }) => ({ category: queryKey[1], id: queryKey[2], time: newTime }) }])
  // keep observer and reset operation will emit queryFn to overwrite time
  observer.subscribe(() => {})

  await queryClient.resetQueries({
    queryKey: postKey('life', '*'),
  })

  const time2 = (await queryClient.fetchQuery<{ time: number }>(postKey('life', 4)))?.time
  expect(time2).toBeGreaterThan(time)
  expect(time2).toBe(newTime)
  // because post life 5 no have any observer, not refetch
  expect(undefined).toBe(queryClient.getQueryData<{ time: number }>(postKey('life', 5))?.time)
})

it('refetchQueries', async () => {
  const time = queryClient.getQueryData<{ time: number }>(postKey('tech', 4))!.time
  const newTime = Date.now() + 100

  const queryFn: QueryFunction<{ time: number }> = ({ queryKey }) => ({ category: queryKey[1], id: queryKey[2], time: newTime })
  const observer = new QueriesObserver(queryClient, [{ queryKey: postKey('tech', 4), queryFn,
  }])
  // keep observer and refetch operation will emit queryFn to overwrite time
  observer.subscribe(() => {})

  await queryClient.refetchQueries({
    queryKey: postKey('tech', '*'),
  })

  const time2 = (await queryClient.fetchQuery<{ time: number }>(postKey('tech', 4)))?.time
  const time3 = (await queryClient.fetchQuery<{ time: number }>(postKey('tech', 5), { queryFn }))?.time

  expect(time2).toBeGreaterThan(time)
  expect(time2).toBe(newTime)
  expect(time3).toBe(newTime)
  expect(time2).toBe(time3)
})

it('cancelQueries', async () => {
  let fetchTimes = 0

  const newTime = Date.now()
  const queryFn: QueryFunction<any> = ({ queryKey }) => {
    fetchTimes++
    return new Promise((resolve) => {
      setTimeout(() => resolve({ category: queryKey[1], id: queryKey[2], time: newTime }))
    })
  }

  const fetch = () => queryClient.fetchQuery({
    queryKey: postKey('game', 8),
    queryFn,
  })

  const promise = fetch()
  expect(fetchTimes).toBe(1)

  await queryClient.cancelQueries({
    queryKey: postKey('game', '*'),
  })

  // cancel error
  expect(() => promise).rejects.toThrowError()
  expect(queryClient.getQueryData<{ time: number }>(postKey('game', 8))?.time).not.toBe(newTime)
})

it('invalidateQueries', async () => {
  let fetchTimes = 0

  const newTime = Date.now()
  const queryFn: QueryFunction<{ time: number }> = ({ queryKey }) => {
    fetchTimes++
    return ({ category: queryKey[1], id: queryKey[2], time: newTime })
  }

  const fetch = () => queryClient.fetchQuery({
    queryKey: postKey('tech', 8),
    queryFn,
    staleTime: Number.POSITIVE_INFINITY,
  })

  let promise = fetch()
  expect(fetchTimes).toBe(0)
  expect((await promise).time).toBeLessThan(newTime)

  await queryClient.invalidateQueries({
    queryKey: postKey('tech', '*'),
  })

  promise = fetch()
  expect(fetchTimes).toBe(1)
  expect((await promise).time).toBe(newTime)
})
