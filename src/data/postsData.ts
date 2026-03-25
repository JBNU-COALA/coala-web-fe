export type PostBoardFilterId = 'all' | 'free' | 'alumni'

export type PostBadgeTone = 'all' | 'free' | 'alumni'

type PostAuthorTone = 'mint' | 'slate' | 'sky' | 'sand' | 'rose'

type PostCategoryFilter = {
  id: PostBoardFilterId
  label: string
}

type SidebarBoardItem = {
  id: PostBoardFilterId
  label: string
  badge: string
}

export type CommunityPost = {
  id: string
  category: PostBoardFilterId
  title: string
  excerpt: string
  author: string
  authorInitials: string
  authorTone: PostAuthorTone
  publishedAt: string
  views: string
  comments: number
  solved?: boolean
}

type PostCategoryMeta = {
  label: string
  tone: PostBadgeTone
  description: string
}

type PostDetailBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'list'; items: string[] }

export type PostDetailContent = {
  subtitle: string
  coverGradient: string
  tags: string[]
  readingTime: string
  lastUpdated: string
  content: PostDetailBlock[]
}

export const defaultPostBoardFilter: PostBoardFilterId = 'all'

export const totalPostCountLabel = '코알라 커뮤니티에서 1,284개의 게시글을 찾았어요.'

export const postCategoryFilters: PostCategoryFilter[] = [
  { id: 'all', label: '전체 게시글' },
  { id: 'free', label: '자유게시판' },
  { id: 'alumni', label: '졸업생게시판' },
]

export const sidebarBoardItems: SidebarBoardItem[] = [
  { id: 'all', label: '전체 게시글', badge: '1.2k' },
  { id: 'free', label: '자유게시판', badge: '842' },
  { id: 'alumni', label: '졸업생게시판', badge: '197' },
]

export const postCategoryMeta: Record<PostBoardFilterId, PostCategoryMeta> = {
  all: {
    label: '전체',
    tone: 'all',
    description: '모든 게시글의 리듬을 훑어보며 커뮤니티 분위기를 파악해요.',
  },
  free: {
    label: '자유',
    tone: 'free',
    description: '자유게시판에서는 근황, 질문, 팁을 가볍게 나눠요.',
  },
  alumni: {
    label: '졸업생',
    tone: 'alumni',
    description: '졸업생들의 실무 인사이트와 경험담을 모아둔 보드예요.',
  },
}

export const communityPosts: CommunityPost[] = [
  {
    id: 'post-001',
    category: 'all',
    title: '동아리 코알라 이용 가이드와 온보딩 공지',
    excerpt: '신규 합류자가 빠르게 적응할 수 있도록 운영진이 정리해 둔 체크리스트와 공지를 모았습니다.',
    author: '관리자_코알라',
    authorInitials: '관',
    authorTone: 'mint',
    publishedAt: '2시간 전',
    views: '1.2k',
    comments: 48,
  },
  {
    id: 'post-002',
    category: 'free',
    title: '2026년 생산성 루틴 공유 스레드',
    excerpt: '아침 루틴부터 사이드 프로젝트를 병행하는 방법까지, 멤버들의 실제 스케줄을 엿볼 수 있어요.',
    author: '박세연',
    authorInitials: '박',
    authorTone: 'slate',
    publishedAt: '어제',
    views: '842',
    comments: 12,
  },
  {
    id: 'post-003',
    category: 'free',
    title: '스터디 운영 자동화 템플릿 같이 써볼 분 있나요?',
    excerpt: '노션과 슬랙을 연결한 스터디 운영 자동화 템플릿을 함께 실험해볼 멤버를 찾습니다.',
    author: '최민호',
    authorInitials: '최',
    authorTone: 'sky',
    publishedAt: '3일 전',
    views: '321',
    comments: 5,
    solved: true,
  },
  {
    id: 'post-004',
    category: 'alumni',
    title: '졸업생 실무 세션: 프론트엔드 협업 팁 공유',
    excerpt: '실제 스타트업 프론트엔드 팀에서 쓰는 협업 규칙과 QA 플로를 정리한 세션 노트입니다.',
    author: '김예린',
    authorInitials: '김',
    authorTone: 'sand',
    publishedAt: '2025.12.24',
    views: '512',
    comments: 8,
  },
  {
    id: 'post-005',
    category: 'alumni',
    title: '취업 포트폴리오 피드백 모임 후기',
    excerpt: '졸업생 모임에서 나왔던 포트폴리오 진단 기준과 첨삭 팁을 간단히 남겼어요.',
    author: '이도윤',
    authorInitials: '이',
    authorTone: 'rose',
    publishedAt: '2025.12.20',
    views: '1.1k',
    comments: 22,
  },
]

