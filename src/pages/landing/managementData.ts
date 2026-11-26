export type ManagementMember = {
  id: string
  name: string
  role: string
  introduction?: string
  photoUrl?: string
  githubUrl?: string
  linkedinUrl?: string
}

export type ManagementGeneration = {
  id: string
  label: string
  term?: string
  members: ManagementMember[]
}

// Add confirmed generations newest first. Never publish placeholder identities.
export const managementGenerations: ManagementGeneration[] = []
