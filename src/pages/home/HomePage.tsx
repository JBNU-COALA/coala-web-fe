import { useNavigate } from 'react-router-dom'
import type { RecruitStatus } from '../../shared/api/recruits'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SafeImage } from '../../shared/ui/SafeImage'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import {
  formatHomeDate,
  getPostThumbnail,
  getServiceThumbnail,
  infoCategoryLabel,
  preview,
} from './homeEditorial'
import { useHomeFeed } from './useHomeFeed'
import { HomeCarousel } from './HomeCarousel'
import './home-editorial.css'
import './portal-badge-colors.css'

type HomePageProps = {
  onOpenAllPosts?: () => void
  onOpenInfo?: () => void
  onOpenPost?: (boardId: number, postId: number) => void
  onOpenInfoArticle?: (infoId: number) => void
}

const recruitStatusLabel: Record<RecruitStatus, string> = {
  open: '모집 중',
  'closing-soon': '마감 임박',
  closed: '마감',
}

export function HomePage({ onOpenAllPosts, onOpenInfo, onOpenPost, onOpenInfoArticle }: HomePageProps) {
  const navigate = useNavigate()
  const { articles, posts, recruits, services, loading, errors } = useHomeFeed()

  const openInfo = () => {
    if (onOpenInfo) onOpenInfo()
    else navigate(routes.community.info)
  }
  const openArticle = (id: number) => {
    if (onOpenInfoArticle) onOpenInfoArticle(id)
    else navigate(routes.community.infoPost(id))
  }
  const openPosts = () => {
    if (onOpenAllPosts) onOpenAllPosts()
    else navigate(routes.community.board)
  }
  const openPost = (boardId: number, postId: number) => {
    if (onOpenPost) onOpenPost(boardId, postId)
    else navigate(routes.community.boardPost(boardId, postId))
  }

  return (
    <section className="coala-content coala-content--portal home-editorial">
      <HomeCarousel />

      <div className="home-feed-columns home-editorial-container" aria-busy={loading}>
        <section className="home-feed-column" aria-labelledby="home-posts-title">
          <header className="home-editorial-section-head">
            <h2 id="home-posts-title"><span className="home-section-icon" aria-hidden="true">💬</span>게시판</h2>
            <button type="button" onClick={openPosts}>더보기 <Icon name="chevron-right" size={18} /></button>
          </header>
          {loading ? <div className="home-editorial-loading" aria-label="게시글 불러오는 중" /> : <ul className="home-feed-list">
            {posts.slice(0, 4).map((post) => (
              <li key={`${post.boardId}-${post.postId}`}>
                <button type="button" className="home-feed-row" onClick={() => openPost(post.boardId, post.postId)}>
                  <span className="home-feed-body">
                    <span className="home-feed-copy"><strong>{post.title}</strong><span>{preview(post.content)}</span></span>
                    {getPostThumbnail(post) !== '/coala-card-placeholder.png' && <SafeImage className="home-feed-thumb" src={getPostThumbnail(post)} alt="" loading="lazy" />}
                  </span>
                  <span className="home-feed-meta">
                    <span className="home-feed-tag">{post.boardName || '게시판'}</span>
                    <span aria-label={`조회 ${post.viewCount}`}><Icon name="eye" size={16} />{post.viewCount}</span>
                    <span aria-label={`댓글 ${post.commentCount ?? 0}`}><Icon name="message" size={16} />{post.commentCount ?? 0}</span>
                    <time dateTime={post.createdAt}>{formatHomeDate(post.createdAt)}</time>
                  </span>
                </button>
              </li>
            ))}
            {posts.length === 0 && <li className="home-editorial-empty">{errors.posts ? '게시글을 불러오지 못했습니다.' : '게시글이 없습니다.'}</li>}
          </ul>}
        </section>

        <section className="home-feed-column" aria-labelledby="home-info-title">
          <header className="home-editorial-section-head">
            <h2 id="home-info-title"><span className="home-section-icon" aria-hidden="true">📚</span>정보공유</h2>
            <button type="button" onClick={openInfo}>더보기 <Icon name="chevron-right" size={18} /></button>
          </header>
          {loading ? <div className="home-editorial-loading" aria-label="정보공유 불러오는 중" /> : <ul className="home-feed-list">
            {articles.slice(0, 4).map((article) => (
              <li key={article.id}>
                <button type="button" className="home-feed-row" onClick={() => openArticle(article.id)}>
                  <span className="home-feed-body"><span className="home-feed-copy"><strong>{article.title}</strong><span>{preview(article.content)}</span></span></span>
                  <span className="home-feed-meta">
                    <span className="home-feed-tag">{infoCategoryLabel[article.filter]}</span>
                    <span aria-label={`조회 ${article.viewCount}`}><Icon name="eye" size={16} />{article.viewCount}</span>
                    <time dateTime={article.createdAt ?? article.sourceDate}>{formatHomeDate(article.createdAt ?? article.sourceDate)}</time>
                  </span>
                </button>
              </li>
            ))}
            {articles.length === 0 && <li className="home-editorial-empty">{errors.articles ? '정보공유를 불러오지 못했습니다.' : '새로운 이야기를 준비하고 있습니다.'}</li>}
          </ul>}
        </section>

        <section className="home-feed-column home-feed-column--recruit" aria-labelledby="home-recruit-title">
          <header className="home-editorial-section-head">
            <h2 id="home-recruit-title"><span className="home-section-icon" aria-hidden="true">🤝</span>멤버 모집</h2>
            <button type="button" onClick={() => navigate(routes.community.recruit)}>더보기 <Icon name="chevron-right" size={18} /></button>
          </header>
          {loading ? <div className="home-editorial-loading" aria-label="모집 불러오는 중" /> : <ul className="home-recruit-list">
            {recruits.map((recruit) => (
              <li key={recruit.id}>
                <button type="button" onClick={() => navigate(routes.community.recruitNotice(recruit.id))}>
                  <span className={`home-recruit-status home-recruit-status--${recruit.status}`}>{recruitStatusLabel[recruit.status]}</span>
                  <strong>{recruit.title}</strong>
                  <span>{recruit.shortDesc}</span>
                  <small>{recruit.currentMembers}/{recruit.maxMembers}명 · {recruit.meetingType}</small>
                </button>
              </li>
            ))}
            {recruits.length === 0 && <li className="home-editorial-empty">{errors.recruits ? '모집을 불러오지 못했습니다.' : '진행 중인 모집이 없습니다.'}</li>}
          </ul>}
        </section>
      </div>

      <section className="home-services home-editorial-container" aria-labelledby="home-services-title">
        <header className="home-editorial-section-head">
          <div>
            <h2 id="home-services-title"><span className="home-section-icon" aria-hidden="true">🐨</span>코알라가 만든 서비스</h2>
          </div>
          <button type="button" onClick={() => navigate(routes.services.user)}>
            서비스 전체 보기
            <Icon name="chevron-right" size={16} />
          </button>
        </header>
        <div className="home-service-grid">
          {services.map((service) => (
            <button key={service.id} type="button" className="home-service-item" onClick={() => navigate(routes.services.userDetail(service.id))}>
              <span className="home-service-image">
                <SafeImage
                  src={service.imageUrl ? getServiceThumbnail(service.imageUrl) : '/portal-koala-team.png'}
                  alt=""
                  loading="lazy"
                  fallback={<img src="/portal-koala-team.png" alt="" loading="lazy" />}
                />
              </span>
              <span className="home-service-copy">
                <span className="home-service-title-row"><strong>{service.title}</strong><small className="home-service-status">{service.status}</small></span>
                <span>{service.summary}</span>
                {service.tags.length > 0 && <span className="home-service-tags">{service.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</span>}
                <span className="home-service-owner"><CharacterAvatar name={service.owner} size="xs" /><span>{service.owner}</span></span>
              </span>
            </button>
          ))}
          {!loading && services.length === 0 && <p className="home-editorial-empty">{errors.services ? '서비스를 불러오지 못했습니다.' : '공개된 유저 서비스가 없습니다.'}</p>}
        </div>
      </section>
    </section>
  )
}
