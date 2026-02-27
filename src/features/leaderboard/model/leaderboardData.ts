export type SolvedTier =
  | 'ruby'
  | 'diamond'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'unrated'

export type AvatarTone = 'mint' | 'sky' | 'amber' | 'slate' | 'sand' | 'rose'

export type ActivityTrend = 'up' | 'down' | 'flat'

export type ActivitySource = {
  id: string
  label: string
  description: string
  pointFormula: string
}

export type ActivityMember = {
  id: string
  rank: number
  name: string
  initials: string
  tone: AvatarTone
  solvedHandle: string
  solvedTier: SolvedTier
  solvedCount: number
  githubHandle: string
  githubCommits: number
  totalPoints: number
  trend: ActivityTrend
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

export const activitySources: ActivitySource[] = [
  {
    id: 'baekjoon',
    label: '백준 문제풀이',
    description: 'SOLVED 등급에 따라 풀이당 차등 포인트 지급',
    pointFormula: 'Ruby 100pt · Diamond 80pt · Platinum 60pt · Gold 40pt · Silver 20pt · Bronze 10pt',
  },
  {
    id: 'github',
    label: 'GitHub 커밋',
    description: '월별 커밋 기록 기준 포인트 지급',
    pointFormula: '커밋 1건 = 5pt',
  },
]

export const activityMembers: ActivityMember[] = [
  {
    id: 'member-1',
    rank: 1,
    name: '이영희',
    initials: '이',
    tone: 'mint',
    solvedHandle: 'younghee_dev',
    solvedTier: 'diamond',
    solvedCount: 184,
    githubHandle: 'younghee-dev',
    githubCommits: 213,
    totalPoints: 15785,
    trend: 'flat',
  },
  {
    id: 'member-2',
    rank: 2,
    name: '김철수',
    initials: '김',
    tone: 'sky',
    solvedHandle: 'cskim_codes',
    solvedTier: 'platinum',
    solvedCount: 197,
    githubHandle: 'cskim-dev',
    githubCommits: 148,
    totalPoints: 12560,
    trend: 'up',
  },
  {
    id: 'member-3',
    rank: 3,
    name: '박지민',
    initials: '박',
    tone: 'amber',
    solvedHandle: 'jimin_ps',
    solvedTier: 'gold',
    solvedCount: 263,
    githubHandle: 'jimin-park',
    githubCommits: 95,
    totalPoints: 11005,
    trend: 'up',
  },
  {
    id: 'member-4',
    rank: 4,
    name: '최현우',
    initials: '최',
    tone: 'slate',
    solvedHandle: 'chw_algorithm',
    solvedTier: 'gold',
    solvedCount: 231,
    githubHandle: 'chw-dev',
    githubCommits: 72,
    totalPoints: 9600,
    trend: 'up',
  },
  {
    id: 'member-5',
    rank: 5,
    name: '한예진',
    initials: '한',
    tone: 'rose',
    solvedHandle: 'yejin_h',
    solvedTier: 'silver',
    solvedCount: 318,
    githubHandle: 'yejin-han',
    githubCommits: 104,
    totalPoints: 8980,
    trend: 'down',
  },
  {
    id: 'member-6',
    rank: 6,
    name: '윤지수',
    initials: '윤',
    tone: 'sand',
    solvedHandle: 'js_yun',
    solvedTier: 'silver',
    solvedCount: 302,
    githubHandle: 'jisoo-yun',
    githubCommits: 86,
    totalPoints: 8470,
    trend: 'flat',
  },
  {
    id: 'member-42',
    rank: 42,
    name: '김코알라',
    initials: '김',
    tone: 'mint',
    solvedHandle: 'koala_codes',
    solvedTier: 'bronze',
    solvedCount: 88,
    githubHandle: 'kim-koala',
    githubCommits: 53,
    totalPoints: 1145,
    trend: 'up',
    isMe: true,
  },
]
