import { vi } from 'vitest'

type QueryResult = { data: unknown; error: unknown }

export function mockQueryChain(result: QueryResult) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const single = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ maybeSingle, single, eq })
  const select = vi.fn().mockReturnValue({ eq, maybeSingle, single })
  const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })
  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq })

  return {
    from: vi.fn().mockReturnValue({ select, insert, delete: deleteFn, eq, maybeSingle, single }),
    maybeSingle,
    single,
    eq,
    select,
    insert,
    deleteFn,
  }
}
