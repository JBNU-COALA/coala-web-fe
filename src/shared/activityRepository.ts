import {
  activityToday,
  shiftDate,
  type ActivityData,
  type StudyRecord,
  type ActivityMemberOption,
  type StudyGroup
} from './activity'
import client from './api/client'

export async function searchActivityMembers(query: string, signal?: AbortSignal): Promise<ActivityMemberOption[]> {
  return (await client.get<ActivityMemberOption[]>('/api/study/members', { params: { query }, signal })).data
}

export async function loadActivityGroups(): Promise<StudyGroup[]> {
  return (await client.get<StudyGroup[]>('/api/study/groups')).data
}

export async function createActivityGroup(recruitId: string, name: string) {
  return (
    await client.post<StudyGroup>('/api/study/groups', { recruitId, name })
  ).data
}

export async function loadActivityData(
  anchor = activityToday(),
  recordId?: string
): Promise<ActivityData> {
  const records = (
    await client.get<StudyRecord[]>('/api/study/records', {
      params: { from: shiftDate(anchor, -42), to: shiftDate(anchor, 42) }
    })
  ).data
  if (recordId && !records.some((record) => record.id === recordId))
    records.push(
      (
        await client.get<StudyRecord>(
          `/api/study/records/${encodeURIComponent(recordId)}`
        )
      ).data
    )
  try {
    return { groups: await loadActivityGroups(), records }
  } catch {
    return { groups: [], records, groupsError: '조 목록을 불러오지 못했습니다.' }
  }
}

export async function saveActivityRecord(
  record: StudyRecord,
  editing: boolean
): Promise<StudyRecord> {
  const payload = {
    groupId: record.groupId ? Number(record.groupId) : null,
    title: record.title,
    date: record.date,
    content: record.content,
    version: record.version,
    attachmentIds: record.photos?.map((photo) => photo.attachmentId),
    attendance: record.attendance.map(({ userId, status }) => ({
      userId: Number(userId),
      status
    }))
  }
  try {
    return (
      editing
        ? await client.patch<StudyRecord>(
            `/api/study/records/${encodeURIComponent(record.id)}`,
            payload
          )
        : await client.post<StudyRecord>('/api/study/records', payload)
    ).data
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status
    throw new Error(
      status === 400
        ? '입력값을 확인해 주세요. 날짜는 한국 시간 기준 오늘까지, 제목은 120자, 본문은 20,000자까지 입력할 수 있습니다.'
        : status === 401
          ? '로그인이 만료되었습니다. 작성 내용을 보관한 뒤 다시 로그인해 주세요.'
          : status === 409
            ? '다른 사람이 먼저 수정했습니다. 작성 내용을 보관한 뒤 새로 불러와 주세요.'
            : status === 403
              ? '활동을 수정할 권한이 없습니다.'
              : '기록을 저장하지 못했습니다. 작성 내용은 화면에 남아 있습니다.'
    )
  }
}
export async function loadActivityEditorData(recordId?: string): Promise<ActivityData> {
  // Record history is not needed to start a new post.
  const records = recordId
    ? [(await client.get<StudyRecord>(`/api/study/records/${encodeURIComponent(recordId)}`)).data]
    : []
  try {
    return { records, groups: await loadActivityGroups() }
  } catch {
    return { records, groups: [], groupsError: '조 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }
}

export async function deleteActivityRecord(record: StudyRecord) {
  await client.delete(`/api/study/records/${encodeURIComponent(record.id)}`, {
    params: { version: record.version }
  })
}
