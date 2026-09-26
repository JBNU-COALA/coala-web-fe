import { expect, test } from 'vitest'
import { isHttpUrl, isImageUrl, isInternalPath } from './adminValidation.ts'

test('banner destinations allow internal routes, queries, and fragments', () => {
  for (const path of ['/', '/about', '/community/activity?group=42', '/services#official', '/community/board?q=%ED%99%9C%EB%8F%99']) {
    expect(isInternalPath(path), path).toBe(true)
  }
})

test('banner destinations reject external, protocol-relative, and encoded redirects', () => {
  for (const path of ['', 'https://example.com', 'javascript:alert(1)', '//example.com', '/\\example.com', '/%2fexample.com', '/%252fexample.com', '/%5cexample.com', '/%255cexample.com']) {
    expect(isInternalPath(path), path).toBe(false)
  }
})

test('banner destinations reject controls, invalid encoding, and unbounded decoding', () => {
  for (const path of ['/x\ny', '/%00', '/%0d%0aexample', '/%7f', '/x y', '/%zz', '/%2525252525252fexample.com']) {
    expect(isInternalPath(path), path).toBe(false)
  }
})

test('optional banner image permits only empty, internal, or HTTP(S) URLs', () => {
  for (const url of ['', '/images/banner.png', 'https://example.com/banner.png', 'http://localhost/banner.jpg']) {
    expect(isImageUrl(url), url).toBe(true)
  }
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/banner.png', '/%2fexample.com', 'file:///banner.png', 'not a URL']) {
    expect(isImageUrl(url), url).toBe(false)
  }
})

test('service URLs require HTTP(S)', () => {
  expect(isHttpUrl('https://example.com')).toBe(true)
  expect(isHttpUrl('http://localhost:8080/service')).toBe(true)
  for (const url of ['', '/services', 'example.com', 'file:///tmp/file', 'javascript:alert(1)']) expect(isHttpUrl(url), url).toBe(false)
})
