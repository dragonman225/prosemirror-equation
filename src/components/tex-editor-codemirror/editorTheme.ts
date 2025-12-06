import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export const editorTheme: Extension = EditorView.theme({
  '&': {
    color: 'var(--text-color)',
    transition:
      'background-color var(--theme-switch-duration) var(--theme-switch-easing)',
    fontSize: 'var(--tex-editor-font-size)',
    '--text-color': 'rgb(55, 53, 47)',
  },
  '.cm-scroller': {
    fontFamily: `var(--font-mono)`,
    lineHeight: 'var(--tex-editor-line-height)',
    maxHeight: 'var(--tex-editor-max-height)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '& .cm-content': {
    caretColor: 'var(--text-color)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text-color)' },
})
