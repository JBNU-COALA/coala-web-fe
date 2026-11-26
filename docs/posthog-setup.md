# 코알라 PostHog 연결

프로젝트 토큰이 없으면 SDK를 로드하지 않고 아무 이벤트도 보내지 않습니다.

1. https://posthog.com 에서 계정과 프로젝트를 생성합니다.
2. 프로젝트 설정에서 공개 Project token과 API host를 복사합니다. 개인 API 키는 사용하지 않습니다.
3. 배포 빌드 환경에 아래 값을 등록하고 다시 빌드/배포합니다.

```dotenv
VITE_POSTHOG_PROJECT_TOKEN=프로젝트의_공개_토큰
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

EU 프로젝트는 `https://eu.i.posthog.com`을 사용합니다. 개발 환경은 기본적으로 수집하지 않습니다.
현재 배포는 GitHub Actions가 Ubuntu 서버에서 빌드합니다. 저장소 **Settings → Secrets and variables → Actions**에서
`VITE_POSTHOG_PROJECT_TOKEN`을 Secret 또는 Variable로, `VITE_POSTHOG_HOST`를 Variable로 등록한 뒤 배포를 다시 실행합니다.
워크플로가 SSH 빌드 단계에 값을 전달합니다. Actions 값이 없으면 서버의 `.env.production` 설정을 유지합니다.
Wizard가 사용하는 `VITE_POSTHOG_KEY`도 대체 이름으로 지원하며, `VITE_POSTHOG_PROJECT_TOKEN`이 우선합니다. SDK는 공통 analytics 모듈에서 한 번만 초기화합니다.
로컬 수신 확인 시 `.env.local`에 위 값과 `VITE_POSTHOG_ENABLE_DEV=true`를 넣습니다.

## 수집 이벤트

| 이벤트 | 의미 |
| --- | --- |
| `$pageview` | SPA 페이지 조회. `route`는 ID를 제거한 경로, `authenticated`는 로그인 여부 |
| `navigation_clicked` | 사이트 내부 링크 클릭. `destination`으로 이동 대상 구분 |
| `login_completed` | 로그인 API 성공 |
| `signup_submitted` | 회원가입 API 성공. 이메일 인증 완료와는 다름 |
| `post_created`, `info_created`, `recruit_created` | 게시물 등록 API 성공 |
| `archive_created`, `service_created` | 자료/서비스 등록 API 성공 |
| `instance_application_submitted`, `domain_application_submitted`, `recruit_application_submitted` | 각 신청 API 성공 |

Wizard 대시보드 호환을 위해 `post_published`, `recruitment_published`, `recruitment_application_submitted`, `archive_item_created`, `jcloud_application_submitted`도 대응하는 생성 이벤트와 함께 전송합니다. 같은 행동의 별칭이므로 두 이름의 횟수를 합산하지 않습니다. 수정/활동 이벤트는 `post_updated`, `activity_record_created`, `activity_record_updated`, `archive_item_updated`입니다.

추천 집계: 일별 고유 방문자, `route`별 조회수, 기기별 이용량, 글 작성 페이지 조회→`post_created`,
인스턴스/도메인 페이지 조회→신청 완료 퍼널. 신청 페이지 조회는 실제 입력 시작을 뜻하지 않습니다.
서버 데이터와 비교할 때 광고 차단기나 브라우저 종료로 인한 수집 누락을 고려합니다.

## 관리자 화면

`/admin?tab=analytics`에 연결 상태와 집계 대시보드를 표시합니다.
초록색 Live는 해당 iframe의 PostHog 메시지를 받아 로드를 확인한 상태입니다. 네트워크 단절, 로드 오류 또는 확인 시간 초과에는 빨간색으로 표시합니다. 이벤트 수집 성공이나 실시간 차트 갱신을 보증하는 표시는 아닙니다.
사용자가 제공한 코알라 공유 대시보드가 기본으로 연결되어 있습니다. 대시보드 표시는 수집 토큰 설정과 독립적입니다.
아래 환경변수에 다른 주소를 넣으면 기본 연결을 변경합니다.
PostHog에서 집계 대시보드를 만든 뒤 **Share → Embed**의 iframe `src`를 다음 설정에 넣습니다.

```dotenv
VITE_POSTHOG_DASHBOARD_EMBED_URL=https://us.posthog.com/embedded/공유_식별자
```

공유 링크는 관리자 로그인과 별개이며 링크를 가진 사람이 접근할 수 있습니다.
이 방식은 개인별 정보 없는 공개 가능한 집계 전용입니다. 비공개 데이터는 공유하지 말고
관리자 화면의 **PostHog 열기**로 로그인해서 확인합니다. 관리자 권한으로 보호되는 비공개
인앱 통계가 필요하면 백엔드에 PostHog 조회 API 프록시와 권한 검증이 추가로 필요합니다.
개인 API 키를 `VITE_` 환경변수나 localStorage에 넣지 않습니다.

## 수집 범위와 확인

- 관리자, 설정, 비밀번호 재설정, 이메일 인증 화면 제외.
- 자동 클릭/입력 수집, 세션 재생, 오류/성능 자동수집 비활성화.
- 이름, 이메일, 입력 내용, URL 쿼리/해시, 개별 게시물/회원 ID를 전송하지 않음.
- 익명 브라우저 식별자를 사용하며 계정 ID와 연결하지 않음. 기기 간 동일 회원 분석은 지원하지 않음.
- PostHog Live events에서 페이지 이동당 `$pageview`가 한 번 들어오는지 확인.
- 테스트 글/신청 성공 후 해당 완료 이벤트를 확인. 실패 응답에는 완료 이벤트가 없어야 함.
- 관리자 이동/입력 시 이벤트가 없는지 확인. 원격 프로젝트가 없으면 이 확인은 할 수 없음.
- CSP가 있는 배포에서는 해당 PostHog 수집 호스트 연결을 허용해야 합니다.

공식 문서: https://posthog.com/docs/libraries/react
공유/임베드: https://posthog.com/docs/product-analytics/sharing
