import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import type { NodeView, EditorView as ProseMirrorView } from 'prosemirror-view'
import type { EquationPluginKey } from './equation'
import type { RenderEquationEditorFn } from './components/equation-editor'
import type { RenderEquationNodeFn } from './components/equation-node'

type GetPosFn = () => number | undefined

export class EquationView implements NodeView {
  dom: HTMLElement
  private node: ProseMirrorNode
  // Outer ProseMirror editor
  private pm: ProseMirrorView
  private getPos: GetPosFn
  // Plugin key to access plugin state
  private equationPluginKey: EquationPluginKey
  /** `true` if this EquationView is for block equation, `false` if it's
      for inline equation. */
  private isBlock: boolean
  /** A function to render equation editor to HTML document. */
  private renderEquationEditor: RenderEquationEditorFn
  /** A function to render equation node to HTML document. */
  private renderEquationNode: RenderEquationNodeFn
  /** Whether equation editor is open. */
  private isEditing: boolean = false
  /** TeX content from the equation editor. */
  private editorTex: string = ''
  /** A function to clean up equation editor. */
  private cleanupEquationEditor: (() => void) | void | undefined

  constructor(
    node: ProseMirrorNode,
    pm: ProseMirrorView,
    getPos: GetPosFn,
    equationPluginKey: EquationPluginKey,
    isBlock: boolean,
    renderEquationEditor: RenderEquationEditorFn,
    renderEquationNode: RenderEquationNodeFn
  ) {
    // For later usage
    this.node = node
    this.pm = pm
    this.getPos = getPos
    this.equationPluginKey = equationPluginKey
    this.isBlock = isBlock
    this.renderEquationEditor = renderEquationEditor
    this.renderEquationNode = renderEquationNode

    const display = isBlock ? true : node.attrs.display
    this.dom = document.createElement(display ? 'div' : 'span')
    const classes = isBlock
      ? // 'Pomelo-block' enables node selection overlay.
        ['block-equation', 'Pomelo-block']
      : ['inline-equation']
    this.dom.classList.add(...classes)
    this.renderEquationNode({
      dom: this.dom,
      isBlock,
      isInlineDisplay: node.attrs.display,
      tex: node.textContent,
    })
  }

  // ProseMirror -> CodeMirror
  update(node: ProseMirrorNode) {
    if (!node.sameMarkup(this.node)) return false
    // `cancalEdit()` needs the latest version in ProseMirror doc.
    this.node = node
    // Don't re-render equation node when it's being edited since it needs
    // to be consistent with TeX in equation editor.
    if (this.isEditing) return false
    this.renderEquationNode({
      dom: this.dom,
      isBlock: this.isBlock,
      isInlineDisplay: node.attrs.display,
      tex: node.textContent,
    })
    return true
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode')

    // Don't show equation editor when outer ProseMirror view is not
    // editable.
    if (!this.pm.editable) return

    // Allow opening editor when node is selected but editor closed (e.g.
    // after pressing Escape key in a block equation's editor, after
    // undo/redo)
    this.dom.addEventListener('click', this.tryOpenEquationEditorFromNodeClick)

    // Open editor when slash commands request so.
    const pluginState = this.equationPluginKey.getState(this.pm.state)
    if (pluginState?.requestOpenEditor) {
      this.openEquationEditorOnNextAnimationFrame()
    }

    // Don't open editor on caret-triggered selection for block equations.
    // Note that pointer-triggered selection still opens editor — since
    // ProseMirror calls this function on "mouseup", above "click" event
    // handler would run in the same click.
    if (this.isBlock) return

    // Don't open editor on undo/redo and after drag-and-drop a block
    // equation. We achieve that by checking if the document changed in the
    // last transaction. Undo/redo and after drag-and-drop change document,
    // while caret movement and clicking don't.
    if (pluginState?.docChangedInLastTr) return

    this.openEquationEditorOnNextAnimationFrame()
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode')
    this.dom.removeEventListener(
      'click',
      this.tryOpenEquationEditorFromNodeClick
    )
    this.closeEquationEditor()
  }

  destroy() {
    this.closeEquationEditor()
  }

  ignoreMutation() {
    return true
  }

  private tryOpenEquationEditorFromNodeClick = () => {
    // Don't show equation editor when outer ProseMirror view is not
    // editable.
    if (!this.pm.editable) return
    this.openEquationEditorOnNextAnimationFrame()
  }

  // Open editor with requestAnimationFrame to
  // 1. avoid blocking rendering since initializing a CodeMirror editor is
  //    expensive and
  // 2. ensure the CodeMirror editor will get focus because a
  //    requestAnimationFrame callback will be run after ProseMirror sets
  //    selection.
  private openEquationEditorOnNextAnimationFrame() {
    requestAnimationFrame(() => this.openEquationEditor())
  }

