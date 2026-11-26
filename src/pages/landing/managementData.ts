export type ManagementMember = {
  id: string
  name: string
  role?: string
  introduction?: string
  photoUrl?: string
  githubUrl?: string
  linkedinUrl?: string
}

export type ManagementGeneration = {
  id: string
  label: string
  term?: string
  members: ManagementMember[]
}

// Add confirmed generations newest first. Never publish placeholder identities.
export const managementGenerations: ManagementGeneration[] = [
  { id: '7', label: '7기', members: [{ id: 'hwang-hyemin', name: '황혜민', role: '회장' }] },
  { id: '6', label: '6기', members: [{ id: 'park-youngju', name: '박영주', role: '회장' }] },
  {
    id: '5', label: '5기', members: [
      { id: 'lim-seonghyeok', name: '임성혁', role: '회장', githubUrl: 'https://github.com/orqan137', linkedinUrl: 'https://www.linkedin.com/in/seonghyuk-yim-99908a386/' },
      { id: 'cho-daein', name: '조대인', role: '부회장', githubUrl: 'https://github.com/virtu0427', linkedinUrl: 'https://www.linkedin.com/in/%EB%8C%80%EC%9D%B8-%EC%A1%B0-a60ab3372/' },
      { id: 'heo-wan', name: '허완', role: '총무', githubUrl: 'https://github.com/hodu26', linkedinUrl: 'https://www.linkedin.com/in/%EC%99%84-%ED%97%88-2a4642310/' },
      { id: 'noh-hyeongjun', name: '노형준', role: '학습부장', githubUrl: 'https://github.com/NOHHYEONGJUN', linkedinUrl: 'https://www.linkedin.com/in/nohhyeongjun/' },
      { id: 'choi-hongseok', name: '최홍석', role: '홍보부장', githubUrl: 'https://github.com/Hongttochi', linkedinUrl: 'https://www.linkedin.com/in/hongseok-choi-089b23302/' },
    ],
  },
  { id: '4', label: '4기', members: [{ id: 'choi-daeun', name: '최다은', role: '회장', githubUrl: 'https://github.com/Ddaaan' }] },
  { id: '3', label: '3기', members: [{ id: 'ok-seungheon', name: '옥승헌', role: '회장' }] },
  { id: '2', label: '2기', members: [{ id: 'shin-myeongsu', name: '신명수', role: '회장', githubUrl: 'https://github.com/dampers', linkedinUrl: 'https://www.linkedin.com/in/%EB%AA%85%EC%88%98-%EC%8B%A0-3aa7a0257/' }] },
  { id: '1', label: '1기', members: [{ id: 'kim-eunseok', name: '김은석', role: '회장', linkedinUrl: 'https://www.linkedin.com/in/eunseok-kim-64024b204/' }] },
]
