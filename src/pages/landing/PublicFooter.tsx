import { Link } from 'react-router-dom'
import './public-footer.css'

export function PublicFooter() {
  return <footer className="public-footer">
    <div className="public-footer-inner">
      <Link to="/" className="public-footer-brand" aria-label="코알라 홈"><img src="/coala-logo.svg" alt="COALA 로고" /></Link>
      <div className="public-footer-channels" aria-label="공식 채널 준비 중">
        <button type="button" disabled aria-label="GitHub · 준비 중" title="GitHub · 준비 중"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5v-2.3c-2.7.6-3.3-1.2-3.3-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.2 1.1 2.8.8.1-.6.4-1 .7-1.2-2.2-.3-4.5-1.1-4.5-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.9-.3 2.8 1a9.8 9.8 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .5 1.3.2 2.3.1 2.7 1 1 1 2 1 2.7 0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.8v3.2A10 10 0 0 0 12 2Z" /></svg></button>
        <button type="button" disabled aria-label="인스타그램 · 준비 중" title="인스타그램 · 준비 중"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></button>
        <Link to="/portal" className="public-footer-channel" aria-label="코알라 커뮤니티" title="코알라 커뮤니티"><img src="/coala-logo.svg" alt="" /></Link>
      </div>
      <p>동아리방 : 공과대학 7호관 지하 7009-1호</p>
      <small>© COALA. All rights reserved.</small>
    </div>
  </footer>
}
