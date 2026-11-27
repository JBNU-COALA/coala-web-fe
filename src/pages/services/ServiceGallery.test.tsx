import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ServiceGallery } from './ServiceGallery'

vi.mock('../../shared/api/client', () => ({ resolveApiAssetUrl: (url: string) => url }))
afterEach(cleanup)

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
