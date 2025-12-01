import { equation } from '..'
import { renderEquationEditor } from '../components/equation-editor'
import { renderEquationNode } from '../components/equation-node'

export function equationExampleSetup() {
  return equation({
    renderEditor: renderEquationEditor,
    renderNode: renderEquationNode,
  })
}
