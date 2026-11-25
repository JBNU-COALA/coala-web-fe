const logos: Record<string, string> = {
  react: 'react', reactjs: 'react', spring: 'spring', springboot: 'spring',
  typescript: 'typescript', javascript: 'javascript', python: 'python', java: 'java',
  docker: 'docker', kubernetes: 'kubernetes', k8s: 'kubernetes', mysql: 'mysql',
  postgresql: 'postgresql', postgres: 'postgresql', redis: 'redis', nodejs: 'nodejs',
  node: 'nodejs', nextjs: 'nextjs', next: 'nextjs', vue: 'vuejs', vuejs: 'vuejs', git: 'git',
}
export function TechLogo({ name }: { name: string }) {
  const logo = logos[name.toLowerCase().replace(/[^a-z0-9]/g, '')]
  return logo ? <img src={`/tech-logos/${logo}.svg`} alt="" width={20} height={20} loading="lazy" /> : null
}
