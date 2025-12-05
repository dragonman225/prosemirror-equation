# prosemirror-equation

> ### 🚧 Work in progress 🚧

[![NPM version](https://img.shields.io/npm/v/prosemirror-equation?color=214b1b&label=)](https://www.npmjs.com/package/prosemirror-equation)

Write math equations with LaTeX in [ProseMirror](https://prosemirror.net/) — this module provides block and inline node [schema](https://prosemirror.net/examples/schema/)s, rendering with [KaTeX](https://katex.org/), editing with [CodeMirror](https://codemirror.net/) in a popover UI, and an [input rule](https://prosemirror.net/docs/ref/#inputrules.InputRule) to create inline equation nodes.

## Design Principles

- Opening or closing the equation editor should not cause any layout shift.
- Users should be able to see the rendered equation while they edit the TeX.
- Users should be able to open or close the editor—and start or finish editing—without taking their hands off the keyboard.

## Key Features ([try it yourself](https://prosemirror-equation.netlify.app/))

We’ve taken a lot of inspiration from how Notion designs its [math equation experience](https://www.notion.com/help/math-equations).

- Opens a popover editor next to the equation for editing TeX.
- Uses CodeMirror to provide syntax highlighting in the editor.
- Updates the rendered equation in real time as you type.
- Lets you move into and out of an inline equation with the arrow keys.

In addition to user-facing features, we also offer the following developer-friendly benefits:

- Unstyled, framework-agnostic, fully customizable UI.
- Load KaTeX ([264kB](https://bundlephobia.com/package/katex@0.16.25)) and CodeMirror ([242kB](https://bundlephobia.com/package/@codemirror/view@6.38.8)) dynamically—only when they’re actually needed—to keep your main JS bundle small.

## Getting Started

We will walk you through the process of integrating `prosemirror-equation` into an existing ProseMirror project.

### Install packages

```bash
npm i prosemirror-equation katex
```

You will import `katex`'s CSS files in your project, so you need to install it as a dependency.

### Set up CSS

Make sure you include the CSS files for `katex` and `prosemirror-equation` on any pages that will need them. They can be found at the following paths:

```bash
node_modules/katex/dist/katex.min.css
node_modules/prosemirror-equation/style/equation.css
```

If you are using a bundler like `vite`, you may be able to include the CSS files in your JavaScript entry point like this:

```js
import 'katex/dist/katex.min.css'
import 'prosemirror-equation/style/equation.css'
```

Or in your CSS entry point like this:

```css
@import 'katex/dist/katex.min.css';
@import 'prosemirror-equation/style/equation.css';
```

### Set up schema

Add equation nodes to your ProseMirror schema.

For example, if you are using the schema from [`prosemirror-schema-basic`](https://github.com/ProseMirror/prosemirror-schema-basic):

```ts
import { Schema } from 'prosemirror-model'
import { schema as baseSchema } from 'prosemirror-schema-basic'
import { equationNodes } from 'prosemirror-equation'

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    equationNodes({
      blockEquationGroup: 'block',
      inlineEquationGroup: 'inline',
    })
  ),
  marks: baseSchema.spec.marks,
})
```

### Set up plugins

Add the pre-configured equation plugin to your ProseMirror state:

```ts
import { EditorState } from 'prosemirror-state'
import { equationExampleSetup } from 'prosemirror-equation/example-setup'

const state = EditorState.create({
  schema,
  plugins: [equationExampleSetup()],
})
```

The pre-configured plugin includes default UI components for rendering and editing math equations.

### Optional: Set up input rules

We provide an input rule that lets you type `$$...$$` to create inline equation nodes. You can add it to your editor setup with the [`inputRules`](https://prosemirror.net/docs/ref/#inputrules.inputRules) plugin from [`prosemirror-inputrules`](https://github.com/ProseMirror/prosemirror-inputrules).

```diff
import { EditorState } from 'prosemirror-state'
+import { inputRules } from 'prosemirror-inputrules'
+import { inlineEquationInputRule } from 'prosemirror-equation'
import { equationExampleSetup } from 'prosemirror-equation/example-setup'

const state = EditorState.create({
  schema,
  plugins: [
    equationExampleSetup(),
+   inputRules({
+     rules: [
+       inlineEquationInputRule(),
+     ],
+   }),
  ],
})
```

### Next steps

Congratulations, you're all set up with the math equation functionality! In the next section, we'll guide you through how to further customize it to fit your needs.

If you want to have a clearer picture of how to put the pieces together, check out our demo code in [demo/demo.ts](https://github.com/dragonman225/prosemirror-equation/blob/main/demo/demo.ts) or tinker with it live in the online code editor:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/dragonman225/prosemirror-equation?file=demo%2Fdemo.ts)

## Customizing

### Styling

You can copy [`style/equation.css`](style/equation.css) to your project and modify it.

### Modifying element structures and behaviors

Instead of using the pre-configured `equationExampleSetup()` function from `prosemirror-equation/example-setup`, you can use `equation()` function from `prosemirror-equation` to provide your own implementations of `renderEditor` and `renderNode`.

For example, below is how the `equationExampleSetup()` function is implemented:

```ts
import { equation } from 'prosemirror-equation'
import { createEquationEditorRenderer } from 'prosemirror-equation/components/equation-editor'
import { renderEquationNode } from 'prosemirror-equation/components/equation-node'

export function equationExampleSetup() {
  return equation({
    renderEditor: createEquationEditorRenderer({
      loadTexEditorTheme: async () =>
        (await import('prosemirror-equation/components/tex-editor-codemirror'))
          .editorTheme,
    }),
    renderNode: renderEquationNode,
  })
}
```

You can reuse the components that come with the `prosemirror-equation` package by importing them from `prosemirror-equation/components/*`.

### Styling our CodeMirror-based TeX editor

You can replace `loadTexEditorTheme` in the previous snippet with your own implementation to provide your own CodeMirror theme.

- [How to style CodeMirror](https://codemirror.net/examples/styling/)

#### Syntax highlighting

Modify the `.cm-line .token.xxx` classes in [`style/equation.css`](style/equation.css).

#### Ready-made CodeMirror themes

- [gh:@codemirror/theme-one-dark](https://github.com/codemirror/theme-one-dark)
- [gh:@fsegurai/codemirror-themes](https://github.com/fsegurai/codemirror-themes)
- [gh:@vadimdemedes/thememirror](https://github.com/vadimdemedes/thememirror)

## Prior Art

### ProseMirror-based alternatives

- [gh:@benrbray/prosemirror-math](https://github.com/benrbray/prosemirror-math)
- [Tiptap's Mathematics extension](https://tiptap.dev/docs/editor/extensions/nodes/mathematics)
- [gh:@buttondown/tiptap-math](https://github.com/buttondown/tiptap-math)
- [gh:@aarkue/tiptap-math-extension](https://github.com/aarkue/tiptap-math-extension)
- [ProseMirror + Math at Desmos](https://discuss.prosemirror.net/t/prosemirror-math-at-desmos/707)

### Not ProseMirror-based — for UX reference

- [lexical's math equation node](https://playground.lexical.dev/)
- [Corca](https://corca.app/doc/45KghvqDJatmDv7T_MGhq)

## About This Repository

The important files in this repository are:

- `demo/`: The demo website.
- `src/`
  - `schema.ts`: Schemas of block and inline equation nodes.
  - `equation.ts`: A ProseMirror Plugin that registers NodeViews and enables opening equation editor programmatically.
  - `equationNodeView.ts`: A NodeView which renders TeX equations and provides interactivity.
  - `equationInputRules.ts`: Contains an InputRule that lets user create inline equation nodes by typing `$$equation$$`.

## To-do

- [ ] Research [prosekit](https://github.com/prosekit/prosekit) integration

## Development

#### Install dependencies

```bash
pnpm install
```

#### Develop the library with demo

```bash
pnpm run dev
```

#### Run the unit tests

```bash
pnpm run test
```

#### Build the library

```bash
pnpm run build
```

#### Build the demo

```bash
pnpm run build:demo
```

#### Analyze bundle with demo

```bash
pnpm run analyzeBundle
```

and navigate to http://localhost:8888/

#### Other notes

- This repository uses [gh:@googleapis/release-please](https://github.com/googleapis/release-please) to create releases automatically. Add `Release-As: x.y.z` to the commit body to mark the version of the commit.

## License

MIT

## Closing Note

Chat with DeepWiki about anything not covered in the documentation or that needs more clarification:

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/dragonman225/prosemirror-equation)
