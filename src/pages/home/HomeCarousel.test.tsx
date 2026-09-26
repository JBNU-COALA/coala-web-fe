import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { siteApi, type SiteBanner } from '../../shared/api/site'
import { HomeCarousel } from './HomeCarousel'

vi.mock('../../shared/api/site', () => ({ siteApi: { getBanners: vi.fn() } }))
const makeBanner = (id: number, values: Partial<SiteBanner> = {}): SiteBanner => ({
  id, title: `배너 ${id}`, description: '테스트 설명', eyebrow: 'COALA', imageUrl: '',
  targetPath: '/about', actionLabel: '자세히 보기', tone: 'green', sortOrder: id, enabled: true, ...values,
})
const mount = () => render(<MemoryRouter><HomeCarousel /></MemoryRouter>)

beforeEach(() => { vi.mocked(siteApi.getBanners).mockResolvedValue([makeBanner(1), makeBanner(2)]) })
afterEach(() => vi.useRealTimers())

describe('home banner carousel', () => {
  it('renders configured banners in order and excludes disabled ones', async () => {
    vi.mocked(siteApi.getBanners).mockResolvedValue([makeBanner(2), makeBanner(3, { enabled: false }), makeBanner(1)])
    const { container } = mount()
    await screen.findByRole('heading', { name: '배너 1' })
    expect(container.querySelectorAll('.home-carousel-slide')).toHaveLength(2)
    expect(screen.queryByRole('heading', { name: '배너 3', hidden: true })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '다음 배너' }))
    expect(screen.getByRole('heading', { name: '배너 2' })).toBeTruthy()
    expect(container.querySelectorAll('[inert]')).toHaveLength(1)
  })

  it('honors an intentionally empty administrator list', async () => {
    vi.mocked(siteApi.getBanners).mockResolvedValue([])
    const { container } = mount()
    await waitFor(() => expect(container.querySelector('.home-carousel')).toBeNull())
  })

  it('keeps working navigation banners when the API is unavailable', async () => {
    vi.mocked(siteApi.getBanners).mockRejectedValue(new Error('offline'))
    mount()
    await act(async () => {})
    expect(screen.getByRole('heading', { name: 'COALA Developer Club' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '동아리 소개' }).getAttribute('href')).toBe('/about')
  })

  it('rejects external redirects in configured action links', async () => {
    vi.mocked(siteApi.getBanners).mockResolvedValue([makeBanner(1, { targetPath: '//untrusted.example' })])
    mount()
    await screen.findByRole('heading', { name: '배너 1' })
    expect(screen.getByRole('link', { name: '자세히 보기' }).getAttribute('href')).toBe('/')
  })

  it('supports touch navigation without treating vertical scroll as swipe', async () => {
    const { container } = mount()
    await screen.findByRole('heading', { name: '배너 1' })
    const carousel = container.querySelector('.home-carousel')!
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 20 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 190, clientY: 200 }] })
    expect(screen.getByRole('heading', { name: '배너 1' })).toBeTruthy()
    fireEvent.touchStart(carousel, { touches: [{ clientX: 220, clientY: 20 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 30, clientY: 25 }] })
    expect(screen.getByRole('heading', { name: '배너 2' })).toBeTruthy()
  })

  it('pauses automatic movement on hover and with the stop control', async () => {
    vi.useFakeTimers()
    const { container } = mount()
    await act(async () => {})
    const carousel = container.querySelector('.home-carousel')!
    fireEvent.mouseEnter(carousel)
    act(() => vi.advanceTimersByTime(13000))
    expect(screen.getByRole('heading', { name: '배너 1' })).toBeTruthy()
    fireEvent.mouseLeave(carousel)
    act(() => vi.advanceTimersByTime(6500))
    expect(screen.getByRole('heading', { name: '배너 2' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '자동 넘김 정지' }))
    act(() => vi.advanceTimersByTime(6500))
    expect(screen.getByRole('heading', { name: '배너 2' })).toBeTruthy()
  })
})
