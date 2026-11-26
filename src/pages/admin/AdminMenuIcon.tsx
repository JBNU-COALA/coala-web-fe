const icons: Record<string, string> = {
  stats: '📊', users: '👥', banners: '🖼️', about: '👋', boards: '📚',
  posts: '📝', activity: '📅', reports: '🚨', services: '🧩', instances: '🖥️', domains: '🌐',
}

export function AdminMenuIcon({ name }: { name: string }) {
  return <span className="admin-color-icon" aria-hidden="true">{icons[name]}</span>
}
