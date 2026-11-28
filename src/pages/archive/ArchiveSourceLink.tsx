export function ArchiveSourceLink({ href, isPdf }: { href: string; isPdf: boolean }) {
  const label = isPdf ? 'PDF 다운로드' : '원문 보기'
  return <a className="archive-source-link" href={href} target="_blank" rel="noreferrer" aria-label={label}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {isPdf ? <path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6" />
        : <path d="M12 6c-3-2-6-3-10-3v16c4 0 7 1 10 3 3-2 6-3 10-3V3c-4 0-7 1-10 3Zm0 0v16" />}
    </svg>
    <span className="archive-source-tooltip" aria-hidden="true">{label}</span>
  </a>
}
