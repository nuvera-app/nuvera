import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, NewsParams } from '../lib/api'

const PAGE_SIZE = 15

export function useNews(params: NewsParams = {}) {
  return useInfiniteQuery({
    queryKey:  ['news', params],
    queryFn:   ({ pageParam }: { pageParam: number | undefined }) =>
      api.news.list({ ...params, before_id: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].id : undefined,
    staleTime: 5 * 60 * 1000,
  })
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: ['article', id],
    queryFn:  () => api.news.detail(id),
    staleTime: 10 * 60 * 1000,
  })
}
