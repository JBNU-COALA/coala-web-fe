/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import { attachmentsApi } from '../../shared/api/attachments'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { usersApi, type ActivityMember, type AvatarTone, type UserAward, type UserProfileLink } from '../../shared/api/users'
import { Icon } from '../../shared/ui/Icon'

type ProfileTab = 'overview' | 'activity' | 'awards' | 'posts'
type AuthoredContentKind = 'board' | 'info' | 'recruit'

type AuthoredContentItem = {
  id: string
  kind: AuthoredContentKind
  title: string
  excerpt: string
  createdAt: string
  viewCount?: number
}

const contentKindLabel: Record<AuthoredContentKind, string> = {
  board: '게시판',
  info: '정보공유',
  recruit: '모집',
}

const genderLabel = {
  MALE: '남성',
  FEMALE: '여성',
  OTHER: '기타',
  PREFER_NOT_TO_SAY: '응답 안 함',
} as const

const academicStatusLabel = {
  PROFESSOR: '교수',
  ASSISTANT: '조교',
  ENROLLED: '재학생',
  ON_LEAVE: '휴학생',
  GRADUATED: '졸업생',
  GENERAL: '일반',
} as const

const awardCategoryLabel: Record<UserAward['category'], string> = {
  competition: '대회',
  hackathon: '해커톤',
  research: '연구',
  club: '동아리',
}

const PROFILE_PHOTO_MAX_SIZE = 3 * 1024 * 1024

const avatarToneOptions: { id: AvatarTone; label: string }[] = [
  { id: 'mint', label: 'Mint' },
  { id: 'sky', label: 'Sky' },
  { id: 'amber', label: 'Amber' },
  { id: 'slate', label: 'Slate' },
  { id: 'sand', label: 'Sand' },
  { id: 'rose', label: 'Rose' },
]

type EditableGender = keyof typeof genderLabel
type EditableAcademicStatus = keyof typeof academicStatusLabel

type AccountDraft = {
  name: string
  email: string
  studentId: string
  githubId: string
  lab: string
  gender: EditableGender
  academicStatus: EditableAcademicStatus
  linkedinUrl: string
}

type ProfileCustomizationDraft = {
  avatarTone: AvatarTone
  headline: string
  profileImageUrl: string
  links: UserProfileLink[]
}

const defaultAccountDraft: AccountDraft = {
  name: '',
  email: '',
  studentId: '',
  githubId: '',
  lab: '',
  gender: 'PREFER_NOT_TO_SAY',
  academicStatus: 'ENROLLED',
  linkedinUrl: '',
}

const defaultCustomizationDraft: ProfileCustomizationDraft = {
  avatarTone: 'mint',
  headline: '',
  profileImageUrl: '',
  links: [],
}

