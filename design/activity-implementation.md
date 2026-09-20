# 모집 · 활동 · 마이페이지

## 연결 방식

- 커뮤니티에 활동 메뉴를 추가했다. 카드 보기와 월간 캘린더, 주간 출석 현황을 제공한다.
- 모집 공고 작성자 또는 운영진이 지원자를 승인하고 활동 조를 생성한다.
- 현재는 모집 공고 하나에 활동 조 하나를 연결한다. 같은 요청을 반복해도 조가 중복 생성되지 않는다.
- 조원은 공고 작성자와 승인된 지원자다. 조별 활동에서 원본 모집 공고로 이동하고, 마이페이지에서 참여 조와 개인 출석 기록을 조회한다.
- 실제 활동 API는 로그인·이메일 인증을 요구한다. 작성·수정 권한은 서버의 공고 소유권과 운영진 권한으로 확인한다.
- 관리자 권한은 기존 `STAFF`, `SUPER_ADMIN`을 사용한다. 두 역할 모두 다른 작성자의 지원 승인·거절, 조 생성, 활동 기록 작성·수정과 출석 수정을 할 수 있다. 조·활동 삭제 API는 제공하지 않는다.

## 데이터 계약

- `GET/POST /api/study/groups`: 조 목록과 생성. `canManage`는 서버가 계산한다.
- `GET /api/study/records?from=YYYY-MM-DD&to=YYYY-MM-DD`: 기간별 기록. 최대 93일, `groupId`, `memberId` 필터 지원.
- `POST /api/study/records`: 기록 생성. ID는 서버 UUID이며 사용자 ID와 조 ID는 숫자다.
- `GET/PATCH /api/study/records/{id}`: 상세 조회·수정. 수정할 때 `version`을 보내며 동시 수정은 409로 거부한다.
- `PATCH /api/recruits/{recruitId}/applications/{applicationId}`: `submitted`, `accepted`, `rejected` 상태 변경.
- 출석 상태: `present`, `late`, `absent`, `unknown`. 현재 명단 전체를 한 번씩 포함해야 저장할 수 있다.
- 과거 기록은 활동 당시 사용자 ID 명단을 유지한다. 현재 명단에서 제외되어도 과거 출석은 남는다. 이름은 현재 사용자 이름으로 표시한다.
- 활동이 연결된 공고는 삭제할 수 없다. 모집 상태를 마감으로 바꿔 보존한다.

## 코드 구조

- `shared/activity.ts`: 데이터 타입, 날짜 처리, 출석 집계.
- `shared/activityRepository.ts`: 실제 API만 사용한다. 미리보기 쿼리로 인증이나 권한을 우회하지 않는다.
- `RecordEditor`, `AttendanceList`, `ActivityCalendar`: 편집·출석·캘린더 재사용 컴포넌트.
- `StudyConnections`: 프로필·공고의 공통 연결 UI.
- `RecruitParticipants`: 공고 소유자의 지원자 상태 관리.
- 런타임 더미 데이터와 브라우저 예시 저장소를 제거했다. 테스트 데이터는 `design`의 API 모킹 검사에서만 사용한다.

## 검증과 배포

- `check-production.cjs`: 320/390/768/1280/1800px의 16개 경로에서 빈 데이터, API 오류, 가로 넘침과 로그인 폼 정렬을 검사한다.
- `check-activity-api.cjs`: API 응답을 모킹해 숫자 ID, 서버 발급 ID, 버전 충돌, 지원 승인→조원 반영, 프로필→활동 연결을 검사한다. 운영 서버 연결 검증과는 별개다.
- 백엔드 `StudyIntegrationTest`: H2 영속성, 관리자 두 역할, 소유권, 명단 변조, 정원, 과거 명단, 동시 수정, HTTP 인증·입력 검증. 전체 테스트 63개 통과.
- 배포 전에 백엔드 Flyway `V20260920_1200__create_study_activity.sql`을 적용해야 한다. 기존 데이터를 삭제하는 마이그레이션은 없다.
- 운영 PostgreSQL 마이그레이션과 실제 배포 환경 연동은 별도 확인이 필요하다. `main` 푸시는 기존 CI/CD를 실행하며, 이 작업에서 운영 DB 초기화를 요청하지 않는다.
- 프론트 빌드와 변경 기능의 ESLint는 통과했다. 전체 ESLint에는 기존 App·관리자·글 편집/상세 화면의 React Hooks 오류가 남아 있어 전체 린트 통과로 간주하지 않는다.

## 시안과 참고

GPT 이미지 시안은 `mockups/community-activity-mobile.png`, `mockups/community-activity-connected.png`에 보관했다. 모바일은 날짜와 상태를 간결하게 보여 주고, 출석 명단은 격자 카드 대신 행 목록으로 구성했다. 캘린더는 날짜·표시점과 선택일 목록으로 분리했다.

- [Microsoft Teams 모임 출석 보고서](https://support.microsoft.com/en-us/teams/meetings/manage-meeting-attendance-reports-in-microsoft-teams): 모임 단위의 참석 내역.
- [Google Classroom 학생 작업 확인](https://support.google.com/edu/classroom/answer/9157286?hl=en): 개인별 상태 확인.

위 자료는 정보 구조 참고이며, 제품 화면을 그대로 복제한 것은 아니다.
## 더미 제거 후 운영

- 예시 사용자·게시글·모집·서비스·신청내역 및 개발 계정 자동 생성을 제거했다. 기존 DB 행을 자동 삭제하지 않는다.
- 새 DB의 게시판 분류는 관리자 기능으로 등록해야 한다. 프론트가 게시판 ID를 추측하지 않는다.
- 정보공유는 별도 API의 글 ID로 라우팅한다. 기존 boardId 포함 URL은 새 경로로 이동한다.
- 로그인·회원가입·이메일 인증·비밀번호 재설정은 공통 단일 열 폼을 사용한다.
