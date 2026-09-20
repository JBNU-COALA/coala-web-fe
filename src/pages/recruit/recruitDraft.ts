import type { RecruitCategory, RecruitItem, RecruitPostPayload, RecruitStatus } from '../../shared/api/recruits'

export type RecruitRoleDraft = { key: string; label: string; max: number | '' }

export type RecruitDraft = {
  title: string
  shortDesc: string
  category: RecruitCategory
  status?: RecruitStatus
  roles: RecruitRoleDraft[]
  techStack: string
  meetingType: string
  expectedDuration: string
  tags: string
  detailContent: string
  processList: string
}

const splitList = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
const paragraphs = (value: string) => value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)

export const itemToDraft = (item: RecruitItem): RecruitDraft => ({
  ...item,
  roles: item.roles.map((role, index) => ({ key: `role-${index}`, label: role.label, max: role.max })),
  techStack: item.techStack.join(', '),
  tags: item.tags.join(', '),
  detailContent: item.detailContent.join('\n\n'),
  processList: item.processList.join('\n'),
})

export function buildRecruitPayload(draft: RecruitDraft): RecruitPostPayload {
  const roles = draft.roles.map((role) => ({ label: role.label.trim(), max: Number(role.max) }))
  const payload: RecruitPostPayload = {
    title: draft.title.trim(), shortDesc: draft.shortDesc.trim(), category: draft.category,
    status: draft.status, roles, techStack: splitList(draft.techStack),
    meetingType: draft.meetingType.trim() || '협의 후 결정',
    expectedDuration: draft.expectedDuration.trim() || '협의 후 결정',
    tags: splitList(draft.tags).map((tag) => tag.startsWith('#') ? tag : `#${tag}`),
    detailContent: paragraphs(draft.detailContent),
    processList: draft.processList.split('\n').map((line) => line.trim()).filter(Boolean),
  }
  if (!payload.title || payload.title.length > 150) throw new Error('제목은 1~150자로 입력해 주세요.')
  if (!payload.shortDesc || payload.shortDesc.length > 300) throw new Error('한 줄 소개는 1~300자로 입력해 주세요.')
  if (!roles.length || roles.length > 20 || roles.some((role) => !role.label || role.label.length > 80 || !Number.isInteger(role.max) || role.max < 1 || role.max > 200))
    throw new Error('모집 역할은 1~20개, 역할별 인원은 1~200명으로 입력해 주세요.')
  if (new Set(roles.map((role) => role.label)).size !== roles.length) throw new Error('같은 모집 역할을 중복해서 입력할 수 없습니다.')
  if (!payload.detailContent.length || payload.detailContent.length > 100 || payload.detailContent.some((text) => text.length > 2000))
    throw new Error('모집 소개를 입력해 주세요. 문단은 빈 줄로 구분하며 각 문단은 2,000자 이내입니다.')
  if (payload.techStack.length > 30 || payload.techStack.some((value) => value.length > 80)) throw new Error('기술 스택은 30개 이하, 각 80자 이내로 입력해 주세요.')
  if (payload.tags.length > 20 || payload.tags.some((value) => value.length > 50)) throw new Error('태그는 20개 이하, 각 50자 이내로 입력해 주세요.')
  if (payload.meetingType.length > 150 || payload.expectedDuration.length > 80) throw new Error('진행 방식은 150자, 예상 기간은 80자 이내로 입력해 주세요.')
  if (payload.processList.length > 30 || payload.processList.some((value) => value.length > 255)) throw new Error('진행 프로세스는 30개 이하, 각 255자 이내로 입력해 주세요.')
  return payload
}
