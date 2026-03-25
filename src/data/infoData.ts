export type InfoFilterId = 'all' | 'pdf' | 'study' | 'meeting'

type ResourceCard = {
  id: string
  filter: Exclude<InfoFilterId, 'all'>
  tag: string
  title: string
  meta: string
  source: string
  imageUrl: string
}

type FeaturedArticle = {
  title: string
  description: string
  category: string
  imageUrl: string
}

type CalendarDay = {
  id: string
  label: string
  isMuted?: boolean
  hasEvent?: boolean
}

type CalendarSchedule = {
  id: string
  dateLabel: string
  title: string
  type: string
}

export type LatestInfoTabId = 'all' | 'notice' | 'share' | 'tip'

type LatestInfoUpdate = {
  id: string
  title: string
  summary: string
  timestamp: string
  category: string
  type: Exclude<LatestInfoTabId, 'all'>
}

export const infoFilters: { id: InfoFilterId; label: string }[] = [
  { id: 'all', label: '전체 자료' },
  { id: 'pdf', label: 'PDF 가이드' },
  { id: 'study', label: '스터디 자료' },
  { id: 'meeting', label: '회의록' },
]

export const featuredArticle: FeaturedArticle = {
  title: '코알라 팀의 새로운 커뮤니티 UX 설계',
  description:
    '운영 효율과 참여 경험을 동시에 높이기 위해 어떤 디자인 원칙을 적용했는지 정리했어요.',
  category: '디자인',
  imageUrl:
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
}

export const resourceCards: ResourceCard[] = [
  {
    id: 'resource-001',
    filter: 'pdf',
    tag: 'PDF GUIDE',
    title: 'Python 기초 가이드',
    meta: '1.2 MB',
    source: '관리자 | 2026.02.24',
    imageUrl:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'resource-002',
    filter: 'study',
    tag: 'EXTERNAL LINK',
    title: 'UI/UX 디자인 트렌드 2026',
    meta: 'MEDIUM.COM',
    source: '멤버 A | 2026.02.22',
    imageUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'resource-003',
    filter: 'pdf',
    tag: 'PDF GUIDE',
    title: 'React 상태관리 패턴',
    meta: '3.4 MB',
    source: '멤버 B | 2026.02.20',
    imageUrl:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'resource-004',
    filter: 'meeting',
    tag: 'DOCUMENT',
    title: '10월 동아리 회의록',
    meta: '450 KB',
    source: '총무 | 2026.02.18',
    imageUrl:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'resource-005',
    filter: 'study',
    tag: 'ZIP ARCHIVE',
    title: '그래픽 디자인 에셋 모음',
    meta: '128 MB',
    source: '멤버 C | 2026.02.15',
    imageUrl:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'resource-006',
    filter: 'pdf',
    tag: 'PDF GUIDE',
    title: '백엔드 보안 체크리스트',
    meta: '880 KB',
    source: '관리자 | 2026.02.12',
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  },
]

export const infoCalendar = {
  monthLabel: '2026년 3월',
  weekdayLabels: ['월', '화', '수', '목', '금', '토', '일'],
  days: [
    { id: 'day-prev-1', label: '24', isMuted: true },
    { id: 'day-prev-2', label: '25', isMuted: true },
    { id: 'day-prev-3', label: '26', isMuted: true },
    { id: 'day-prev-4', label: '27', isMuted: true },
    { id: 'day-prev-5', label: '28', isMuted: true },
    { id: 'day-prev-6', label: '1', isMuted: true },
    { id: 'day-prev-7', label: '2', isMuted: true },
    { id: 'day-1', label: '3' },
    { id: 'day-2', label: '4' },
    { id: 'day-3', label: '5' },
    { id: 'day-4', label: '6', hasEvent: true },
    { id: 'day-5', label: '7' },
    { id: 'day-6', label: '8' },
    { id: 'day-7', label: '9' },
    { id: 'day-8', label: '10' },
    { id: 'day-9', label: '11' },
    { id: 'day-10', label: '12', hasEvent: true },
    { id: 'day-11', label: '13' },
    { id: 'day-12', label: '14' },
    { id: 'day-13', label: '15' },
    { id: 'day-14', label: '16' },
    { id: 'day-15', label: '17', hasEvent: true },
    { id: 'day-16', label: '18' },
    { id: 'day-17', label: '19' },
    { id: 'day-18', label: '20' },
    { id: 'day-19', label: '21', hasEvent: true },
    { id: 'day-20', label: '22' },
    { id: 'day-21', label: '23' },
    { id: 'day-22', label: '24' },
    { id: 'day-23', label: '25' },
    { id: 'day-24', label: '26' },
    { id: 'day-25', label: '27', hasEvent: true },
    { id: 'day-26', label: '28' },
    { id: 'day-27', label: '29' },
    { id: 'day-28', label: '30' },
    { id: 'day-29', label: '31' },
    { id: 'day-next-1', label: '1', isMuted: true },
    { id: 'day-next-2', label: '2', isMuted: true },
  ] as CalendarDay[],
  schedules: [
    {
      id: 'schedule-1',
      dateLabel: '03.06 (목)',
      title: '데이터 직무 스터디 발표',
      type: '스터디',
    },
    {
      id: 'schedule-2',
      dateLabel: '03.12 (수)',
      title: '교내 공모전 팀빌딩 세션',
      type: '공모전',
    },
    {
      id: 'schedule-3',
      dateLabel: '03.17 (월)',
      title: '전공 심화 커리큘럼 리허설',
      type: '전공',
    },
    {
      id: 'schedule-4',
      dateLabel: '03.21 (금)',
      title: '취업 밋업 & 포트폴리오 리뷰',
      type: '취업',
    },
    {
      id: 'schedule-5',
      dateLabel: '03.26 (수)',
      title: '커뮤니티 가이드라인 리프레시 워크숍',
      type: '공지',
    },
  ] as CalendarSchedule[],
}

export const latestInfoTabs: { id: LatestInfoTabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'notice', label: '공지' },
  { id: 'share', label: '자료' },
  { id: 'tip', label: '팁' },
]

export const latestInfoUpdates: LatestInfoUpdate[] = [
  {
    id: 'latest-001',
    title: '2026 AI 해커톤 참가자 모집 시작',
    summary: '3/25 자정까지 제출 · 운영진 슬랙으로 문의 바랍니다.',
    timestamp: '방금 전',
    category: '공지',
    type: 'notice',
  },
  {
    id: 'latest-002',
    title: 'PDF 가이드 : 전공필수 알고리즘 2week',
    summary: '자료실 > 스터디 탭 업로드 · 팀장 주연 작성',
    timestamp: '1시간 전',
    category: '자료',
    type: 'share',
  },
  {
    id: 'latest-003',
    title: '취업 밋업 Q&A 요약',
    summary: '포트폴리오 리뷰 질의 PDF 링크 공유되었습니다.',
    timestamp: '어제',
    category: '팁',
    type: 'tip',
  },
  {
    id: 'latest-004',
    title: '전공 심화 스터디 영상 다시보기',
    summary: '3/10 세션 녹화 링크를 정보공유 폴더에 저장했어요.',
    timestamp: '2일 전',
    category: '자료',
    type: 'share',
  },
]
