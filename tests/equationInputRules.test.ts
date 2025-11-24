import { describe, expect, test } from 'vitest'
import { INLINE_EQUATION_PATTERN } from '../src/equationInputRules'

interface TestCase {
  text: string
  shouldMatch: boolean
}

describe('INLINE_EQUATION_PATTERN', () => {
  const testCases: TestCase[] = [
    { text: '$$equation$$', shouldMatch: true }, // start of string
    { text: '$$e$$', shouldMatch: true }, // single char
    { text: 'hello $$equation$$', shouldMatch: true },
    { text: 'hello $$equa$tion$$', shouldMatch: true }, // $ in the middle
    { text: 'hello\uFFFC$$equation$$', shouldMatch: true }, // after a hard_break node, which ProseMirror serializes to `U+FFFC`
    { text: 'hello$$equation$$', shouldMatch: false }, // no space before delim
    { text: '$$ equation$$', shouldMatch: false }, // space after delim
    { text: '$$equation $$', shouldMatch: false }, // space before delim
    { text: '$$equa tion$$', shouldMatch: true }, // space in the middle
    { text: '$$$$', shouldMatch: false }, // empty
    { text: '$$$$$', shouldMatch: false }, // empty
    { text: '$$ $$', shouldMatch: false }, // single space between delim
  ]

  testCases.forEach(({ text, shouldMatch }) => {
    test(`should ${shouldMatch ? 'match' : 'not match'} '${text}'`, () => {
      const match = INLINE_EQUATION_PATTERN.test(text)
      expect(match).toBe(shouldMatch)
    })
  })
})
