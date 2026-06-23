export const ADMIN_ITEMS_PER_PAGE = 10

export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize = ADMIN_ITEMS_PER_PAGE,
) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  }
}
