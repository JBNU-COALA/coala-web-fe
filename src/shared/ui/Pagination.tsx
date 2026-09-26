import { Icon } from './Icon'
import './Pagination.css'

type PaginationProps = { page: number; pageCount: number; onChange: (page: number) => void }

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null
  const first = Math.max(1, Math.min(page - 2, pageCount - 4))
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => first + index)
  return <nav className="listing-pagination" aria-label="목록 페이지">
    <button type="button" title="이전 페이지" aria-label="이전 페이지" disabled={page === 1} onClick={() => onChange(page - 1)}><Icon name="chevron-left" size={16} /></button>
    {pages.map((number) => <button key={number} type="button" aria-label={`${number}페이지`} aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>)}
    <button type="button" title="다음 페이지" aria-label="다음 페이지" disabled={page === pageCount} onClick={() => onChange(page + 1)}><Icon name="chevron-right" size={16} /></button>
  </nav>
}
