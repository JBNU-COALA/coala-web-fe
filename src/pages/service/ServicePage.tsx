import './jcloud-provider.css'
import { JcloudApplyForm } from './JcloudApplyForm'
import { JcloudApplyList } from './JcloudApplyList'
import { ServiceWorkspace } from '../../shared/ui/ServiceWorkspace'

export function ServicePage({ embedded = false }: { embedded?: boolean }) {
  const content = <ServiceWorkspace kind="instances"
    form={(onSubmit) => <JcloudApplyForm onSubmit={onSubmit} />} list={<JcloudApplyList />} />

  const provider = <header className="jcloud-provider-heading">
    <img src="/jcloud-logo.png" alt="JCloud" width={880} height={167} />
    <div><h2>JCloud 인스턴스 대여</h2><p>JCloud에서 제공하는 인스턴스를 신청하고 이용하세요.</p></div>
  </header>

  if (embedded) return <div className="services-instance-panel">{provider}{content}</div>

  return <section className="coala-content coala-content--service">
    <div className="jcloud-hero">
      <div className="jcloud-hero-body">
        <span className="jcloud-hero-badge">인스턴스</span>
        <h2 className="jcloud-hero-title">JCloud 인스턴스 신청</h2>
      </div>
    </div>
    {provider}
    {content}
  </section>
}
