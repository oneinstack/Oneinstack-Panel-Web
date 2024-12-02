/// <reference types="vitest" />

import path from 'path'
import { defineConfig } from 'vite'
import { viteVar } from 'vite-var'
import { getBuild, getPlugins } from './build/config'
import { globalVar } from './build/env/globalVar'
import { initLog } from './build/env/log'

// https://vitejs.dev/config/

initLog()
export default ({ mode, command }) => {
  const env = globalVar(mode)
  return defineConfig({
    base: './',
    plugins: getPlugins(env),
    css: { postcss: { plugins: [viteVar(env as any)] } },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: env.port || 5100
    },
    build: getBuild(env)
  })
}
