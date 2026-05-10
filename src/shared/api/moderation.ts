import client from './client'

export type ModerationTargetType = 'POST' | 'COMMENT' | 'USER'

export type ReportReasonType =
  | 'ABUSE'
  | 'SEXUAL_CONTENT'
  | 'SPAM'
  | 'PERSONAL_INFO'
  | 'FALSE_INFORMATION'
  | 'OTHER'

export type ReportStatus = 'PENDING' | 'AUTO_HIDDEN' | 'ACCEPTED' | 'REJECTED'

export type ReportResponse = {
  id: number
  reporterId: number
  targetType: ModerationTargetType
  targetId: number
  reasonType: ReportReasonType
  reasonDetail?: string | null
  status: ReportStatus
  createdAt: string
  handledAt?: string | null
}

export const moderationApi = {
  report: (data: {
    targetType: ModerationTargetType
    targetId: number
    reasonType: ReportReasonType
    reasonDetail?: string
  }) => client.post<ReportResponse>('/api/reports', data).then((response) => response.data),
}
