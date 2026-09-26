import client from './client'

export type SiteAboutContent = {
  title: string
  description: string
  chips: string[]
}

export type SiteAboutPayload = SiteAboutContent

export type SiteBanner = {
  id: number
  title: string
  eyebrow: string
  description: string
  imageUrl: string
  targetPath: string
  actionLabel: string
  tone: 'green' | 'blue' | 'coral'
  sortOrder: number
  enabled: boolean
}

export type SiteBannerPayload = Omit<SiteBanner, 'id'>

export const siteApi = {
  getBanners: () => client.get<SiteBanner[]>('/api/site/banners').then((response) => response.data),

  getAbout: () => client.get<SiteAboutContent>('/api/site/about').then((response) => response.data),

  updateAbout: (data: SiteAboutPayload) =>
    client.patch<SiteAboutContent>('/api/site/about', data).then((response) => response.data),
}
