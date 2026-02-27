import { useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ProfileCard } from './features/home/ui/ProfileCard'
import {
  buildContextPanel,
  getRouteFromPath,
  headerNavItems,
  routePathById,
  type AppRoute,
  type ContextPanelItem,
} from './features/navigation/model/navigationData'
import { ContextPanel } from './features/navigation/ui/ContextPanel'
import {
  defaultPostBoardFilter,
  type PostBoardFilterId,
} from './features/posts/model/postsData'
import { SectionPlaceholderPage } from './pages/common/SectionPlaceholderPage'
import { HomePage } from './pages/home/HomePage'
import { AllPostsPage } from './pages/posts/AllPostsPage'
import { PostDetailPage } from './pages/posts/PostDetailPage'
import { PostWriterPage } from './pages/posts/PostWriterPage'
import { InfoSharePage } from './pages/info/InfoSharePage'
import { AuthPage } from './pages/auth/AuthPage'
import { RecruitPage } from './pages/recruit/RecruitPage'
import { RecruitDetailPage } from './pages/recruit/RecruitDetailPage'
import { LeaderboardPage } from './pages/leaderboard/LeaderboardPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { Icon } from './shared/ui/Icon'
import './features/home/ui/home.css'

const isPostBoardFilter = (value: string): value is PostBoardFilterId => {
  return value === 'all' || value === 'free' || value === 'alumni'
}

function PostDetailRoute() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  if (!postId) return <Navigate to="/community" replace />
  return (
    <PostDetailPage
      postId={postId}
      onBack={() => navigate('/community')}
      onWrite={() => navigate('/community/write')}
    />
  )
}

function RecruitDetailRoute() {
  const { recruitId } = useParams<{ recruitId: string }>()
  const navigate = useNavigate()
  if (!recruitId) return <Navigate to="/recruit" replace />
  return <RecruitDetailPage recruitId={recruitId} onBack={() => navigate('/recruit')} />
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeBoard, setActiveBoard] = useState<PostBoardFilterId>(defaultPostBoardFilter)

  const activeRoute: AppRoute = getRouteFromPath(location.pathname)
  const isAuthRoute = activeRoute === 'login' || activeRoute === 'signup'

  const contextPanel = useMemo(
    () => buildContextPanel(activeRoute, activeBoard),
    [activeBoard, activeRoute],
  )

  const handleRouteChange = (route: AppRoute) => {
    navigate(routePathById[route])
  }

  const handleContextSelect = (item: ContextPanelItem) => {
    if (item.kind === 'board' && isPostBoardFilter(item.value)) {
      setActiveBoard(item.value)
      navigate('/community')
      return
    }

    if (item.kind === 'action' && item.value === 'home-resource') {
      navigate('/community/info')
      return
    }

    if (
      item.kind === 'action' &&
      (item.value === 'home-leader' || item.value === 'game-ranking')
    ) {
      navigate('/activity')
      return
    }

    if (
      item.kind === 'action' &&
      (item.value === 'home-recent' ||
        item.value === 'community-manage' ||
        item.value === 'community-announce')
    ) {
      navigate('/community')
      return
    }

    if (
      item.kind === 'action' &&
      (item.value === 'recruit-open' || item.value === 'recruit-manage')
    ) {
      navigate('/recruit')
      return
    }

    if (item.kind === 'action' && item.value === 'community-info') {
      navigate('/community/info')
    }
  }

  return (
    <div className="coala-app">
      <header className="coala-header">
        <div className="coala-header-inner">
          <button type="button" className="coala-brand" onClick={() => navigate('/')}>
            coala
          </button>

          <nav className="coala-main-nav" aria-label="메인 메뉴">
            {headerNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  activeRoute === item.id ? 'main-nav-button is-active' : 'main-nav-button'
                }
                onClick={() => handleRouteChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="coala-header-actions">
            <button
              type="button"
              className="header-action-button"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
            <button
              type="button"
              className="header-action-button header-action-button--primary"
              onClick={() => navigate('/signup')}
            >
              회원가입
            </button>
            <button type="button" className="mode-toggle" aria-label="화면 모드 전환">
              <Icon name="moon" size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className={isAuthRoute ? 'coala-shell coala-shell--auth' : 'coala-shell'}>
        {!isAuthRoute ? (
          <aside className="coala-sidebar">
            <ProfileCard
              onOpenSettings={() => navigate('/settings')}
              onOpenProfile={() => navigate('/settings')}
            />
            {contextPanel ? (
              <ContextPanel panel={contextPanel} onSelect={handleContextSelect} />
            ) : null}
          </aside>
        ) : null}

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onOpenAllPosts={() => navigate('/community')}
                onOpenInfo={() => navigate('/community/info')}
                onOpenRecruit={() => navigate('/recruit')}
                onOpenLeaderboard={() => navigate('/activity')}
              />
            }
          />

          <Route path="/community" element={
            <AllPostsPage
              activeBoard={activeBoard}
              onOpenPost={(postId) => navigate(`/community/posts/${postId}`)}
              onWritePost={() => navigate('/community/write')}
              title="커뮤니티"
              subtitle="전체 게시글, 자유게시판, 졸업생게시판을 한 곳에서 관리해요."
            />
          } />
          <Route path="/community/info" element={<InfoSharePage />} />
          <Route path="/community/write" element={
            <PostWriterPage onClose={() => navigate('/community')} />
          } />
          <Route path="/community/posts/:postId" element={<PostDetailRoute />} />

          <Route path="/recruit" element={
            <RecruitPage onSelectRecruit={(id) => navigate(`/recruit/${id}`)} />
          } />
          <Route path="/recruit/:recruitId" element={<RecruitDetailRoute />} />

          <Route path="/activity" element={<LeaderboardPage />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/service" element={<SectionPlaceholderPage title="서비스" />} />
          <Route path="/login" element={
            <AuthPage mode="login" onSwitchMode={() => navigate('/signup')} />
          } />
          <Route path="/signup" element={
            <AuthPage mode="signup" onSwitchMode={() => navigate('/login')} />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="coala-footer">(c) 2026 동아리 코알라. All rights reserved.</footer>
    </div>
  )
}

export default App
