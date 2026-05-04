import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  buildContextPanel,
  getRouteFromPath,
  headerNavItems,
  headerSubNavItems,
  routePathById,
  type AppRoute,
  type ContextPanelItem,
} from './navigation/navigationData'
import { ContextPanel } from './navigation/ContextPanel'
import { Icon } from './shared/ui/Icon'
import { useAuth } from './shared/auth/AuthContext'
import { RequireAuth } from './shared/auth/RequireAuth'
import './pages/home/home.css'

const HomePage = lazy(() => import('./pages/home/HomePage').then((m) => ({ default: m.HomePage })))
const AllPostsPage = lazy(() => import('./pages/posts/AllPostsPage').then((m) => ({ default: m.AllPostsPage })))
const PostDetailPage = lazy(() => import('./pages/posts/PostDetailPage').then((m) => ({ default: m.PostDetailPage })))
const PostWriterPage = lazy(() => import('./pages/posts/PostWriterPage').then((m) => ({ default: m.PostWriterPage })))
const CommunityHubPage = lazy(() => import('./pages/community/CommunityHubPage').then((m) => ({ default: m.CommunityHubPage })))
const InfoSharePage = lazy(() => import('./pages/info/InfoSharePage').then((m) => ({ default: m.InfoSharePage })))
const InfoDetailPage = lazy(() => import('./pages/info/InfoDetailPage').then((m) => ({ default: m.InfoDetailPage })))
const AuthPage = lazy(() => import('./pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })))
const RecruitPage = lazy(() => import('./pages/recruit/RecruitPage').then((m) => ({ default: m.RecruitPage })))
const RecruitDetailPage = lazy(() => import('./pages/recruit/RecruitDetailPage').then((m) => ({ default: m.RecruitDetailPage })))
const LeaderboardPage = lazy(() => import('./pages/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const ServicesPage = lazy(() => import('./pages/services/ServicesPage').then((m) => ({ default: m.ServicesPage })))

function PostDetailRoute() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  if (!postId) return <Navigate to="/community/board" replace />
  return (
    <PostDetailPage
      postId={postId}
      onBack={() => navigate('/community/board')}
      onWrite={() => navigate('/community/board/write')}
    />
  )
}

function RecruitDetailRoute() {
  const { recruitId } = useParams<{ recruitId: string }>()
  const navigate = useNavigate()
  if (!recruitId) return <Navigate to="/community/recruit" replace />
  return <RecruitDetailPage recruitId={recruitId} onBack={() => navigate('/community/recruit')} />
}

function InfoDetailRoute() {
  const { infoId } = useParams<{ infoId: string }>()
  const navigate = useNavigate()
  if (!infoId) return <Navigate to="/community/info" replace />
  return (
    <InfoDetailPage
      infoId={infoId}
      onBack={() => navigate('/community/info')}
      onWrite={() => navigate('/community/info/write')}
    />
  )
}

function UserProfileRoute() {
  const { userId } = useParams<{ userId: string }>()
  if (!userId) return <Navigate to="/users" replace />
  return <ProfilePage profileUserId={userId} />
}

function SettingsRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/users/${user.id}`} replace />
}

function ServicesHubPage() {
  return (
    <section className="coala-content coala-content--placeholder">
      <div className="surface-card services-hub">
        <p className="services-hub-eyebrow">Services</p>
        <h2 className="services-hub-title">코알라 서비스</h2>
        <div className="services-hub-grid">
          <article className="services-hub-card">
            <Icon name="network" size={18} />
            <h3>인스턴스</h3>
          </article>
          <article className="services-hub-card">
            <Icon name="chart" size={18} />
            <h3>활동</h3>
          </article>
        </div>
      </div>
    </section>
  )
}

void ServicesHubPage

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [expandedMainNav, setExpandedMainNav] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { isLoggedIn, user, logout } = useAuth()

  const activeRoute: AppRoute = getRouteFromPath(location.pathname)
  const isAuthRoute = activeRoute === 'login' || activeRoute === 'signup'
  const contextPanel = useMemo(
    () => buildContextPanel(activeRoute, location.pathname),
    [activeRoute, location.pathname, location.search],
  )

  useEffect(() => {
    setProfileMenuOpen(false)
    setExpandedMainNav(null)
  }, [location.pathname])

  const handleHeaderSubNavSelect = (path: string) => {
    navigate(path)
    setMobileNavOpen(false)
    setExpandedMainNav(null)
  }

  const isHeaderSubNavActive = (path: string) => {
    const [targetPath, targetQuery = ''] = path.split('?')

    if (targetPath === '/community/board') {
      return location.pathname.startsWith('/community/board') || location.pathname.startsWith('/community/posts')
    }

    if (targetPath === '/community/info') {
      return location.pathname.startsWith('/community/info')
    }

    if (targetPath === '/community/recruit') {
      return location.pathname.startsWith('/community/recruit') || location.pathname.startsWith('/recruit')
    }

    if (targetPath === '/members') {
      return (
        (location.pathname === '/members' || location.pathname === '/activity') &&
        location.search === (targetQuery ? `?${targetQuery}` : '')
      )
    }

    if (targetPath === '/users') {
      return location.pathname === '/users'
    }

    if (targetPath === '/services') {
      return location.pathname === '/services' && location.search === (targetQuery ? `?${targetQuery}` : '')
    }

    return location.pathname === targetPath
  }

  const handleContextSelect = (item: ContextPanelItem) => {
    if (item.value === 'community-board') {
      navigate('/community/board')
      return
    }

    if (item.value === 'community-info') {
      navigate('/community/info')
      return
    }

    if (item.value === 'community-recruit') {
      navigate('/community/recruit')
      return
    }

    if (item.value === 'service-status' || item.value === 'service-guide' || item.value === 'services-cossp') {
      navigate('/services')
      return
    }

    if (item.value === 'game-ranking') {
      navigate('/users')
      return
    }

    if (item.value === 'services-official') {
      navigate('/services?tab=official')
      return
    }

    if (item.value === 'services-unofficial') {
      navigate('/services?tab=unofficial')
      return
    }
  }

  const handleLogout = async () => {
    await logout()
    setProfileMenuOpen(false)
    navigate('/')
  }

  const handleOpenProfile = () => {
    setProfileMenuOpen(false)
    if (user) {
      navigate(`/users/${user.id}`)
    }
  }

  const handleMainNavClick = (itemId: string, hasSubItems: boolean) => {
    if (!hasSubItems) {
      setExpandedMainNav(null)
      navigate(routePathById[itemId as AppRoute])
      return
    }

    if (window.matchMedia('(max-width: 640px)').matches) {
      setExpandedMainNav(null)
      return
    }

    setExpandedMainNav((current) => (current === itemId ? null : itemId))
  }

  const appRoutes = (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onOpenAllPosts={() => navigate('/community/board')}
              onOpenInfo={() => navigate('/community/info')}
            />
          }
        />

        <Route
          path="/community"
          element={
            <CommunityHubPage
              onOpenBoard={() => navigate('/community/board')}
              onOpenInfo={() => navigate('/community/info')}
              onOpenRecruit={() => navigate('/community/recruit')}
            />
          }
        />
        <Route
          path="/community/board"
          element={
            <AllPostsPage
              onOpenPost={(postId) => navigate(`/community/board/posts/${postId}`)}
              onWritePost={() => navigate('/community/board/write')}
              title="게시판"
            />
          }
        />
        <Route
          path="/community/info"
          element={
            <InfoSharePage
              onWriteInfo={() => navigate('/community/info/write')}
              onOpenInfo={(infoId) => navigate(`/community/info/${infoId}`)}
            />
          }
        />
        <Route path="/community/info/:infoId" element={<InfoDetailRoute />} />
        <Route
          path="/community/info/write"
          element={<PostWriterPage writerType="info" onClose={() => navigate('/community/info')} />}
        />
        <Route
          path="/community/board/write"
          element={<PostWriterPage onClose={() => navigate('/community/board')} />}
        />
        <Route path="/community/board/posts/:postId" element={<PostDetailRoute />} />
        <Route path="/community/write" element={<Navigate to="/community/board/write" replace />} />
        <Route path="/community/posts/:postId" element={<PostDetailRoute />} />

        <Route
          path="/community/recruit"
          element={<RecruitPage onSelectRecruit={(id) => navigate(`/community/recruit/${id}`)} />}
        />
        <Route
          path="/community/recruit/write"
          element={
            <RecruitPage
              initialMode="write"
              onSelectRecruit={(id) => navigate(`/community/recruit/${id}`)}
            />
          }
        />
        <Route path="/community/recruit/:recruitId" element={<RecruitDetailRoute />} />
        <Route path="/recruit" element={<Navigate to="/community/recruit" replace />} />
        <Route
          path="/recruit/:recruitId"
          element={
            <Navigate
              to={`/community/recruit/${location.pathname.split('/').filter(Boolean).at(-1) ?? ''}`}
              replace
            />
          }
        />

        <Route path="/users" element={<LeaderboardPage />} />
        <Route path="/users/:userId" element={<UserProfileRoute />} />
        <Route path="/members" element={<Navigate to="/users" replace />} />
        <Route path="/activity" element={<Navigate to="/users" replace />} />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsRedirect />
            </RequireAuth>
          }
        />
        <Route path="/service" element={<Navigate to="/services" replace />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage mode="login" onSwitchMode={() => navigate('/signup')} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage mode="signup" onSwitchMode={() => navigate('/login')} />
            )
          }
        />
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
            {headerNavItems.map((item) => {
              const subItems = headerSubNavItems[item.id] ?? []

              return (
                <div
                  key={item.id}
                  className={expandedMainNav === item.id ? 'main-nav-item is-expanded' : 'main-nav-item'}
                >
                  <button
                    type="button"
                    className={activeRoute === item.id ? 'main-nav-button is-active' : 'main-nav-button'}
                    aria-expanded={subItems.length > 0 ? expandedMainNav === item.id : undefined}
                    onClick={() => handleMainNavClick(item.id, subItems.length > 0)}
                  >
                    {item.label}
                  </button>
                  {subItems.length > 0 ? (
                    <div className="main-nav-dropdown" role="menu" aria-label={`${item.label} 하위 메뉴`}>
                      {subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          type="button"
                          className={
                            isHeaderSubNavActive(subItem.path)
                              ? 'main-nav-dropdown-item is-active'
                              : 'main-nav-dropdown-item'
                          }
                          onClick={() => handleHeaderSubNavSelect(subItem.path)}
                          role="menuitem"
                        >
                          <Icon name={subItem.icon} size={14} />
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>

          <div className="coala-header-actions">
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label="메뉴 열기"
              onClick={() => setMobileNavOpen((value) => !value)}
            >
              <Icon name={mobileNavOpen ? 'chevron-down' : 'layout'} size={16} />
            </button>
            {isLoggedIn ? (
              <div className="header-profile-menu">
                <button
                  type="button"
                  className={`header-user-button${profileMenuOpen ? ' is-open' : ''}`}
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((value) => !value)}
                >
                  <span className="header-user-avatar">
                    {(user?.name ?? user?.email ?? 'U').charAt(0)}
                  </span>
                  <span className="header-user-name">{user?.name ?? user?.email}</span>
                  <Icon name={profileMenuOpen ? 'chevron-down' : 'chevron-right'} size={13} />
                </button>
                {profileMenuOpen ? (
                  <div className="header-profile-popover">
                    <div className="header-profile-summary">
                      <span className="header-profile-summary-avatar">
                        {(user?.name ?? user?.email ?? 'U').charAt(0)}
                      </span>
                      <div>
                        <strong>{user?.name ?? user?.email}</strong>
                        <span>{user?.department ?? user?.email}</span>
                      </div>
                    </div>
                    <button type="button" className="header-profile-menu-item" onClick={handleOpenProfile}>
                      <Icon name="user" size={14} />
                      마이프로필
                    </button>
                    <button type="button" className="header-profile-menu-item" onClick={handleLogout}>
                      <Icon name="chevron-right" size={14} />
                      로그아웃하기
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="header-action-button"
                  onClick={() => navigate('/login', { state: { from: location } })}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className="header-action-button header-action-button--primary"
                  onClick={() => navigate('/signup', { state: { from: location } })}
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
        {appRoutes}
      </main>

      <footer className="coala-footer">(c) 2026 동아리 코알라. All rights reserved.</footer>
    </div>
  )
}

export default App
