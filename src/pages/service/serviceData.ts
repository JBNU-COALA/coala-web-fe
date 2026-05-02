export type InstanceType = 'micro' | 'small' | 'medium' | 'large' | 'gpu'

export type ApplyStatus = 'pending' | 'approved' | 'rejected'

export type JcloudApplication = {
  id: string
  applicantName: string
  studentId: string
  instanceType: InstanceType
  purpose: string
  duration: string
  requestedAt: string
  approvedAt?: string
  status: ApplyStatus
  adminNote?: string
  attachedFiles?: AttachedFile[]
  specs: InstanceSpec
}

export type InstanceSpec = {
  cpu: string
  ram: string
  disk: string
  gpu?: string
}

export type AttachedFile = {
  name: string
  size: string
  uploadedAt: string
}

export type InquiryItem = {
  id: string
  title: string
  summary: string
  author: string
  createdAt: string
  status: string
  statusClass: string
}

export const instanceTypes: {
  id: InstanceType
  label: string
  description: string
  specs: InstanceSpec
  badge?: string
}[] = [
  {
    id: 'micro',
    label: 't3.micro',
    description: '가벼운 테스트 및 학습용',
    specs: { cpu: '2 vCPU', ram: '1 GB', disk: '20 GB SSD' },
  },
  {
    id: 'small',
    label: 't3.small',
    description: '소규모 프로젝트 및 개발 서버',
    specs: { cpu: '2 vCPU', ram: '2 GB', disk: '40 GB SSD' },
  },
  {
    id: 'medium',
    label: 't3.medium',
    description: '중규모 웹 서비스 운영',
    specs: { cpu: '2 vCPU', ram: '4 GB', disk: '80 GB SSD' },
    badge: '인기',
  },
  {
    id: 'large',
    label: 't3.large',
    description: '데이터 처리 및 백엔드 서버',
    specs: { cpu: '2 vCPU', ram: '8 GB', disk: '160 GB SSD' },
  },
  {
    id: 'gpu',
    label: 'g4dn.xlarge',
    description: 'AI / ML 모델 학습 및 추론',
    specs: {
      cpu: '4 vCPU',
      ram: '16 GB',
      disk: '125 GB SSD',
      gpu: 'NVIDIA T4 16GB',
    },
    badge: 'GPU',
  },
]

export const durationOptions = [
  { id: '1w', label: '1주일' },
  { id: '1m', label: '1개월' },
  { id: '3m', label: '3개월' },
  { id: '6m', label: '6개월' },
]

export const mockApplications: JcloudApplication[] = [
  {
    id: 'jc-001',
    applicantName: '김코알라',
    studentId: '20211234',
    instanceType: 'medium',
    purpose: '캡스톤 디자인 프로젝트 백엔드 서버 구축 및 배포 테스트',
    duration: '3개월',
    requestedAt: '2026-03-10',
    approvedAt: '2026-03-12',
    status: 'approved',
    adminNote: '승인되었습니다. 첨부 파일에서 접속 정보를 확인하세요.',
    attachedFiles: [
      { name: 'jc-001-connection-info.pdf', size: '128 KB', uploadedAt: '2026-03-12' },
    ],
    specs: { cpu: '2 vCPU', ram: '4 GB', disk: '80 GB SSD' },
  },
  {
    id: 'jc-002',
    applicantName: '박알고',
    studentId: '20220987',
    instanceType: 'gpu',
    purpose: '졸업 논문용 딥러닝 모델 학습 (ResNet 기반 이미지 분류)',
    duration: '1개월',
    requestedAt: '2026-03-28',
    status: 'pending',
    specs: { cpu: '4 vCPU', ram: '16 GB', disk: '125 GB SSD', gpu: 'NVIDIA T4 16GB' },
  },
  {
    id: 'jc-003',
    applicantName: '이구조',
    studentId: '20193456',
    instanceType: 'micro',
    purpose: '개인 포트폴리오 사이트 배포',
    duration: '1개월',
    requestedAt: '2026-02-15',
    approvedAt: '2026-02-16',
    status: 'rejected',
    adminNote:
      '현재 micro 인스턴스 재고가 부족합니다. small 이상으로 재신청 부탁드립니다.',
    specs: { cpu: '2 vCPU', ram: '1 GB', disk: '20 GB SSD' },
  },
  {
    id: 'jc-004',
    applicantName: '최네트',
    studentId: '20231111',
    instanceType: 'small',
    purpose: 'Node.js 기반 REST API 서버 개발 및 테스트 환경 구성',
    duration: '1개월',
    requestedAt: '2026-04-01',
    status: 'pending',
    specs: { cpu: '2 vCPU', ram: '2 GB', disk: '40 GB SSD' },
  },
]

export const statusMeta: Record<ApplyStatus, { label: string; colorClass: string }> = {
  pending: { label: '검토 중', colorClass: 'status--pending' },
  approved: { label: '승인', colorClass: 'status--approved' },
  rejected: { label: '반려', colorClass: 'status--rejected' },
}

export const inquiryItems: InquiryItem[] = [
  {
    id: 'inq-001',
    title: 'GPU 인스턴스는 최대 몇 주까지 대여할 수 있나요?',
    summary: '졸업 프로젝트 모델 학습 일정 때문에 GPU 인스턴스 연장 가능 여부를 확인하고 싶습니다.',
    author: '박알고',
    createdAt: '2026.04.28',
    status: '답변 완료',
    statusClass: 'status--approved',
  },
  {
    id: 'inq-002',
    title: '배포용 포트를 외부에서 열 수 있는지 궁금합니다.',
    summary: '캡스톤 데모 기간에만 API 서버를 외부 테스트 링크로 공유하려고 합니다.',
    author: '최네트',
    createdAt: '2026.04.25',
    status: '검토 중',
    statusClass: 'status--pending',
  },
  {
    id: 'inq-003',
    title: '팀 프로젝트 인스턴스 신청자는 팀장만 가능한가요?',
    summary: '프로젝트 팀원이 대신 신청해도 되는지, 승인 후 접속 정보 공유 방식이 궁금합니다.',
    author: '김코알라',
    createdAt: '2026.04.21',
    status: '답변 완료',
    statusClass: 'status--approved',
  },
]
