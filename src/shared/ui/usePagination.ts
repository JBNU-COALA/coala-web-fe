import { useState } from 'react'

export function usePagination<T>(items: T[], filterKey: string, pageSize = 12) {
  const [selection, setSelection] = useState({ filterKey, page: 1 })
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = selection.filterKey === filterKey ? Math.min(selection.page, pageCount) : 1
  return {
    page,
    pageCount,
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
    setPage: (next: number) => setSelection({ filterKey, page: Math.max(1, Math.min(pageCount, next)) }),
  }
}
