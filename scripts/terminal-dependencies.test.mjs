import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../package.json', import.meta.url))
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'))

// Official xterm 5.3 release compatibility set. Renderer addons use private
// terminal internals, so merely satisfying structural TypeScript types is not enough.
const versions = {
  xterm: '5.3.0',
  'xterm-addon-fit': '0.8.0',
  'xterm-addon-canvas': '0.5.0'
}

test('terminal packages, lockfile and declarations use one compatible release set', () => {
  for (const [name, version] of Object.entries(versions)) {
    assert.ok(manifest.dependencies[name], `${name} must be a direct dependency`)
    const packagePath = require.resolve(`${name}/package.json`)
    const installed = JSON.parse(readFileSync(packagePath, 'utf8'))
    assert.equal(installed.version, version, `${name} installed version`)
    assert.equal(lock.packages[`node_modules/${name}`].version, version, `${name} locked version`)
    assert.ok(existsSync(require.resolve(name)), `${name} entrypoint must resolve`)
    assert.ok(existsSync(resolve(dirname(packagePath), installed.types || installed.typings)), `${name} must ship types`)
    if (name !== 'xterm') assert.ok(installed.peerDependencies.xterm, `${name} must target xterm`)
  }
  assert.equal(manifest.dependencies['@xterm/addon-canvas'], undefined)
  assert.equal(lock.packages['node_modules/@xterm/addon-canvas'], undefined)
  assert.equal(lock.packages['node_modules/@xterm/xterm'], undefined)
})

test('terminal imports the matching canvas renderer, not the scoped renderer', () => {
  const source = readFileSync(resolve(root, 'src/views/pages/terminal/components/terminal.vue'), 'utf8')
  assert.match(source, /import\s+\{\s*CanvasAddon\s*\}\s+from\s+['"]xterm-addon-canvas['"]/)
  assert.doesNotMatch(source, /['"]@xterm\/addon-canvas['"]/)
})
