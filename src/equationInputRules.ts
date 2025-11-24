import { InputRule } from 'prosemirror-inputrules'
import { INLINE_EQUATION_NAME } from './constants'

/** ProseMirror serializes `<br>` as char code 65532 (U+FFFC). */
export const INLINE_EQUATION_PATTERN =
  /(?:^|\s|\uFFFC)\$\$([^\s$](?:.*[^\s$])?)\$\$$/

export function inlineEquationInputRule(): InputRule {
  return new InputRule(
    INLINE_EQUATION_PATTERN,
    (state, match, rawStart, rawEnd) => {
      /** `match[0]` is the whole match, `match[1]` is the TeX part. */
      const wholeMatch = match[0]
      const tex = match[1]
      // const [markupLeft, markupRight] = wholeMatch.split(tex)
      const startsWithWhitespace = /^\s|\uFFFC/.test(wholeMatch)
      const { schema } = state
      return state.tr.replaceWith(
        /** Preserve leading whitespace in the whole match. */
        startsWithWhitespace ? rawStart + 1 : rawStart,
        rawEnd,
        schema.node(INLINE_EQUATION_NAME, null, schema.text(tex))
      )
    }
  )
}
