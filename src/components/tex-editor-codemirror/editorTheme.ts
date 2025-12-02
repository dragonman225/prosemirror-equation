import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export const editorTheme: Extension = EditorView.theme({
  '&': {
    color: 'var(--text-normal)',
    transition:
      'background-color var(--theme-switch-duration) var(--theme-switch-easing)',
    fontSize: '0.875rem',
  },
  '.cm-scroller': {
    fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace`,
    lineHeight: '1.5',
    maxHeight: '50vh',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '& .cm-content': {
    caretColor: 'var(--text-normal)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text-normal)' },
})
