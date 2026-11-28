import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ServiceGallery } from './ServiceGallery'

vi.mock('../../shared/api/client', () => ({ resolveApiAssetUrl: (url: string) => url }))
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('cycles through images in both directions and synchronizes thumbnails', () => {
  render(<ServiceGallery title="프로젝트" images={['/first.png', '/second.png', '/third.png']} />)
  fireEvent.click(screen.getByRole('button', { name: '이전 이미지' }))
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 3' }).getAttribute('src')).toBe('/third.png')
  expect(screen.getByRole('button', { name: '3번 이미지 보기' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 1' }).getAttribute('src')).toBe('/first.png')
  fireEvent.click(screen.getByRole('button', { name: '2번 이미지 보기' }))
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 2' }).getAttribute('src')).toBe('/second.png')
})

it('hides navigation when only one distinct image is available', () => {
  render(<ServiceGallery title="프로젝트" images={['/first.png', '/first.png']} />)
  expect(screen.queryByRole('button')).toBeNull()
})

it('retains the current image until the next image is decoded and keeps both mounted', async () => {
  let finishDecode!: () => void
  const decoded = new Promise<void>((resolve) => { finishDecode = resolve })
  const { container } = render(<ServiceGallery title="프로젝트" images={['/first.png', '/second.png']} />)
  const first = screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 1' })
  const second = container.querySelector<HTMLImageElement>('.project-gallery-slide[aria-hidden="true"] img')!
  second.decode = vi.fn(() => decoded)
  fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 1' })).toBe(first)
  await act(async () => { finishDecode(); await decoded })
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 2' })).toBe(second)
  expect(first.isConnected).toBe(true)
})

it('ignores an older decode when a later navigation finishes first', async () => {
  let finishDecode!: () => void
  const decoded = new Promise<void>((resolve) => { finishDecode = resolve })
  const { container } = render(<ServiceGallery title="프로젝트" images={['/first.png', '/second.png', '/third.png']} />)
  const second = container.querySelectorAll<HTMLImageElement>('.project-gallery-slide img')[1]
  second.decode = vi.fn(() => decoded)
  fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))
  fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 3' })).toBeTruthy()
  await act(async () => { finishDecode(); await decoded })
  expect(screen.getByRole('img', { name: '프로젝트 프로젝트 이미지 3' })).toBeTruthy()
})
