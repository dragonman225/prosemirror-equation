# Changelog

## [0.4.2](https://github.com/dragonman225/prosemirror-equation/compare/v0.4.1...v0.4.2) (2025-12-02)


### doc

* add usage section to README ([3ca5174](https://github.com/dragonman225/prosemirror-equation/commit/3ca5174cd53afb2699571fafb026cbdc75b5800a))

## [0.4.1](https://github.com/dragonman225/prosemirror-equation/compare/v0.4.0...v0.4.1) (2025-12-02)


### Bug Fixes

* add equation.css to exports field so that it can be imported ([1178609](https://github.com/dragonman225/prosemirror-equation/commit/117860934fa490722a38061f9931830cc486362c))
* install @codemirror/state as a devDependency to fix type error in editorTheme ([d4e7129](https://github.com/dragonman225/prosemirror-equation/commit/d4e7129ccffa58b96a936f601c788a3b62ac0246))

## [0.4.0](https://github.com/dragonman225/prosemirror-equation/compare/v0.3.0...v0.4.0) (2025-12-01)


### Features

* allow passing custom renderEquationNode implementation to equation() ([cf69e84](https://github.com/dragonman225/prosemirror-equation/commit/cf69e84a42bf9b2cc85796bea14d80423a8bd5f0))
* dynamically load CodeMirror packages to reduce main JS bundle's size by 238KB ([75ede4d](https://github.com/dragonman225/prosemirror-equation/commit/75ede4d6fad6f7ba51e6978a3018e4b06e203070))
* equation() now doesn't use renderEquationEditor() by default. Use equationExampleSetup() instead if you want the default renderer. ([c8afefa](https://github.com/dragonman225/prosemirror-equation/commit/c8afefa51f439eb30444ba386b52ee430d502cb5))

## [0.3.0](https://github.com/dragonman225/prosemirror-equation/compare/v0.2.2...v0.3.0) (2025-11-30)


### Features

* add example styling to equation node and editor ([50f772a](https://github.com/dragonman225/prosemirror-equation/commit/50f772ae8170c4f516c61565150a34caff3afe23))
* allow renderEquationEditor to get latest node rect so it can reposition editor when viewport changes ([4a0adc4](https://github.com/dragonman225/prosemirror-equation/commit/4a0adc48087b41c8d19e21ad721346752bd1b931))
* make prosemirror-inputrules optional peer dependency ([418dde4](https://github.com/dragonman225/prosemirror-equation/commit/418dde4410ca65cf6b68b7710b077852f5a0a2c5))


### Bug Fixes

* don't re-render equation on ProseMirror update when it's being edited ([cbc2c0c](https://github.com/dragonman225/prosemirror-equation/commit/cbc2c0c3ec81203759412a2306078d45726c8fff))
* parse whitespaces correctly in parseDOM rule ([8f9b1ed](https://github.com/dragonman225/prosemirror-equation/commit/8f9b1ed855a89b332e2e95b495c9dadb46d13e12))

## [0.2.2](https://github.com/dragonman225/prosemirror-equation/compare/v0.2.1...v0.2.2) (2025-11-25)


### Features

* mark module side-effect-free ([241438f](https://github.com/dragonman225/prosemirror-equation/commit/241438fbfe6b904b4e053a855625ffab604badb3))

## [0.2.1](https://github.com/dragonman225/prosemirror-equation/compare/v0.2.0...v0.2.1) (2025-11-24)


### Miscellaneous Chores

* test release ([f7123b2](https://github.com/dragonman225/prosemirror-equation/commit/f7123b2087ead2d600eb4a2e01ce723d17b0eab9))

## 0.2.0 (2025-11-24)


### Features

* remove console.log ([ea4fde8](https://github.com/dragonman225/prosemirror-equation/commit/ea4fde88f428167d459c342c9ab148d8c3c66208))
