import { isAxiosError } from 'axios'

export function mutationError(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback
  const code = error.response?.data?.errorCode
  if (code === 'EMAIL_NOT_VERIFIED') return '이메일 인증을 완료한 뒤 다시 시도해 주세요.'
  if (code === 'USER_SANCTIONED') return '현재 계정은 글 작성이 제한되어 있습니다.'
  switch (error.response?.status) {
    case 400: return '입력한 항목의 형식과 길이를 확인해 주세요. 작성 내용은 유지됩니다.'
    case 401: return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
    case 403: return '이 작업을 수행할 권한이 없습니다.'
    case 404: return '대상을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.'
    case 409: return '연결된 활동이나 승인된 지원자가 있어 변경할 수 없거나, 다른 사람이 먼저 수정했습니다.'
    default: return fallback
  }
}
