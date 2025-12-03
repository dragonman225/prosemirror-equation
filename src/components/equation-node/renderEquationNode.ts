export type RenderEquationNodeFn = (props: EquationNodeProps) => void

export interface EquationNodeProps {
  dom: HTMLElement
  isBlock: boolean
  isInlineDisplay: boolean
  tex: string
}

type Katex = typeof import('katex')
let katex: Katex | undefined

export const renderEquationNode: RenderEquationNodeFn = ({
  dom,
  isBlock,
  isInlineDisplay,
  tex,
}) => {
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
<div style="width: 1.5625rem; height: 1.5625rem; flex-shrink: 0; margin-right: 0.75rem; display: flex; font-size: 0.75rem; font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif; align-items: center;">
  <div style="transform: translate(0.075rem, -0.15rem);">T</div>
  <div style="transform: translate(-0.05rem, 0.15rem);">E</div>
  <div style="transform: translate(-0.075rem, -0.15rem);">X</div>
</div>
<div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">Add a TeX equation</div>`
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
