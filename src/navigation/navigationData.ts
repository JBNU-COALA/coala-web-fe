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
  game: '/activity',
  service: '/services?tab=instance',
  services: '/services',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
}

export function getRouteFromPath(pathname: string): AppRoute {
  if (pathname.startsWith('/community')) return 'community'
  if (pathname.startsWith('/recruit')) return 'community'
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
  { id: 'game', label: '활동', icon: 'chart' },
  { id: 'services', label: '서비스', icon: 'settings' },
]

export const routeLabelById: Record<AppRoute, string> = {
  home: '홈',
  community: '커뮤니티',
  recruit: '모집',
  game: '활동',
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
    description: '공지, 자유, 유머 게시글을 확인합니다.',
  },
  {
    id: 'community-info',
    label: '정보공유',
    icon: 'book',
    description: '소식, 대회, 연구실, 자료를 확인합니다.',
  },
  {
    id: 'community-recruit',
    label: '모집',
    icon: 'users',
    description: '코알라 프로젝트와 팀 모집을 확인합니다.',
  },
]

const activityActions: ContextActionDefinition[] = [
  {
    id: 'game-ranking',
    label: '유저 목록',
    icon: 'users',
    description: '활동을 공유한 유저 목록을 확인합니다.',
  },
  {
    id: 'game-github',
    label: 'GitHub 활동',
    icon: 'network',
    description: '유저가 올린 GitHub 저장소와 활동 로그를 확인합니다.',
  },
]

const servicesActions: ContextActionDefinition[] = [
  {
    id: 'services-official',
    label: '통합 서비스',
    icon: 'layout',
    description: '동아리 프로젝트에 통합된 주요 서비스를 확인합니다.',
  },
  {
    id: 'services-instance',
    label: '인스턴스 신청',
    icon: 'network',
    description: '프로젝트 서버와 실습 환경을 신청합니다.',
  },
  {
    id: 'services-unofficial',
    label: '비공식 서비스',
    icon: 'link',
    description: '멤버들이 등록한 비공식 서비스를 둘러봅니다.',
  },
  {
    id: 'services-activity',
    label: '서비스 등록',
    icon: 'plus',
    description: '직접 만든 서비스를 소개합니다.',
  },
]

const settingsActions: ContextActionDefinition[] = [
  {
    id: 'settings-profile',
    label: '프로필 설정',
    icon: 'user',
    description: '닉네임, 소개, 계정 정보를 수정합니다.',
  },
  {
    id: 'settings-theme',
    label: '알림 및 테마',
    icon: 'palette',
    description: '알림 기준과 화면 테마를 설정합니다.',
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
  const isInstance = query.includes('tab=instance')

  return servicesActions.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    kind: 'action',
    value: item.id,
    isActive:
      item.id === 'services-instance'
        ? isInstance || pathname.startsWith('/service')
        : item.id === 'services-official'
          ? !isInstance
          : false,
  }))
}

export function buildContextPanel(route: AppRoute, pathname = ''): ContextPanelData | null {
  switch (route) {
    case 'home':
      return null
    case 'community':
      return {
        title: '커뮤니티',
        description: '게시판, 정보공유, 모집을 전환합니다.',
        items: toCommunityItems(pathname),
      }
    case 'game':
      return {
        title: '활동',
        description: '유저와 GitHub 활동을 확인합니다.',
        items: toActionPanelItems(activityActions),
      }
    case 'service':
      return null
    case 'services':
      return {
        title: '서비스',
        description: '통합 서비스와 인스턴스 신청을 확인합니다.',
        items: toServicesItems(pathname),
      }
    case 'settings':
      return {
        title: '프로필 설정',
        description: '개인 설정을 수정합니다.',
        items: toActionPanelItems(settingsActions),
      }
    case 'login':
    case 'signup':
      return null
    default:
      return null
  }
}
