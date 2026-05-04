import type { InquiryItem, JcloudApplication } from '../pages/service/serviceData'

export const mockApplications: JcloudApplication[] = [
  {
    id: 'jc-001',
    applicantName: '김코알라',
    studentId: '20211234',
    keyEmail: 'coala.member@example.com',
    instanceType: 'medium',
    purpose: '캡스톤 프로젝트 API 서버 배포',
    duration: '6개월',
    requestedAt: '2026-03-10',
    approvedAt: '2026-03-12',
    status: 'approved',
    adminNote: '승인되었습니다. 접속 키와 안내 메일을 확인하세요.',
    attachedFiles: [
      { name: 'jc-001-connection-info.pdf', size: '128 KB', uploadedAt: '2026-03-12' },
    ],
    specs: { cpu: '4 vCPU', ram: '4 GB RAM', disk: '10 GB Disk' },
  },
  {
    id: 'jc-002',
    applicantName: '박알고',
    studentId: '20220987',
    keyEmail: 'algorithm@example.com',
    instanceType: 'micro',
    purpose: '동아리 스터디 실습 서버',
    duration: '1년',
    requestedAt: '2026-03-28',
    status: 'pending',
    specs: { cpu: '2 vCPU', ram: '2 GB RAM', disk: '10 GB Disk' },
  },
]

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

