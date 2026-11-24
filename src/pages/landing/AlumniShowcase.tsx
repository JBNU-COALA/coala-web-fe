import './showcase.css'

const organizations = [
  { name: 'CJ올리브네트웍스', image: 'cj.svg' },
  { name: '이스타항공', image: 'eastar.png' },
  { name: '한국식품연구원', image: 'kfri.png' },
  { name: '저축은행중앙회', image: 'fsb.jpg' },
  { name: 'GIST', image: 'gist.jpg' },
  { name: 'UNIST', image: 'unist.png' },
  { name: 'ENERZAi', image: 'enerzai.png' },
  { name: '큐픽스', image: 'cupix.svg' },
  { name: 'HD현대', image: 'hd-hyundai.png' },
]

export function AlumniShowcase() {
  return <section className="alumni-showcase" aria-labelledby="alumni-title"><div className="showcase-inner">
    <div className="alumni-heading"><div><p className="section-eyebrow">Alumni</p><h2 id="alumni-title">선배들의 진로</h2></div></div>
    <div className="alumni-window" tabIndex={0} role="region" aria-label="선배들의 진로 목록. 마우스를 올리거나 키보드로 선택하면 슬라이드가 멈춥니다."><div className="alumni-moving-track">{[0, 1].map((copy) => <div className="alumni-logos" key={copy} aria-hidden={copy === 1 ? true : undefined}>{organizations.map((organization) => <figure className={`alumni-logo alumni-logo--${organization.image.split('.')[0]}`} key={organization.name}><div className="alumni-logo-art"><img src={`/alumni/${organization.image}`} alt="" loading="eager" /></div><figcaption>{organization.name}</figcaption></figure>)}</div>)}</div></div>
  </div></section>
}
