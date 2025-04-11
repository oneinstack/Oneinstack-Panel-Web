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
        '@': path.resolve(__dirname, './src'),
        '@public': path.resolve(__dirname, './public')
      }
    },
    // server: {
    //   host: '0.0.0.0',
    //   port: env.port || 5200
    // },
    server: {
      host: '0.0.0.0',
      port: env.port || 5200,
      headers:{ 'Access-Control-Allow-Origin': '*',},
      proxy: {
        '/api': {
          // 开发环境使用本地地址，生产环境使用线上地址
          target:'http://162.14.64.127:8089',
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, 'v1')
        }
      }
    },
    build: getBuild(env)
  })
}
