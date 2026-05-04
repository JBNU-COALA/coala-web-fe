type SectionPlaceholderPageProps = {
  title: string
}

export function SectionPlaceholderPage({ title }: SectionPlaceholderPageProps) {
  return (
    <section className="coala-content coala-content--placeholder">
      <article className="surface-card placeholder-shell">
        <h2 className="placeholder-title">{title}</h2>
        <div className="placeholder-grid">
          <div className="placeholder-item">메뉴</div>
          <div className="placeholder-item">목록</div>
          <div className="placeholder-item">작업</div>
        </div>
      </article>
    </section>
  )
}
