const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export interface Article {
  id:              number
  title:           string
  url:             string
  summary:         string | null
  source_name:     string
  category:        string
  region:          string
  language:        string
  bias:            string | null
  bias_confidence: number | null
  bias_reason:     string | null
  tags:            string | null
  read_time:       number
  created_at:      string
}

export interface NewsParams {
  language?:  string
  region?:    string
  category?:  string
  before_id?: number
  limit?:     number
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  news: {
    list:   (p: NewsParams = {}) => get<Article[]>('/news', p as Record<string, string | number>),
    detail: (id: number)          => get<Article>(`/news/${id}`),
  },
}
