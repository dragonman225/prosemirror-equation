import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
} from 'prosemirror-state'
import type { NodeViewConstructor } from 'prosemirror-view'
import type { RenderEquationEditorFn } from './components/equation-editor'
import type { RenderEquationNodeFn } from './components/equation-node'
import {
  BLOCK_EQUATION_NAME,
  INLINE_EQUATION_NAME,
  REQUEST_OPEN_EDITOR_KEY,
} from './constants'
import { EquationView } from './equationNodeView'

type EquationPluginState = {
  docChangedInLastTr: boolean
  requestOpenEditor: boolean
}

export type EquationPluginKey = PluginKey<EquationPluginState>

interface EquationOptions {
  /**
   * A function that renders equation editor to HTML document and returns a
   * clean-up function to execute when closing editor.
   */
  renderEditor: RenderEquationEditorFn
  /**
   * A function that renders equation node to HTML document.
   */
  renderNode: RenderEquationNodeFn
}

/**
 * Create a ProseMirror plugin that adds equation NodeViews and manages
 * them.
 */
export function equation({ renderEditor, renderNode }: EquationOptions) {
  const key = new PluginKey<EquationPluginState>('equation')
  const equationViewFactory = (type: string) =>
    ((node, view, getPos) => {
      return new EquationView(
        node,
        view,
        getPos,
        key,
        type === BLOCK_EQUATION_NAME,
        renderEditor,
        renderNode
      )
    }) as NodeViewConstructor

  return new Plugin<EquationPluginState>({
    key,
    state: {
      init() {
        return { docChangedInLastTr: false, requestOpenEditor: false }
      },
      apply(tr) {
        // Track if the document changed in this transaction. If the
        // document changed, set the flag to true. If it didn't change,
        // reset the flag to false. This helps detect when selectNode() is
        // called due to undo/redo (which changes the document) vs caret
        // movement (which doesn't).
        return {
          docChangedInLastTr: tr.docChanged,
          requestOpenEditor: !!tr.getMeta(REQUEST_OPEN_EDITOR_KEY),
        }
      },
    },
    props: {
      nodeViews: {
        [BLOCK_EQUATION_NAME]: equationViewFactory(BLOCK_EQUATION_NAME),
        [INLINE_EQUATION_NAME]: equationViewFactory(INLINE_EQUATION_NAME),
      },
      handleKeyDown(view, event) {
        // When a block equation node is selected, pressing Enter key opens
        // the equation editor for the node.
        if (!view.editable) return false
        const { selection } = view.state
        if (!(selection instanceof NodeSelection)) return false
        const { node } = selection
        if (node.type.name !== BLOCK_EQUATION_NAME) return false
        if (event.key !== 'Enter') return false
        // Do nothing if any modifier keys are pressed. If we return false
        // ProseMirror will run default behavior (turning the block
        // equation node into a paragraph node with two empty lines). Make
        // sure we already checked that the selection is a block equation
        // node at this moment, otherwise we will break Enter key behaviors
        // for other nodes.
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
          return true
        }

        // Set selection to something else and set it back to the block
        // equation node to make ProseMirror call `EquationView`'s
        // `selectNode`, which will open the equation editor.
        view.dispatch(
          view.state.tr.setSelection(TextSelection.atStart(view.state.doc))
        )
        view.dispatch(
          view.state.tr
            .setSelection(NodeSelection.create(view.state.doc, selection.from))
            .setMeta(REQUEST_OPEN_EDITOR_KEY, true)
        )
        return true
      },
    },
  })
}
