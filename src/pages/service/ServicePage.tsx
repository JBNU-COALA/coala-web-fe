import { JcloudApplyForm } from './JcloudApplyForm'
import { JcloudApplyList } from './JcloudApplyList'
import { ServiceWorkspace } from '../../shared/ui/ServiceWorkspace'

export function ServicePage({ embedded = false }: { embedded?: boolean }) {
  const content = <ServiceWorkspace kind="instances"
    form={(onSubmit) => <JcloudApplyForm onSubmit={onSubmit} />} list={<JcloudApplyList />} />

  if (embedded) return <div className="services-instance-panel">{content}</div>

  return <section className="coala-content coala-content--service">
    <div className="jcloud-hero">
      <div className="jcloud-hero-body">
        <span className="jcloud-hero-badge">인스턴스</span>
        <h2 className="jcloud-hero-title">코알라 인스턴스 신청</h2>
      </div>
    </div>
    {content}
  </section>
}
