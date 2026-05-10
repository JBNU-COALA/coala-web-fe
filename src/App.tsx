import { lazy, Suspense, type FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { isAdminUser } from './shared/auth/adminAccess'
import { routes } from './shared/routes'
import {
  getFallbackInfoBoardIdByPostId,
  makePostRouteKey,
  parsePostRouteKey,
  parseRouteId,
} from './shared/communityBoards'
import './pages/home/home.css'

const HomePage = lazy(() => import('./pages/home/HomePage').then((m) => ({ default: m.HomePage })))
const AboutPage = lazy(() => import('./pages/about/AboutPage').then((m) => ({ default: m.AboutPage })))
const AllPostsPage = lazy(() => import('./pages/posts/AllPostsPage').then((m) => ({ default: m.AllPostsPage })))
const PostDetailPage = lazy(() => import('./pages/posts/PostDetailPage').then((m) => ({ default: m.PostDetailPage })))
const PostWriterPage = lazy(() => import('./pages/posts/PostWriterPage').then((m) => ({ default: m.PostWriterPage })))
const InfoSharePage = lazy(() => import('./pages/info/InfoSharePage').then((m) => ({ default: m.InfoSharePage })))
const InfoDetailPage = lazy(() => import('./pages/info/InfoDetailPage').then((m) => ({ default: m.InfoDetailPage })))
const AuthPage = lazy(() => import('./pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })))
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage').then((m) => ({ default: m.EmailVerificationPage })))
const RecruitPage = lazy(() => import('./pages/recruit/RecruitPage').then((m) => ({ default: m.RecruitPage })))
const RecruitDetailPage = lazy(() => import('./pages/recruit/RecruitDetailPage').then((m) => ({ default: m.RecruitDetailPage })))
const RecruitApplyPage = lazy(() => import('./pages/recruit/RecruitApplyPage').then((m) => ({ default: m.RecruitApplyPage })))
const LeaderboardPage = lazy(() => import('./pages/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const ServicesPage = lazy(() => import('./pages/services/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })))

function PostDetailRoute() {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>()
  const navigate = useNavigate()
  const parsedBoardId = parseRouteId(boardId)
  const parsedPostId = parseRouteId(postId)
  if (!parsedBoardId || !parsedPostId) return <Navigate to={routes.community.board} replace />
  const postKey = makePostRouteKey(parsedBoardId, parsedPostId)
  return (
    <PostDetailPage
      postId={postKey}
      onBack={() => navigate(routes.community.board)}
      onWrite={() => navigate(routes.community.boardPostNew)}
      onEdit={() => navigate(routes.community.boardPostEditor(parsedBoardId, parsedPostId))}
    />
  )
}

function LegacyCommunityPostRoute() {
  const { postId } = useParams<{ postId: string }>()
  if (!postId) return <Navigate to={routes.community.board} replace />
  const parsed = parsePostRouteKey(postId)
  return parsed ? (
    <Navigate to={routes.community.boardPost(parsed.boardId, parsed.postId)} replace />
  ) : (
    <Navigate to={routes.community.board} replace />
  )
}

function BoardPostEditorRoute() {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>()
  const navigate = useNavigate()
  const parsedBoardId = parseRouteId(boardId)
  const parsedPostId = parseRouteId(postId)
  if (!parsedBoardId || !parsedPostId) return <Navigate to={routes.community.board} replace />
  const postKey = makePostRouteKey(parsedBoardId, parsedPostId)
  return (
    <PostWriterPage
      editPostId={postKey}
      onClose={() => navigate(routes.community.boardPost(parsedBoardId, parsedPostId))}
    />
  )
}

function LegacyBoardPostEditorRoute() {
  const { postId } = useParams<{ postId: string }>()
  if (!postId) return <Navigate to={routes.community.board} replace />
  const parsed = parsePostRouteKey(postId)
  return parsed ? (
    <Navigate to={routes.community.boardPostEditor(parsed.boardId, parsed.postId)} replace />
  ) : (
    <Navigate to={routes.community.board} replace />
  )
}

function RecruitDetailRoute() {
  const { recruitId } = useParams<{ recruitId: string }>()
  const navigate = useNavigate()
  if (!recruitId) return <Navigate to={routes.community.recruit} replace />
  return (
    <RecruitDetailPage
      recruitId={recruitId}
      onBack={() => navigate(routes.community.recruit)}
      onApply={(id) => navigate(routes.community.recruitApplicationNew(id))}
    />
  )
}

function LegacyRecruitDetailRoute() {
  const { recruitId } = useParams<{ recruitId: string }>()
  if (!recruitId) return <Navigate to={routes.community.recruit} replace />
  return <Navigate to={routes.community.recruitNotice(recruitId)} replace />
}

function normalizeInfoIdParam(infoId: string) {
  const legacyMatch = infoId.match(/^resource-0*(\d+)$/i)
  if (!legacyMatch) return infoId
  return String(Number(legacyMatch[1]))
}

function InfoDetailRoute() {
  const { boardId, infoId } = useParams<{ boardId: string; infoId: string }>()
  const navigate = useNavigate()
  const parsedBoardId = parseRouteId(boardId)
  if (!parsedBoardId || !infoId) return <Navigate to={routes.community.info} replace />
  const normalizedInfoId = normalizeInfoIdParam(infoId)
  if (normalizedInfoId !== infoId) {
    return <Navigate to={routes.community.infoPost(parsedBoardId, normalizedInfoId)} replace />
  }
  return (
    <InfoDetailPage
      infoId={normalizedInfoId}
      onBack={() => navigate(routes.community.info)}
      onWrite={() => navigate(routes.community.infoPostNew)}
      onEdit={() => navigate(routes.community.infoPostEditor(parsedBoardId, normalizedInfoId))}
    />
  )
}

function LegacyInfoDetailRoute() {
  const { infoId } = useParams<{ infoId: string }>()
  if (!infoId) return <Navigate to={routes.community.info} replace />
  const normalizedInfoId = normalizeInfoIdParam(infoId)
  return (
    <Navigate
      to={routes.community.infoPost(getFallbackInfoBoardIdByPostId(normalizedInfoId), normalizedInfoId)}
      replace
    />
  )
}

function InfoPostEditorRoute() {
  const { boardId, infoId } = useParams<{ boardId: string; infoId: string }>()
  const navigate = useNavigate()
  const parsedBoardId = parseRouteId(boardId)
  if (!parsedBoardId || !infoId) return <Navigate to={routes.community.info} replace />
  const normalizedInfoId = normalizeInfoIdParam(infoId)
  if (normalizedInfoId !== infoId) {
    return <Navigate to={routes.community.infoPostEditor(parsedBoardId, normalizedInfoId)} replace />
  }
  return (
    <PostWriterPage
      writerType="info"
      editPostId={normalizedInfoId}
      onClose={() => navigate(routes.community.infoPost(parsedBoardId, normalizedInfoId))}
    />
  )
}

function LegacyInfoPostEditorRoute() {
  const { infoId } = useParams<{ infoId: string }>()
  if (!infoId) return <Navigate to={routes.community.info} replace />
  const normalizedInfoId = normalizeInfoIdParam(infoId)
  return (
    <Navigate
      to={routes.community.infoPostEditor(getFallbackInfoBoardIdByPostId(normalizedInfoId), normalizedInfoId)}
      replace
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
  return <Navigate to={routes.users.detail(user.id)} replace />
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [expandedMainNav, setExpandedMainNav] = useState<string | null>(null)
  const [suppressedMainNav, setSuppressedMainNav] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const mainNavRef = useRef<HTMLElement | null>(null)
  const closeSubNavTimerRef = useRef<number | null>(null)
  const releaseSubNavTimerRef = useRef<number | null>(null)
  const { isLoggedIn, user, logout } = useAuth()
  const isAdmin = isAdminUser(user)

  const clearSubNavTimers = useCallback(() => {
    if (closeSubNavTimerRef.current) {
      window.clearTimeout(closeSubNavTimerRef.current)
      closeSubNavTimerRef.current = null
    }

    if (releaseSubNavTimerRef.current) {
      window.clearTimeout(releaseSubNavTimerRef.current)
      releaseSubNavTimerRef.current = null
    }
  }, [])

  const closeExpandedMainNav = useCallback(() => {
    clearSubNavTimers()
    setExpandedMainNav(null)
    setSuppressedMainNav(null)
  }, [clearSubNavTimers])

  const scheduleExpandedMainNavClose = useCallback(() => {
    clearSubNavTimers()
    closeSubNavTimerRef.current = window.setTimeout(() => {
      setExpandedMainNav(null)
      setSuppressedMainNav(null)
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    }, 160)
  }, [clearSubNavTimers])

  const activeRoute: AppRoute = getRouteFromPath(location.pathname)
  const isAuthRoute = activeRoute === 'login' || activeRoute === 'signup' || activeRoute === 'verifyEmail'
  const contextPanel = useMemo(
    () => buildContextPanel(activeRoute, location.pathname),
    [activeRoute, location.pathname],
  )

  useEffect(() => {
    const closeOnRouteChange = window.setTimeout(() => {
      setProfileMenuOpen(false)
      setExpandedMainNav(null)
    }, 0)

    return () => window.clearTimeout(closeOnRouteChange)
  }, [location.pathname])

  useEffect(() => {
    if (!expandedMainNav) return undefined

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && mainNavRef.current?.contains(target)) return
      closeExpandedMainNav()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeExpandedMainNav()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeExpandedMainNav, expandedMainNav])

  useEffect(() => {
    return clearSubNavTimers
  }, [clearSubNavTimers])

  const handleHeaderSubNavSelect = (path: string, parentId: string) => {
    navigate(path)
    setMobileNavOpen(false)
    clearSubNavTimers()

    closeSubNavTimerRef.current = window.setTimeout(() => {
      setExpandedMainNav(null)
      setSuppressedMainNav(parentId)
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    }, 120)

    releaseSubNavTimerRef.current = window.setTimeout(() => {
      setSuppressedMainNav((current) => (current === parentId ? null : current))
    }, 380)
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

    if (targetPath === '/services/official/instance') {
      return location.pathname.startsWith('/services/official/instance') || location.pathname.startsWith('/service')
    }

    if (targetPath === '/services/user') {
      return location.pathname.startsWith('/services/user') || location.pathname.startsWith('/services/unofficial')
    }

    if (targetPath === '/services') {
      return location.pathname === '/services' && location.search === (targetQuery ? `?${targetQuery}` : '')
    }

    return location.pathname === targetPath
  }

  const handleContextSelect = (item: ContextPanelItem) => {
    if (item.value === 'community-board') {
      navigate(routes.community.board)
      return
    }

    if (item.value === 'community-info') {
      navigate(routes.community.info)
      return
    }

    if (item.value === 'community-recruit') {
      navigate(routes.community.recruit)
      return
    }

    if (item.value === 'service-status' || item.value === 'service-guide' || item.value === 'services-coas') {
      navigate(routes.services.root)
      return
    }

    if (item.value === 'game-ranking') {
      navigate(routes.users.root)
      return
    }

    if (item.value === 'services-official') {
      navigate(routes.services.officialInstance)
      return
    }

    if (item.value === 'services-user') {
      navigate(routes.services.user)
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
      navigate(routes.users.detail(user.id))
    }
  }

  const handleOpenAdmin = () => {
    setProfileMenuOpen(false)
    navigate(routes.admin)
  }

  const handleMainNavClick = (itemId: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      clearSubNavTimers()
      setExpandedMainNav((current) => (current === itemId ? null : itemId))
      return
    }

    closeExpandedMainNav()
    setMobileNavOpen(false)
    navigate(routePathById[itemId as AppRoute])
  }

  const handleMainNavMouseEnter = () => {
    if (closeSubNavTimerRef.current) {
      window.clearTimeout(closeSubNavTimerRef.current)
      closeSubNavTimerRef.current = null
    }
  }

  const handleMainNavMouseLeave = () => {
    if (expandedMainNav) scheduleExpandedMainNavClose()
  }

  const handleMainNavBlur = (event: FocusEvent<HTMLElement>) => {
    const nextFocusedElement = event.relatedTarget
    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) return
    if (expandedMainNav) scheduleExpandedMainNavClose()
  }

  const appRoutes = (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onOpenAllPosts={() => navigate(routes.community.board)}
              onOpenInfo={() => navigate(routes.community.info)}
            />
          }
        />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/community" element={<Navigate to="/" replace />} />
        <Route
          path="/community/board"
          element={
            <AllPostsPage
              onOpenPost={(boardId, postId) => navigate(routes.community.boardPost(boardId, postId))}
              onWritePost={() => navigate(routes.community.boardPostNew)}
              title="게시판"
            />
          }
        />
        <Route
          path="/community/info"
          element={
            <InfoSharePage
              onWriteInfo={() => navigate(routes.community.infoPostNew)}
              onOpenInfo={(boardId, infoId) => navigate(routes.community.infoPost(boardId, infoId))}
            />
          }
        />
        <Route path="/community/info/posts/new" element={<PostWriterPage writerType="info" onClose={() => navigate(routes.community.info)} />} />
        <Route path="/community/info/:boardId/posts/:infoId/editor" element={<InfoPostEditorRoute />} />
        <Route path="/community/info/:boardId/posts/:infoId" element={<InfoDetailRoute />} />
        <Route path="/community/info/posts/:infoId/editor" element={<LegacyInfoPostEditorRoute />} />
        <Route path="/community/info/posts/:infoId" element={<LegacyInfoDetailRoute />} />
        <Route
          path="/community/info/write"
          element={<Navigate to={routes.community.infoPostNew} replace />}
        />
        <Route path="/community/info/:infoId" element={<LegacyInfoDetailRoute />} />
        <Route path="/community/board/posts/new" element={<PostWriterPage onClose={() => navigate(routes.community.board)} />} />
        <Route path="/community/board/:boardId/posts/:postId/editor" element={<BoardPostEditorRoute />} />
        <Route path="/community/board/:boardId/posts/:postId" element={<PostDetailRoute />} />
        <Route path="/community/board/posts/:postId/editor" element={<LegacyBoardPostEditorRoute />} />
        <Route path="/community/board/posts/:postId" element={<LegacyCommunityPostRoute />} />
        <Route path="/community/board/write" element={<Navigate to={routes.community.boardPostNew} replace />} />
        <Route path="/community/write" element={<Navigate to={routes.community.boardPostNew} replace />} />
        <Route path="/community/posts/:postId" element={<LegacyCommunityPostRoute />} />

        <Route
          path="/community/recruit"
          element={<RecruitPage onSelectRecruit={(id) => navigate(routes.community.recruitNotice(id))} />}
        />
        <Route
          path="/community/recruit/notices/new"
          element={
            <RecruitPage
              initialMode="write"
              onSelectRecruit={(id) => navigate(routes.community.recruitNotice(id))}
            />
          }
        />
        <Route path="/community/recruit/applications/new" element={<RecruitApplyPage />} />
        <Route path="/community/recruit/notices/:recruitId" element={<RecruitDetailRoute />} />
        <Route path="/community/recruit/write" element={<Navigate to={routes.community.recruitNoticeNew} replace />} />
        <Route path="/community/recruit/apply" element={<Navigate to={`/community/recruit/applications/new${location.search}`} replace />} />
        <Route path="/community/recruit/:recruitId" element={<LegacyRecruitDetailRoute />} />
        <Route path="/recruit" element={<Navigate to={routes.community.recruit} replace />} />
        <Route path="/recruit/apply" element={<Navigate to={`/community/recruit/applications/new${location.search}`} replace />} />
        <Route
          path="/recruit/:recruitId"
          element={
            <Navigate
              to={routes.community.recruitNotice(location.pathname.split('/').filter(Boolean).at(-1) ?? '')}
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
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="/service/*" element={<Navigate to={routes.services.officialInstance} replace />} />
        <Route path="/services/official" element={<Navigate to={routes.services.officialInstance} replace />} />
        <Route path="/services/official/instance" element={<ServicesPage />} />
        <Route path="/services/unofficial" element={<Navigate to={routes.services.user} replace />} />
        <Route path="/services/user/:serviceId" element={<ServicesPage />} />
        <Route path="/services/user" element={<ServicesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              user?.verified === false ? (
                <Navigate to={routes.auth.verifyEmail} replace state={{ email: user.email }} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <AuthPage mode="login" onSwitchMode={() => navigate('/signup')} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              user?.verified === false ? (
                <Navigate to={routes.auth.verifyEmail} replace state={{ email: user.email }} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <AuthPage mode="signup" onSwitchMode={() => navigate('/login')} />
            )
          }
        />
        <Route
          path="/email-verification"
          element={
            isLoggedIn && user?.verified !== false ? (
              <Navigate to="/" replace />
            ) : (
              <EmailVerificationPage />
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
              <img src="/favicon.svg?v=coala-20260504" alt="" />
            </span>
            <span className="coala-brand-copy">
              <span className="coala-brand-word">코알라</span>
            </span>
          </button>

          <nav
            ref={mainNavRef}
            className={mobileNavOpen ? 'coala-main-nav is-open' : 'coala-main-nav'}
            aria-label="메인 메뉴"
            onMouseEnter={handleMainNavMouseEnter}
            onMouseLeave={handleMainNavMouseLeave}
            onBlur={handleMainNavBlur}
          >
            {headerNavItems.map((item) => {
              const subItems = headerSubNavItems[item.id] ?? []

              return (
                <div
                  key={item.id}
                  className={[
                    'main-nav-item',
                    expandedMainNav === item.id ? 'is-expanded' : '',
                    suppressedMainNav === item.id ? 'is-suppressed' : '',
                  ].filter(Boolean).join(' ')}
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
                          onClick={() => handleHeaderSubNavSelect(subItem.path, item.id)}
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
                        <span>{user?.lab ?? user?.department ?? user?.email}</span>
                      </div>
                    </div>
                    <button type="button" className="header-profile-menu-item" onClick={handleOpenProfile}>
                      <Icon name="user" size={14} />
                      마이프로필
                    </button>
                    {isAdmin ? (
                      <button type="button" className="header-profile-menu-item" onClick={handleOpenAdmin}>
                        <Icon name="settings" size={14} />
                        관리자 대시보드
                      </button>
                    ) : null}
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
