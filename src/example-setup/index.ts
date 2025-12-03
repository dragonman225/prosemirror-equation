import { equation } from '..'
import { createEquationEditorRenderer } from '../components/equation-editor'
import { renderEquationNode } from '../components/equation-node'

export function equationExampleSetup() {
  return equation({
    renderEditor: createEquationEditorRenderer({
      loadTexEditorTheme: async () =>
        /**
         * Since `editorTheme` statically imports `@codemirror/view`, if we
         * want to import `@codemirror/view` dynamically, we need to import
         * `editorTheme` dynamically as well.
         */
        (await import('../components/tex-editor-codemirror/editorTheme'))
          .editorTheme,
    }),
    renderNode: renderEquationNode,
  })
}
