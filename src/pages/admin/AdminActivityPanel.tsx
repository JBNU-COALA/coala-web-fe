import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../shared/api/admin'
import { activityToday, attendanceCounts } from '../../shared/activity'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { AdminLoadState } from './AdminFields'
import { useAdminResource } from './useAdminResource'

export function AdminActivityPanel({ refreshKey }: { refreshKey: number }) {
  const [month, setMonth] = useState(activityToday().slice(0, 7))
  const [groupId, setGroupId] = useState('all')
  const [query, setQuery] = useState('')
  const loader = useCallback(async () => {
    const [year, number] = month.split('-').map(Number)
    const to = `${month}-${new Date(year, number, 0).getDate()}`
    const [groups, records] = await Promise.all([adminApi.getStudyGroups(), adminApi.getStudyRecords(`${month}-01`, to)])
    return { groups, records }
  }, [month])
  const resource = useAdminResource(loader, refreshKey)
  const records = resource.data?.records.filter((record) =>
    (groupId === 'all' || (groupId === 'individual' ? !record.groupId : record.groupId === groupId)) &&
    record.title.toLowerCase().includes(query.trim().toLowerCase())) ?? []
  const groups = resource.data?.groups ?? []
  return <div className="admin-stack">
    <div className="admin-toolbar">
      <label className="admin-field"><span>조회 월</span><input aria-label="활동 조회 월" type="month" required value={month} onChange={(e) => { if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value) }} /></label>
      <Link className="admin-primary-button" to={routes.community.activity}><Icon name="calendar" size={16} />활동 관리</Link>
      <Link className="admin-ghost-button" to={routes.community.activityRecordNew}><Icon name="plus" size={16} />활동 기록 추가</Link>
    </div>
    <AdminLoadState {...resource} onRetry={resource.reload} />
    {!resource.loading && !resource.error && resource.data && <>
      <div className="admin-metric-band" aria-label="활동 현황"><div><span>활동 그룹</span><strong>{groups.length}</strong></div>
        <div><span>{month} 활동 기록</span><strong>{resource.data.records.length}</strong></div>
        <div><span>{month} 출석 · 지각</span><strong>{resource.data.records.reduce((sum, record) => { const counts = attendanceCounts(record.attendance); return sum + counts.present + counts.late }, 0)}</strong></div>
      </div>
      <section className="admin-panel"><div className="admin-panel-header"><h3>그룹</h3></div>
        <div className="admin-group-list">{groups.map((group) => <Link className="admin-group-row" key={group.id} to={routes.community.activityGroup(group.id)}>
          <span><strong>{group.name}</strong><small>{group.members.length}명 · 이번 달 {resource.data!.records.filter((record) => record.groupId === group.id).length}건</small></span>
          <span>활동 관리 <Icon name="chevron-right" size={16} /></span>
        </Link>)}{!groups.length && <p className="admin-empty">등록된 그룹이 없습니다.</p>}</div>
      </section>
      <section className="admin-panel"><div className="admin-panel-header"><h3>활동 기록</h3><span>{records.length}건</span></div>
        <div className="admin-toolbar"><label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="활동 기록 검색" placeholder="활동 기록 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <select className="admin-inline-select" aria-label="활동 그룹" value={groupId} onChange={(e) => setGroupId(e.target.value)}><option value="all">전체 그룹</option><option value="individual">개인 활동</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select>
        </div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>기록</th><th>날짜</th><th>그룹</th><th>출석 / 참여자</th><th>관리</th></tr></thead><tbody>
          {records.map((record) => <tr key={record.id}><td><Link className="admin-text-link" to={routes.community.activityRecord(record.id)}>{record.title}</Link></td><td>{record.date}</td><td>{groups.find((group) => group.id === record.groupId)?.name ?? '개인 활동'}</td><td>{attendanceCounts(record.attendance).present} / {record.attendance.length}</td>
            <td><Link className="admin-text-link" to={record.canManage ? routes.community.activityRecordEditor(record.id) : routes.community.activityRecord(record.id)}>{record.canManage ? '기록 수정' : '기록 보기'}<Icon name={record.canManage ? 'edit' : 'eye'} size={14} /></Link></td></tr>)}
        </tbody></table></div>{!records.length && <p className="admin-empty">조건에 맞는 활동 기록이 없습니다.</p>}
      </section>
    </>}
  </div>
}
