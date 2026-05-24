import { isAxiosError } from 'axios'
import client from './client'

export type AttachmentUploadResponse = {
  attachmentId: number
  originalName: string
  contentType: string
  fileSize: number
  url: string
  status: 'TEMP' | 'ACTIVE' | 'DELETED' | 'ORPHANED'
}

function upload(path: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return client.post<AttachmentUploadResponse>(path, formData)
    .then((response) => response.data)
    .catch((error) => {
      if (isAxiosError(error) && error.response?.status === 413) {
        throw new Error('첨부 파일 용량이 너무 큽니다. 이미지를 줄인 뒤 다시 시도해주세요.')
      }
      if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new Error('이미지 첨부 권한이 없습니다. 로그인 상태를 확인한 뒤 다시 시도해주세요.')
      }
      throw error
    })
}

export const attachmentsApi = {
  uploadImage: (file: File) => upload('/api/attachments/images', file),
  uploadFile: (file: File) => upload('/api/attachments/files', file),
}
