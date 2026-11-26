import { lazy, Suspense, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CommunityBanner } from '../community/CommunityBanner'
import { educationApi, type EducationSubject } from '../../shared/api/education'
import { Icon } from '../../shared/ui/Icon'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'
import { routes } from '../../shared/routes'
import { subjectPath, subjectIcon } from './subjects'
import { CourseDetail, CourseList } from './CoursePages'
import { useCtfResource } from './hacking/useCtfResource'
import { CtfResourceState } from './hacking/CtfUi'
import './education.css'

const HackingPage = lazy(() => import('./hacking/HackingPage').then((module) => ({ default: module.HackingPage })))
export function EducationPage() {
  const { pathname } = useLocation()
  const [revision, setRevision] = useState(0)
  const resource = useCtfResource(educationApi.subjects, revision)
  const subject = resource.data?.find((item) => pathname === subjectPath(item.id) || pathname.startsWith(`${subjectPath(item.id)}/`))
  return <section className="coala-content page-frame education-page" aria-labelledby="education-heading">
    <CommunityBanner title={subject?.name ?? '교육'} description={subject?.topics ?? ''} headingLevel={1} titleId="education-heading" />
    <div className="page-container page-frame-body education-body">
      {pathname !== routes.education.root && <nav className="education-breadcrumb" aria-label="교육 경로"><Link to={routes.education.root}>교육</Link><Icon name="chevron-right" size={12} /><span aria-current="page">{subject?.name ?? '과정'}</span></nav>}
      <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
      <Suspense fallback={<LoadingSpinner label="교육 과정을 불러오는 중..." />}><Routes>
        <Route index element={resource.data && <EducationSubjects subjects={resource.data} />} />
        <Route path="hacking/*" element={<HackingPage />} />
        <Route path="algorithms" element={<CourseList subjectId="algorithms" />} />
        <Route path="subjects/:subjectId" element={<CourseList />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="*" element={<Navigate to={routes.education.root} replace />} />
      </Routes></Suspense>
    </div>
  </section>
}
function EducationSubjects({ subjects }: { subjects: EducationSubject[] }) {
  return <>
    <div className="education-list-heading"><h2>교육 분야</h2><span>{subjects.length}개 분야</span></div>
    <div className="education-subject-list">{subjects.map((subject) => <Link className="education-subject" key={subject.id} to={subjectPath(subject.id)}>
      <div className="education-subject-head"><span className="education-subject-symbol"><Icon name={subjectIcon(subject.id)} size={22} /></span><h3>{subject.name}</h3></div>
      <p>{subject.topics}</p><div className="education-subject-footer"><span>{subject.courseCount}개 과정</span><Icon name="chevron-right" size={16} /></div>
    </Link>)}</div>
  </>
}
