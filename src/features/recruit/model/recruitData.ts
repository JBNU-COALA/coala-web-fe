export type RecruitStatus = 'open' | 'closed' | 'closing-soon'

export type RecruitCategory = 'study' | 'project' | 'tutoring'

export type RecruitAvatarTone = 'mint' | 'sky' | 'amber' | 'slate' | 'sand' | 'rose'

export type RecruitRole = {
  label: string
  current: number
  max: number
}

export type RecruitComment = {
  id: string
  author: string
  authorInitials: string
  authorTone: RecruitAvatarTone
  timeLabel: string
  content: string
}

export type RecruitItem = {
  id: string
  title: string
  shortDesc: string
  category: RecruitCategory
  status: RecruitStatus
  currentMembers: number
  maxMembers: number
  host: string
  hostInitials: string
  hostTone: RecruitAvatarTone
  hostRole: string
  trustScore: number
  tags: string[]
  techStack: string[]
  roles: RecruitRole[]
  meetingType: string
  expectedDuration: string
  detailContent: string[]
  processList: string[]
  comments: RecruitComment[]
  createdAt: string
  views: number
  bookmarks: number
}

export const recruitCategoryMeta: Record<RecruitCategory, { label: string }> = {
  study: { label: '스터디' },
  project: { label: '프로젝트' },
  tutoring: { label: '멘토링' },
}

export type RecruitFilterId = 'all' | 'open' | 'closing-soon'

export const recruitFilters: { id: RecruitFilterId; label: string }[] = [
  { id: 'all', label: '전체 보기' },
  { id: 'open', label: '모집 중' },
  { id: 'closing-soon', label: '마감 임박' },
]

