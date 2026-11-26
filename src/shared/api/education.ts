import client from './client'

export type EducationSubject = { id: string; name: string; topics: string; courseCount: number; sortOrder: number; published: boolean; version: number }
export type EducationLesson = { id: string; title: string; goals: string[]; tools: string[]; challenges: string[]; homework: string | null }
export type EducationCourse = { id: string; subjectId: string; slug: string; title: string; description: string; content: string; level: string; kind: 'TRACK' | 'GUIDE' | 'COURSE'; weeks: EducationLesson[]; completedLessons: string[]; sortOrder: number; published: boolean; version: number }
const base = '/api/education'
export const educationApi = {
  subjects: async (signal?: AbortSignal) => (await client.get<EducationSubject[]>(`${base}/subjects`, { signal })).data,
  courses: async (id: string, signal?: AbortSignal) => (await client.get<EducationCourse[]>(`${base}/subjects/${encodeURIComponent(id)}/courses`, { signal })).data,
  course: async (id: string, signal?: AbortSignal) => (await client.get<EducationCourse>(`${base}/courses/${encodeURIComponent(id)}`, { signal })).data,
  progress: async (id: string, lesson: string, completed: boolean) => client.put(`${base}/courses/${encodeURIComponent(id)}/progress/${encodeURIComponent(lesson)}`, { completed }),
}
