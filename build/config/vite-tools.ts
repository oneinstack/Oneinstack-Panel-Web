import fs from 'node:fs'
import path from 'node:path'
import type { IndexHtmlTransformContext, PluginOption } from 'vite'

type NestedValue = Record<string, unknown>

const flattenKeys = (value: NestedValue, prefix = '', seen = new Set<object>()): string[] => {
  if (seen.has(value)) return []
  seen.add(value)
  const result: string[] = []
  for (const [key, child] of Object.entries(value)) {
    const name = prefix ? `${prefix}.${key}` : key
    result.push(name)
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      result.push(...flattenKeys(child as NestedValue, name, seen))
    }
  }
  return result
}

const valueAt = (source: NestedValue, name: string): string => {
  let value: unknown = source
  for (const part of name.split('.')) {
    value = (value as NestedValue)[part]
  }
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    return JSON.stringify(value)
  }
  return String(value)
}

export const viteVar = (variables: NestedValue): PluginOption & {
  postcssPlugin: string
  Once(root: any): void
} => {
  const replacements = flattenKeys(variables).map((key) => ({
    token: `#{${key}}`,
    value: valueAt(variables, key)
  }))
  const replace = (source: string) => {
    let result = source
    for (const item of replacements) {
      if (result.includes(item.token)) {
        result = result.replaceAll(item.token, item.value)
      }
    }
    return result
  }
  const transformHTML = async (html: string, context: IndexHtmlTransformContext) => {
    return path.basename(context.filename) === 'index.html' ? replace(html) : html
  }
  return {
    name: 'oneinstack:vite-var',
    enforce: 'pre',
    transform(code) {
      return replace(code)
    },
    transformIndexHtml: {
      order: 'pre',
      handler: transformHTML
    },
    postcssPlugin: 'oneinstack:vite-var-css',
    Once(root: any) {
      root.walkDecls((declaration: { value: string }) => {
        declaration.value = replace(declaration.value)
      })
    }
  }
}

export const viteDef = (mode: string): PluginOption => {
  const replace = (source: string) => {
    if (!source.includes('#ifvar-')) return source
    const selected = new RegExp(
      `//*[^#]#ifvar-${mode}\\s(.*?)//*[^#]#endvar|<!--*[^#]#ifvar-${mode}\\s*[^-]-->(.*?)<!--*[^#]#endvar[^-]*-->`,
      'gs'
    )
    const remaining = new RegExp(
      '//*[^#]#ifvar-(.*?)//*[^#]#endvar|<!--*[^#]#ifvar-(.*?)*[^-]-->(.*?)<!--*[^#]#endvar*[^-]-->',
      'gs'
    )
    return source.replace(selected, '$1$2').replace(remaining, '')
  }
  return {
    name: 'oneinstack:vite-def',
    enforce: 'pre',
    transform(code) {
      return replace(code)
    },
    transformIndexHtml: {
      order: 'pre',
      handler: async (html) => replace(html)
    }
  }
}

export const viteComType = (options: {
  comUrl?: string
  prefix?: string
} = {}): PluginOption => {
  const componentRoot = options.comUrl || './src/components'
  const prefix = options.prefix || 's'
  return {
    name: 'oneinstack:vite-component-types',
    enforce: 'pre',
    configResolved() {
      const absoluteRoot = path.resolve(componentRoot)
      const components = fs.readdirSync(absoluteRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
      const declarations = components
        .map((name) => {
          const tag = `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`
          return `        ${tag}: typeof import('./${name}/index.vue')['default']`
        })
        .join('\n')
      const content = `import '@vue/runtime-core'
export {}
declare module '@vue/runtime-core' {
    export interface GlobalComponents {
${declarations}
    }
}
`
      fs.writeFileSync(path.join(absoluteRoot, 'types.d.ts'), content)
    }
  }
}
