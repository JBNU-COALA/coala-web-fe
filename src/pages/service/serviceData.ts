export type InstanceType = 'micro' | 'medium'

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
  specs: InstanceSpec
}[] = [
  {
    id: 'micro',
    label: 'micro',
    specs: { cpu: '2 vCPU', ram: '2 GB RAM', disk: '10 GB Disk' },
  },
  {
    id: 'medium',
    label: 'medium',
    specs: { cpu: '4 vCPU', ram: '4 GB RAM', disk: '10 GB Disk' },
  },
]

export const durationOptions = [
  { id: '1w', label: '1주' },
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
    purpose: '캡스톤 프로젝트 API 서버 배포',
    duration: '3개월',
    requestedAt: '2026-03-10',
    approvedAt: '2026-03-12',
    status: 'approved',
    adminNote: '승인되었습니다. 첨부 파일에서 접속 정보를 확인하세요.',
    attachedFiles: [
      { name: 'jc-001-connection-info.pdf', size: '128 KB', uploadedAt: '2026-03-12' },
    ],
    specs: { cpu: '4 vCPU', ram: '4 GB RAM', disk: '10 GB Disk' },
  },
  {
    id: 'jc-002',
    applicantName: '박알고',
    studentId: '20220987',
    instanceType: 'micro',
    purpose: '동아리 스터디 실습 서버',
    duration: '1개월',
    requestedAt: '2026-03-28',
    status: 'pending',
    specs: { cpu: '2 vCPU', ram: '2 GB RAM', disk: '10 GB Disk' },
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
    title: '인스턴스 기간 연장 문의',
    summary: '프로젝트 일정 변경으로 사용 기간 연장이 가능한지 문의합니다.',
    author: '김코알라',
    createdAt: '2026.04.28',
    status: '답변 완료',
    statusClass: 'status--approved',
  },
  {
    id: 'inq-002',
    title: '포트 개방 문의',
    summary: 'API 서버 테스트를 위해 외부 접속 포트 설정이 필요한지 확인하고 싶습니다.',
    author: '박알고',
    createdAt: '2026.04.25',
    status: '검토 중',
    statusClass: 'status--pending',
  },
]
