import client from './client'

export type SiteAboutContent = {
  title: string
  description: string
  chips: string[]
}

export type SiteAboutPayload = SiteAboutContent

export const siteApi = {
  getAbout: () => client.get<SiteAboutContent>('/api/site/about').then((response) => response.data),

  updateAbout: (data: SiteAboutPayload) =>
    client.patch<SiteAboutContent>('/api/site/about', data).then((response) => response.data),
}