export const recruitItems: RecruitItem[] = [
  {
    id: 'react-study',
    title: 'React 19 + TypeScript 심화 스터디 2기 모집',
    shortDesc:
      '실무형 컴포넌트 설계, 상태관리 패턴, 테스트 전략까지 한 번에 다루는 집중 스터디입니다.',
    category: 'study',
    status: 'open',
    currentMembers: 4,
    maxMembers: 6,
    host: '김민지',
    hostInitials: '김',
    hostTone: 'sky',
    hostRole: '프론트엔드 파트장',
    trustScore: 96.2,
    tags: ['#React', '#TypeScript', '#Frontend'],
    techStack: ['React', 'TypeScript', 'Vite', 'Vitest'],
    roles: [{ label: '스터디원', current: 4, max: 6 }],
    meetingType: '온라인 (Discord) + 월 1회 오프라인',
    expectedDuration: '8주',
    detailContent: [
      '이번 스터디는 단순 문법 학습이 아니라 실제 서비스 코드 구조를 설계하는 방식에 집중합니다.',
      '주차별 과제는 커스텀 훅, 비동기 상태 흐름, 폼 아키텍처, 테스트 자동화를 포함합니다.',
      '참여자는 매주 코드 리뷰를 받고, 마지막 주에는 팀 단위 미니 프로젝트를 발표합니다.',
    ],
    processList: [
      '주 2회 온라인 스터디 진행 (화/목 저녁)',
      'GitHub PR 기반 코드 리뷰',
      '주간 회고 문서 제출 및 피드백',
    ],
    comments: [
      {
        id: 'comment-react-1',
        author: '이준호',
        authorInitials: '이',
        authorTone: 'mint',
        timeLabel: '2시간 전',
        content: '비전공자도 지원 가능한지 궁금합니다. 선수 지식 기준이 있을까요?',
      },
      {
        id: 'comment-react-2',
        author: '박소연',
        authorInitials: '박',
        authorTone: 'rose',
        timeLabel: '1시간 전',
        content: '기초 JS와 React 훅 경험이 있으면 충분히 따라올 수 있어요.',
      },
    ],
    createdAt: '2026.02.24',
    views: 1240,
    bookmarks: 48,
  },
  {
    id: 'ai-project',
    title: 'AI 기반 일정 어시스턴트 사이드 프로젝트',
    shortDesc:
      '기획, FE, BE가 함께 8주 동안 MVP를 개발하는 협업형 프로젝트 팀을 모집합니다.',
    category: 'project',
    status: 'open',
    currentMembers: 3,
    maxMembers: 5,
    host: '정우석',
    hostInitials: '정',
    hostTone: 'slate',
    hostRole: '프로젝트 리드',
    trustScore: 92.4,
    tags: ['#AI', '#MVP', '#협업'],
    techStack: ['Next.js', 'FastAPI', 'PostgreSQL'],
    roles: [
      { label: '프론트엔드', current: 1, max: 2 },
      { label: '백엔드', current: 1, max: 2 },
      { label: '기획', current: 1, max: 1 },
    ],
    meetingType: '오프라인 주 1회 + 상시 온라인',
    expectedDuration: '8주',
    detailContent: [
      '일정 추천과 회의 기록 요약을 제공하는 웹 서비스 MVP를 목표로 합니다.',
      '팀 단위 스프린트로 운영하며, 기능별 책임 영역을 명확히 나눠 진행합니다.',
      '완료 후 데모데이를 통해 동아리 내 공개 발표를 진행합니다.',
    ],
    processList: [
      '격주 스프린트 계획/회고',
      'Issue 템플릿 기반 태스크 관리',
      '기능 데모와 기술 공유 세션',
    ],
    comments: [],
    createdAt: '2026.02.22',
    views: 980,
    bookmarks: 35,
  },
  {
    id: 'portfolio-mentoring',
    title: '취업 포트폴리오 리뷰 멘토링 2기',
    shortDesc:
      '졸업생 멘토와 함께 포트폴리오 메시지, 구조, 전달력까지 단계별로 점검하는 프로그램입니다.',
    category: 'tutoring',
    status: 'closing-soon',
    currentMembers: 7,
    maxMembers: 8,
    host: '최예린',
    hostInitials: '최',
    hostTone: 'sand',
    hostRole: '졸업생 멘토',
    trustScore: 97.0,
    tags: ['#취업', '#포트폴리오', '#멘토링'],
    techStack: ['Notion', 'Figma'],
    roles: [{ label: '멘티', current: 7, max: 8 }],
    meetingType: '온라인',
    expectedDuration: '4주',
    detailContent: [
      '문서 완성도보다 문제 해결 방식과 의사결정 근거를 어떻게 보여줄지에 집중합니다.',
      '개인별 1:1 피드백과 그룹 리뷰를 병행해 빠르게 개선 포인트를 찾습니다.',
    ],
    processList: ['주 1회 그룹 세션', '개인 문서 리뷰 코멘트 제공'],
    comments: [],
    createdAt: '2026.02.20',
    views: 760,
    bookmarks: 41,
  },
  {
    id: 'backend-study',
    title: '백엔드 아키텍처 스터디 (Spring & Node 비교)',
    shortDesc:
      '실제 API 설계 사례를 바탕으로 백엔드 구조를 비교 학습하고, 설계 문서 작성까지 진행합니다.',
    category: 'study',
    status: 'open',
    currentMembers: 5,
    maxMembers: 8,
    host: '윤지수',
    hostInitials: '윤',
    hostTone: 'amber',
    hostRole: '백엔드 운영진',
    trustScore: 89.6,
    tags: ['#Backend', '#Architecture', '#API'],
    techStack: ['Spring Boot', 'Node.js', 'Redis'],
    roles: [{ label: '스터디원', current: 5, max: 8 }],
    meetingType: '온라인',
    expectedDuration: '6주',
    detailContent: [
      '요구사항을 데이터 모델과 API로 변환하는 과정을 반복 학습합니다.',
      '팀별로 아키텍처 결정을 문서화하고 리뷰합니다.',
    ],
    processList: ['주 1회 발표', '주간 과제 PR 제출'],
    comments: [],
    createdAt: '2026.02.18',
    views: 612,
    bookmarks: 20,
  },
  {
    id: 'design-system-project',
    title: '디자인 시스템 구축 프로젝트',
    shortDesc:
      '컴포넌트 기준, 토큰 체계, 문서 자동화까지 포함한 실전형 디자인 시스템 프로젝트입니다.',
    category: 'project',
    status: 'closed',
    currentMembers: 4,
    maxMembers: 4,
    host: '한서율',
    hostInitials: '한',
    hostTone: 'rose',
    hostRole: '디자인 리드',
    trustScore: 94.1,
    tags: ['#DesignSystem', '#Storybook', '#협업'],
    techStack: ['React', 'Storybook', 'Figma'],
    roles: [
      { label: '프론트엔드', current: 2, max: 2 },
      { label: '디자이너', current: 2, max: 2 },
    ],
    meetingType: '오프라인',
    expectedDuration: '10주',
    detailContent: ['현재 모집이 마감되어 대기자 등록만 가능합니다.'],
    processList: ['월간 리뷰 세션'],
    comments: [],
    createdAt: '2026.02.11',
    views: 1320,
    bookmarks: 67,
  },
]
