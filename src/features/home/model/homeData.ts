import type { IconName } from '../../../shared/ui/Icon'

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
  imageUrl: string
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

export const profileSummary: ProfileSummary = {
  name: '박성우',
  role: '동아리 멤버',
}

export const homeHeroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: '동아리 코알라',
    title: '이번 주 스터디와 커뮤니티 소식을 한 번에 확인하세요.',
    subtitle: '공지, 정보공유, 멤버 활동 데이터를 홈에서 빠르게 확인할 수 있어요.',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'slide-2',
    eyebrow: '동아리 코알라',
    title: '모집 공고를 비교하고 지금 가장 맞는 팀에 참여해보세요.',
    subtitle: '프론트엔드, 백엔드, 디자인 트랙별 인기 모집 공고를 추천해드립니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'slide-3',
    eyebrow: '동아리 코알라',
    title: '리더보드에서 멤버들의 성장 흐름을 투명하게 볼 수 있어요.',
    subtitle: '랭킹, 티어, 트렌드 기반으로 팀 기여도를 확인하고 목표를 설정하세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
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
    id: 'handbook',
    title: '동아리 핸드북.pdf',
    subtitle: '신규 멤버를 위한 필수 안내 문서',
    meta: '2.4 MB   |   다운로드',
    icon: 'book',
    tone: 'mint',
  },
  {
    id: 'design-kit',
    title: '디자인 에셋 라이브러리',
    subtitle: '공유 Figma 리소스와 템플릿',
    meta: '링크   |   외부',
    icon: 'link',
    tone: 'sand',
  },
  {
    id: 'tutorial',
    title: '온보딩 튜토리얼',
    subtitle: '새 멤버를 위한 빠른 시작 영상',
    meta: '12:45   |   영상',
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