const createBlankAward = (): UserAward => ({
  awardId: `award-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  organizer: '',
  rank: '',
  awardedAt: new Date().toISOString().slice(0, 10),
  category: 'competition',
  description: '',
  credentialUrl: '',
})

const fallbackProfileMember: ActivityMember = {
  id: '0',
  name: '사용자',
  initials: '사',
  tone: 'slate',
  role: '회원',
  grade: '1학년',
  lab: '코알라',
  githubHandle: 'coala',
  githubUrl: 'https://github.com',
  focus: '코알라에서 함께 개발하고 있습니다.',
  bio: '',
  activityNote: '',
  awardNote: '',
  recentCommit: '-',
  sharedRepos: [],
  logs: [],
  solvedHandle: '',
  solvedTier: 'unrated',
  solvedCount: 0,
  githubCommits: 0,
  totalPoints: 0,
  awards: [],
}

type ProfilePageProps = {
  profileUserId?: string
}

function apiPostToAuthoredContent(post: PostListItem): AuthoredContentItem {
  const boardName = post.boardName ?? ''
  const kind: AuthoredContentKind =
    boardName.toLowerCase().includes('recruit') || boardName.includes('모집')
      ? 'recruit'
      : 'board'

  return {
    id: `api-${post.boardId}-${post.postId}`,
    kind,
    title: post.title,
    excerpt: post.content.replace(/<[^>]+>/g, '').slice(0, 100),
    createdAt: post.createdAt,
    viewCount: post.viewCount,
  }
}

function formatDate(dateStr: string) {
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('ko-KR')
}

function formatAwardDate(dateStr: string) {
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
}

function memberLogsToAuthoredContents(member: ActivityMember): AuthoredContentItem[] {
  return member.logs.map((log) => ({
    id: `log-${member.id}-${log.id}`,
    kind: log.type === 'note' ? 'info' : log.type === 'release' ? 'recruit' : 'board',
    title: log.title,
    excerpt: `${log.repository} · ${log.description}`,
    createdAt: log.timeLabel,
  }))
}

function firstNonBlank(...values: Array<string | null | undefined>) {
  return values.find((value) => value !== null && value !== undefined && value.trim() !== '') ?? ''
}

function normalizeGithubHandle(value?: string | null) {
  return value?.trim().replace(/^@+/, '') ?? ''
}

function getGithubProfileUrl(value?: string | null) {
  const handle = normalizeGithubHandle(value)
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(handle)) return null
  return `https://github.com/${encodeURIComponent(handle)}`
}

function getMemberCustomization(member: ActivityMember): ProfileCustomizationDraft {
  return {
    avatarTone: member.customization?.avatarTone ?? member.tone,
    headline: member.customization?.headline ?? '',
    profileImageUrl: member.customization?.profileImageUrl ?? '',
    links: member.customization?.links ?? [],
  }
}

export function ProfilePage({ profileUserId }: ProfilePageProps) {
  const { isLoggedIn, user, updateUser } = useAuth()
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('코알라에서 함께 개발하고 있습니다.')
  const [activityNote, setActivityNote] = useState('')
  const [awardNote, setAwardNote] = useState('')
  const [sharedReposInput, setSharedReposInput] = useState('')
  const [accountDraft, setAccountDraft] = useState<AccountDraft>(defaultAccountDraft)
  const [sharedRepoDrafts, setSharedRepoDrafts] = useState<string[]>([])
  const [newSharedRepo, setNewSharedRepo] = useState('')
  const [awardDrafts, setAwardDrafts] = useState<UserAward[]>([])
  const [customizationDraft, setCustomizationDraft] = useState<ProfileCustomizationDraft>(defaultCustomizationDraft)
  const [newProfileLink, setNewProfileLink] = useState<UserProfileLink>({ label: '', url: '' })
  const [profileSaveState, setProfileSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [authoredContents, setAuthoredContents] = useState<AuthoredContentItem[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false)
  const [publicMembers, setPublicMembers] = useState<ActivityMember[]>([])
  const [profileDetail, setProfileDetail] = useState<ActivityMember | null>(null)

  const effectiveProfileUserId = profileUserId ?? (user ? String(user.id) : '1')
  const matchedPublicMember = publicMembers.find((member) => member.id === effectiveProfileUserId)
  const publicMember =
    profileDetail ??
    matchedPublicMember ??
    (profileUserId ? null : publicMembers[0]) ??
    fallbackProfileMember
  const profileMember = publicMember
  const isOwnProfile = Boolean(profileMember.isMe) || Boolean(user && String(user.id) === effectiveProfileUserId)
  const canEdit = isOwnProfile

  const displayName = isOwnProfile ? user?.name ?? profileMember.name ?? user?.email ?? '사용자' : profileMember.name
  const displayRole = isOwnProfile && user?.academicStatus
    ? `${academicStatusLabel[user.academicStatus]} · ${user.grade ?? '-'}학년`
    : `${profileMember.grade} · ${profileMember.role}`
  const profileAffiliation = isOwnProfile
    ? firstNonBlank(user?.lab, user?.department, profileMember.lab, '소속 미입력')
    : profileMember.lab
  const initial = displayName.charAt(0)
  const joinedAt = isOwnProfile && user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : profileMember.recentCommit.replace(' 가입', '')
  const profileGithub = isOwnProfile
    ? firstNonBlank(user?.githubId, profileMember.githubHandle)
    : firstNonBlank(profileMember.githubHandle)
  const profileGithubHandle = normalizeGithubHandle(profileGithub)
  const profileGithubLabel = profileGithubHandle ? `@${profileGithubHandle}` : '-'
  const profileGithubUrl = getGithubProfileUrl(profileGithub)
  const profileCustomization = getMemberCustomization(profileMember)
  const displayAvatarTone = editing ? customizationDraft.avatarTone : profileCustomization.avatarTone
  const profileImageUrl = editing ? customizationDraft.profileImageUrl : profileCustomization.profileImageUrl
  const displayProfileImage = resolveApiAssetUrl(profileImageUrl || profilePhoto || '')
  const profileLinks = editing ? customizationDraft.links : profileCustomization.links
  const profileAwards = editing ? awardDrafts : profileMember.awards
  const profileSharedRepos = editing
    ? sharedRepoDrafts.map((repo) => repo.trim()).filter(Boolean)
    : sharedReposInput
      .split(/[\n,]/)
      .map((repo) => repo.trim())
      .filter(Boolean)
  const profilePhotoStorageKey = `coala-profile-photo:${effectiveProfileUserId}`

  useEffect(() => {
    if (typeof window === 'undefined') return
    setProfilePhoto(window.localStorage.getItem(profilePhotoStorageKey))
    setPhotoError(null)
  }, [profilePhotoStorageKey])

  useEffect(() => {
    if (!isLoggedIn) {
      setPublicMembers([])
      return
    }

    let active = true

    usersApi.getUsers()
      .then((members) => {
        if (active) setPublicMembers(members)
      })
      .catch(() => {
        if (active) setPublicMembers([])
      })

    return () => {
      active = false
    }
  }, [isLoggedIn])

  useEffect(() => {
    const numericProfileUserId = Number(effectiveProfileUserId)
    if (!Number.isSafeInteger(numericProfileUserId) || numericProfileUserId <= 0) {
      setProfileDetail(null)
      return
    }

    let active = true

    usersApi.getUser(numericProfileUserId)
      .then((member) => {
        if (active) setProfileDetail(member)
      })
      .catch(() => {
        if (active) setProfileDetail(null)
      })

    return () => {
      active = false
    }
  }, [effectiveProfileUserId])

  useEffect(() => {
    setEditing(false)
    setProfileSaveState('idle')
    setBio(firstNonBlank(profileMember.bio, canEdit ? '코알라에서 함께 개발하고 있습니다.' : profileMember.focus))
    setActivityNote(profileMember.activityNote ?? '')
    setAwardNote(profileMember.awardNote ?? '')
    setSharedReposInput(profileMember.sharedRepos.join('\n'))
    setSharedRepoDrafts(profileMember.sharedRepos)
    setNewSharedRepo('')
    setAwardDrafts(profileMember.awards)
    setCustomizationDraft(getMemberCustomization(profileMember))
    setNewProfileLink({ label: '', url: '' })
    setAccountDraft({
      name: user?.name ?? profileMember.name ?? '',
      email: user?.email ?? '',
      studentId: user?.studentId ?? '',
      githubId: firstNonBlank(user?.githubId, profileMember.githubHandle),
      lab: firstNonBlank(user?.lab, profileMember.lab),
      gender: user?.gender ?? 'PREFER_NOT_TO_SAY',
      academicStatus: user?.academicStatus ?? 'ENROLLED',
      linkedinUrl: user?.linkedinUrl ?? '',
    })
  }, [
    canEdit,
    effectiveProfileUserId,
    profileMember.activityNote,
    profileMember.awardNote,
    profileMember.bio,
    profileMember.focus,
    profileMember.githubHandle,
    profileMember.lab,
    profileMember.name,
    profileMember.sharedRepos,
    profileMember.awards,
    profileMember.customization,
    profileMember.tone,
    user?.academicStatus,
    user?.email,
    user?.gender,
    user?.githubId,
    user?.lab,
    user?.linkedinUrl,
    user?.name,
    user?.studentId,
  ])

  useEffect(() => {
    if (!isOwnProfile || !user) {
      setAuthoredContents(memberLogsToAuthoredContents(profileMember))
      return
    }

    const fetchAuthoredContents = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const apiContents = postsArrays
          .flat()
          .filter((p) => p.userId === user.id)
          .map(apiPostToAuthoredContent)

        setAuthoredContents(
          apiContents.length > 0
            ? apiContents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            : memberLogsToAuthoredContents(profileMember),
        )
      } catch {
        setAuthoredContents(memberLogsToAuthoredContents(profileMember))
      }
    }

    fetchAuthoredContents()
  }, [isOwnProfile, profileMember, user])

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'activity', label: '활동 내역' },
    { id: 'awards', label: '수상 내역' },
    { id: 'posts', label: '작성 내용' },
  ]

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 등록할 수 있습니다.')
      return
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      setPhotoError('프로필 사진은 3MB 이하만 등록할 수 있습니다.')
      return
    }

    setIsUploadingProfilePhoto(true)
    setPhotoError(null)
    try {
      const uploaded = await attachmentsApi.uploadImage(file)
      setCustomizationDraft((current) => ({ ...current, profileImageUrl: uploaded.url }))
      setProfilePhoto(null)
      window.localStorage.removeItem(profilePhotoStorageKey)
      setEditing(true)
      setProfileSaveState('idle')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : '이미지를 업로드하지 못했습니다.')
    } finally {
      setIsUploadingProfilePhoto(false)
    }
  }

  const removeProfilePhoto = () => {
    window.localStorage.removeItem(profilePhotoStorageKey)
    setProfilePhoto(null)
    setCustomizationDraft((current) => ({ ...current, profileImageUrl: '' }))
    setEditing(true)
    setProfileSaveState('idle')
    setPhotoError(null)
  }

  const saveProfile = async () => {
    if (!canEdit) return
    setProfileSaveState('saving')
    try {
      const normalizedRepos = sharedRepoDrafts.map((repo) => repo.trim()).filter(Boolean)
      const normalizedAwards = awardDrafts
        .map((award) => ({
          ...award,
          title: award.title.trim(),
          organizer: award.organizer.trim(),
          rank: award.rank.trim(),
          awardedAt: award.awardedAt.trim(),
          description: award.description.trim(),
          credentialUrl: award.credentialUrl?.trim(),
        }))
        .filter((award) => award.title)
      const normalizedCustomization: ProfileCustomizationDraft = {
        avatarTone: customizationDraft.avatarTone,
        headline: customizationDraft.headline.trim(),
        profileImageUrl: customizationDraft.profileImageUrl.trim(),
        links: customizationDraft.links
          .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
          .filter((link) => link.label && /^https?:\/\//i.test(link.url))
          .slice(0, 5),
      }
      const updated = await usersApi.updateMyProfile({
        name: accountDraft.name.trim(),
        email: accountDraft.email.trim().toLowerCase(),
        studentId: accountDraft.studentId.trim(),
        githubId: normalizeGithubHandle(accountDraft.githubId),
        lab: accountDraft.lab.trim(),
        gender: accountDraft.gender,
        academicStatus: accountDraft.academicStatus,
        linkedinUrl: accountDraft.linkedinUrl.trim(),
        bio,
        activityNote,
        awardNote: JSON.stringify(normalizedAwards),
        sharedRepositories: normalizedRepos.join('\n'),
        customization: JSON.stringify(normalizedCustomization),
      })
      setProfileDetail(updated)
      setPublicMembers((members) => members.map((member) => (member.id === updated.id ? updated : member)))
      setAwardDrafts(updated.awards)
      setSharedRepoDrafts(updated.sharedRepos)
      setSharedReposInput(updated.sharedRepos.join('\n'))
      setCustomizationDraft(getMemberCustomization(updated))
      setNewProfileLink({ label: '', url: '' })
      updateUser({
        name: accountDraft.name.trim(),
        email: accountDraft.email.trim().toLowerCase(),
        studentId: accountDraft.studentId.trim(),
        githubId: normalizeGithubHandle(accountDraft.githubId),
        lab: accountDraft.lab.trim() || null,
        gender: accountDraft.gender,
        academicStatus: accountDraft.academicStatus,
        linkedinUrl: accountDraft.linkedinUrl.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      setEditing(false)
      setProfileSaveState('saved')
    } catch {
      setProfileSaveState('error')
    }
  }

  const handleEditClick = () => {
    if (!editing) {
      setEditing(true)
      setProfileSaveState('idle')
      return
    }
    void saveProfile()
  }

  const updateAccountDraftField = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setAccountDraft((current) => ({ ...current, [key]: value }))
  }

  const updateCustomizationDraft = <K extends keyof ProfileCustomizationDraft>(
    key: K,
    value: ProfileCustomizationDraft[K],
  ) => {
    setCustomizationDraft((current) => ({ ...current, [key]: value }))
  }

  const updateProfileLink = (index: number, key: keyof UserProfileLink, value: string) => {
    setCustomizationDraft((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) => (
        linkIndex === index ? { ...link, [key]: value } : link
      )),
    }))
  }

  const addProfileLink = () => {
    const label = newProfileLink.label.trim()
    const url = newProfileLink.url.trim()
    if (!label || !/^https?:\/\//i.test(url)) return
    setCustomizationDraft((current) => ({
      ...current,
      links: [...current.links, { label, url }].slice(0, 5),
    }))
    setNewProfileLink({ label: '', url: '' })
  }

  const removeProfileLink = (index: number) => {
    setCustomizationDraft((current) => ({
      ...current,
      links: current.links.filter((_link, linkIndex) => linkIndex !== index),
    }))
  }

  const addSharedRepo = () => {
    const repo = newSharedRepo.trim()
    if (!repo) return
    setSharedRepoDrafts((current) => [...new Set([...current, repo])])
    setNewSharedRepo('')
  }

  const updateSharedRepo = (index: number, value: string) => {
    setSharedRepoDrafts((current) => current.map((repo, repoIndex) => (repoIndex === index ? value : repo)))
  }

  const removeSharedRepo = (index: number) => {
    setSharedRepoDrafts((current) => current.filter((_repo, repoIndex) => repoIndex !== index))
  }

  const updateAwardDraft = <K extends keyof UserAward>(index: number, key: K, value: UserAward[K]) => {
    setAwardDrafts((current) =>
      current.map((award, awardIndex) => (
        awardIndex === index ? { ...award, [key]: value } : award
      )),
    )
  }

  const addAwardDraft = () => {
    setAwardDrafts((current) => [...current, createBlankAward()])
  }

  const removeAwardDraft = (index: number) => {
    setAwardDrafts((current) => current.filter((_award, awardIndex) => awardIndex !== index))
  }

  const startAddSharedRepo = () => {
    if (!canEdit) return
    setTab('activity')
    setEditing(true)
    setProfileSaveState('idle')
  }

  const startAddAward = () => {
    if (!canEdit) return
    setTab('awards')
    setEditing(true)
    setProfileSaveState('idle')
    setAwardDrafts((current) => [...current, createBlankAward()])
  }

  return (
    <section className="coala-content coala-content--profile">
      <div className="profile-page">
        <div className="profile-page-hero surface-card">
          <div className="profile-page-hero-main">
            <div className="profile-photo-panel">
              <div className={`profile-page-avatar profile-page-avatar--${displayAvatarTone}${displayProfileImage ? ' profile-page-avatar--image' : ''}`}>
                {displayProfileImage ? (
                  <img src={displayProfileImage} alt={`${displayName} 프로필 사진`} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              {canEdit ? (
                <div className="profile-photo-controls">
                  <button type="button" className="profile-photo-button" onClick={() => photoInputRef.current?.click()}>
                    {isUploadingProfilePhoto ? '업로드 중' : '사진 변경'}
                  </button>
                  {displayProfileImage ? (
                    <button type="button" className="profile-photo-button profile-photo-button--muted" onClick={removeProfilePhoto}>
                      삭제
                    </button>
                  ) : null}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="profile-photo-input"
                    onChange={handlePhotoSelect}
                    disabled={isUploadingProfilePhoto}
                  />
                  {photoError ? <p className="profile-photo-error">{photoError}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="profile-page-identity">
              <h2 className="profile-page-name">{displayName}</h2>
              <p className="profile-page-role">{displayRole}</p>
              {profileMember.focus ? <p className="profile-page-focus">{profileMember.focus}</p> : null}
              <div className="profile-page-meta">
                <span>{profileAffiliation}</span>
                {profileGithubUrl ? (
                  <a href={profileGithubUrl} target="_blank" rel="noreferrer">
                    {profileGithubLabel}
                  </a>
                ) : (
                  <span>{profileGithubLabel}</span>
                )}
              </div>
              {joinedAt ? <p className="profile-page-joined">{joinedAt} 가입 · 동아리 코알라</p> : null}
              {profileLinks.length > 0 ? (
                <div className="profile-public-links">
                  {profileLinks.map((link) => (
                    <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {canEdit ? (
            <button
              type="button"
              className={editing ? 'profile-edit-button profile-edit-button--active' : 'profile-edit-button'}
              onClick={handleEditClick}
              disabled={profileSaveState === 'saving'}
            >
              <Icon name="edit" size={13} />
              {editing ? (profileSaveState === 'saving' ? '저장 중' : '저장') : '편집'}
            </button>
          ) : null}
        </div>
        {profileSaveState === 'error' ? <p className="profile-save-message profile-save-message--error">프로필을 저장하지 못했습니다.</p> : null}
        {profileSaveState === 'saved' ? <p className="profile-save-message">프로필을 저장했습니다.</p> : null}

        <div className="profile-stats-grid">
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{profileMember.totalPoints.toLocaleString()}</p>
            <p className="profile-stat-label">활동 점수</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value profile-stat-value--github">{profileMember.githubCommits}</p>
            <p className="profile-stat-label">GitHub 커밋</p>
          </div>
          <div className="profile-stat-card surface-card">
            <div className="profile-stat-card-head">
              <p className="profile-stat-value">{profileMember.sharedRepos.length}개</p>
              {canEdit ? (
                <button type="button" className="profile-inline-add-button" onClick={startAddSharedRepo} aria-label="공유 저장소 추가">
                  <Icon name="plus" size={13} />
                </button>
              ) : null}
            </div>
            <p className="profile-stat-label">공유 저장소</p>
          </div>
          <div className="profile-stat-card surface-card">
            <div className="profile-stat-card-head">
              <p className="profile-stat-value profile-stat-value--award">{profileAwards.length}개</p>
              {canEdit ? (
                <button type="button" className="profile-inline-add-button" onClick={startAddAward} aria-label="수상 내역 추가">
                  <Icon name="plus" size={13} />
                </button>
              ) : null}
            </div>
            <p className="profile-stat-label">수상 내역</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{authoredContents.length}개</p>
            <p className="profile-stat-label">작성 내용</p>
          </div>
        </div>

        <div className="profile-tab-bar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'profile-tab is-active' : 'profile-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="profile-section-grid profile-section-grid--overview">
            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">소개</h3>
              {editing ? (
                <textarea
                  className="profile-bio-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="profile-bio-text">{bio}</p>
              )}
            </div>

            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">기본 정보</h3>
              {editing ? (
                <div className="profile-edit-grid">
                  <label className="profile-edit-field">
                    <span>이름</span>
                    <input
                      className="auth-input"
                      value={accountDraft.name}
                      onChange={(event) => updateAccountDraftField('name', event.target.value)}
                    />
                  </label>
                  <label className="profile-edit-field">
                    <span>이메일</span>
                    <input
                      className="auth-input"
                      type="email"
                      value={accountDraft.email}
                      onChange={(event) => updateAccountDraftField('email', event.target.value)}
                    />
                  </label>
                  <label className="profile-edit-field">
                    <span>학번</span>
                    <input
                      className="auth-input"
                      value={accountDraft.studentId}
                      onChange={(event) => updateAccountDraftField('studentId', event.target.value)}
                    />
                  </label>
                  <label className="profile-edit-field">
                    <span>GitHub</span>
                    <input
                      className="auth-input"
                      value={accountDraft.githubId}
                      onChange={(event) => updateAccountDraftField('githubId', event.target.value)}
                    />
                  </label>
                  <label className="profile-edit-field">
                    <span>소속 연구실</span>
                    <input
                      className="auth-input"
                      value={accountDraft.lab}
                      onChange={(event) => updateAccountDraftField('lab', event.target.value)}
                    />
                  </label>
                  <label className="profile-edit-field">
                    <span>성별</span>
                    <select
                      className="auth-input"
                      value={accountDraft.gender}
                      onChange={(event) => updateAccountDraftField('gender', event.target.value as EditableGender)}
                    >
                      {Object.entries(genderLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="profile-edit-field">
                    <span>학적</span>
                    <select
                      className="auth-input"
                      value={accountDraft.academicStatus}
                      onChange={(event) => updateAccountDraftField('academicStatus', event.target.value as EditableAcademicStatus)}
                    >
                      {Object.entries(academicStatusLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="profile-edit-field profile-edit-field--wide">
                    <span>LinkedIn</span>
                    <input
                      className="auth-input"
                      type="url"
                      value={accountDraft.linkedinUrl}
                      onChange={(event) => updateAccountDraftField('linkedinUrl', event.target.value)}
                    />
                  </label>
                </div>
              ) : canEdit ? (
                <ul className="profile-handles-list">
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="user" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">이메일</span>
                      <span className="profile-handle-value">{user?.email ?? '-'}</span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="file" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">학번</span>
                      <span className="profile-handle-value">{user?.studentId ?? '-'}</span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="users" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">소속 / 연구실</span>
                      <span className="profile-handle-value">
                        {firstNonBlank(user?.department, '소속 미입력')} · {firstNonBlank(user?.lab, '연구실 미입력')}
                      </span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="users" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">성별 / 학적</span>
                      <span className="profile-handle-value">
                        {user?.gender ? genderLabel[user.gender] : '-'} ·{' '}
                        {user?.academicStatus ? academicStatusLabel[user.academicStatus] : '-'}
                      </span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="network" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">GitHub</span>
                      {profileGithubUrl ? (
                        <a className="profile-handle-value profile-handle-link" href={profileGithubUrl} target="_blank" rel="noreferrer">
                          {profileGithubLabel}
                        </a>
                      ) : (
                        <span className="profile-handle-value">{profileGithubLabel}</span>
                      )}
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="link" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">LinkedIn</span>
                      <span className="profile-handle-value">{user?.linkedinUrl ?? '등록 안 함'}</span>
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="profile-handles-list">
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="network" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">GitHub</span>
                      {profileGithubUrl ? (
                        <a className="profile-handle-value profile-handle-link" href={profileGithubUrl} target="_blank" rel="noreferrer">
                          {profileGithubLabel}
                        </a>
                      ) : (
                        <span className="profile-handle-value">{profileGithubLabel}</span>
                      )}
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="users" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">소속</span>
                      <span className="profile-handle-value">{profileMember.lab}</span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="file" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">역할</span>
                      <span className="profile-handle-value">{profileMember.role}</span>
                    </span>
                  </li>
                </ul>
              )}
            </div>
            <div className="surface-card profile-section-card profile-custom-card">
              <h3 className="profile-section-title">커스터마이징</h3>
              {editing ? (
                <div className="profile-custom-editor">
                  <label className="profile-edit-field profile-edit-field--wide">
                    <span>한 줄 소개</span>
                    <input
                      className="auth-input"
                      maxLength={120}
                      value={customizationDraft.headline}
                      placeholder="프로필 상단에 보여줄 문장"
                      onChange={(event) => updateCustomizationDraft('headline', event.target.value)}
                    />
                  </label>
                  <div className="profile-edit-field profile-edit-field--wide">
                    <span>아바타 톤</span>
                    <div className="profile-tone-picker">
                      {avatarToneOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={customizationDraft.avatarTone === option.id ? 'profile-tone-button is-active' : 'profile-tone-button'}
                          onClick={() => updateCustomizationDraft('avatarTone', option.id)}
                        >
                          <span className={`profile-tone-swatch profile-tone-swatch--${option.id}`} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="profile-edit-field profile-edit-field--wide">
                    <span>공개 링크</span>
                    <div className="profile-repeat-editor">
                      {customizationDraft.links.map((link, index) => (
                        <div className="profile-repeat-row profile-repeat-row--link" key={`${link.label}-${index}`}>
                          <input
                            className="auth-input"
                            value={link.label}
                            placeholder="라벨"
                            onChange={(event) => updateProfileLink(index, 'label', event.target.value)}
                          />
                          <input
                            className="auth-input"
                            value={link.url}
                            placeholder="https://..."
                            onChange={(event) => updateProfileLink(index, 'url', event.target.value)}
                          />
                          <button type="button" className="ghost-button" onClick={() => removeProfileLink(index)}>
                            삭제
                          </button>
                        </div>
                      ))}
                      {customizationDraft.links.length < 5 ? (
                        <div className="profile-repeat-row profile-repeat-row--link">
                          <input
                            className="auth-input"
                            value={newProfileLink.label}
                            placeholder="라벨"
                            onChange={(event) => setNewProfileLink((current) => ({ ...current, label: event.target.value }))}
                          />
                          <input
                            className="auth-input"
                            value={newProfileLink.url}
                            placeholder="https://..."
                            onChange={(event) => setNewProfileLink((current) => ({ ...current, url: event.target.value }))}
                          />
                          <button type="button" className="ghost-button" onClick={addProfileLink}>
                            <Icon name="plus" size={13} />
                            추가
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : profileLinks.length > 0 ? (
                <div className="profile-link-list">
                  {profileLinks.map((link) => (
                    <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                      <Icon name="link" size={13} />
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="profile-empty-text">등록된 공개 링크가 없습니다.</p>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'activity' ? (
          <div className="profile-section-grid profile-section-grid--single">
            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">GitHub 현황</h3>
              <div className="profile-activity-block">
                <div className="profile-activity-row">
                  <span className="profile-activity-label">핸들</span>
                  {profileGithubUrl ? (
                    <a className="profile-activity-value profile-activity-link" href={profileGithubUrl} target="_blank" rel="noreferrer">
                      {profileGithubLabel}
                    </a>
                  ) : (
                    <span className="profile-activity-value profile-activity-value--mono">{profileGithubLabel}</span>
                  )}
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">최근 커밋</span>
                  <span className="profile-activity-value profile-activity-value--github">
                    {profileMember.githubCommits}개
                  </span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">
                    저장소
                    {canEdit && !editing ? (
                      <button type="button" className="profile-inline-add-button" onClick={startAddSharedRepo} aria-label="공유 저장소 추가">
                        <Icon name="plus" size={13} />
                      </button>
                    ) : null}
                  </span>
                  {editing ? (
                    <div className="profile-repeat-editor">
                      {sharedRepoDrafts.map((repo, index) => (
                        <div className="profile-repeat-row" key={`${repo}-${index}`}>
                          <input
                            className="auth-input"
                            value={repo}
                            placeholder="owner/repository"
                            onChange={(event) => updateSharedRepo(index, event.target.value)}
                          />
                          <button type="button" className="ghost-button" onClick={() => removeSharedRepo(index)}>
                            삭제
                          </button>
                        </div>
                      ))}
                      <div className="profile-repeat-row">
                        <input
                          className="auth-input"
                          value={newSharedRepo}
                          placeholder="owner/repository"
                          onChange={(event) => setNewSharedRepo(event.target.value)}
                        />
                        <button type="button" className="ghost-button" onClick={addSharedRepo}>
                          <Icon name="plus" size={13} />
                          추가
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="profile-repo-list">
                      {profileSharedRepos.length > 0 ? (
                        profileSharedRepos.map((repo) => <span key={repo}>{repo}</span>)
                      ) : (
                        <span className="profile-empty-text">공유 저장소가 없습니다.</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">활동 내역</h3>
              {editing ? (
                <textarea
                  className="profile-bio-textarea"
                  value={activityNote}
                  onChange={(event) => setActivityNote(event.target.value)}
                  rows={6}
                  placeholder="공유하고 싶은 활동 내역을 입력하세요."
                />
              ) : activityNote ? (
                <p className="profile-bio-text">{activityNote}</p>
              ) : (
                <p className="profile-empty-text">등록된 활동 내역이 없습니다.</p>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'awards' ? (
          <div className="surface-card profile-section-card">
            <div className="profile-section-title-row">
              <h3 className="profile-section-title">수상 내역 ({profileAwards.length})</h3>
              {canEdit ? (
                <button type="button" className="profile-inline-add-button" onClick={startAddAward} aria-label="수상 내역 추가">
                  <Icon name="plus" size={13} />
                </button>
              ) : null}
            </div>
            {editing ? (
              <div className="profile-award-editor">
                {awardDrafts.map((award, index) => (
                  <div className="profile-award-edit-item" key={award.awardId}>
                    <div className="profile-award-edit-grid">
                      <label className="profile-edit-field">
                        <span>수상명</span>
                        <input
                          className="auth-input"
                          value={award.title}
                          onChange={(event) => updateAwardDraft(index, 'title', event.target.value)}
                        />
                      </label>
                      <label className="profile-edit-field">
                        <span>주최</span>
                        <input
                          className="auth-input"
                          value={award.organizer}
                          onChange={(event) => updateAwardDraft(index, 'organizer', event.target.value)}
                        />
                      </label>
                      <label className="profile-edit-field">
                        <span>등수</span>
                        <input
                          className="auth-input"
                          value={award.rank}
                          onChange={(event) => updateAwardDraft(index, 'rank', event.target.value)}
                        />
                      </label>
                      <label className="profile-edit-field">
                        <span>날짜</span>
                        <input
                          className="auth-input"
                          type="date"
                          value={award.awardedAt}
                          onChange={(event) => updateAwardDraft(index, 'awardedAt', event.target.value)}
                        />
                      </label>
                      <label className="profile-edit-field">
                        <span>분류</span>
                        <select
                          className="auth-input"
                          value={award.category}
                          onChange={(event) => updateAwardDraft(index, 'category', event.target.value as UserAward['category'])}
                        >
                          {Object.entries(awardCategoryLabel).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="profile-edit-field">
                        <span>확인 링크</span>
                        <input
                          className="auth-input"
                          type="url"
                          value={award.credentialUrl ?? ''}
                          onChange={(event) => updateAwardDraft(index, 'credentialUrl', event.target.value)}
                        />
                      </label>
                      <label className="profile-edit-field profile-edit-field--wide">
                        <span>설명</span>
                        <input
                          className="auth-input"
                          value={award.description}
                          onChange={(event) => updateAwardDraft(index, 'description', event.target.value)}
                        />
                      </label>
                    </div>
                    <button type="button" className="ghost-button" onClick={() => removeAwardDraft(index)}>
                      삭제
                    </button>
                  </div>
                ))}
                <button type="button" className="ghost-button profile-add-row-button" onClick={addAwardDraft}>
                  <Icon name="plus" size={14} />
                  수상내역 추가
                </button>
              </div>
            ) : awardNote && !awardNote.trim().startsWith('[') ? (
              <p className="profile-bio-text profile-award-note">{awardNote}</p>
            ) : null}
            {profileAwards.length === 0 ? (
              <p className="profile-empty-text">등록된 수상 내역이 없습니다.</p>
            ) : (
              <ul className="profile-award-list">
                {profileAwards.map((award) => (
                  <li key={award.awardId} className="profile-award-item">
                    <div className="profile-award-main">
                      <span className={`profile-award-category profile-award-category--${award.category}`}>
                        {awardCategoryLabel[award.category]}
                      </span>
                      <p className="profile-award-title">{award.title}</p>
                      <p className="profile-award-description">{award.description}</p>
                    </div>
                    <div className="profile-award-meta">
                      <strong>{award.rank}</strong>
                      <span>{award.organizer}</span>
                      <span>{formatAwardDate(award.awardedAt)}</span>
                      {award.credentialUrl ? (
                        <a href={award.credentialUrl} target="_blank" rel="noreferrer">
                          확인 링크
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === 'posts' ? (
          <div className="surface-card profile-section-card">
            <h3 className="profile-section-title">작성 내용 ({authoredContents.length})</h3>
            {authoredContents.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>작성한 내용이 없습니다.</p>
            ) : (
              <ul className="profile-post-list">
                {authoredContents.map((item) => (
                  <li key={item.id} className="profile-post-item">
                    <div className="profile-post-body">
                      <span className={`profile-content-kind profile-content-kind--${item.kind}`}>
                        {contentKindLabel[item.kind]}
                      </span>
                      <p className="profile-post-title">{item.title}</p>
                      <p className="profile-post-excerpt">{item.excerpt}</p>
                    </div>
                    <div className="profile-post-meta">
                      <span className="profile-post-time">{formatDate(item.createdAt)}</span>
                      {typeof item.viewCount === 'number' ? (
                        <span className="profile-post-stat">
                          <Icon name="eye" size={11} />
                          {item.viewCount}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