  private openEquationEditor() {
    // Prevent opening more than one editor
    if (this.isEditing) return

    this.dom.classList.add('editing-equation')

    this.isEditing = true
    this.editorTex = this.node.textContent
    this.cleanupEquationEditor = this.renderEquationEditor({
      isBlock: this.isBlock,
      initialTex: this.editorTex,
      onChange: (tex) => {
        this.editorTex = tex
        this.renderEquationNode({
          dom: this.dom,
          isBlock: this.isBlock,
          isInlineDisplay: this.node.attrs.display,
          tex,
        })
      },
      getNodeRect: () => this.dom.getBoundingClientRect(),
      cancelEdit: this.cancelEdit.bind(this),
      confirmEdit: this.confirmEdit.bind(this),
    })
  }

  private closeEquationEditor() {
    this.cleanupEquationEditor?.()
    this.cleanupEquationEditor = undefined
    this.isEditing = false
    this.editorTex = ''
    this.dom.classList.remove('editing-equation')
  }

  /**
   * Save equation changes and close editor
   * @param dir Direction that caret is moving towards in the editor, -1
   * means left and 1 means right. If the caret is not moving, then this
   * means which side of the equation node that the caret should appear
   * blinking at. Default: 1 (right).
   */
  private confirmEdit(dir: -1 | 1 = 1) {
    const nextTex = this.editorTex.trim()
    this.closeEquationEditor()

    // When editing an inline equation, if newTeX is empty, delete the node
    // and put caret blinking at the deleted pos.
    if (!this.isBlock && !nextTex) {
      this.deleteEquationNodeAndFocus()
      return true
    }

    // Save changes
    const pos = this.getPos()
    if (pos === undefined) return false
    const { tr } = this.pm.state
    const nextDoc =
      nextTex === this.node.textContent
        ? // Do not replace TeX if it does not change
          tr.doc
        : (() => {
            const TeXStart = pos + 1
            const { doc: changedDoc } = tr.replaceWith(
              TeXStart,
              TeXStart + this.node.nodeSize - 2,
              nextTex ? this.pm.state.schema.text(nextTex) : []
            )
            return changedDoc
          })()

    if (this.isBlock) {
      // When editing a block equation, after saving changes, select the
      // whole block equation node.
      tr.setSelection(NodeSelection.create(nextDoc, pos))
    } else {
      // When editing an inline equation, after saving changes, put caret
      // blinking before or after the inline equation node depending on
      // which direction caret is moving towards.
      const targetPos = pos + (dir < 0 ? 0 : nextTex.length + 2)
      const selection = Selection.near(nextDoc.resolve(targetPos), dir)
      tr.setSelection(selection).scrollIntoView()
    }

    this.pm.dispatch(tr)
    this.pm.focus()
    return true
  }

  /** Cancel equation changes and close editor */
  private cancelEdit() {
    this.closeEquationEditor()

    // When editing an inline equation, if the original TeX is empty,
    // delete the node and put caret blinking at the deleted pos.
    if (!this.node.textContent && !this.isBlock) {
      this.deleteEquationNodeAndFocus()
      return true
    }

    // Re-render equation to the version in the latest ProseMirror doc.
    this.renderEquationNode({
      dom: this.dom,
      isBlock: this.isBlock,
      isInlineDisplay: this.node.attrs.display,
      tex: this.node.textContent,
    })

    if (this.isBlock) this.selectEquationNodeAndFocus()
    else this.putCaretAfterEquationNodeAndFocus()

    return true
  }

  private selectEquationNodeAndFocus() {
    const pos = this.getPos()
    if (pos === undefined) return
    const { tr, doc } = this.pm.state
    this.pm.dispatch(tr.setSelection(NodeSelection.create(doc, pos)))
    /** Focusing ProseMirror may cause perceivable delay, so do it in next
        frame. */
    requestAnimationFrame(() => this.pm.focus())
  }

  private putCaretAfterEquationNodeAndFocus() {
    const pos = this.getPos()
    if (pos === undefined) return
    const equationNodeSize = this.node.nodeSize
    const posAfter = pos + equationNodeSize
    const { tr, doc } = this.pm.state
    this.pm.dispatch(tr.setSelection(TextSelection.near(doc.resolve(posAfter))))
    /** Focusing ProseMirror may cause perceivable delay, so do it in next
        frame. */
    requestAnimationFrame(() => this.pm.focus())
  }

  private deleteEquationNodeAndFocus() {
    const pos = this.getPos()
    if (pos === undefined) return false
    const { tr } = this.pm.state
    const { doc: changedDoc } = tr.delete(pos, pos + this.node.nodeSize)
    tr.setSelection(TextSelection.create(changedDoc, pos))
    this.pm.dispatch(tr)
    /** Focusing ProseMirror may cause perceivable delay, so do it in next
        frame. */
    requestAnimationFrame(() => this.pm.focus())
  }
}
