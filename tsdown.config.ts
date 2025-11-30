import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
  entry: ['src/index.ts', 'src/components/tex-editor/codemirror/index.ts'],
})
