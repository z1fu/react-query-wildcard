import { expect, it, vi } from 'vitest'

import { QueriesObserver } from 'react-query'
import { WildcardQueriesObserver } from '../src'
import { env, sleep } from './util'

///////////////////////
// prepare test data //
///////////////////////

const { queryClient, postKey, init } = env()

const now = Date.now()

await init(now)

////////////////
// test cases //
////////////////

it('queriesObserver basic', async () => {
  // standard
  const queriesObserver = new QueriesObserver(queryClient, queryClient.getQueriesData(postKey('tech', '*')).map(([queryKey]) => ({ queryKey, refetchOnMount: false })))
  const standard = vi.fn()
  queriesObserver.subscribe(standard)

  // wildcard
  const wildcardQueriesObserver = new WildcardQueriesObserver(queryClient, [{ queryKey: postKey('tech', '*'), refetchOnMount: false }])
  const wildcard = vi.fn()
  wildcardQueriesObserver.subscribe(wildcard)

  expect(standard).toBeCalledTimes(0)
  expect(wildcard).toBeCalledTimes(0)

  await queryClient.setQueriesData(postKey('tech', 2), { time: Date.now() })
  await sleep()

  expect(standard).toBeCalledTimes(1)
  expect(wildcard).toBeCalledTimes(1)

  await queryClient.setQueriesData(postKey('tech', '*'), { time: Date.now() })
  await sleep()
  expect(standard).toBeCalledTimes(11)
  expect(wildcard).toBeCalledTimes(11)

  await queryClient.setQueriesData(postKey('game', '*'), { time: Date.now() })
  await sleep()
  expect(standard).toBeCalledTimes(11)
  expect(wildcard).toBeCalledTimes(11)

  await queryClient.setQueriesData(postKey('*', '*'), { time: Date.now() })
  await sleep()
  expect(standard).toBeCalledTimes(21)
  expect(wildcard).toBeCalledTimes(21)
})