export const postDetailContentById: Record<string, PostDetailContent> = {
  'post-001': {
    subtitle: '커뮤니티 운영진 노트',
    coverGradient: 'linear-gradient(135deg, #d8f3dc 0%, #95d5b2 100%)',
    tags: ['운영정책', '온보딩', '공지'],
    readingTime: '7분 분량',
    lastUpdated: '오늘 09:12 업데이트',
    content: [
      {
        type: 'paragraph',
        text: '올해부터 온보딩 공지를 묶어달라는 요청이 많아져서 전체 흐름을 다시 정리했어요. 처음 들어온 멤버가 48시간 안에 알아야 하는 규칙과 참여 루틴 위주로 압축했습니다.',
      },
      {
        type: 'heading',
        text: '온보딩 체크리스트',
      },
      {
        type: 'list',
        items: [
          '커뮤니티 약속 7항을 읽고 슬랙 #introduce 채널에 인증하기',
          '주간 라이브 공지 구독: 노션 링크에서 알림 켜기',
          '스터디/프로젝트 참여 신청서는 일괄적으로 월요일 밤에 열립니다.',
        ],
      },
      {
        type: 'quote',
        text: '동아리 코알라의 온보딩 목적은 빠른 적응보다 함께 일하는 방식을 이해하는 것에 있습니다.',
      },
      {
        type: 'paragraph',
        text: '체크리스트를 마치면 자동으로 웰컴 DM이 발송되고, 신규 멤버 전용 자료실 접근 권한이 열립니다. 세부 정책은 노션 문서에 계속 업데이트할 예정입니다.',
      },
    ],
  },
  'post-002': {
    subtitle: '루틴 아카이브',
    coverGradient: 'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)',
    tags: ['생산성', '루틴', '스터디'],
    readingTime: '5분 분량',
    lastUpdated: '어제 19:30 업데이트',
    content: [
      {
        type: 'paragraph',
        text: '올해도 루틴 공유 스레드가 열렸습니다. 팀 프로젝트와 개인 사이드 작업을 병행하는 멤버들의 리얼 스케줄을 시간대별로 모으고 있어요.',
      },
      {
        type: 'heading',
        text: '많이 언급된 루틴',
      },
      {
        type: 'list',
        items: [
          '06:30 기상 → 10분 스트레칭 → 20분 간단 기록 (5명)',
          '업무 후 90분 사이드 프로젝트 블록을 캘린더에 고정 (3명)',
          '주말 오전에 커뮤니티 글과 자료를 몰아서 정리 (4명)',
        ],
      },
      {
        type: 'paragraph',
        text: '댓글에 본인의 루틴을 시간 단위로 남기면, 운영진이 한 주 뒤 카드 뉴스로 요약해드립니다. 루틴 캡처 이미지를 올리면 더 좋아요.',
      },
    ],
  },
  'post-003': {
    subtitle: '협업 실험실',
    coverGradient: 'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)',
    tags: ['템플릿', '자동화', '스터디'],
    readingTime: '6분 분량',
    lastUpdated: '3일 전 업데이트',
    content: [
      {
        type: 'paragraph',
        text: '슬랙 명령어와 노션 데이터베이스를 묶어 스터디 운영을 자동화해보고 있습니다. 반복되는 리마인드, 출석 확인, 과제 취합을 짧은 워크플로우로 구성했어요.',
      },
      {
        type: 'heading',
        text: '자동화 구성 요소',
      },
      {
        type: 'list',
        items: [
          '슬랙 slash 커맨드 `/study checkin` 으로 출석폼 열기',
          '노션 API로 출석 결과를 해당 회차 페이지에 자동 기록',
          '리마인드 DM은 Make.com 시나리오로 1시간 전 자동 발송',
        ],
      },
      {
        type: 'code',
        language: 'json',
        code: '{\n  "workflow": "weekly-standup",\n  "trigger": "/study checkin",\n  "actions": ["notion.append", "slack.dm"]\n}',
      },
      {
        type: 'paragraph',
        text: '관심 있는 분들은 댓글로 슬랙 아이디를 남겨주세요. 시범 운영 보드에 초대드릴게요.',
      },
    ],
  },
  'post-004': {
    subtitle: '졸업생 라운지',
    coverGradient: 'linear-gradient(135deg, #dee2ff 0%, #b8c0ff 100%)',
    tags: ['실무팁', '프론트엔드', '협업'],
    readingTime: '8분 분량',
    lastUpdated: '2025.12.24 업데이트',
    content: [
      {
        type: 'paragraph',
        text: '최근 진행한 졸업생 실무 세션을 글로 옮겼습니다. 스타트업 프론트엔드 팀이 실제로 쓰는 QA 루틴과 코드 리뷰 규칙을 그대로 담았습니다.',
      },
      {
        type: 'heading',
        text: '스쿼드별 협업 규칙',
      },
      {
        type: 'list',
        items: [
          'PR은 반드시 issue 템플릿과 연동되어야 하며, 리뷰어는 2명 이상 지정',
          '릴리즈 전날 QA 문서를 갱신하고 QA 전용 슬랙 채널에서 체크리스트 공유',
          '디자인 핸드오프 후 24시간 내에 컴포넌트 계약서를 작성',
        ],
      },
      {
        type: 'quote',
        text: '협업 규칙을 문서화하면 신입 멤버 온보딩 시간이 평균 3일 줄었습니다.',
      },
      {
        type: 'paragraph',
        text: '세션 영상과 함께 실습 자료를 노션 보드에 업로드했으니 참고해 주세요.',
      },
    ],
  },
  'post-005': {
    subtitle: '포트폴리오 아카이브',
    coverGradient: 'linear-gradient(135deg, #ffe5ec 0%, #ffc2d1 100%)',
    tags: ['포트폴리오', '커리어', '졸업생'],
    readingTime: '4분 분량',
    lastUpdated: '2025.12.20 업데이트',
    content: [
      {
        type: 'paragraph',
        text: '지난 졸업생 포트폴리오 피드백 모임의 핵심 기준을 간단히 남겨둡니다. 인터랙션 시나리오와 성과 지표를 어떻게 설명했는지가 중요 포인트였어요.',
      },
      {
        type: 'heading',
        text: '피드백 관찰 포인트',
      },
      {
        type: 'list',
        items: [
          '문제를 정의하는 문장이 구체적인 데이터와 함께 제시되었는가',
          '솔루션 섹션에 팀 과정과 본인 역할이 분리되어 있는가',
          '결과를 정량화한 지표나 배운 점이 명확하게 표기되었는가',
        ],
      },
      {
        type: 'paragraph',
        text: '참여자별 코멘트는 개인정보를 위해 별도 문서로 공유해두었습니다. 링크가 필요하면 댓글로 알려주세요.',
      },
    ],
  },
}
