import { Icon } from '../../shared/ui/Icon'
import { CommunityBanner } from './CommunityBanner'

type CommunityHubPageProps = {
  onOpenBoard: () => void
  onOpenInfo: () => void
  onOpenRecruit: () => void
}

const communitySections = [
  {
    id: 'board',
    title: '게시판',
    icon: 'message',
  },
  {
    id: 'info',
    title: '정보공유',
    icon: 'book',
  },
  {
    id: 'recruit',
    title: '모집',
    icon: 'users',
  },
] as const

export function CommunityHubPage({
  onOpenBoard,
  onOpenInfo,
  onOpenRecruit,
}: CommunityHubPageProps) {
  const handlers = {
    board: onOpenBoard,
    info: onOpenInfo,
    recruit: onOpenRecruit,
  }

  return (
    <section className="coala-content coala-content--community">
      <div className="community-hub">
        <CommunityBanner
          title="커뮤니티"
          tone="board"
          images={[
            {
              label: '게시판',
              title: '공지 · 자유 · 유머',
              imageUrl:
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
            },
            {
              label: '정보공유',
              title: '소식 · 대회 · 연구실 · 자료',
              imageUrl:
                'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80',
            },
            {
              label: '모집',
              title: '모집 공고 작성 · 지원 하기',
              imageUrl:
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
            },
          ]}
        />

        <div className="community-hub-grid">
          {communitySections.map((section) => (
            <button
              key={section.id}
              type="button"
              className="surface-card community-hub-card"
              onClick={handlers[section.id]}
            >
              <span className="community-hub-icon">
                <Icon name={section.icon} size={20} />
              </span>
              <span>
                <strong>{section.title}</strong>
              </span>
              <Icon name="chevron-right" size={16} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
