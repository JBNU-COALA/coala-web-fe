export type AvatarTone = 'mint' | 'sky' | 'amber' | 'slate' | 'sand' | 'rose'

export type SolvedTier =
  | 'ruby'
  | 'diamond'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'unrated'

export type ActivityLogType = 'commit' | 'pull-request' | 'release' | 'note'

export type ActivityLog = {
  id: string
  type: ActivityLogType
  title: string
  repository: string
  description: string
  timeLabel: string
}

export type ActivityMember = {
  id: string
  name: string
  initials: string
  tone: AvatarTone
  role: string
  grade: '1학년' | '2학년' | '3학년' | '4학년' | '졸업생'
  lab: string
  githubHandle: string
  githubUrl: string
  focus: string
  recentCommit: string
  sharedRepos: string[]
  logs: ActivityLog[]
  solvedHandle: string
  solvedTier: SolvedTier
  solvedCount: number
  githubCommits: number
  totalPoints: number
  isMe?: boolean
}

export const GITHUB_COMMIT_POINT = 5

export const solvedTierMeta: Record<SolvedTier, { label: string; pointsPerProblem: number }> = {
  ruby: { label: 'Ruby', pointsPerProblem: 100 },
  diamond: { label: 'Diamond', pointsPerProblem: 80 },
  platinum: { label: 'Platinum', pointsPerProblem: 60 },
  gold: { label: 'Gold', pointsPerProblem: 40 },
  silver: { label: 'Silver', pointsPerProblem: 20 },
  bronze: { label: 'Bronze', pointsPerProblem: 10 },
  unrated: { label: 'Unrated', pointsPerProblem: 5 },
}

export const activityMembers: ActivityMember[] = [
  {
    id: 'member-1',
    name: '김민지',
    initials: '김',
    tone: 'mint',
    role: '프론트엔드',
    grade: '3학년',
    lab: '웹서비스 연구실',
    githubHandle: 'minji-dev',
    githubUrl: 'https://github.com/minji-dev',
    focus: 'React, 디자인 시스템',
    recentCommit: '오늘 09:12',
    sharedRepos: ['coala-dashboard', 'design-token-lab'],
    solvedHandle: 'minji_dev',
    solvedTier: 'gold',
    solvedCount: 132,
    githubCommits: 88,
    totalPoints: 6420,
    logs: [
      {
        id: 'log-1-1',
        type: 'commit',
        title: '커뮤니티 배너 슬라이더 컴포넌트 정리',
        repository: 'coala-dashboard',
        description: '탭형 페이지에서 재사용할 수 있도록 배너 데이터를 분리했습니다.',
        timeLabel: '오늘',
      },
      {
        id: 'log-1-2',
        type: 'pull-request',
        title: '프로필 작성 콘텐츠 필터 개선',
        repository: 'coala-dashboard',
        description: '게시판, 정보공유, 모집 글을 같은 목록에서 확인하도록 수정했습니다.',
        timeLabel: '어제',
      },
    ],
  },
  {
    id: 'member-2',
    name: '박세연',
    initials: '박',
    tone: 'sky',
    role: '백엔드',
    grade: '4학년',
    lab: '클라우드 시스템 연구실',
    githubHandle: 'seyeon-api',
    githubUrl: 'https://github.com/seyeon-api',
    focus: 'Spring Boot, 배포 자동화',
    recentCommit: '어제 22:40',
    sharedRepos: ['instance-api', 'deploy-playground'],
    solvedHandle: 'seyeon_api',
    solvedTier: 'platinum',
    solvedCount: 166,
    githubCommits: 104,
    totalPoints: 7810,
    logs: [
      {
        id: 'log-2-1',
        type: 'release',
        title: '인스턴스 신청 API v0.3 배포',
        repository: 'instance-api',
        description: '신청 상태 변경과 관리자 메모 필드를 추가했습니다.',
        timeLabel: '어제',
      },
    ],
  },
  {
    id: 'member-3',
    name: '최민호',
    initials: '최',
    tone: 'amber',
    role: 'AI 연구',
    grade: '졸업생',
    lab: '지능형소프트웨어 연구실',
    githubHandle: 'mino-lab',
    githubUrl: 'https://github.com/mino-lab',
    focus: 'LLM, 데이터 파이프라인',
    recentCommit: '2일 전',
    sharedRepos: ['paper-scout', 'dataset-cleaner'],
    solvedHandle: 'mino_lab',
    solvedTier: 'silver',
    solvedCount: 94,
    githubCommits: 57,
    totalPoints: 4380,
    logs: [
      {
        id: 'log-3-1',
        type: 'note',
        title: '논문 요약 자동화 실험 기록 공유',
        repository: 'paper-scout',
        description: '초록 수집, 키워드 추출, 요약 프롬프트를 비교했습니다.',
        timeLabel: '2일 전',
      },
    ],
  },
  {
    id: 'member-4',
    name: '이도윤',
    initials: '이',
    tone: 'slate',
    role: '풀스택',
    grade: '2학년',
    lab: '웹서비스 연구실',
    githubHandle: 'doyun-stack',
    githubUrl: 'https://github.com/doyun-stack',
    focus: 'Next.js, PostgreSQL',
    recentCommit: '3일 전',
    sharedRepos: ['team-finder', 'study-mate'],
    solvedHandle: 'doyun_stack',
    solvedTier: 'bronze',
    solvedCount: 61,
    githubCommits: 42,
    totalPoints: 3150,
    logs: [
      {
        id: 'log-4-1',
        type: 'commit',
        title: '모집 지원 플로우 초안 구현',
        repository: 'team-finder',
        description: '지원서 입력 폼과 모집 상태 표시를 추가했습니다.',
        timeLabel: '3일 전',
      },
    ],
    isMe: true,
  },
]
