import type { RecruitingPositionIconName } from './RecruitingPositionIcon'

type Position = {
  slug: string
  title: string
  description: string
  icon: RecruitingPositionIconName
  vision: string
  work: string[]
  lookingFor: string[]
  plus: string[]
  tools: string[]
  question: string
  answer: string
}

// Editorial content for the public recruiting site, independent of community posts.
export const positions: Position[] = [
  {
    slug: 'frontend', title: 'Frontend Engineer', icon: 'react',
    description: '사용자 친화적이고 인터랙티브한 웹 UI를 구현해요.',
    vision: '작은 상호작용부터 전체 흐름까지, 누구나 편하게 사용할 수 있는 웹 경험을 고민해요.',
    work: ['디자인을 반응형 웹 화면과 재사용 가능한 컴포넌트로 구현해요.', '백엔드와 API를 연결하고 로딩·오류·빈 화면까지 세심하게 다뤄요.', '접근성과 성능을 점검하며 더 편리한 사용 경험을 만들어요.'],
    lookingFor: ['컴포넌트 단위로 UI를 설계하고, 상태 변화에 반응하는 인터랙티브한 화면을 구현할 수 있는 분', '사용자 관점에서 UX와 인터랙션 디테일을 개선할 수 있는 분', '코드 리뷰로 의견을 주고받으며 코드 품질을 함께 높이는 분'],
    plus: ['React나 TypeScript로 화면을 만들어 본 경험', '반응형 레이아웃 또는 웹 접근성을 고민해 본 경험', 'API 연동이나 상태 관리 경험'],
    tools: ['React', 'Vue', 'TypeScript', 'Git', 'AI 관련 툴 (ex. Claude, Codex)'],
    question: 'React 경험이 많아야 하나요?', answer: '경험의 양보다 무엇을 배우고 어떻게 문제를 해결했는지 이야기해 주세요. 작은 웹 페이지나 학습 기록도 나를 소개하는 좋은 출발점이에요.',
  },
  {
    slug: 'backend', title: 'Backend Engineer', icon: 'spring',
    description: '확장 가능한 API와 데이터 구조를 설계하고 구현해요.',
    vision: '보이지 않는 곳에서 서비스가 안정적으로 작동하도록, 데이터와 로직의 흐름을 설계해요.',
    work: ['서비스에 필요한 API와 비즈니스 로직을 구현해요.', '데이터 모델을 설계하고 데이터베이스와 연결해요.', '테스트와 로그를 바탕으로 오류를 찾고 안정성을 개선해요.'],
    lookingFor: ['RESTful API를 설계하고 데이터베이스와 연동해 기능을 구현할 수 있는 분', '요구사항을 분석해 데이터 모델과 비즈니스 로직으로 구조화할 수 있는 분', 'API 명세를 기준으로 프론트엔드·앱 팀과 원활하게 협업할 수 있는 분'],
    plus: ['Java 또는 Spring으로 API를 만들어 본 경험', 'SQL과 데이터베이스 설계 경험', '테스트 코드 작성 또는 서버 배포 경험'],
    tools: ['Java', 'Spring', 'Node.js', 'SQL', 'MySQL', 'PostgreSQL', 'Git', 'AI 관련 툴 (ex. Claude, Codex)'],
    question: '어떤 프로젝트 경험을 소개하면 좋을까요?', answer: '규모가 작아도 괜찮아요. 직접 만든 API나 데이터 모델을 소개하고, 설계 이유와 해결했던 문제를 함께 이야기해 주세요.',
  },
  {
    slug: 'ios', title: 'iOS Engineer', icon: 'apple',
    description: 'Swift 기반으로 매끄럽고 직관적인 iOS 앱을 구현해요.',
    vision: '기기의 특성과 사용자의 흐름을 이해하며, 손끝에서 자연스럽게 이어지는 모바일 경험을 만들어요.',
    work: ['Swift로 앱 화면과 사용자 인터랙션을 구현해요.', 'API를 연결하고 앱의 데이터와 상태를 관리해요.', '다양한 화면 크기와 앱 생명주기를 고려해 동작을 점검해요.'],
    lookingFor: ['SwiftUI 또는 UIKit으로 화면을 구성하고 사용자 인터랙션을 구현할 수 있는 분', 'Human Interface Guidelines를 이해하고 사용성 디테일을 챙기는 분', '비동기 처리와 상태 관리를 고려해 안정적인 앱 구조를 고민하는 분'],
    plus: ['SwiftUI 또는 UIKit으로 화면을 만든 경험', '네트워크 통신이나 비동기 처리 경험', '앱 테스트 또는 배포 과정에 대한 관심'],
    tools: ['Swift', 'SwiftUI', 'Xcode', 'Git', 'AI 관련 툴 (ex. Claude, Codex)'],
    question: '출시한 앱이 있어야 하나요?', answer: '출시 이력만으로 경험을 설명할 필요는 없어요. 구현한 화면이나 작은 기능, 개발하며 고민했던 내용을 중심으로 준비해 주세요.',
  },
  {
    slug: 'android', title: 'Android Engineer', icon: 'android',
    description: 'Kotlin 기반으로 다양한 기기에 최적화된 앱을 구현해요.',
    vision: '다양한 기기에서도 일관되고 편리하게 사용할 수 있는 안드로이드 앱을 고민해요.',
    work: ['Kotlin으로 앱 화면과 기능을 구현해요.', '서버와 데이터를 주고받고 화면의 상태를 관리해요.', '기기 환경과 생명주기를 고려해 앱의 안정성을 개선해요.'],
    lookingFor: ['Kotlin과 Jetpack Compose로 화면과 기능을 구현할 수 있는 분', '생명주기와 다양한 기기 환경을 고려해 안정적으로 동작하는 앱을 만드는 분', '버그의 원인을 추적하고 재현·해결 과정을 공유할 수 있는 분'],
    plus: ['Kotlin이나 Jetpack Compose를 사용해 본 경험', 'API 연동 또는 로컬 데이터 저장 경험', '앱 구조나 테스트에 대해 고민해 본 경험'],
    tools: ['Kotlin', 'Jetpack Compose', 'Android Studio', 'Git', 'AI 관련 툴 (ex. Claude, Codex)'],
    question: '어떤 내용을 공부해 두면 좋을까요?', answer: 'Kotlin의 기본 문법과 화면 구성부터 시작해 보세요. 버튼을 누르면 상태가 바뀌는 작은 앱을 만들고, 동작 과정을 설명해 보는 것도 좋아요.',
  },
  {
    slug: 'ai-ml', title: 'AI / ML Engineer', icon: 'ai',
    description: '데이터와 모델로 실제 문제를 해결하는 AI 기능을 구현해요.',
    vision: '기술 자체보다 해결할 문제에 집중하며, AI가 실제로 도움이 되는 경험을 실험해요.',
    work: ['문제에 맞는 데이터를 살펴보고 실험 방법을 설계해요.', '모델과 AI 도구를 활용해 아이디어를 프로토타입으로 구현해요.', '결과를 비교하고 한계와 개선 방향을 기록해요.'],
    lookingFor: ['Python으로 데이터를 전처리·분석하고 모델 실험을 진행할 수 있는 분', '평가 지표를 기준으로 실험 결과를 비교하고 개선 방향을 도출하는 분', 'LLM과 모델을 실제 서비스 기능으로 연결하는 과정에 관심 있는 분'],
    plus: ['Python으로 데이터를 분석해 본 경험', '머신러닝 모델이나 LLM을 활용한 프로젝트 경험', '실험 결과를 비교하고 정리한 경험'],
    tools: ['Python', 'Jupyter', 'AI 관련 툴 (ex. Claude, Codex, Gemini)'],
    question: 'AI 도구 활용 경험도 소개해도 되나요?', answer: '좋아요. 어떤 문제를 풀기 위해 도구를 선택했는지, 결과를 어떻게 확인하고 개선했는지 함께 설명해 주세요.',
  },
  {
    slug: 'devops', title: 'DevOps Engineer', icon: 'jenkins',
    description: 'CI/CD와 인프라를 구축해 안정적인 서비스 운영을 책임져요.',
    vision: '개발한 기능이 사용자에게 안정적으로 전달되도록, 반복 가능한 배포와 운영 흐름을 만들어요.',
    work: ['빌드와 배포 과정을 자동화하고 개발 환경을 정리해요.', '로그와 지표로 서비스 상태를 확인해요.', '장애 원인을 분석하고 복구 과정과 운영 지식을 문서로 남겨요.'],
    lookingFor: ['Linux와 Docker 환경에서 서비스를 빌드하고 배포해 본 분', '반복 작업을 스크립트와 CI/CD 파이프라인으로 자동화할 수 있는 분', '모니터링 지표와 로그를 기반으로 장애 원인을 분석하고 대응하는 분'],
    plus: ['Linux 또는 Docker를 사용해 본 경험', 'CI/CD 파이프라인 구성 경험', '서버 모니터링이나 클라우드 환경에 대한 관심'],
    tools: ['Jenkins', 'Docker', 'Kubernetes', 'Linux', 'Git', 'GitLab', 'Go', 'Prometheus', 'AI 관련 툴 (ex. Claude, Codex)'],
    question: '운영 경험이 없어도 준비할 수 있나요?', answer: '작은 서비스를 직접 실행하고 배포해 보세요. 자동화해 보고 싶은 작업이나 오류를 해결한 과정을 정리하면 관심과 학습 경험을 잘 보여줄 수 있어요.',
  },
]
