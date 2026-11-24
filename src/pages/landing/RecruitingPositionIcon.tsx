export type RecruitingPositionIconName = 'react' | 'spring' | 'apple' | 'android' | 'ai' | 'jenkins'

export function RecruitingPositionIcon({ name }: { name: RecruitingPositionIconName }) {
  if (name === 'ai') {
    return <span className="rc-position-icons" role="img" aria-label="Claude, Codex, Gemini">
      <img src="/recruiting/claude.svg" alt="" />
      <img src="/recruiting/codex.svg" alt="" />
      <img src="/recruiting/gemini.svg" alt="" />
    </span>
  }

  return <img className="rc-position-icon" src={`/recruiting/${name}.svg`} alt={{ apple: 'Apple', android: 'Android', jenkins: 'Jenkins', react: 'React', spring: 'Spring' }[name]} />
}
