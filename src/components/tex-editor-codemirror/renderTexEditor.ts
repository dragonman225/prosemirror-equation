import type { KeyBinding } from '@codemirror/view'

interface TexEditorProps {
  /** Initial TeX content. */
  initialTex?: string
  /** When the content changes. */
  onChange?: (tex: string) => void
  /** When the user presses `Enter` in the editor. */
  onEnter?: () => void
  /** When the user presses `Escape` in the editor. */
  onEscape?: () => void
  /**
   * Called when the user attempts to move caret out of the editor. This
   * happens when the user presses `ArrowLeft` at the start of the editor
   * (`dir = -1`) or `ArrowRight` at the end of the editor (`dir = 1`).
   */
  onAttemptCaretExit?: (dir: -1 | 1) => void
}

export async function renderTexEditor({
  initialTex,
  onChange,
  onEnter,
  onEscape,
  onAttemptCaretExit,
}: TexEditorProps): Promise<{
  dom: Element
  getTex: () => string
  focus: (options?: { selectAll?: boolean }) => void
  destroy: () => void
}> {
  /**
   * `onEnter` and `onEscape` are always able to perform their side
   * effects, so these commands always return `true`.
   */
  function onEnterCommand() {
    onEnter?.()
    return true
  }

  function onEscapeCommand() {
    onEscape?.()
    return true
  }

  /**
   * Determine whether to attempt to move caret out of the editor.
   *
   * When `unit = 'char'`, it should happen when called with `dir = -1` and
   * the caret being at the start of the content or `dir = 1` and the caret
   * being at the end of the content.
   *
   * @see `maybeEscape` in the "Embedded code editor" example
   * https://prosemirror.net/examples/codemirror/
   */
  function mayAttemptCaretExit(unit: 'line' | 'char', dir: -1 | 1) {
    // Check if caret can be moved out.
    const { state } = cm
    const { main } = state.selection
    if (!main.empty) return false
    let mainSel: { from: number; to: number } = main
    if (unit == 'line') mainSel = state.doc.lineAt(main.head)
    if (dir < 0 ? mainSel.from > 0 : mainSel.to < state.doc.length) return false

    // Caret can be moved out.
    onAttemptCaretExit?.(dir)
    return true
  }

  const [
    { closeBrackets },
    { defaultKeymap, history, historyKeymap },
    { bracketMatching },
    { EditorView: CodeMirrorView, keymap: cmKeymap, highlightSpecialChars },
    { editorTheme },
    { latex },
  ] = await Promise.all([
    import('@codemirror/autocomplete'),
    import('@codemirror/commands'),
    import('@codemirror/language'),
    import('@codemirror/view'),
    import('./editorTheme'),
    import('./latex'),
  ])

  const texEditorKeymap: KeyBinding[] = [
    { key: 'ArrowLeft', run: () => mayAttemptCaretExit('char', -1) },
    { key: 'ArrowRight', run: () => mayAttemptCaretExit('char', 1) },
    { key: 'Enter', run: onEnterCommand },
    { key: 'Escape', run: onEscapeCommand },
  ]

  const cm = new CodeMirrorView({
    doc: initialTex,
    extensions: [
      cmKeymap.of([...texEditorKeymap, ...historyKeymap, ...defaultKeymap]),
      highlightSpecialChars(),
      bracketMatching(),
      closeBrackets(),
      history(),
      latex(), // LaTeX syntax highlighting
      editorTheme,
      CodeMirrorView.lineWrapping,
      CodeMirrorView.updateListener.of(
        (update) => update.docChanged && onChange?.(update.state.doc.toString())
      ),
    ],
  })

  return {
    dom: cm.dom,
    getTex: () => cm.state.doc.toString(),
    focus: (options) => {
      if (options?.selectAll) {
        cm.dispatch({ selection: { anchor: 0, head: cm.state.doc.length } })
      }
      cm.focus()
    },
    destroy: () => cm.destroy(),
  }
}
