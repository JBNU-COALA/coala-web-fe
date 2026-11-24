import { useNavigate } from 'react-router-dom'
import type { RecruitStatus } from '../../shared/api/recruits'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SafeImage } from '../../shared/ui/SafeImage'
import {
  formatHomeDate,
  getInfoThumbnail,
  getPostThumbnail,
  getServiceThumbnail,
  infoCategoryLabel,
  preview,
} from './homeEditorial'
import { useHomeFeed } from './useHomeFeed'
import { HomeCarousel } from './HomeCarousel'
import './home-editorial.css'

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
  const storyArticles = articles.slice(0, 4)
  const leadArticle = storyArticles[0]

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

      <section className="home-stories home-editorial-container" aria-labelledby="home-stories-title">
        <header className="home-editorial-section-head">
          <div>
            <h2 id="home-stories-title">새로운 소식</h2>
          </div>
          <button type="button" onClick={openInfo}>
            전체 보기
            <Icon name="chevron-right" size={16} />
          </button>
        </header>

        {loading ? (
          <div className="home-editorial-loading" aria-label="홈 콘텐츠 불러오는 중" />
        ) : leadArticle ? (
          <div className="home-story-grid">
            {storyArticles.map((article) => {
              const thumbnail = getInfoThumbnail(article)
              const placeholder = <span className={`home-story-placeholder home-story-placeholder--${article.filter}`} aria-hidden="true">
                <Icon name={article.filter === 'contest' ? 'chart' : article.filter === 'lab' ? 'book' : article.filter === 'resource' ? 'file' : 'message'} size={28} />
                <span>{infoCategoryLabel[article.filter]}</span>
              </span>
              return <button key={article.id} type="button" className="home-story-card" onClick={() => openArticle(article.id)}>
                <span className="home-story-card-image">
                  {thumbnail === '/coala-card-placeholder.png' ? placeholder : <SafeImage src={thumbnail} alt="" loading="lazy" fallback={placeholder} />}
                </span>
                <span className="home-story-card-copy">
                  <span className={`home-editorial-category home-editorial-category--${article.filter}`}>{infoCategoryLabel[article.filter]}</span>
                  <strong>{article.title}</strong>
                  <span className="home-story-excerpt">{preview(article.content, 100)}</span>
                  <small>{formatHomeDate(article.createdAt ?? article.sourceDate)}<Icon name="chevron-right" size={14} /></small>
                </span>
              </button>
            })}
          </div>
        ) : (
          <p className="home-editorial-empty">{errors.articles ? '정보공유를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.' : '새로운 이야기를 준비하고 있습니다.'}</p>
        )}
      </section>

      <section className="home-community-band">
        <div className="home-editorial-container home-community-layout">
          <section className="home-popular" aria-labelledby="home-popular-title">
            <header className="home-editorial-section-head home-editorial-section-head--compact">
              <div>
                <h2 id="home-popular-title">지금 많이 읽는 글</h2>
              </div>
              <button type="button" onClick={openPosts}>게시판 보기</button>
            </header>
            <ol className="home-popular-list">
              {posts.map((post, index) => (
                <li key={`${post.boardId}-${post.postId}`}>
                  <button type="button" onClick={() => openPost(post.boardId, post.postId)}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>
                      <small>{post.boardName ?? '게시판'}</small>
                      <strong>{post.title}</strong>
                      <em>{post.authorName || '코알라 멤버'} · 댓글 {post.commentCount ?? 0}</em>
                    </span>
                    {getPostThumbnail(post) !== '/coala-card-placeholder.png' && <span className="home-popular-thumb">
                      <SafeImage src={getPostThumbnail(post)} alt="" loading="lazy" />
                    </span>}
                  </button>
                </li>
              ))}
              {!loading && posts.length === 0 && <li className="home-editorial-empty">{errors.posts ? '게시글을 불러오지 못했습니다.' : '게시글이 없습니다.'}</li>}
            </ol>
          </section>

          <section className="home-recruit" aria-labelledby="home-recruit-title">
            <header className="home-editorial-section-head home-editorial-section-head--compact">
              <div>
                <h2 id="home-recruit-title">함께할 멤버 모집</h2>
              </div>
              <button type="button" onClick={() => navigate(routes.community.recruit)}>모집 보기</button>
            </header>
            <ul className="home-recruit-list">
              {recruits.map((recruit) => (
                <li key={recruit.id}>
                  <button type="button" onClick={() => navigate(routes.community.recruitNotice(recruit.id))}>
                    <span className={`home-recruit-status home-recruit-status--${recruit.status}`}>
                      {recruitStatusLabel[recruit.status]}
                    </span>
                    <strong>{recruit.title}</strong>
                    <span>{recruit.shortDesc}</span>
                    <small>{recruit.currentMembers}/{recruit.maxMembers}명 · {recruit.meetingType}</small>
                  </button>
                </li>
              ))}
              {!loading && recruits.length === 0 && <li className="home-editorial-empty">{errors.recruits ? '모집을 불러오지 못했습니다.' : '진행 중인 모집이 없습니다.'}</li>}
            </ul>
          </section>
        </div>
      </section>

      <section className="home-services home-editorial-container" aria-labelledby="home-services-title">
        <header className="home-editorial-section-head">
          <div>
            <h2 id="home-services-title">코알라가 만든 서비스</h2>
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
                {service.imageUrl ? <SafeImage
                  src={getServiceThumbnail(service.imageUrl)}
                  alt=""
                  loading="lazy"
                  fallback={<span className="home-service-placeholder" aria-hidden="true"><Icon name="globe" size={32} /></span>}
                /> : <span className="home-service-placeholder" aria-hidden="true"><Icon name="globe" size={32} /></span>}
              </span>
              <span className="home-service-copy">
                <small>{service.status} · {service.owner}</small>
                <strong>{service.title}</strong>
                <span>{service.summary}</span>
                <em>{service.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}</em>
              </span>
            </button>
          ))}
          {!loading && services.length === 0 && <p className="home-editorial-empty">{errors.services ? '서비스를 불러오지 못했습니다.' : '공개된 유저 서비스가 없습니다.'}</p>}
        </div>
      </section>
    </section>
  )
}
