interface EquationEditorProps {
  /** Put this into DOM so user can edit TeX. */
  texEditor: HTMLElement
  /** Get DOMRect of the equation node being edited. */
  getNodeRect: () => DOMRect
  /** Discard TeX modification and close editor. */
  cancelEdit: () => void
  /** Commit TeX modification and close editor.  */
  confirmEdit: () => void
}

/**
 * A function to detach elements from HTML document and clean up effects.
 */
type CleanupEquationEditorFn = () => void

export type RenderEquationEditorFn = typeof renderEquationEditor

/** Default implementation of equation editor. */
export function renderEquationEditor({
  texEditor,
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

  const equationNodeRect = getNodeRect()
  const popup = document.createElement('div')
  popup.classList.add('equation-editor-popup')
  popup.role = 'dialog'
  popup.style.position = 'absolute'
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

  const confirmBtn = document.createElement('button')
  confirmBtn.classList.add('equation-editor-confirm-btn', 'os-btn-primary')
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

  popup.append(texEditor, confirmBtn)
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
    }

    function unmount() {
      popup.removeEventListener('animationend', unmount)
      document.body.removeChild(portal)
    }
  }
}
