import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: {
    customExports(pkg) {
      pkg['./style/equation.css'] = './style/equation.css'
      return pkg
    },
  },
  entry: [
    'src/index.ts',
    'src/components/equation-editor/index.ts',
    'src/components/equation-node/index.ts',
    'src/components/tex-editor-codemirror/index.ts',
    'src/example-setup/index.ts',
  ],
})
