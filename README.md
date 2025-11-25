# prosemirror-equation

> ### 🚧 Work in progress 🚧

[![NPM version](https://img.shields.io/npm/v/prosemirror-equation?color=214b1b&label=)](https://www.npmjs.com/package/prosemirror-equation)

Write math equations with LaTeX in [ProseMirror](https://prosemirror.net/) — this module provides block and inline node [schema](https://prosemirror.net/examples/schema/)s, rendering with [KaTeX](https://katex.org/), editing with [CodeMirror](https://codemirror.net/) in a popover UI, and an [input rule](https://prosemirror.net/docs/ref/#inputrules.InputRule) to create inline equation nodes.

## Design Principles

- Opening or closing the equation editor should not cause any layout shift.
- Users should be able to see the rendered equation while they edit the TeX.
- Users should be able to open or close the editor—and start or finish editing—without taking their hands off the keyboard.

## Key Features

We’ve taken a lot of inspiration from how Notion designs its [math equation experience](https://www.notion.com/help/math-equations).

- Opens a popover editor next to the equation for editing TeX.
- Uses CodeMirror to provide syntax highlighting in the editor.
- Updates the rendered equation in real time as you type.
- Lets you move into and out of an inline equation with the arrow keys.

In addition to user-facing features, we also offer the following developer-friendly benefits:

- Unstyled, fully customizable UI.
- Dynamic loading of KaTeX only when an equation node is present—saving [about 250 KB](https://bundlephobia.com/package/katex@0.16.25) from your main JavaScript bundle.

## Usage

## Styling

- [How to style CodeMirror](https://codemirror.net/examples/styling/)

### Ready-made CodeMirror themes

- [gh:@codemirror/theme-one-dark](https://github.com/codemirror/theme-one-dark)
- [gh:@fsegurai/codemirror-themes](https://github.com/fsegurai/codemirror-themes)
- [gh:@vadimdemedes/thememirror](https://github.com/vadimdemedes/thememirror)

## Other Implementations

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

- Install dependencies:

```bash
pnpm install
```

- Develop the library with demo:

```bash
pnpm run dev
```

- Run the unit tests:

```bash
pnpm run test
```

- Build the library:

```bash
pnpm run build
```

- Build the demo:

```bash
pnpm run build:demo
```

- This repository uses [gh:@googleapis/release-please](https://github.com/googleapis/release-please) to create releases automatically. Add `Release-As: x.y.z` to the commit body to mark the version of the commit.

## License

MIT
