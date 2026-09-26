import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isAdminUser } from '../auth/adminAccess'
import { routes } from '../routes'
import { Icon, type IconName } from './Icon'
import { ServiceInquiries } from './ServiceInquiries'
import './ServiceWorkspace.css'

type ServiceTab = 'apply' | 'list' | 'inquiry'
type ServiceKind = 'instances' | 'domains'
const tabs: { id: ServiceTab; label: string; icon: IconName }[] = [
  { id: 'apply', label: '신청하기', icon: 'plus' },
  { id: 'list', label: '신청 내역', icon: 'file' },
  { id: 'inquiry', label: '문의사항', icon: 'message' },
]

export function ServiceWorkspace({ kind, form, list }: {
  kind: ServiceKind
  form: (onSubmit: () => void) => ReactNode
  list: ReactNode
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const parameter = kind === 'instances' ? 'instanceTab' : 'domainTab'
  const requestedTab = searchParams.get(parameter)
  const tab = requestedTab === 'list' || requestedTab === 'inquiry' ? requestedTab : 'apply'
  const changeTab = (nextTab: ServiceTab) => setSearchParams((current) => {
    const next = new URLSearchParams(current)
    if (nextTab === 'apply') next.delete(parameter)
    else next.set(parameter, nextTab)
    return next
  })

  return <div className="jcloud-tab-shell surface-card">
    <nav className="service-workspace-nav" aria-label={kind === 'instances' ? '인스턴스 신청 메뉴' : '도메인 신청 메뉴'}>
      {tabs.map((item) => <button key={item.id} type="button"
        className={`service-workspace-tab${tab === item.id ? ' is-active' : ''}`}
        aria-current={tab === item.id ? 'page' : undefined} onClick={() => changeTab(item.id)}>
        <Icon name={item.icon} size={14} />{item.label}
      </button>)}
      {isAdminUser(user) && <button type="button" className="service-workspace-tab"
        onClick={() => navigate(`${routes.admin}?tab=${kind}`)}>
        <Icon name="settings" size={14} />관리자
      </button>}
    </nav>
    <div className="jcloud-tab-content" key={user?.id ?? 'guest'}>
      {tab === 'apply' ? form(() => changeTab('list')) : tab === 'list' ? list : <ServiceInquiries kind={kind} />}
    </div>
  </div>
}
