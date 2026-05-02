import { lazy, Suspense, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  buildContextPanel,
  getRouteFromPath,
  headerNavItems,
  routePathById,
  type AppRoute,
  type ContextPanelItem,
} from './navigation/navigationData'
import { ContextPanel } from './navigation/ContextPanel'
import { UserActivityRail } from './navigation/UserActivityRail'
import { Icon } from './shared/ui/Icon'
import { useAuth } from './shared/auth/AuthContext'
import { RequireAuth } from './shared/auth/RequireAuth'
import './pages/home/home.css'

const ServicePage = lazy(() => import('./pages/service/ServicePage').then(m => ({ default: m.ServicePage })))
const HomePage = lazy(() => import('./pages/home/HomePage').then(m => ({ default: m.HomePage })))
const AllPostsPage = lazy(() => import('./pages/posts/AllPostsPage').then(m => ({ default: m.AllPostsPage })))
const PostDetailPage = lazy(() => import('./pages/posts/PostDetailPage').then(m => ({ default: m.PostDetailPage })))
const PostWriterPage = lazy(() => import('./pages/posts/PostWriterPage').then(m => ({ default: m.PostWriterPage })))
const InfoSharePage = lazy(() => import('./pages/info/InfoSharePage').then(m => ({ default: m.InfoSharePage })))
const AuthPage = lazy(() => import('./pages/auth/AuthPage').then(m => ({ default: m.AuthPage })))
const RecruitPage = lazy(() => import('./pages/recruit/RecruitPage').then(m => ({ default: m.RecruitPage })))
const RecruitDetailPage = lazy(() => import('./pages/recruit/RecruitDetailPage').then(m => ({ default: m.RecruitDetailPage })))
const LeaderboardPage = lazy(() => import('./pages/leaderboard/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { isLoggedIn, user, logout } = useAuth()

  const activeRoute: AppRoute = getRouteFromPath(location.pathname)
  const isAuthRoute = activeRoute === 'login' || activeRoute === 'signup'

  const contextPanel = useMemo(
    () => buildContextPanel(activeRoute, location.pathname),
    [activeRoute, location.pathname],
  )
  const showHeaderProfile = isLoggedIn && activeRoute !== 'home'
  const showActivityRail =
    !isAuthRoute &&
    activeRoute !== 'home' &&
    activeRoute !== 'settings' &&
    location.pathname !== '/community/write'

  const handleRouteChange = (route: AppRoute) => {
    navigate(routePathById[route])
  }

  const handleContextSelect = (item: ContextPanelItem) => {
    if (item.value === 'community-board') {
      navigate('/community')
      return
    }

    if (item.value === 'community-info') {
      navigate('/community/info')
      return
    }

    if (
      item.kind === 'action' &&
      (item.value === 'service-status' || item.value === 'service-guide')
    ) {
      navigate(item.value === 'service-guide' ? '/service?tab=inquiry' : '/service')
      return
    }

    if (item.kind === 'action' && item.value === 'game-ranking') {
      navigate('/activity')
      return
    }

    if (
      item.kind === 'action' &&
      (item.value === 'recruit-open' || item.value === 'recruit-manage')
    ) {
      navigate('/recruit')
      return
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const handleMobileNav = (route: AppRoute) => {
    handleRouteChange(route)
    setMobileNavOpen(false)
  }

  const handleRailPrimaryAction = () => {
    if (activeRoute === 'community') {
      navigate('/community/write')
      return
    }
    if (activeRoute === 'service') {
      navigate('/service')
      return
    }
    if (activeRoute === 'recruit') {
      navigate('/recruit')
      return
    }
    if (activeRoute === 'game') {
      navigate('/activity')
    }
  }

  const appRoutes = (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onOpenAllPosts={() => navigate('/community')}
              onOpenInfo={() => navigate('/community/info')}
            />
          }
        />

        <Route path="/community" element={
          <AllPostsPage
            onOpenPost={(postId) => navigate(`/community/posts/${postId}`)}
              onWritePost={() => navigate('/community/write')}
              title="커뮤니티"
              subtitle="공지와 인기글을 구분해 커뮤니티 흐름을 확인합니다."
            />
        } />
        <Route
          path="/community/info"
          element={<InfoSharePage onWriteInfo={() => navigate('/community/info/write')} />}
        />
        <Route path="/community/info/write" element={
          <RequireAuth>
            <PostWriterPage writerType="info" onClose={() => navigate('/community/info')} />
          </RequireAuth>
        } />
        <Route path="/community/write" element={
          <RequireAuth>
            <PostWriterPage onClose={() => navigate('/community')} />
          </RequireAuth>
        } />
        <Route path="/community/posts/:postId" element={<PostDetailRoute />} />

        <Route path="/recruit" element={
          <RecruitPage onSelectRecruit={(id) => navigate(`/recruit/${id}`)} />
        } />
        <Route path="/recruit/:recruitId" element={<RecruitDetailRoute />} />

        <Route path="/activity" element={<LeaderboardPage />} />
        <Route path="/settings" element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        } />
        <Route path="/service" element={<ServicePage />} />
        <Route path="/login" element={
          isLoggedIn
            ? <Navigate to="/" replace />
            : <AuthPage mode="login" onSwitchMode={() => navigate('/signup')} />
        } />
        <Route path="/signup" element={
          isLoggedIn
            ? <Navigate to="/" replace />
            : <AuthPage mode="signup" onSwitchMode={() => navigate('/login')} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )

  return (
    <div className="coala-app">
      <header className="coala-header">
        <div className="coala-header-inner">
          <button type="button" className="coala-brand" onClick={() => navigate('/')}>
            <span className="coala-brand-mark" aria-hidden="true">
              <span className="coala-brand-leaf coala-brand-leaf--left" />
              <span className="coala-brand-leaf coala-brand-leaf--right" />
            </span>
            <span className="coala-brand-copy">
              <span className="coala-brand-word">코알라</span>
            </span>
          </button>

          <nav className={mobileNavOpen ? 'coala-main-nav is-open' : 'coala-main-nav'} aria-label="메인 메뉴">
            {headerNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  activeRoute === item.id ? 'main-nav-button is-active' : 'main-nav-button'
                }
                onClick={() => handleMobileNav(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="coala-header-actions">
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label="메뉴 열기"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <Icon name={mobileNavOpen ? 'chevron-down' : 'layout'} size={16} />
            </button>
            {isLoggedIn ? (
              <>
                {showHeaderProfile ? (
                  <button
                    type="button"
                    className="header-user-button"
                    onClick={() => navigate('/settings')}
                  >
                    <span className="header-user-avatar">
                      {(user?.name ?? user?.email ?? 'U').charAt(0)}
                    </span>
                    <span className="header-user-name">{user?.name ?? user?.email}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="header-action-button"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      {!isAuthRoute && activeRoute !== 'home' && contextPanel ? (
        <div className="coala-subnav">
          <ContextPanel panel={contextPanel} onSelect={handleContextSelect} variant="bar" />
        </div>
      ) : null}

      <main className={isAuthRoute ? 'coala-shell coala-shell--auth' : 'coala-shell'}>
        {showActivityRail ? (
          <div className="coala-workspace coala-workspace--with-rail">
            <div className="coala-workspace-main">{appRoutes}</div>
            <UserActivityRail
              route={activeRoute as 'community' | 'recruit' | 'game' | 'service'}
              onPrimaryAction={handleRailPrimaryAction}
              onOpenProfile={() => navigate('/settings')}
              onLogin={() => navigate('/login')}
            />
          </div>
        ) : (
          appRoutes
        )}
      </main>

      <footer className="coala-footer">(c) 2026 동아리 코알라. All rights reserved.</footer>
    </div>
  )
}

export default App
