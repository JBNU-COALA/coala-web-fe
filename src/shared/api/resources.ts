import client from './client'

export type ResourceItem = {
  resourceId: number
  postId: number
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: string
}

export type CreateResourceRequest = {
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export const resourcesApi = {
  getResources: (postId: number) =>
    client.get<ResourceItem[]>(`/api/posts/${postId}/resources`).then((r) => r.data),

  createResource: (postId: number, data: CreateResourceRequest) =>
    client.post<ResourceItem>(`/api/posts/${postId}/resources`, data).then((r) => r.data),

  deleteResource: (postId: number, resourceId: number) =>
    client.delete(`/api/posts/${postId}/resources/${resourceId}`),
}
