import type { IconName } from '../../shared/ui/Icon'

export const adminDestinations = [
  { id: 'stats', label: '운영 현황', icon: 'award-color', group: '운영' },
  { id: 'analytics', label: '사용 분석', icon: 'award-color', group: '운영' },
  { id: 'ai', label: '에이전트 검수', icon: 'file-color', group: '운영' },
  { id: 'audit', label: '작업 기록', icon: 'file-color', group: '운영' },
  { id: 'users', label: '회원 관리', icon: 'profile-color', group: '회원 · 커뮤니티' },
  { id: 'boards', label: '게시판 관리', icon: 'copy-color', group: '회원 · 커뮤니티' },
  { id: 'posts', label: '게시글 관리', icon: 'message-color', group: '회원 · 커뮤니티' },
  { id: 'comments', label: '댓글 관리', icon: 'message-color', group: '회원 · 커뮤니티' },
  { id: 'employment', label: '취업 후기 관리', icon: 'file-color', group: '회원 · 커뮤니티' },
  { id: 'activity', label: '활동 관리', icon: 'calendar-color', group: '회원 · 커뮤니티' },
  { id: 'reports', label: '신고 처리', icon: 'siren-color', group: '회원 · 커뮤니티' },
  { id: 'education', label: '교육 관리', icon: 'file-color', group: '교육 · 자료' },
  { id: 'archive', label: '자료실 관리', icon: 'file-color', group: '교육 · 자료' },
  { id: 'banners', label: '배너 관리', icon: 'eye-color', group: '사이트 · 서비스' },
  { id: 'about', label: '소개 관리', icon: 'pencil-color', group: '사이트 · 서비스' },
  { id: 'services', label: '서비스 관리', icon: 'server-color', group: '사이트 · 서비스' },
  { id: 'instances', label: '인스턴스 관리', icon: 'server-color', group: '사이트 · 서비스' },
  { id: 'domains', label: '도메인 관리', icon: 'globe-color', group: '사이트 · 서비스' },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: IconName; group: string }>
export type AdminDestination = typeof adminDestinations[number]['id']
