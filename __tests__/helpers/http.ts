import { NextRequest } from 'next/server'

export function createJsonRequest(
  url: string,
  body: unknown,
  init?: { method?: string; headers?: Record<string, string> },
) {
  return new NextRequest(url, {
    method: init?.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body),
  })
}

export async function readJsonResponse<T = Record<string, unknown>>(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as T,
  }
}
