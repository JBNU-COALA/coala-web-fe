export type InstanceType = 'micro' | 'medium'

export type ApplyStatus = 'pending' | 'approved' | 'rejected'

export type JcloudApplication = {
  id: string
  applicantName: string
  studentId: string
  keyEmail?: string
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
  { id: '6m', label: '6개월' },
  { id: '1y', label: '1년' },
  { id: 'permanent', label: '영구', description: '메일 보내주세요 : coala.jbnu@gmail.com', disabled: true },
]

export const statusMeta: Record<ApplyStatus, { label: string; colorClass: string }> = {
  pending: { label: '검토 중', colorClass: 'status--pending' },
  approved: { label: '승인', colorClass: 'status--approved' },
  rejected: { label: '반려', colorClass: 'status--rejected' },
}
