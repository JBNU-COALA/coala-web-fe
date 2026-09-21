import type { UserDetailsDraft } from '../api/userDetails'
import './user-details-fields.css'

export function UserDetailsFields({ value, onChange, email, disabled = false }: {
  value: UserDetailsDraft
  onChange: (value: UserDetailsDraft) => void
  email: string
  disabled?: boolean
}) {
  const set = (key: keyof UserDetailsDraft, next: string) => onChange({ ...value, [key]: next })
  const input = (key: keyof UserDetailsDraft, label: string, maxLength: number, required = false, type = 'text') =>
    <label className="member-field"><span>{label}</span><input type={type} value={value[key]}
      maxLength={maxLength} required={required} onChange={(event) => set(key, event.target.value)} /></label>
  return <fieldset className="member-fields" disabled={disabled}>
    <legend className="sr-only">회원정보</legend>
    <label className="member-field member-field--wide"><span>계정 이메일</span>
      <input type="email" value={email} readOnly aria-readonly="true" /></label>
    {input('name', '이름', 50, true)}
    {input('nickname', '닉네임', 50)}
    {input('department', '학과 / 소속', 100, true)}
    {input('lab', '연구실', 150)}
    {input('studentId', '학번', 20, true)}
    <label className="member-field"><span>학년</span><select value={value.grade} onChange={(event) => set('grade', event.target.value)}>
      <option value="">미등록</option>{[1, 2, 3, 4, 5, 6].map((grade) => <option value={grade} key={grade}>{grade}학년</option>)}
    </select></label>
    <label className="member-field"><span>생년월일</span><input type="date" value={value.birthDate}
      max={new Date().toLocaleDateString('en-CA')} onChange={(event) => set('birthDate', event.target.value)} /></label>
    <label className="member-field"><span>성별</span><select value={value.gender} onChange={(event) => set('gender', event.target.value)}>
      <option value="PREFER_NOT_TO_SAY">응답 안 함</option><option value="MALE">남성</option>
      <option value="FEMALE">여성</option><option value="OTHER">기타</option>
    </select></label>
    <label className="member-field"><span>학적</span><select value={value.academicStatus} onChange={(event) => set('academicStatus', event.target.value)}>
      {Object.entries({ ENROLLED: '재학생', ON_LEAVE: '휴학생', GRADUATED: '졸업생', PROFESSOR: '교수', ASSISTANT: '조교', GENERAL: '일반' })
        .map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    {input('githubId', 'GitHub ID', 39, true)}
    {input('baekjoonId', '백준 ID', 50)}
    {input('linkedinUrl', 'LinkedIn', 255, false, 'url')}
  </fieldset>
}
