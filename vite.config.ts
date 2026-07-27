import path from 'path'
import { defineConfig } from 'vite'
import { viteVar } from 'vite-var'
import { getBuild, getPlugins } from './build/config'
import { globalVar } from './build/env/globalVar'
import { initLog } from './build/env/log'

// https://vitejs.dev/config/
// 读取配置文件
// const config = yaml.load(fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf8')) as any

initLog()
export default ({ mode }) => {
  const env = globalVar(mode)
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
      proxy: {
        '/v1': {
          target: process.env.ONEINSTACK_DEV_PROXY || 'http://127.0.0.1:8089',
          secure: false,
          changeOrigin: true
        }
      }
    },
    optimizeDeps: {
      exclude: ['tools-javascript']
    },
    build: getBuild(env)
  })
}
