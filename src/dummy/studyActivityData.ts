import { dateKey, mondayOf, shiftDate, type ActivityData, type AttendanceStatus } from '../shared/activity'

export function createStudyActivityDemo(): ActivityData {
  const members = ['김민지', '이준호', '박소연', '정우석', '최예린', '윤지수'].map((name, index) => ({ userId: String(index + 1), name }))
  const groups = [
    { id: '1', name: '프론트엔드 1조', recruitId: 'react-study', members },
    { id: '2', name: '백엔드 2조', recruitId: 'backend-study', members: [members[3], members[4], members[5], { userId: '7', name: '한서율' }, { userId: '8', name: '김예린' }, { userId: '9', name: '최민호' }] },
    { id: '3', name: '알고리즘 3조', members: [members[0], members[2], members[4]] },
  ]
  const start = mondayOf(dateKey(new Date()))
  const specifications = [
    { id: '1', group: 0, day: 0, title: 'React 상태 관리와 코드 리뷰', content: '## 이번 주 활동\n\n전역 상태와 서버 상태를 구분하고, 각자 작성한 코드를 함께 리뷰했습니다.\n\n- 컴포넌트별 상태 흐름 정리\n- 비동기 요청의 로딩·오류 처리\n- PR 리뷰와 개선 사항 반영\n\n## 다음 모임\n\n테스트 코드를 작성하고 변경 전후 동작을 비교합니다.' },
    { id: '2', group: 1, day: 0, title: 'API 설계와 테스트', content: '게시글 API의 요청과 응답 형식을 맞추고 단위 테스트를 작성했습니다.\n\n## 함께 확인한 내용\n\n- 오류 응답 규칙\n- 페이지네이션\n- 인증이 필요한 요청' },
    { id: '3', group: 2, day: 0, title: '그래프 탐색 문제 풀이', content: 'BFS와 DFS 풀이를 비교했습니다. 각자 풀이를 설명하고 시간 복잡도를 점검했습니다.' },
    { id: '4', group: 0, day: -7, title: '컴포넌트 설계와 역할 나누기', content: '공통 컴포넌트의 책임과 데이터 흐름을 정리했습니다.' },
  ]
  return { groups, records: specifications.map((item) => ({
    id: item.id, groupId: groups[item.group].id, date: shiftDate(start, item.day), title: item.title, content: item.content,
    attendance: groups[item.group].members.map((member, index) => ({ ...member, status: (index === 4 ? 'late' : index === 5 ? 'absent' : 'present') as AttendanceStatus })),
    updatedAt: new Date().toISOString(),
  })) }
}
