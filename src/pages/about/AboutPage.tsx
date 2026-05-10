import { CommunityBanner } from '../community/CommunityBanner'

export function AboutPage() {
  return (
    <section className="coala-content coala-content--about">
      <div className="about-page">
        <CommunityBanner title="동아리 소개" tone="about" />

        <section className="surface-card about-intro">
          <p className="about-intro-eyebrow">COALA</p>
          <h3>함께 만들고 운영하는 개발 동아리</h3>
          <p>
            코알라는 프로젝트, 스터디, 서비스 운영을 통해 개발 경험을 쌓는 전북대학교 개발 동아리입니다.
          </p>
          <div className="about-intro-grid">
            <span>프로젝트</span>
            <span>스터디</span>
            <span>서비스 운영</span>
            <span>커뮤니티</span>
          </div>
        </section>
      </div>
    </section>
  )
}
