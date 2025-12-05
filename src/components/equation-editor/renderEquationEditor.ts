import { renderTexEditor, type TexEditorProps } from '../tex-editor-codemirror'

interface EquationEditorConfig {
  /**
   * A function to load custom theme for the editor. It should return a
   * Promise that resolves to a CodeMirror extension created with
   * `EditorView.theme()`. This allows the editor to dynamically import
   * `@codemirror/view`.
   */
  loadTexEditorTheme?: TexEditorProps['loadTheme']
}

interface EquationEditorProps {
  /** Whether the equation node is a block equation. */
  isBlock: boolean
  /** Initial TeX content. */
  initialTex: string
  /** When the content changes. */
  onChange: (tex: string) => void
  /** Get DOMRect of the equation node being edited. */
  getNodeRect: () => DOMRect
  /** Discard TeX modification and close editor. */
  cancelEdit: () => void
  /**
   * Commit TeX modification and close editor.
   *
   * @param dir Indicate the side of the equation node that the caret
   * should appear blinking at after closing the editor. -1 means left and
   * 1 means right. Default: 1 (right).
   */
  confirmEdit: (dir?: -1 | 1) => void
}

/**
 * A function to detach elements from HTML document and clean up effects.
 */
type CleanupEquationEditorFn = () => void

/** @experimental */
export type RenderEquationEditorFn = (
  props: EquationEditorProps
) => void | CleanupEquationEditorFn

/**
 * Default implementation of equation editor.
 * @experimental
 */
export function createEquationEditorRenderer({
  loadTexEditorTheme,
}: EquationEditorConfig = {}) {
  return function renderEquationEditor({
    isBlock,
    initialTex,
    onChange,
    getNodeRect,
    cancelEdit,
    confirmEdit,
  }: EquationEditorProps): void | CleanupEquationEditorFn {
    const portal = document.createElement('div')
    portal.classList.add('equation-editor-portal')

    // Cancel editing when clicking outside popup
    function handlePortalClick(event: MouseEvent) {
      if (event.target === portal) cancelEdit()
    }
    portal.addEventListener('click', handlePortalClick)

    const popup = document.createElement('div')
    popup.classList.add('equation-editor-popup')
    popup.role = 'dialog'
    popup.style.position = 'absolute'
    const equationNodeRect = getNodeRect()
    popup.style.left = equationNodeRect.left + 'px'
    popup.style.setProperty('--equation-left', equationNodeRect.left + 'px')
    // Place popup below or above equation — at the side which has more space
    const windowHeight = window.innerHeight
    const spaceAbove = equationNodeRect.top
    const spaceBelow = windowHeight - equationNodeRect.bottom
    if (spaceAbove > spaceBelow) {
      popup.style.bottom = `calc(100vh - ${equationNodeRect.top}px)`
      popup.style.transformOrigin = '0% bottom'
    } else {
      popup.style.top = equationNodeRect.bottom + 'px'
      popup.style.transformOrigin = '0% top'
    }

    const texEditorPlaceholder = document.createElement('div')
    texEditorPlaceholder.classList.add('tex-editor-placeholder')

    let texEditor: Awaited<ReturnType<typeof renderTexEditor>> | undefined

    renderTexEditor({
      initialTex,
      loadTheme: loadTexEditorTheme,
      onChange,
      onEnter: confirmEdit,
      onEscape: cancelEdit,
      onAttemptCaretExit: (dir) => {
        // Don't move caret out when editing a block equation.
        if (isBlock) return
        confirmEdit(dir)
      },
    }).then((resolvedTexEditor) => {
      texEditor = resolvedTexEditor
      // If placeholder is no longer in DOM, it means the editor has been
      // closed before CodeMirror finished loading. Destroy the editor to
      // prevent memory leaks.
      if (texEditorPlaceholder.parentElement) {
        texEditorPlaceholder.replaceWith(texEditor.dom)
        texEditor.focus({ selectAll: true })
      } else {
        texEditor.destroy()
      }
    })

    const confirmBtn = document.createElement('button')
    confirmBtn.classList.add('equation-editor-confirm-btn', 'btn-primary')
    const text = document.createElement('span')
    text.classList.add('text')
    text.innerText = 'Done'
    const icon = document.createElement('div')
    icon.classList.add('icon')
    icon.innerText = '↵'
    confirmBtn.append(text, icon)
    function handleConfirmBtnClick() {
      confirmEdit()
    }
    confirmBtn.addEventListener('click', handleConfirmBtnClick)

    popup.append(texEditorPlaceholder, confirmBtn)
    portal.append(popup)
    document.body.append(portal)

    return () => {
      portal.removeEventListener('click', handlePortalClick)
      confirmBtn.removeEventListener('click', handleConfirmBtnClick)
      animateClose()

      function animateClose() {
        const durationMs = 200
        // Reverse animation sometimes doesn't animate and doesn't end.
        popup.style.animation = `equation-fade-scale-out ${durationMs}ms ease forwards`
        popup.addEventListener('animationend', unmount)
        // Force unmount if animation doesn't end, for example, when
        // style/equation.css is not loaded.
        setTimeout(unmount, durationMs * 2)
      }

      function unmount() {
        popup.removeEventListener('animationend', unmount)
        // The TeX editor may or may not have been created when the user
        // closes the equation editor due to dynamic import.
        texEditor?.destroy()
        portal.remove()
      }
    }
  }
}
