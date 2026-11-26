import './achievements.css'

const history = [
  { year: '2020', entries: [
    { scope: 'external', name: 'ACM-ICPC 국내 본선', result: '49위' },
    { scope: 'external', name: '에너지 ICT 융합보안 해킹경진대회 대학생부', result: '1위' },
  ] },
  { year: '2021', entries: [
    { scope: 'external', name: 'ACM-ICPC 국내 본선', result: '51위' },
  ] },
  { year: '2022', entries: [
    { scope: 'campus', name: '교내 ACM-ICPC', result: '금상 / 은상' },
    { scope: 'external', name: '부채널정보분석 경진대회', result: '소장상' },
    { scope: 'external', name: '암호분석 경진대회', result: '특별상' },
    { scope: 'external', name: '지역ICT이노베이션스퀘어 확산사업 AI코딩 경진대회', result: '최우수상' },
  ] },
  { year: '2023', entries: [
    { scope: 'campus', name: '교내 제1회 Hacking Contest', result: '특별상' },
    { scope: 'external', name: '전주ICT이노베이션스퀘어 AI코딩대회', result: '대상(1위) / 우수상' },
    { scope: 'external', name: 'K-Hackathon 11 애플리케이션 부문', result: '우수상' },
  ] },
  { year: '2024', entries: [
    { scope: 'campus', name: '제2회 오픈소스 해커톤', result: '최우수상' },
    { scope: 'external', name: '제5회 오아시스 해커톤', result: '최우수상' },
    { scope: 'external', name: '화이트햇스쿨 2기 우수프로젝트', result: '한국정보기술연구원장상' },
    { scope: 'external', name: '한국장애인재단 장애인 해커톤', result: '입선' },
    { scope: 'campus', name: '전북대학교 캡스톤 경진대회', result: '대상 / 최우수상 / 우수상' },
  ] },
  { year: '2025', entries: [
    { scope: 'external', name: '한국컴퓨터종합학술대회(KCC 2025)', result: '학부 논문 우수상' },
    { scope: 'external', name: 'Kubestronaut', result: '취득' },
  ] },
] as const

export function AchievementTimeline() {
  return <section className="achievement-section" aria-labelledby="achievement-title">
    <div className="achievement-inner">
      <header className="achievement-heading"><h2 id="achievement-title">수상 및 자격 취득 이력</h2></header>
      <ol className="achievement-timeline">{history.map(({ year, entries }) => <li className="achievement-year" key={year}>
        <h3><time dateTime={year}>{year}</time></h3>
        <ul>{entries.map((entry) => <li className={`achievement-item is-${entry.scope}`} key={`${entry.name}-${entry.result}`}><span className="achievement-scope">{entry.scope === 'campus' ? '교내' : '교외'}</span><span className="achievement-name">{entry.name}{entry.name === 'Kubestronaut' && <img className="achievement-cert-logo" src="/kubestronaut.svg" alt="" loading="lazy" />}</span><strong>{entry.result}</strong></li>)}</ul>
      </li>)}</ol>
    </div>
  </section>
}
