import path from 'path'
import { defineConfig } from 'vite'
// import yaml from 'js-yaml'
import fs from 'fs'
import { viteVar } from 'vite-var'
import { getBuild, getPlugins } from './build/config'
import { globalVar } from './build/env/globalVar'
import { initLog } from './build/env/log'

// https://vitejs.dev/config/
// 读取配置文件
// const config = yaml.load(fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf8')) as any

initLog()
export default ({ mode, command }) => {
  const env = globalVar(mode)
  const isDev = mode === 'development'
  return defineConfig({
    base: mode === 'production' ? './' : '/',
    plugins: getPlugins(env),
    css: { postcss: { plugins: [viteVar(env as any)] } },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@chat': path.resolve(__dirname, './src/modules/chat')
      }
    },
    server: {
      host: '0.0.0.0',
      port: env.port || 5100,
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
