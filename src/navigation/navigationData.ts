import type { IconName } from '../shared/ui/Icon'

export type AppRoute =
  | 'home'
  | 'community'
  | 'recruit'
  | 'game'
  | 'service'
  | 'settings'
  | 'login'
  | 'signup'

export type HeaderRoute = 'home' | 'community' | 'recruit' | 'game' | 'service'

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
  recruit: '/recruit',
  game: '/activity',
  service: '/service',
  settings: '/settings',
  login: '/login',
  signup: '/signup',
}

export function getRouteFromPath(pathname: string): AppRoute {
  if (pathname.startsWith('/community')) return 'community'
  if (pathname.startsWith('/recruit')) return 'recruit'
  if (pathname.startsWith('/activity')) return 'game'
  if (pathname.startsWith('/service')) return 'service'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/login')) return 'login'
  if (pathname.startsWith('/signup')) return 'signup'
  return 'home'
}

export const headerNavItems: HeaderNavItem[] = [
  { id: 'home', label: '홈', icon: 'layout' },
  { id: 'service', label: '인스턴스', icon: 'network' },
  { id: 'community', label: '커뮤니티', icon: 'message' },
  { id: 'recruit', label: '모집', icon: 'users' },
  { id: 'game', label: '활동', icon: 'chart' },
]

export const routeLabelById: Record<AppRoute, string> = {
  home: '홈',
  community: '커뮤니티',
  recruit: '모집',
  game: '활동',
  service: '인스턴스',
  settings: '프로필 설정',
  login: '로그인',
  signup: '회원가입',
}

const communityActions: ContextActionDefinition[] = [
  {
    id: 'community-board',
    label: '게시판',
    icon: 'message',
    description: '전체 게시글과 일반 게시판 필터를 확인합니다.',
  },
  {
    id: 'community-info',
    label: '정보공유',
    icon: 'book',
    description: '동아리 소개, 최신 정보, 일정, 전체 정보를 확인합니다.',
  },
]

const recruitActions: ContextActionDefinition[] = [
  {
    id: 'recruit-open',
    label: '모집 글 등록',
    icon: 'edit',
    description: '스터디, 프로젝트, 멘토링 모집 글을 등록해요.',
  },
  {
    id: 'recruit-manage',
    label: '지원자 관리',
    icon: 'users',
    description: '지원자 상태와 연락 내역을 확인해요.',
  },
]

const gameActions: ContextActionDefinition[] = [
  {
    id: 'game-ranking',
    label: '활동 현황',
    icon: 'chart',
    description: 'GitHub 활동과 향후 오픈소스 기여 지표를 확인합니다.',
  },
  {
    id: 'game-github',
    label: 'GitHub 현황',
    icon: 'network',
    description: '월별 커밋 기록과 활동 기여도를 확인해요.',
  },
]

const serviceActions: ContextActionDefinition[] = [
  {
    id: 'service-status',
    label: '인스턴스 대여',
    icon: 'network',
    description: '인스턴스 대여 신청 화면으로 이동합니다.',
  },
  {
    id: 'service-guide',
    label: '문의사항',
    icon: 'book',
    description: '대여 관련 문의와 처리 안내를 확인합니다.',
  },
]

const settingsActions: ContextActionDefinition[] = [
  {
    id: 'settings-profile',
    label: '프로필 설정',
    icon: 'user',
    description: '닉네임, 소개, 공개 범위를 변경해요.',
  },
  {
    id: 'settings-theme',
    label: '알림 및 테마',
    icon: 'palette',
    description: '알림 기준과 화면 테마를 설정해요.',
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
  const isInfo = pathname.startsWith('/community/info')
  return communityActions.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    kind: 'action',
    value: item.id,
    isActive: item.id === 'community-info' ? isInfo : !isInfo,
  }))
}

export function buildContextPanel(
  route: AppRoute,
  pathname = '',
): ContextPanelData | null {
  switch (route) {
    case 'home':
      return null
    case 'community':
      return {
        title: '커뮤니티',
        description: '게시판과 정보공유를 전환합니다.',
        items: toCommunityItems(pathname),
      }
    case 'recruit':
      return {
        title: '모집 메뉴',
        description: '모집 글 작성부터 지원자 관리까지 바로 처리하세요.',
        items: toActionPanelItems(recruitActions),
      }
    case 'game':
      return {
        title: '활동 메뉴',
        description: 'GitHub 활동과 오픈소스 기여 지표를 확인하세요.',
        items: toActionPanelItems(gameActions),
      }
    case 'service':
      return {
        title: '인스턴스 메뉴',
        description: '인스턴스 대여와 문의사항으로 이동할 수 있어요.',
        items: toActionPanelItems(serviceActions),
      }
    case 'settings':
      return {
        title: '프로필 설정',
        description: '개인화 설정을 수정하세요.',
        items: toActionPanelItems(settingsActions),
      }
    case 'login':
    case 'signup':
      return null
    default:
      return null
  }
}
