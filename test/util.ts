import { QueryClient } from 'react-query'

import { WildcardQueryCache, wildcard } from '../src'

const categories = ['tech', 'life', 'game'] as const
type Category = (typeof categories)[number]

const postKey = (category: Category | '*', id?: number | '*') => ['post', wildcard(category), ...(typeof id !== 'undefined' ? [wildcard(id)] : [])]

export function env() {
  const queryCache = new WildcardQueryCache()
  const queryClient = new QueryClient({ queryCache })

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

  return {
    queryClient,
    postKey,
    init,
  }
}

export async function sleep(time = 0) {
  return new Promise(r => setTimeout(r, time))
}
