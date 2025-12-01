import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
  entry: [
    'src/index.ts',
    'src/components/equation-editor/index.ts',
    'src/components/tex-editor-codemirror/index.ts',
    'src/example-setup/index.ts',
  ],
})
