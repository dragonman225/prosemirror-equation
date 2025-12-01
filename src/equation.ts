import { Plugin, PluginKey } from 'prosemirror-state'
import type { NodeViewConstructor } from 'prosemirror-view'
import {
  BLOCK_EQUATION_NAME,
  INLINE_EQUATION_NAME,
  REQUEST_OPEN_EDITOR_KEY,
} from './constants'
import { EquationView } from './equationNodeView'
import type { RenderEquationEditorFn } from './components/equation-editor'
import type { RenderEquationNodeFn } from './components/equation-node'

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
    },
  })
}
