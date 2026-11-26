import axios from 'axios'

export function featureError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) return '로그인이 필요합니다. 다시 로그인해 주세요.'
    if (status === 403) return '권한 또는 이메일 인증 상태를 확인해 주세요.'
    if (status === 404) return '요청한 자료를 찾을 수 없습니다.'
    if (status === 409) return '다른 변경 사항이 있습니다. 새로고침 후 다시 시도해 주세요.'
    if (status === 429) return '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
    if (status === 400) return '입력 항목과 선택 값을 확인해 주세요.'
    if (status === 503) return '실습 서버가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.'
  }
  return '자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}
