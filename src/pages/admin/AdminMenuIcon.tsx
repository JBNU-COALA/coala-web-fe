export function AdminMenuIcon({ name }: { name: string }) {
  const asset = name === 'education' ? 'boards' : name === 'employment' ? 'posts' : name
  return <img className="admin-menu-art" src={`/admin-icons/${asset}.png`} width={24} height={24} alt="" aria-hidden="true" />
}
