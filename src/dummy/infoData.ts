export type InfoFilterId = 'news' | 'contest' | 'lab' | 'resource'

type ResourceCard = {
  id: number
  filter: InfoFilterId
  tag: string
  title: string
  meta: string
  source: string
  content: string
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

export type LatestInfoTabId = InfoFilterId

type LatestInfoUpdate = {
  id: string
  title: string
  summary: string
  timestamp: string
  category: string
  type: LatestInfoTabId
}

export const infoFilters: { id: InfoFilterId; label: string }[] = [
  { id: 'news', label: '소식' },
  { id: 'contest', label: '대회' },
  { id: 'lab', label: '연구실' },
  { id: 'resource', label: '자료' },
]

export const featuredArticle: FeaturedArticle = {
  title: '코알라 커뮤니티 정보공유 개편',
  description: '',
  category: '소식',
  imageUrl:
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
}

export const resourceCards: ResourceCard[] = [
  {
    id: 1,
    filter: 'news',
    tag: 'NEWS',
    title: '5월 코알라 운영진 공지',
    meta: '공지',
    source: '운영진 | 2026.05.02',
    content: `이번 달 운영 일정입니다.

- 정기 모임: 매주 목요일
- 프로젝트 점검: 5월 둘째 주
- 서비스 배포 신청: 상시

변경되는 내용은 정보공유에 다시 올리겠습니다.`,
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    filter: 'contest',
    tag: 'CONTEST',
    title: '2026 AI 해커톤 참가팀 모집',
    meta: '외부 대회',
    source: '대회팀 | 2026.05.01',
    content: `AI 해커톤 참가팀을 모집합니다.

- 주제: 서비스 기획과 AI 기능 구현
- 팀 구성: 2명 이상 5명 이하
- 신청 마감: 2026년 5월 10일

참가를 원하는 부원은 모집 게시판에서 팀원을 먼저 구해 주세요.`,
    imageUrl:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    filter: 'lab',
    tag: 'LAB',
    title: '지능형소프트웨어 연구실 학부생 인턴 안내',
    meta: '연구실',
    source: '연구연계팀 | 2026.04.29',
    content: `지능형소프트웨어 연구실 학부생 인턴 안내입니다.

- 대상: 2학년 이상
- 분야: 웹 서비스, 데이터 처리, 모델 활용
- 문의: 연구연계팀

지원 전 관심 분야와 가능한 시간을 정리해 두면 좋습니다.`,
    imageUrl:
      'https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 4,
    filter: 'resource',
    tag: 'PDF',
    title: 'React 상태관리 패턴 정리',
    meta: '3.4 MB',
    source: '김예린 | 2026.04.27',
    content: `React 상태관리 패턴을 정리한 자료입니다.

## 포함 내용

- Context 사용 기준
- Zustand 상태 분리
- TanStack Query 캐시 전략

프로젝트 규모별로 어떤 선택을 하면 좋은지 비교했습니다.`,
    imageUrl:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 5,
    filter: 'contest',
    tag: 'CONTEST',
    title: '교내 캡스톤 경진대회 일정',
    meta: '교내 대회',
    source: '박세연 | 2026.04.25',
    content: `교내 캡스톤 경진대회 일정입니다.

- 예선 접수: 5월 20일
- 발표 자료 제출: 5월 27일
- 본선 발표: 6월 3일

팀별 산출물과 시연 영상을 미리 준비해 주세요.`,
    imageUrl:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 6,
    filter: 'resource',
    tag: 'LINK',
    title: '백엔드 보안 체크리스트',
    meta: '외부 링크',
    source: '최민호 | 2026.04.23',
    content: `백엔드 보안 점검용 체크리스트입니다.

- 인증 토큰 만료와 재발급
- 권한별 API 접근 제어
- 파일 업로드 검증
- 관리자 API 감사 로그

배포 전 최소 한 번은 팀원끼리 함께 확인해 주세요.`,
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  },
]

export const infoCalendar = {
  monthLabel: '2026년 5월',
  weekdayLabels: ['일', '월', '화', '수', '목', '금', '토'],
  days: [
    { id: 'day-prev-1', label: '26', isMuted: true },
    { id: 'day-prev-2', label: '27', isMuted: true },
    { id: 'day-prev-3', label: '28', isMuted: true },
    { id: 'day-prev-4', label: '29', isMuted: true },
    { id: 'day-prev-5', label: '30', isMuted: true },
    { id: 'day-1', label: '1', hasEvent: true },
    { id: 'day-2', label: '2' },
    { id: 'day-3', label: '3' },
    { id: 'day-4', label: '4' },
    { id: 'day-5', label: '5' },
    { id: 'day-6', label: '6', hasEvent: true },
    { id: 'day-7', label: '7' },
    { id: 'day-8', label: '8' },
    { id: 'day-9', label: '9' },
    { id: 'day-10', label: '10' },
    { id: 'day-11', label: '11' },
    { id: 'day-12', label: '12', hasEvent: true },
    { id: 'day-13', label: '13' },
    { id: 'day-14', label: '14' },
    { id: 'day-15', label: '15' },
    { id: 'day-16', label: '16' },
    { id: 'day-17', label: '17' },
    { id: 'day-18', label: '18' },
    { id: 'day-19', label: '19', hasEvent: true },
    { id: 'day-20', label: '20' },
    { id: 'day-21', label: '21' },
    { id: 'day-22', label: '22' },
    { id: 'day-23', label: '23' },
    { id: 'day-24', label: '24' },
    { id: 'day-25', label: '25' },
    { id: 'day-26', label: '26' },
    { id: 'day-27', label: '27', hasEvent: true },
    { id: 'day-28', label: '28' },
    { id: 'day-29', label: '29' },
    { id: 'day-30', label: '30' },
    { id: 'day-31', label: '31' },
    { id: 'day-next-1', label: '1', isMuted: true },
    { id: 'day-next-2', label: '2', isMuted: true },
    { id: 'day-next-3', label: '3', isMuted: true },
    { id: 'day-next-4', label: '4', isMuted: true },
    { id: 'day-next-5', label: '5', isMuted: true },
    { id: 'day-next-6', label: '6', isMuted: true },
  ] as CalendarDay[],
  schedules: [
    {
      id: 'schedule-1',
      dateLabel: '05.01 (금)',
      title: '5월 운영 소식 공개',
      type: '소식',
    },
    {
      id: 'schedule-2',
      dateLabel: '05.06 (수)',
      title: 'AI 해커톤 사전 설명회',
      type: '대회',
    },
    {
      id: 'schedule-3',
      dateLabel: '05.12 (화)',
      title: '연구실 학부생 인턴 소개 세션',
      type: '연구실',
    },
    {
      id: 'schedule-4',
      dateLabel: '05.19 (화)',
      title: '자료 아카이브 정리 데이',
      type: '자료',
    },
    {
      id: 'schedule-5',
      dateLabel: '05.27 (수)',
      title: '교내 캡스톤 경진대회 마감',
      type: '대회',
    },
  ] as CalendarSchedule[],
}

export const latestInfoTabs: { id: LatestInfoTabId; label: string }[] = infoFilters

export const latestInfoUpdates: LatestInfoUpdate[] = [
  {
    id: 'latest-001',
    title: '5월 코알라 운영 소식이 올라왔습니다',
    summary: '운영 일정과 커뮤니티 변경사항',
    timestamp: '방금 전',
    category: '소식',
    type: 'news',
  },
  {
    id: 'latest-002',
    title: 'AI 해커톤 참가 신청 시작',
    summary: '팀 빌딩은 이번 주 금요일까지 진행됩니다.',
    timestamp: '1시간 전',
    category: '대회',
    type: 'contest',
  },
  {
    id: 'latest-003',
    title: '지능형소프트웨어 연구실 인턴 모집 안내',
    summary: '학부생 인턴 모집',
    timestamp: '어제',
    category: '연구실',
    type: 'lab',
  },
  {
    id: 'latest-004',
    title: 'React 상태관리 자료가 추가되었습니다',
    summary: 'PDF와 예제 링크',
    timestamp: '2일 전',
    category: '자료',
    type: 'resource',
  },
]
