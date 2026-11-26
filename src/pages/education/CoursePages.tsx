import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { educationApi, type EducationCourse } from '../../shared/api/education'
import { featureError } from '../../shared/api/featureError'
import { useAuth } from '../../shared/auth/AuthContext'
import { prepareMarkdownForDisplay } from '../../shared/markdown'
import { useCtfResource } from './hacking/useCtfResource'
import { CtfResourceState } from './hacking/CtfUi'
import { EducationEmptyState } from './EducationEmptyState'
import { subjectPath } from './subjects'
import { routes } from '../../shared/routes'

export function CourseList({ subjectId: fixed }: { subjectId?: string }) {
  const params = useParams()
  const id = fixed ?? params.subjectId ?? ''
  const load = useCallback((signal: AbortSignal) => educationApi.courses(id, signal), [id])
  const [revision, setRevision] = useState(0)
  const resource = useCtfResource(load, revision)
  return <><div className="education-list-heading"><h2>교육 과정</h2><span>{resource.data?.length ?? 0}개 과정</span></div>
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {resource.data && (resource.data.length ? <CourseLinks courses={resource.data} /> : <EducationEmptyState title="등록된 과정이 없습니다." />)}
  </>
}
export function CourseLinks({ courses }: { courses: EducationCourse[] }) {
  return <ul className="education-course-list">{courses.map((course) => <li key={course.id}><Link to={`/education/courses/${encodeURIComponent(course.id)}`}><strong>{course.title}</strong><span>{course.description}</span></Link><span>{course.weeks.length ? `${course.weeks.length}개 단원` : '문서'}</span></li>)}</ul>
}
export function CourseDetail() {
  const { courseId = '' } = useParams()
  const { isLoggedIn, user } = useAuth()
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completion, setCompletion] = useState<Record<string, boolean>>({})
  const load = useCallback((signal: AbortSignal) => educationApi.course(courseId, signal), [courseId])
  const resource = useCtfResource(load, revision + (user?.id ?? 0))
  const course = resource.data
  const completionKey = (lesson: string) => `${user?.id ?? 'guest'}:${courseId}:${lesson}`
  const isCompleted = (lesson: string) => completion[completionKey(lesson)] ?? course?.completedLessons.includes(lesson) ?? false
  const relatedLoad = useCallback((signal: AbortSignal) => course ? educationApi.courses(course.subjectId, signal) : Promise.resolve([]), [course])
  const related = useCtfResource(relatedLoad)
  const documentHref = (href: string | undefined): string | null => {
    if (!href) return null
    if (/^(https?:\/\/|mailto:|#)/i.test(href)) return href
    const [path, anchor] = href.split('#', 2)
    const filename = path.split('/').pop()?.replace(/\.md$/, '')
    const target = related.data?.find((item) => item.slug === filename || filename === 'curriculum' && item.slug === 'first-year')
    if (target) return `/education/courses/${encodeURIComponent(target.id)}${anchor ? `#${anchor}` : ''}`
    if (filename === 'README') return subjectPath(course?.subjectId ?? '')
    return null
  }
  const update = async (id: string, done: boolean) => {
    if (busy) return
    setBusy(true); setError(null)
    try { await educationApi.progress(courseId, id, done); setCompletion((current) => ({ ...current, [completionKey(id)]: done })) }
    catch (cause) { setError(featureError(cause)) } finally { setBusy(false) }
  }
  return <><CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {error && <p role="alert" className="education-message">{error}</p>}
    {course && <article className="education-course-detail">
      <Link className="education-text-link" to={subjectPath(course.subjectId)}>분야로 돌아가기</Link>
      <div className="education-list-heading"><h2>{course.title}</h2>{course.weeks.length > 0 && <span>{course.weeks.filter((lesson) => isCompleted(lesson.id)).length} / {course.weeks.length}</span>}</div>
      <p className="education-muted">{course.description}</p>
      <div data-color-mode="light" className="education-document"><MDEditor.Markdown source={prepareMarkdownForDisplay(course.content)} skipHtml components={{ a: ({ href, children }) => { const target = documentHref(href); return target ? <a href={target} rel="noopener noreferrer">{children}</a> : <span>{children}</span> } }} /></div>
      {course.weeks.map((lesson) => <section className="education-lesson" key={lesson.id}>
        <div className="education-list-heading"><h3>{lesson.title}</h3><label><input type="checkbox" checked={isCompleted(lesson.id)} disabled={!isLoggedIn || busy} onChange={(event) => void update(lesson.id, event.target.checked)} />학습 완료</label></div>
        <ul>{lesson.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
        {lesson.tools.length > 0 && <p>도구: {lesson.tools.join(' · ')}</p>}
        <ul>{lesson.challenges.map((id) => <li key={id}><Link to={routes.education.hacking.challenge(id)}>{id}</Link></li>)}</ul>
        {lesson.homework && <p>{lesson.homework}</p>}
      </section>)}
    </article>}
  </>
}
