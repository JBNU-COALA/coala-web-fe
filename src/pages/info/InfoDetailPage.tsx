import { resourceCards } from './infoData'
import { Icon } from '../../shared/ui/Icon'

type InfoDetailPageProps = {
  infoId: string
  onBack: () => void
  onWrite: () => void
}

const categoryCopy = {
  news: {
    label: '소식',
  },
  contest: {
    label: '대회',
  },
  lab: {
    label: '연구실',
  },
  resource: {
    label: '자료',
  },
} as const

export function InfoDetailPage({ infoId, onBack, onWrite }: InfoDetailPageProps) {
  const item = resourceCards.find((resource) => resource.id === infoId) ?? resourceCards[0]
  const copy = categoryCopy[item.filter]

  return (
    <section className="coala-content coala-content--info">
      <article className="surface-card info-detail-page">
        <header className="info-detail-topbar">
          <button type="button" className="post-back-button" onClick={onBack}>
            <Icon name="chevron-left" size={16} />
            <span>정보공유로 돌아가기</span>
          </button>
          <button type="button" className="write-post-button write-post-button--info" onClick={onWrite}>
            <Icon name="edit" size={15} />
            정보 글쓰기
          </button>
        </header>

        <section className="info-detail-hero">
          <span className="info-detail-kicker">{copy.label}</span>
          <h1>{item.title}</h1>
          <div className="info-detail-meta">
            <span>{item.source}</span>
            <span>{item.meta}</span>
            <span>{item.tag}</span>
          </div>
        </section>

        <div className="info-detail-body">
          <main className="info-detail-content">
            <h2>본문</h2>
            <ul>
              <li>분류: {copy.label}</li>
              <li>출처: {item.source}</li>
              <li>태그: {item.tag}</li>
            </ul>
          </main>
        </div>
      </article>
    </section>
  )
}
