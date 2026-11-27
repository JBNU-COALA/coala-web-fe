export const availableTechNames = ['React', 'Vue.js', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Spring Boot', 'Node.js', 'Docker', 'Kubernetes', 'MySQL', 'PostgreSQL', 'Redis', 'Git', 'MongoDB', 'Elasticsearch', 'Kibana', 'Logstash', 'Prometheus', 'Grafana', 'Flask', 'MariaDB', 'Oracle', 'AWS', 'Nginx', 'Kafka', 'Jenkins', 'SonarQube', 'GitLab', 'Ansible', 'Harbor', 'Azure', 'Terraform', 'NCP', 'Argo CD']

const logos: Record<string, string> = {
  react: 'react', reactjs: 'react', spring: 'spring', springboot: 'spring',
  typescript: 'typescript', javascript: 'javascript', python: 'python', java: 'java',
  docker: 'docker', kubernetes: 'kubernetes', k8s: 'kubernetes', mysql: 'mysql',
  postgresql: 'postgresql', postgres: 'postgresql', redis: 'redis', nodejs: 'nodejs',
  node: 'nodejs', nextjs: 'nextjs', next: 'nextjs', vue: 'vuejs', vuejs: 'vuejs', git: 'git',
  mongodb: 'mongodb', elasticsearch: 'elasticsearch', kibana: 'kibana', logstash: 'logstash',
  prometheus: 'prometheus', grafana: 'grafana', flask: 'flask', mariadb: 'mariadb', oracle: 'oracle',
  aws: 'aws', amazonwebservices: 'aws', nginx: 'nginx', kafka: 'kafka', apachekafka: 'kafka',
  jenkins: 'jenkins', sonarqube: 'sonarqube', gitlab: 'gitlab', ansible: 'ansible', harbor: 'harbor',
  azure: 'azure', microsoftazure: 'azure', terraform: 'terraform', ncp: 'ncp', navercloud: 'ncp',
  argocd: 'argocd', arogcd: 'argocd',
}
export function TechLogo({ name }: { name: string }) {
  const logo = logos[name.toLowerCase().replace(/[^a-z0-9]/g, '')]
  return logo ? <img src={`/tech-logos/${logo}.${logo === 'ncp' ? 'webp' : 'svg'}`} alt="" width={20} height={20} loading="lazy" /> : null
}
