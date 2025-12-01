import { equation } from '..'
import { renderEquationEditor } from '../components/equation-editor'

export function equationExampleSetup() {
  return equation({
    renderEditor: renderEquationEditor,
  })
}
