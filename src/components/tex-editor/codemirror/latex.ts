import {
  HighlightStyle,
  LanguageSupport,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

const funcPattern = /\\(?:[^a-z()[\]]|[a-z*]+)/i

/** CodeMirror parser for LaTeX. */
const latexParser = StreamLanguage.define({
  name: 'latex',
  startState() {
    return {
      inInlineVerbatim: false,
      inlineVerbatimFirstPipeMatched: false,
      inBlockVerbatim: false,
      inEquation: false,
      equationDelim: null,
      inKeyword: false,
      inHeadline: false,
      inUrl: false,
      command: null,
      commandArgs: null,
    } as {
      inInlineVerbatim: boolean
      inlineVerbatimFirstPipeMatched: boolean
      inBlockVerbatim: boolean
      inEquation: boolean
      equationDelim: string | null
      inKeyword: boolean
      inHeadline: boolean
      inUrl: boolean
      command: string | null
      commandArgs: string | null
    }
  },
  token(stream, state) {
    // Comment
    if (stream.match('%')) {
      stream.skipToEnd()
      return 'comment'
    }

    // Inline verbatim
    if (!state.inInlineVerbatim && stream.match('\\verb')) {
      if (stream.peek() === '|') state.inInlineVerbatim = true
      return 'macroName.function'
    }

    if (state.inInlineVerbatim) {
      if (!state.inlineVerbatimFirstPipeMatched && stream.match('|')) {
        state.inlineVerbatimFirstPipeMatched = true
        return 'quote'
      }
      // Skip escaped pipe character.
      if (stream.match('\\|')) return 'quote'
      if (stream.match('|')) {
        state.inInlineVerbatim = false
        state.inlineVerbatimFirstPipeMatched = false
        return 'quote'
      }
      // Consume any character.
      if (stream.match(/./)) return 'quote'
    }

    // Equation
    if (
      !state.inEquation &&
      (stream.match('$$') ||
        stream.match('$') ||
        stream.match('\\(') ||
        stream.match('\\['))
    ) {
      state.inEquation = true
      state.equationDelim = stream.current()
      return 'content'
    }

    if (state.inEquation) {
      // Check for equation end
      let endDelim = ''
      switch (state.equationDelim) {
        case '$$':
          endDelim = '$$'
          break
        case '$':
          endDelim = '$'
          break
        case '\\(':
          endDelim = '\\)'
          break
        case '\\[':
          endDelim = '\\]'
          break
      }

      if (stream.match(endDelim)) {
        state.inEquation = false
        state.equationDelim = null
        return 'content'
      }

      // Equation commands inside equations
      if (stream.match(funcPattern)) {
        return 'operator'
      }

      stream.next()
      return 'content'
    }

    // Equation environment
    if (stream.match(/\\(begin|cite|documentclass|end|label|ref|usepackage)/)) {
      if (stream.peek() === '{') state.inKeyword = true
      state.command = stream.current()
      return 'macroName.function'
    }

    if (state.inKeyword) {
      if (stream.match(/{/)) return 'punctuation'
      if (stream.match(/[^}]+/)) {
        state.commandArgs = stream.current()
        if (/verbatim\*?/.test(state.commandArgs)) {
          if (state.command === '\\begin') {
            state.inBlockVerbatim = true
          } else if (state.command === '\\end') {
            state.inBlockVerbatim = false
          }
        }
        state.inKeyword = false
        return 'keyword'
      }
    }

    if (state.inBlockVerbatim) {
      // Look for `\end` and hand control back to `if (state.inKeyword)`,
      // which will close block verbatim if `/verbatim\*?/` command args
      // are found.
      if (stream.match(/\\end/)) {
        if (stream.peek() === '{') state.inKeyword = true
        state.command = stream.current()
        return 'macroName.function'
      }
      stream.skipToEnd()
      return 'quote'
    }

    // Headline
    if (
      stream.match(
        /\\(chapter|frametitle|paragraph|part|section|subparagraph|subsection|subsubparagraph|subsubsection|subsubsubparagraph)/
      )
    ) {
      if (stream.peek() === '{') state.inHeadline = true
      return 'macroName.function'
    }

    if (state.inHeadline) {
      if (stream.match(/{/)) return 'punctuation'
      if (stream.match(/[^}]+/)) {
        state.inHeadline = false
        return 'heading className' // "className" is an alias
      }
    }

    // URL
    if (stream.match(/\\url/)) {
      if (stream.peek() === '{') state.inUrl = true
      return 'macroName.function'
    }

    if (state.inUrl) {
      if (stream.match(/{/)) return 'punctuation'
      if (stream.match(/[^}]+/)) {
        state.inUrl = false
        return 'url'
      }
    }

    // General function pattern
    if (stream.match(funcPattern)) {
      return 'macroName.function'
    }

    // Punctuation
    if (stream.match(/[\[\]{}&]/)) {
      return 'punctuation'
    }

    stream.next()
    return null
  },
})

/** CodeMirror highlight style for LaTeX. */
const latexHighlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    // Equation
    { tag: t.content, class: 'token equation' },
    // Command in equation
    { tag: t.operator, class: 'token equation-command' },
    // Command
    {
      tag: [t.function(t.macroName), t.heading, t.className],
      class: 'token function',
    },
    // Command argument
    { tag: t.keyword, class: 'token keyword' },
    // Comment
    { tag: t.comment, class: 'token comment' },
    // Punctuation
    { tag: t.punctuation, class: 'token punctuation' },
    // CDATA/Verbatim environments
    { tag: t.quote, class: 'token cdata' },
    // URL
    { tag: t.url, class: 'token url' },
  ])
)

/** Create a CodeMirror Extension for LaTeX syntax highlighting. */
export function latex() {
  return new LanguageSupport(latexParser, [latexHighlightStyle])
}
