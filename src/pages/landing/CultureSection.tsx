import './culture.css'

const courses = [
  {
    name: 'Base', audience: '1학년 / 비전공자', size: '5–6인',
    goal: '인공지능을 학습하기 전, 파이썬에 익숙해지는 과정입니다.',
    format: '매주 1회 대면으로 만나고, 조장이 스터디 활동 자료를 운영진에게 제출합니다.',
    terms: [
      { period: '3월 ~ 4월', description: '파이썬 스터디(랜덤디펜스): 백준 그룹 연습 탭을 활용해 매주 함께 10문제씩 풉니다.', weeks: [
        '파이썬 및 프로그래밍 이해와 설치', '변수, 입출력 및 계산', '자료형 및 조건문', '반복문 및 함수',
      ], start: 0 },
      { period: '5월 ~ 6월', description: 'Teachable Machine을 비롯한 무료 인공지능 도구를 활용해 조별 활동을 진행합니다.', weeks: [
        '1–3주차 복습 및 반복문', '함수, 리스트, 딕셔너리', '파일과 라이브러리 불러오기 실습', '데이터 분석 기초 실습(pandas, NumPy)', 'Teachable Machine 활용 실습',
      ], start: 4 },
    ],
  },
  {
    name: 'Standard', audience: '2학년', size: '3–4인',
    goal: '인공지능의 이론을 학습하고, 머신러닝과 딥러닝을 실습하는 과정입니다.',
    format: '매주 1회 대면으로 만나고, 조장이 학습자료를 운영진에게 제출합니다. 학습자료는 추후 제공됩니다.',
    terms: [
      { period: '3월 ~ 4월', description: 'Jcloud와 Colab을 활용해 머신러닝을 배우고 함께 실습합니다.', weeks: [
        'Jcloud·Colab 환경 구축 및 데이콘 사용법 안내', '머신러닝 분야 및 데이터 분석 프로젝트 이해: 타이타닉 생존 예측', '데이터 분석·전처리 이해 및 머신러닝 프로젝트 진행(1주차 심화)', '딥러닝 분야 이해 및 간단한 딥러닝 프로젝트 진행',
      ], start: 0 },
      { period: '5월 ~ 6월', description: '개인별 인공지능 도구 활용 소규모 프로젝트 또는 조별 데이터 분석 프로젝트를 진행합니다.', weeks: [
        'NLP / LLM 대회 실습: 한국어 문장 관계 분류 대회', '이미지 처리 딥러닝 알고리즘 대회 실습: 관광데이터 AI 경진대회', '데이터 분석 또는 YOLO·OpenCV 영상 인물 추적 프로젝트 중 조별 선택', '조별 개별 프로젝트 진행 및 이론 자료 제공', '조별 프로젝트 발표회',
      ], start: 4 },
    ],
  },
  {
    name: 'Core', audience: '3학년', size: '3–4인',
    goal: '인공지능 기술을 활용한 팀 프로젝트를 진행하는 과정입니다.',
    format: '매주 1회 대면으로 만나고, 조장이 학습 및 팀 프로젝트 진행 사항을 운영진에게 제출합니다.',
    terms: [
      { period: '3월 ~ 4월', description: 'AWS 아카데미로 클라우드·머신러닝·딥러닝을 실습하고, Standard 과정의 Jcloud 실습도 함께 진행합니다. 기계학습·클라우드 기초 학습 모듈과 AWS 기능을 사용할 수 있는 Learner Lab 모듈을 제공합니다.', weeks: [
        'AWS 아카데미 안내, 머신러닝·딥러닝 학습 사이트 소개 및 Standard 과정 공유', '조별 아카데미 모듈 수강 / BERT 및 트랜스포머 기반 자연어 처리 모델 소개', '조별 아카데미 모듈 수강 / 인공지능 서비스·기술 사례 공유(VectorDB, OpenCV, 창업 및 오픈소스)', '조별 아카데미 모듈 수강 / 팀 프로젝트 토의',
      ], start: 0 },
      { period: '5월 ~ 6월', description: '클라우드 기반의 인공지능 서비스를 개발합니다.', weeks: [
        '조별 아카데미 모듈 수강 / 팀 프로젝트 토의', '조별 아카데미 모듈 수강 / 팀 프로젝트 개발', '조별 아카데미 모듈 수강 / 팀 프로젝트 개발', '팀 프로젝트 진행', '조별 프로젝트 발표회',
      ], start: 4 },
    ],
  },
  {
    name: 'Plus', audience: '4학년 이상', size: '인원 미정',
    goal: '취업·대학원 정보 공유와 개발 프로젝트 등 자유로운 활동을 진행합니다.',
    format: '매주 1회 비대면 또는 대면으로 만나고, 조장이 자료를 정리해 운영진에게 제출합니다.',
    terms: [],
  },
]

export function CultureSection() {
  return <section className="culture-section" aria-labelledby="culture-title"><div className="culture-inner">
    <header className="culture-heading"><p className="section-eyebrow">Culture</p><h2 id="culture-title">코알라에서 함께 즐기는 문화</h2></header>
    <div className="culture-courses">{courses.map((course) => <article className="culture-course" key={course.name}>
      <div className="culture-badges"><span>{course.audience}</span>{course.terms.length > 0 && <span>3월 ~ 6월</span>}</div>
      <div className="culture-course-heading"><h3>{course.name}</h3><span>조별 활동 · {course.size}</span></div>
      <p className="culture-goal">{course.goal}</p><p className="culture-format">{course.format}</p>
      {course.terms.length > 0 && <details className="culture-details"><summary>{course.name} 커리큘럼 보기<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><div className="culture-terms">{course.terms.map((term) => <section className="culture-term" key={term.period}><h4>{term.period}</h4><p>{term.description}</p><ol start={term.start}>{term.weeks.map((week, index) => <li key={index}><span>{index + term.start}주차</span><p>{week}</p></li>)}</ol></section>)}</div></details>}
    </article>)}</div>
  </div></section>
}
