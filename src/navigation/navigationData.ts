import type { IconName } from '../shared/ui/Icon'

export type AppRoute =
  | 'home'
  | 'community'
  | 'recruit'
  | 'game'
  | 'service'
  | 'services'
  | 'settings'
  | 'login'
  | 'signup'

export type HeaderRoute = 'home' | 'community' | 'game' | 'services'

export type HeaderNavItem = {
  id: HeaderRoute
  label: string
  icon: IconName
}

export type HeaderSubNavItem = {
  id: string
  label: string
  icon: IconName
  path: string
}

export type ContextItemKind = 'action'

export type ContextPanelItem = {
  id: string
  label: string
  icon: IconName
  description?: string
  badge?: string
  kind: ContextItemKind
  value: string
  isActive: boolean
}

export type ContextPanelData = {
  title: string
  description: string
  items: ContextPanelItem[]
}

type ContextActionDefinition = {
  id: string
  label: string
  icon: IconName
  description: string
}

export const routePathById: Record<AppRoute, string> = {
  home: '/',
  community: '/community',
  recruit: '/community/recruit',
  game: '/users',
  service: '/services',
  services: '/services',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
}

export function getRouteFromPath(pathname: string): AppRoute {
  if (pathname.startsWith('/community')) return 'community'
  if (pathname.startsWith('/recruit')) return 'community'
  if (pathname.startsWith('/users')) return 'game'
  if (pathname.startsWith('/members')) return 'game'
  if (pathname.startsWith('/activity')) return 'game'
  if (pathname.startsWith('/services')) return 'services'
  if (pathname.startsWith('/service')) return 'services'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/login')) return 'login'
  if (pathname.startsWith('/signup')) return 'signup'
  return 'home'
}

export const headerNavItems: HeaderNavItem[] = [
  { id: 'home', label: '홈', icon: 'layout' },
  { id: 'community', label: '커뮤니티', icon: 'message' },
  { id: 'services', label: '서비스', icon: 'settings' },
  { id: 'game', label: '유저', icon: 'users' },
]

export const headerSubNavItems: Partial<Record<HeaderRoute, HeaderSubNavItem[]>> = {
  community: [
    { id: 'community-board', label: '게시판', icon: 'message', path: '/community/board' },
    { id: 'community-info', label: '정보공유', icon: 'book', path: '/community/info' },
    { id: 'community-recruit', label: '모집', icon: 'users', path: '/community/recruit' },
  ],
  services: [
    { id: 'services-coas', label: 'COAS', icon: 'layout', path: '/services' },
    { id: 'services-official', label: '공식 서비스', icon: 'network', path: '/services/official/instance' },
    { id: 'services-unofficial', label: '비공식 서비스', icon: 'link', path: '/services/unofficial' },
  ],
}

export const routeLabelById: Record<AppRoute, string> = {
  home: '홈',
  community: '커뮤니티',
  recruit: '모집',
  game: '유저',
  service: '인스턴스',
  services: '서비스',
  settings: '프로필 설정',
  login: '로그인',
  signup: '회원가입',
}

const communityActions: ContextActionDefinition[] = [
  {
    id: 'community-board',
    label: '게시판',
    icon: 'message',
    description: '',
  },
  {
    id: 'community-info',
    label: '정보공유',
    icon: 'book',
    description: '',
  },
  {
    id: 'community-recruit',
    label: '모집',
    icon: 'users',
    description: '',
  },
]

const activityActions: ContextActionDefinition[] = [
  {
    id: 'game-ranking',
    label: '유저 목록',
    icon: 'users',
    description: '',
  },
]

const servicesActions: ContextActionDefinition[] = [
  {
    id: 'services-coas',
    label: 'COAS',
    icon: 'layout',
    description: '',
  },
  {
    id: 'services-official',
    label: '공식 서비스',
    icon: 'network',
    description: '',
  },
  {
    id: 'services-unofficial',
    label: '비공식 서비스',
    icon: 'link',
    description: '',
  },
]

const settingsActions: ContextActionDefinition[] = [
  {
    id: 'settings-profile',
    label: '프로필 설정',
    icon: 'user',
    description: '',
  },
  {
    id: 'settings-theme',
    label: '알림 및 테마',
    icon: 'palette',
    description: '',
  },
]

const toActionPanelItems = (
  actions: ContextActionDefinition[],
  activeIndex = 0,
): ContextPanelItem[] => {
  return actions.map((item, index) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    kind: 'action',
    value: item.id,
    isActive: index === activeIndex,
  }))
}

const toCommunityItems = (pathname: string): ContextPanelItem[] => {
  const isBoard = pathname.startsWith('/community/board')
  const isInfo = pathname.startsWith('/community/info')
  const isRecruit = pathname.startsWith('/community/recruit') || pathname.startsWith('/recruit')

  return communityActions.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    kind: 'action',
    value: item.id,
    isActive:
      item.id === 'community-board'
        ? isBoard
        : item.id === 'community-info'
          ? isInfo
          : item.id === 'community-recruit'
            ? isRecruit
            : false,
  }))
}

const toServicesItems = (pathname: string): ContextPanelItem[] => {
  const query = typeof window !== 'undefined' ? window.location.search : ''
  const isOfficial = pathname.startsWith('/services/official') || query.includes('tab=official')
  const isUnofficial = pathname.startsWith('/services/unofficial') || query.includes('tab=unofficial')
  const isLegacyServiceRoute = pathname === '/service' || pathname.startsWith('/service/')

  return servicesActions.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    kind: 'action',
    value: item.id,
    isActive:
      item.id === 'services-unofficial'
        ? isUnofficial
        : item.id === 'services-official'
          ? isOfficial || isLegacyServiceRoute
          : item.id === 'services-coas'
            ? !isOfficial && !isUnofficial && !isLegacyServiceRoute
            : false,
  }))
}

const toActivityItems = (): ContextPanelItem[] => {
  return activityActions.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    kind: 'action',
    value: item.id,
    isActive: true,
  }))
}

export function buildContextPanel(route: AppRoute, pathname = ''): ContextPanelData | null {
  switch (route) {
    case 'home':
      return null
    case 'community':
      return {
        title: '커뮤니티',
        description: '',
        items: toCommunityItems(pathname),
      }
    case 'game':
      return {
        title: '유저',
        description: '',
        items: toActivityItems(),
      }
    case 'service':
      return null
    case 'services':
      return {
        title: '서비스',
        description: '',
        items: toServicesItems(pathname),
      }
    case 'settings':
      return {
        title: '프로필 설정',
        description: '',
        items: toActionPanelItems(settingsActions),
      }
    case 'login':
    case 'signup':
      return null
    default:
      return null
  }
}
