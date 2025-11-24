import type { NodeSpec } from 'prosemirror-model'
import { BLOCK_EQUATION_NAME, INLINE_EQUATION_NAME } from './constants'

export interface EquationNodesOptions {
  blockEquationGroup?: string
  inlineEquationGroup?: string
}

export type EquationNodes = Record<
  typeof BLOCK_EQUATION_NAME | typeof INLINE_EQUATION_NAME,
  NodeSpec
>

export function equationNodes(options: EquationNodesOptions): EquationNodes {
  return {
    [BLOCK_EQUATION_NAME]: {
      group: options.blockEquationGroup,
      content: 'text*',
      atom: true,
      toDOM: () => ['block-equation', 0],
      parseDOM: [{ tag: 'block-equation' }],
    },
    [INLINE_EQUATION_NAME]: {
      group: options.inlineEquationGroup,
      content: 'text*',
      attrs: { display: { default: false } },
      inline: true,
      atom: true,
      toDOM: (node) => [
        'inline-equation',
        { 'data-display': node.attrs.display },
        0,
      ],
      parseDOM: [
        {
          tag: 'inline-equation',
          getAttrs(dom) {
            return {
              display: (dom as HTMLElement).dataset.display,
            }
          },
        },
      ],
    },
  }
}
