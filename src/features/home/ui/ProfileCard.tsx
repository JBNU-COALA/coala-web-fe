import { Icon } from '../../../shared/ui/Icon'
import { profileSummary } from '../model/homeData'

type ProfileCardProps = {
  onOpenSettings?: () => void
  onOpenProfile?: () => void
}

export function ProfileCard({ onOpenSettings, onOpenProfile }: ProfileCardProps) {
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
        <span className="profile-avatar">박</span>
        <div>
          <p className="profile-name">{profileSummary.name}</p>
          <p className="profile-role">{profileSummary.role}</p>
        </div>
      </div>

      <button type="button" className="profile-button" onClick={onOpenProfile}>
        <Icon name="user" size={14} />
        <span>내 프로필</span>
      </button>
    </section>
  )
}

