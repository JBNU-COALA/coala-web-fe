export function AdminMenuIcon({ name }: { name: string }) {
  const asset = name === 'education' || name === 'archive' ? 'boards' : name === 'employment' || name === 'comments' ? 'posts' : name === 'audit' || name === 'ai' ? 'reports' : name
  return <img className="admin-menu-art" src={`/admin-icons/${asset}.png`} width={24} height={24} alt="" aria-hidden="true" />
}
