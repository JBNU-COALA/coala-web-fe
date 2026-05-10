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
  return client.post<AttachmentUploadResponse>(path, formData).then((response) => response.data)
}

export const attachmentsApi = {
  uploadImage: (file: File) => upload('/api/attachments/images', file),
  uploadFile: (file: File) => upload('/api/attachments/files', file),
}
