import { closeBrackets } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  LanguageSupport,
  StreamLanguage,
  bracketMatching,
} from '@codemirror/language'
import {
  Compartment,
  type Extension as CodeMirrorExtension,
} from '@codemirror/state'
import {
  EditorView as CodeMirrorView,
  keymap as cmKeymap,
  highlightSpecialChars,
  type KeyBinding,
} from '@codemirror/view'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import type { NodeView, EditorView as ProseMirrorView } from 'prosemirror-view'
import type { EquationPluginKey } from './equation'
import type { RenderEquationEditorFn } from './renderEquationEditor'

// Hold language support extension to be used in CodeMirror
const languageConf = new Compartment()

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
  /** CodeMirror extensions for theme and highlighting style. */
  private additionalCodemirrorExtensions: CodeMirrorExtension[]
  /** Whether equation editor is open. */
  private isEditing: boolean = false
  /** A function to clean up equation editor. */
  private cleanupEquationEditor: (() => void) | void | undefined
  // CodeMirror as equation editor
  private cm: CodeMirrorView | undefined
  // LaTeX language support for CodeMirror. Will be imported and prepared
  // dynamically on first use.
  private static latexLanguageSupport: LanguageSupport | undefined

  constructor(
    node: ProseMirrorNode,
    pm: ProseMirrorView,
    getPos: GetPosFn,
    equationPluginKey: EquationPluginKey,
    isBlock: boolean,
    renderEquationEditor: RenderEquationEditorFn,
    additionalCodemirrorExtensions: CodeMirrorExtension[] = []
  ) {
    // For later usage
    this.node = node
    this.pm = pm
    this.getPos = getPos
    this.equationPluginKey = equationPluginKey
    this.isBlock = isBlock
    this.renderEquationEditor = renderEquationEditor
    this.additionalCodemirrorExtensions = additionalCodemirrorExtensions

    const display = isBlock ? true : node.attrs.display
    this.dom = document.createElement(display ? 'div' : 'span')
    const classes = isBlock
      ? // 'Pomelo-block' enables node selection overlay.
        ['block-equation', 'Pomelo-block']
      : ['inline-equation']
    this.dom.classList.add(...classes)
    renderEquationNode({
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
    renderEquationNode({
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

    this.cm = new CodeMirrorView({
      doc: this.node.textContent,
      extensions: [
        this.additionalCodemirrorExtensions,
        cmKeymap.of([
          ...this.equationEditorKeymap(),
          ...historyKeymap,
          ...defaultKeymap,
        ]),
        highlightSpecialChars(),
        bracketMatching(),
        closeBrackets(),
        history(),
        CodeMirrorView.lineWrapping,
        CodeMirrorView.updateListener.of(
          (update) =>
            update.docChanged &&
            renderEquationNode({
              dom: this.dom,
              isBlock: this.isBlock,
              isInlineDisplay: this.node.attrs.display,
              tex: update.state.doc.toString(),
            })
        ),
        // LaTeX language support will be loaded dynamically.
        languageConf.of(EquationView.latexLanguageSupport || []),
      ],
    })

    this.loadLatexLanguageSupport()

    const getNodeRect = () => this.dom.getBoundingClientRect()
    this.isEditing = true
    this.cleanupEquationEditor = this.renderEquationEditor({
      texEditor: this.cm.dom,
      getNodeRect,
      cancelEdit: this.cancelEdit.bind(this),
      confirmEdit: this.confirmEdit.bind(this),
    })

    this.cm.dispatch({
      selection: { anchor: 0, head: this.node.textContent.length },
    })
    this.cm.focus()
  }

  private closeEquationEditor() {
    // TODO: Extract TeX editor so it can work with delayed cleanup due to
    // animation.
    // this.cm?.destroy()
    this.cm = undefined
    this.cleanupEquationEditor?.()
    this.cleanupEquationEditor = undefined
    this.isEditing = false
    this.dom.classList.remove('editing-equation')
  }

  private equationEditorKeymap(): KeyBinding[] {
    return [
      { key: 'ArrowLeft', run: () => this.mayMoveCaretOut('char', -1) },
      { key: 'ArrowRight', run: () => this.mayMoveCaretOut('char', 1) },
      { key: 'Enter', run: () => this.confirmEdit() },
      { key: 'Escape', run: () => this.cancelEdit() },
    ]
  }

  // Try to move caret from equation editor (CodeMirror) to host document
  // editor (ProseMirror). This will also save equation changes and close
  // equation editor.
  //
  // @see `maybeEscape` in the "Embedded code editor" example
  // https://prosemirror.net/examples/codemirror/
  private mayMoveCaretOut(unit: 'line' | 'char', dir: -1 | 1) {
    // Should not move caret out if editing an equation block
    if (this.isBlock) return false

    // Check if caret is moving out
    if (!this.cm) return false
    const { state } = this.cm
    const { main } = state.selection
    if (!main.empty) return false
    let mainSel: { from: number; to: number } = main
    if (unit == 'line') mainSel = state.doc.lineAt(main.head)
    if (dir < 0 ? mainSel.from > 0 : mainSel.to < state.doc.length) return false

    // Caret is moving out, save changes and close editor
    return this.confirmEdit(dir)
  }

  /**
   * Save equation changes and close editor
   * @param dir Direction that caret is moving towards in the editor, -1
   * means left and 1 means right. If the caret is not moving, then this
   * means which side of the equation node that the caret should appear
   * blinking at. Default: 1 (right).
   */
  private confirmEdit(dir: -1 | 1 = 1) {
    if (!this.cm) return true
    const nextTex = this.cm.state.doc.toString().trim()
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
    renderEquationNode({
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

  /**
   * Dynamically load LaTeX language support module, cache it at
   * `EquationView.latexLanguageSupport`, and add it to CodeMirror.
   */
  private loadLatexLanguageSupport() {
    // Dynamically import LaTeX language support for syntax highlighting
    // @see https://github.com/codemirror/language-data/blob/e0a0578fc1d1d678bec348fd409d0100a834be34/src/language-data.ts#L848
    if (!EquationView.latexLanguageSupport) {
      import('@codemirror/legacy-modes/mode/stex')
        .then(
          // @see https://github.com/codemirror/language-data/blob/e0a0578fc1d1d678bec348fd409d0100a834be34/src/language-data.ts#L4
          (module) => {
            EquationView.latexLanguageSupport = new LanguageSupport(
              StreamLanguage.define(module.stex)
            )
            this.setLanguageSupport(EquationView.latexLanguageSupport)
          }
        )
        .catch((error) => console.warn(error))
    }
  }

  private setLanguageSupport(ls: CodeMirrorExtension) {
    if (!this.cm) return
    const current = languageConf.get(this.cm.state)
    if (ls === current) return
    const effect = languageConf.reconfigure(ls)
    this.cm.dispatch({ effects: effect })
  }
}

interface EquationNodeProps {
  dom: HTMLElement
  isBlock: boolean
  isInlineDisplay: boolean
  tex: string
}

type Katex = typeof import('katex')
let katex: Katex | undefined

function renderEquationNode({
  dom,
  isBlock,
  isInlineDisplay,
  tex,
}: EquationNodeProps) {
  // Render synchronously except initial module loading so that users won't
  // see layout shift in the doc during drag-and-drop operations due to
  // equation being removed and added in different frames.
  if (!katex) {
    import('katex')
      .then((module) => {
        katex = module
        renderSync(katex)
      })
      .catch(console.warn)
  } else {
    renderSync(katex)
  }

  function renderSync(katex: Katex) {
    try {
      if (!tex) {
        dom.classList.add('empty-equation')
        if (isBlock) {
          dom.innerHTML = `\
<div style="width: 1.5625rem; height: 1.5625rem; flex-shrink: 0; margin-right: 0.75rem; display: flex; font-size: 0.75rem; font-family: var(--font-serif); align-items: center;">
  <div style="transform: translate(0.075rem, -0.15rem);">T</div>
  <div style="transform: translate(-0.05rem, 0.15rem);">E</div>
  <div style="transform: translate(-0.075rem, -0.15rem);">X</div>
</div>
<div class="truncate">Add a TeX equation</div>`
        } else {
          dom.innerText = '√x New equation'
        }
      } else {
        dom.classList.remove('empty-equation')
        /* Wrap KaTeX's root element with an additional `<span>`.
        Otherwise, if we set `display: inline-flex` on `dom` of a
        multi-line inline equation node when it's being edited, it changes
        its height, causing layout shift. */
        const flexReset = document.createElement('span')
        dom.replaceChildren(flexReset)
        katex.render(tex, flexReset, {
          displayMode: isBlock ? true : isInlineDisplay,
          throwOnError: true,
        })
      }
      dom.classList.remove('invalid-equation')
      dom.removeAttribute('title')
    } catch (e) {
      const error = e as katex.ParseError
      dom.classList.add('invalid-equation')

      /* Inline display equation nodes behave like and look like normal
      inline equation nodes except for the KaTeX parts. */
      if (isBlock) {
        dom.innerText = rebrandErrorMessage(error.message)
      } else {
        dom.innerText = '√x Invalid equation'
        dom.title = rebrandErrorMessage(error.message)
      }
    }
  }
}

function rebrandErrorMessage(msg: string): string {
  return msg.replace('KaTeX parse error', 'Invalid equation')
}
