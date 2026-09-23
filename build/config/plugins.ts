import vue from '@vitejs/plugin-vue'
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { UIViteAutoImport } from 'ui-vite/src/autoimport'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { PluginOption } from 'vite'
import { globalType } from '../env/globalVar'
import { tozip } from './plugins/tozip'
import { viteComType, viteDef, viteVar } from './vite-tools'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const toolsJavascriptCSPPlugin = (): PluginOption => ({
  name: 'tools-javascript-csp-safe',
  enforce: 'pre',
  transform(code, id) {
    const normalizedId = id.split(path.sep).join('/')
    if (!normalizedId.endsWith('/node_modules/tools-javascript/dist/tools-javascript.js')) {
      return null
    }

    // tools-javascript 1.2.9 clones prototype helpers through `new Function`.
    // Copying the original function object has the same call semantics and
    // remains compatible with a strict Content-Security-Policy.
    const assignment = code.match(/([A-Za-z_$][\w$]*)\.getFunction=/)
    if (!assignment || assignment.index === undefined) {
      throw new Error('Unable to locate tools-javascript getFunction assignment')
    }
    const owner = assignment[1]
    const assignmentEnd = code.indexOf(`,${owner}.setPrototype=`, assignment.index)
    if (assignmentEnd === -1) {
      throw new Error('Unable to locate tools-javascript setPrototype assignment')
    }
    const patched =
      code.slice(0, assignment.index) +
      `${owner}.getFunction=t=>t` +
      code.slice(assignmentEnd)

    return { code: patched, map: null }
  }
})

const relativeBundleReferencePattern = /\b(?:import|from)\s*\(?["']([^"']+\.(?:js|css)(?:[?#][^"']*)?)["']/g

const verifyLazyBundleReferences = (distDir: string) => {
  const files = new Set<string>()
  const collectFiles = (directory: string) => {
    readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        collectFiles(fullPath)
        return
      }
      files.add(path.relative(distDir, fullPath).split(path.sep).join('/'))
    })
  }

  collectFiles(distDir)
  const missingReferences = new Set<string>()
  for (const file of files) {
    if (!file.endsWith('.js')) continue
    const source = readFileSync(path.join(distDir, file), 'utf8')
    for (const match of source.matchAll(relativeBundleReferencePattern)) {
      const reference = match[1]
      if (!reference.startsWith('.')) continue
      const target = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), reference.replace(/[?#].*$/, ''))
      )
      if (!files.has(target)) {
        missingReferences.add(`${file} -> ${target}`)
      }
    }
  }

  if (missingReferences.size) {
    throw new Error(
      `Production bundle has missing lazy-load assets:\n${[...missingReferences].sort().join('\n')}`
    )
  }
}

export const getPlugins = (env: globalType) => {
  const isBuild = env.env.pro === 'build'

  const plugin: PluginOption[] = [
    toolsJavascriptCSPPlugin(),
    viteVar(env as any),
    viteDef(env.env.pro),
    viteComType({
      prefix: 'x'
    }),
    UIViteAutoImport({
      isBuild: true
    }),
    vue(),
    AutoImport({
      dts: './build/auto/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      dts: './build/auto/components.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
  ]

  if (isBuild) {
    plugin.push(
      {
        name: 'end',
        async closeBundle() {
          const htmlDir = path.join(__dirname, '../../dist/index.html')
          let _str = readFileSync(htmlDir).toString()
          _str = _str.replace(new RegExp(`"./static/`, 'g'), `"${env.static}/`)
          writeFileSync(htmlDir, _str)
          const versionDir = path.join(__dirname, '../../dist/version.json')
          const appName = `app-${env.version}.zip`
          writeFileSync(versionDir, JSON.stringify({ version: env.version, url: appName }))
          verifyLazyBundleReferences(path.join(__dirname, '../../dist'))
          await tozip(path.join(__dirname, '../../dist'), path.join(__dirname, `../../version/${appName}`))
          rmSync(versionDir)
        }
      }
    )
  }

  return plugin
}
