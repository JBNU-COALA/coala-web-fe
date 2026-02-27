import type { IconName } from '../../../shared/ui/Icon'
import {
  type PostBoardFilterId,
  sidebarBoardItems,
} from '../../posts/model/postsData'

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
}

export type ContextItemKind = 'board' | 'action'

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
  { id: 'home', label: '홈' },
  { id: 'community', label: '커뮤니티' },
  { id: 'recruit', label: '모집' },
  { id: 'game', label: '활동' },
  { id: 'service', label: '서비스' },
]

export const routeLabelById: Record<AppRoute, string> = {
  home: '홈',
  community: '커뮤니티',
  recruit: '모집',
  game: '활동',
  service: '서비스',
  settings: '프로필 설정',
  login: '로그인',
  signup: '회원가입',
}

const homeActions: ContextActionDefinition[] = [
  {
    id: 'home-recent',
    label: '최근 업데이트',
    icon: 'bell',
    description: '오늘 변경된 공지와 소식을 확인해요.',
  },
  {
    id: 'home-leader',
    label: '활동 랭킹',
    icon: 'chart',
    description: '백준·GitHub 기여도 순위를 살펴봐요.',
  },
  {
    id: 'home-resource',
    label: '추천 자료',
    icon: 'book',
    description: '커뮤니티 정보공유 게시판으로 이동할 수 있어요.',
  },
]

const communityActions: ContextActionDefinition[] = [
  {
    id: 'community-info',
    label: '정보공유',
    icon: 'book',
    description: '토론형 아티클과 자료 카드 화면을 확인해요.',
  },
  {
    id: 'community-manage',
    label: '게시판 관리',
    icon: 'settings',
    description: '게시판별 권한과 노출 규칙을 관리해요.',
  },
  {
    id: 'community-announce',
    label: '공지 등록',
    icon: 'edit',
    description: '공지 사항을 작성하고 상단 고정을 설정해요.',
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
    label: '종합 랭킹',
    icon: 'chart',
    description: '백준 · GitHub 활동을 합산한 종합 순위를 확인해요.',
  },
  {
    id: 'game-baekjoon',
    label: '백준 현황',
    icon: 'file',
    description: 'SOLVED 등급별 문제풀이 기록을 확인해요.',
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
    label: '서비스 상태',
    icon: 'network',
    description: '서비스 상태와 점검 일정을 확인해요.',
  },
  {
    id: 'service-guide',
    label: '이용 가이드',
    icon: 'book',
    description: '서비스 기능별 사용 가이드를 확인해요.',
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

const toBoardItems = (
  activeBoard: PostBoardFilterId,
  icon: IconName,
): ContextPanelItem[] => {
  return sidebarBoardItems.map((item) => ({
    id: `board-${item.id}`,
    label: item.label,
    icon,
    badge: item.badge,
    kind: 'board',
    value: item.id,
    isActive: activeBoard === item.id,
  }))
}

export function buildContextPanel(
  route: AppRoute,
  activeBoard: PostBoardFilterId,
): ContextPanelData | null {
  switch (route) {
    case 'home':
      return {
        title: '바로가기',
        description: '자주 쓰는 영역을 빠르게 이동할 수 있어요.',
        items: toActionPanelItems(homeActions),
      }
    case 'community':
      return {
        title: '커뮤니티 메뉴',
        description:
          '왼쪽에서 전체 게시글, 자유게시판, 졸업생게시판, 정보공유를 선택합니다.',
        items: [...toBoardItems(activeBoard, 'users'), ...toActionPanelItems(communityActions, -1)],
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
        description: '백준 문제풀이와 GitHub 커밋 활동 기록을 확인하세요.',
        items: toActionPanelItems(gameActions),
      }
    case 'service':
      return {
        title: '서비스 메뉴',
        description: '서비스 상태, 정책, 가이드를 확인할 수 있어요.',
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
