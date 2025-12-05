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

/**
 * This function creates a set of [node
 * specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) for
 * `block_equation` and `inline_equation` nodes types as used by this
 * module. The result can then be added to the set of nodes when creating a
 * schema.
 *
 * @example
 * ```ts
 * new Schema({
 *   nodes: {
 *     ...equationNodes({
 *       blockEquationGroup: 'block',
 *       inlineEquationGroup: 'inline',
 *     })
 *   },
 * })
 * ```
 *
 * @public
 */
export function equationNodes(options: EquationNodesOptions): EquationNodes {
  return {
    [BLOCK_EQUATION_NAME]: {
      group: options.blockEquationGroup,
      content: 'text*',
      atom: true,
      toDOM: () => ['block-equation', 0],
      parseDOM: [{ tag: 'block-equation', preserveWhitespace: 'full' }],
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
          preserveWhitespace: 'full',
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
