type SectionPlaceholderPageProps = {
  title: string
}

export function SectionPlaceholderPage({ title }: SectionPlaceholderPageProps) {
  return (
    <section className="coala-content coala-content--placeholder">
      <article className="surface-card placeholder-shell">
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-description">
          현재 화면은 같은 디자인 시스템으로 확장 가능한 기본 템플릿입니다. 필요한
          기능을 여기에 단계적으로 추가하면 됩니다.
        </p>
        <div className="placeholder-grid">
          <div className="placeholder-item">모듈형 메뉴 영역</div>
          <div className="placeholder-item">카드형 콘텐츠 블록</div>
          <div className="placeholder-item">확장 가능한 작업 패널</div>
        </div>
      </article>
    </section>
  )
}
