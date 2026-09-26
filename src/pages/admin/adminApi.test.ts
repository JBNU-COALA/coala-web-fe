import { afterEach, expect, test, vi } from 'vitest'
import { AxiosHeaders } from 'axios'
import client from '../../shared/api/client'
import { adminApi } from '../../shared/api/admin'
import { siteApi, type SiteBannerPayload } from '../../shared/api/site'
import { boardsApi } from '../../shared/api/boards'
import { infoApi } from '../../shared/api/info'
import { recruitsApi } from '../../shared/api/recruits'
import { servicesApi } from '../../shared/api/services'

const response = <T,>(data: T) => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } })
afterEach(() => vi.restoreAllMocks())

test('shared management methods reuse the existing public API functions', () => {
  const aliases = [
    [adminApi.getBoards, boardsApi.getBoards], [adminApi.createBoard, boardsApi.createBoard], [adminApi.updateBoard, boardsApi.updateBoard],
    [adminApi.getInfoArticle, infoApi.getArticle], [adminApi.updateInfoArticle, infoApi.updateArticle],
    [adminApi.getRecruit, recruitsApi.getRecruit], [adminApi.updateRecruit, recruitsApi.updateRecruit], [adminApi.deleteRecruit, recruitsApi.deleteRecruit],
    [adminApi.getMemberServices, servicesApi.getMemberServices], [adminApi.retireMemberService, servicesApi.retireMemberService],
    [adminApi.getInstanceApplications, servicesApi.getInstanceApplications], [adminApi.updateInstanceApplication, servicesApi.updateInstanceApplication],
    [adminApi.getDomainApplications, servicesApi.getDomainApplications], [adminApi.updateDomainApplication, servicesApi.updateDomainApplication],
  ]
  for (const [admin, shared] of aliases) expect(admin).toBe(shared)
})

test('public delete adapters preserve the admin void response', async () => {
  const board = vi.spyOn(boardsApi, 'deleteBoard').mockResolvedValue(response({ boardId: 3 }))
  const info = vi.spyOn(infoApi, 'deleteArticle').mockResolvedValue(response({ id: 4 }))
  expect(await adminApi.deleteBoard(3)).toBeUndefined()
  expect(await adminApi.deleteInfoArticle(4)).toBeUndefined()
  expect(board).toHaveBeenCalledWith(3)
  expect(info).toHaveBeenCalledWith(4)
})

test('public banners and full admin catalog use separate endpoints', async () => {
  const get = vi.spyOn(client, 'get').mockResolvedValue(response([]))
  expect(await siteApi.getBanners()).toEqual([])
  expect(await adminApi.getBanners()).toEqual([])
  expect(get.mock.calls).toEqual([['/api/site/banners'], ['/api/admin/banners']])
})

test('banner mutations preserve the agreed full-payload contract', async () => {
  const payload: SiteBannerPayload = { title: '소개', eyebrow: '', description: '', imageUrl: '', targetPath: '/about', actionLabel: '소개 보기', tone: 'green', sortOrder: 0, enabled: false }
  const saved = { id: 4, ...payload }
  const post = vi.spyOn(client, 'post').mockResolvedValue(response(saved))
  const patch = vi.spyOn(client, 'patch').mockResolvedValue(response(saved))
  const remove = vi.spyOn(client, 'delete').mockResolvedValue(response(undefined))
  expect(await adminApi.createBanner(payload)).toEqual(saved)
  expect(await adminApi.updateBanner(4, payload)).toEqual(saved)
  await adminApi.deleteBanner(4)
  expect(post).toHaveBeenCalledWith('/api/admin/banners', payload)
  expect(patch).toHaveBeenCalledWith('/api/admin/banners/4', payload)
  expect(remove).toHaveBeenCalledWith('/api/admin/banners/4')
})

test.each(['instances', 'domains'] as const)('inquiry updates use the %s namespace', async (kind) => {
  const patch = vi.spyOn(client, 'patch').mockResolvedValue(response({ id: 'inq-1', reply: '답변', status: 'answered' }))
  await adminApi.updateInquiry(kind, 'inq-1', { status: 'answered', reply: '답변' })
  expect(patch).toHaveBeenCalledWith(`/api/services/${kind}/inquiries/inq-1`, { status: 'answered', reply: '답변' })
})

test('activity requests include mandatory bounded date parameters', async () => {
  const get = vi.spyOn(client, 'get').mockResolvedValue(response([]))
  await adminApi.getStudyRecords('2026-02-01', '2026-02-28')
  expect(get).toHaveBeenCalledWith('/api/study/records', { params: { from: '2026-02-01', to: '2026-02-28' } })
})
