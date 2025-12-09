import 'prosekit/basic/style.css'
import 'prosekit/basic/typography.css'

import { defineBasicExtension } from 'prosekit/basic'
import {
  createEditor,
  defineNodeSpec,
  definePlugin,
  union,
} from 'prosekit/core'
import { defineInputRule } from 'prosekit/extensions/input-rule'
import { ProseKit } from 'prosekit/react'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { equationNodes, inlineEquationInputRule } from '../src'
import { equationExampleSetup } from '../src/example-setup'
import { getDefaultContent } from './getDefaultContent'

function Editor() {
  const editor = useMemo(() => {
    const extension = union(
      defineBasicExtension(),
      ...Object.entries(
        equationNodes({
          blockEquationGroup: 'block',
          inlineEquationGroup: 'inline',
        })
      ).map(([name, spec]) => defineNodeSpec({ name, ...spec })),
      definePlugin(equationExampleSetup()),
      defineInputRule(inlineEquationInputRule())
    )
    return createEditor({
      defaultContent: getDefaultContent(),
      extension,
    })
  }, [])

  return (
    <ProseKit editor={editor}>
      <div
        ref={editor.mount}
        style={{
          padding: '16px',
          border: '1px solid silver',
          borderRadius: '4px',
          outline: 'none',
        }}
      ></div>
    </ProseKit>
  )
}

const root = createRoot(document.getElementById('prosekit-react')!)
root.render(<Editor />)
