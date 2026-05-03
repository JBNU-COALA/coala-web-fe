import type { IconName } from '../shared/ui/Icon'

type ProfileSummary = {
  name: string
  role: string
}

type PostItem = {
  id: string
  title: string
  timeLabel: string
  authorRole: string
}

export type ResourceTone = 'mint' | 'sand' | 'sky'

type ResourceItem = {
  id: string
  title: string
  subtitle: string
  meta: string
  icon: IconName
  tone: ResourceTone
}

type HeroSlide = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
}

type RecruitHighlight = {
  id: string
  category: string
  title: string
  summary: string
  current: number
  max: number
  deadline: string
}

export type LeaderTone = 'mint' | 'sky' | 'amber'

type LeaderboardMember = {
  id: string
  name: string
  level: string
  points: string
  initials: string
  tone: LeaderTone
}

type PortalStat = {
  label: string
  value: string
}

type PortalUpdate = {
  id: string
  category: string
  title: string
  meta: string
}

type PortalOpsItem = {
  id: string
  label: string
  value: string
  detail: string
}

export const profileSummary: ProfileSummary = {
  name: '박성우',
  role: '동아리 멤버',
}

export const homeHeroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: '코알라 대시보드',
    title: '전북대학교 컴퓨터인공지능학부 동아리 코알라입니다.\n',
    subtitle: '(준비중입니다)',
  },
  {
    id: 'slide-2',
    eyebrow: '정보공유',
    title: '동아리 자료와 외부 개발 자료를 모아 공유합니다.\n',
    subtitle: '(준비중입니다)',
  },
  {
    id: 'slide-3',
    eyebrow: '커뮤니티',
    title: '공지와 인기글을 중심으로 커뮤니티 흐름을 보여줍니다.\n',
    subtitle: '(준비중입니다)',
  },
]

export const portalStats: PortalStat[] = [
  { label: '정보공유 새 자료', value: '12' },
  { label: '오늘 새 글', value: '18' },
  { label: '답변 대기 질문', value: '5' },
]

export const portalOpsItems: PortalOpsItem[] = [
  {
    id: 'info-new',
    label: '정보공유',
    value: '12건',
    detail: '최근 추가된 문서, 링크, 튜토리얼',
  },
  {
    id: 'question-new',
    label: '질문/답변',
    value: '5건',
    detail: '답변이 필요한 커뮤니티 질문',
  },
  {
    id: 'community-new',
    label: '전체 게시글',
    value: '18개',
    detail: '오늘 새로 올라온 글과 댓글 업데이트',
  },
]

export const portalUpdates: PortalUpdate[] = [
  {
    id: 'notice',
    category: '공지',
    title: '5월 정기 세션 자료 모음 글이 가장 많이 확인되었습니다.',
    meta: '조회 1.8k · 댓글 24',
  },
  {
    id: 'resource',
    category: '자료',
    title: 'React 상태 관리 비교 정리 글이 이번 주 인기글에 올랐습니다.',
    meta: '조회 1.4k · 댓글 18',
  },
  {
    id: 'question',
    category: '질문',
    title: '인스턴스 대여 전 배포 환경 구성 질문에 답변이 이어지고 있습니다.',
    meta: '조회 980 · 댓글 12',
  },
]

export const postItems: PostItem[] = [
  {
    id: 'workflow',
    title: '2026년 실무 워크플로우 업데이트 정리',
    timeLabel: '2시간 전',
    authorRole: '관리자',
  },
  {
    id: 'opensource',
    title: '오픈소스 풀에 기여하는 방법',
    timeLabel: '어제',
    authorRole: '에디터',
  },
  {
    id: 'guideline',
    title: '커뮤니티 운영 가이드 개정 안내',
    timeLabel: '3일 전',
    authorRole: '모더레이터',
  },
]

export const resourceItems: ResourceItem[] = [
  {
    id: 'react-state',
    title: 'React 상태 관리 패턴 정리',
    subtitle: 'Context, Zustand, TanStack Query를 프로젝트 규모별로 비교한 글',
    meta: '정보공유 · 조회 1.4k',
    icon: 'book',
    tone: 'mint',
  },
  {
    id: 'backend-check',
    title: '백엔드 보안 체크리스트',
    subtitle: '배포 전 인증, 권한, 환경변수, 로그 설정을 점검하는 자료',
    meta: '정보공유 · 조회 860',
    icon: 'link',
    tone: 'sand',
  },
  {
    id: 'ai-resource',
    title: '생성형 AI 서비스 기획 자료',
    subtitle: '뉴스 요약 서비스 프로젝트에서 참고한 API 설계와 UX 흐름',
    meta: '정보공유 · 조회 720',
    icon: 'play',
    tone: 'sky',
  },
]

export const recruitHighlights: RecruitHighlight[] = [
  {
    id: 'recruit-1',
    category: '스터디',
    title: 'React 19 + TypeScript 심화 스터디 모집',
    summary: '주 2회 실습 중심으로 운영되는 프론트엔드 집중 스터디입니다.',
    current: 4,
    max: 6,
    deadline: '3일 남음',
  },
  {
    id: 'recruit-2',
    category: '프로젝트',
    title: 'AI 기반 일정 어시스턴트 사이드 프로젝트',
    summary: '기획, FE, BE 역할을 분담해 8주간 MVP를 개발합니다.',
    current: 3,
    max: 5,
    deadline: '마감 임박',
  },
  {
    id: 'recruit-3',
    category: '멘토링',
    title: '취업 포트폴리오 리뷰 멘토링 2기',
    summary: '졸업생 멘토와 함께 포트폴리오 구조와 피드백 루프를 설계해요.',
    current: 7,
    max: 10,
    deadline: '7일 남음',
  },
]

export const leaderboardMembers: LeaderboardMember[] = [
  {
    id: 'rank-1',
    name: '이영희',
    level: 'GRAND MASTER',
    points: '15,800 pts',
    initials: '이',
    tone: 'mint',
  },
  {
    id: 'rank-2',
    name: '김철수',
    level: 'MASTER TIER',
    points: '12,450 pts',
    initials: '김',
    tone: 'sky',
  },
  {
    id: 'rank-3',
    name: '박지민',
    level: 'DIAMOND TIER',
    points: '11,200 pts',
    initials: '박',
    tone: 'amber',
  },
]
