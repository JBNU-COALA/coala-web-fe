import { Icon } from '../../../shared/ui/Icon'
import { useAuth } from '../../../shared/auth/AuthContext'

type ProfileCardProps = {
  onOpenSettings?: () => void
  onOpenProfile?: () => void
}

export function ProfileCard({ onOpenSettings, onOpenProfile }: ProfileCardProps) {
  const { user, isLoggedIn } = useAuth()

  const displayName = isLoggedIn ? (user?.name ?? user?.email ?? '사용자') : '게스트'
  const displayRole = isLoggedIn ? (user?.department ?? '동아리 멤버') : '로그인이 필요합니다'
  const initial = displayName.charAt(0)

  return (
    <section className="surface-card profile-card">
      <button
        type="button"
        className="profile-settings-button"
        aria-label="프로필 설정"
        onClick={onOpenSettings}
      >
        <Icon name="settings" size={14} />
      </button>

      <div className="profile-header">
        <span className="profile-avatar">{initial}</span>
        <div>
          <p className="profile-name">{displayName}</p>
          <p className="profile-role">{displayRole}</p>
        </div>
      </div>

      <button type="button" className="profile-button" onClick={onOpenProfile}>
        <Icon name="user" size={14} />
        <span>내 프로필</span>
      </button>
    </section>
  )
}
