export const routes = {
  home: '/',
  community: {
    root: '/community',
    board: '/community/board',
    boardPost: (boardId: string | number, postId: string | number) =>
      `/community/board/${boardId}/posts/${postId}`,
    boardPostNew: '/community/board/posts/new',
    boardPostEditor: (boardId: string | number, postId: string | number) =>
      `/community/board/${boardId}/posts/${postId}/editor`,
    info: '/community/info',
    infoPost: (boardId: string | number, infoId: string | number) =>
      `/community/info/${boardId}/posts/${infoId}`,
    infoPostNew: '/community/info/posts/new',
    infoPostEditor: (boardId: string | number, infoId: string | number) =>
      `/community/info/${boardId}/posts/${infoId}/editor`,
    recruit: '/community/recruit',
    recruitNotice: (recruitId: string) => `/community/recruit/notices/${recruitId}`,
    recruitNoticeNew: '/community/recruit/notices/new',
    recruitApplicationNew: (recruitId: string) =>
      `/community/recruit/applications/new?id=${encodeURIComponent(recruitId)}`,
  },
  services: {
    root: '/services',
    officialInstance: '/services/official/instance',
    user: '/services/user',
    userDetail: (serviceId: string) => `/services/user/${serviceId}`,
  },
  users: {
    root: '/users',
    detail: (userId: string | number) => `/users/${userId}`,
  },
} as const
