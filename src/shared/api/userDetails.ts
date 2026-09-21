import type { UserData } from './auth'

export type UserDetailsDraft = {
  name: string
  nickname: string
  birthDate: string
  gender: NonNullable<UserData['gender']>
  department: string
  lab: string
  studentId: string
  grade: string
  githubId: string
  baekjoonId: string
  linkedinUrl: string
  academicStatus: UserData['academicStatus']
}

export type UserDetailsPayload = Omit<UserDetailsDraft, 'grade' | 'birthDate'> & {
  grade: number | null
  birthDate: string | null
}

export function userDetailsDraft(user?: Partial<UserData> | null): UserDetailsDraft {
  return {
    name: user?.name ?? '', nickname: user?.nickname ?? '', birthDate: user?.birthDate ?? '',
    gender: user?.gender ?? 'PREFER_NOT_TO_SAY', department: user?.department ?? '',
    lab: user?.lab ?? '', studentId: user?.studentId ?? '', grade: user?.grade?.toString() ?? '',
    githubId: user?.githubId ?? '', baekjoonId: user?.baekjoonId ?? '',
    linkedinUrl: user?.linkedinUrl ?? '', academicStatus: user?.academicStatus ?? 'ENROLLED',
  }
}

export function userDetailsPayload(draft: UserDetailsDraft): UserDetailsPayload {
  if (![draft.name, draft.department, draft.studentId, draft.githubId].every((value) => value.trim())) {
    throw new Error('이름, 학과, 학번, GitHub ID를 입력해 주세요.')
  }
  if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(draft.githubId.trim())) throw new Error('GitHub ID만 입력해 주세요.')
  if (draft.grade && !/^[1-6]$/.test(draft.grade)) throw new Error('학년은 1~6 사이로 선택해 주세요.')
  if (!/^[A-Za-z0-9_]*$/.test(draft.baekjoonId.trim())) throw new Error('백준 ID를 확인해 주세요.')
  if (draft.linkedinUrl.trim()) {
    try {
      const url = new URL(draft.linkedinUrl.trim())
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    } catch { throw new Error('올바른 LinkedIn 주소를 입력해 주세요.') }
  }
  return { ...draft, name: draft.name.trim(), nickname: draft.nickname.trim(),
    department: draft.department.trim(), lab: draft.lab.trim(), studentId: draft.studentId.trim(),
    githubId: draft.githubId.trim(), baekjoonId: draft.baekjoonId.trim(), linkedinUrl: draft.linkedinUrl.trim(),
    grade: draft.grade ? Number(draft.grade) : null, birthDate: draft.birthDate || null }
}
