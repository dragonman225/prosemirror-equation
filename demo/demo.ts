import './style.css'

import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { DOMParser, Schema } from 'prosemirror-model'
import { schema as baseSchema } from 'prosemirror-schema-basic'
import { exampleSetup } from 'prosemirror-example-setup'
import { inputRules } from 'prosemirror-inputrules'
import { equationNodes, inlineEquationInputRule } from '../src'
import { equationExampleSetup } from '../src/example-setup'

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    /** 1. Add equation nodes to your schema. */
    equationNodes({
      blockEquationGroup: 'block',
      inlineEquationGroup: 'inline',
    })
  ),
  marks: baseSchema.spec.marks,
})

const contentElement = document.querySelector('#content')
if (!contentElement) {
  throw new Error('Failed to find #content')
}
const doc = DOMParser.fromSchema(schema).parse(contentElement)

let state = EditorState.create({
  doc,
  plugins: [
    /**
     * 2. Add equation plugin, which registers block equation and inline
     *    equation NodeViews and allow opening an equation editor
     *    programmatically.
     */
    equationExampleSetup(),
    inputRules({
      rules: [
        /**
         * 3. Optional: Add inline equation input rule, which lets you type
         *    text `$$equation$$` to create an inline equation node.
         */
        inlineEquationInputRule(),
      ],
    }),
  ].concat(exampleSetup({ schema })),
})

const view = new EditorView(document.querySelector('#editor'), {
  state,
})

// Allow inspecting EditorView in console.
declare global {
  interface Window {
    view?: EditorView
  }
}

window.view = view
console.log(view)
