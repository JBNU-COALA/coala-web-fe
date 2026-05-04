import { CommunityBanner } from '../community/CommunityBanner'

export function AboutPage() {
  return (
    <section className="coala-content coala-content--about">
      <CommunityBanner title="동아리 소개" tone="about" />

      <section className="surface-card about-empty">
        <p>준비중입니다</p>
      </section>
    </section>
  )
}
