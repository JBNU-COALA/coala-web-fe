import { expect, it } from 'vitest'
import { serializeServiceFeatures } from './serviceFeatures'

it('preserves indentation and empty lines without sending blank API entries', () => {
  const text = '\n\t첫 기능\n\n  둘째 기능\n\t세부 내용\n'
  const features = serializeServiceFeatures(text)
  expect(features.join('\n')).toBe(text)
  expect(features.every((feature) => feature.trim().length > 0)).toBe(true)
  expect(serializeServiceFeatures(' \n\t')).toEqual([])
})
