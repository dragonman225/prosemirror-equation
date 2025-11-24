interface EquationEditorProps {
  equationNodeRect: DOMRect
  texEditor: HTMLElement
  cancelEdit: () => void
  confirmEdit: () => void
}

/**
 * A function to detach elements from HTML document and clean up effects.
 */
type CleanupEquationEditorFn = () => void

export type RenderEquationEditorFn = typeof renderEquationEditor

/** Default implementation of equation editor. */
export function renderEquationEditor({
  equationNodeRect,
  texEditor,
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
  confirmBtn.innerText = 'Done'
  const enterSign = document.createElement('div')
  enterSign.innerText = '↵'
  confirmBtn.append(enterSign)
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
    document.body.removeChild(portal)
  }
}
