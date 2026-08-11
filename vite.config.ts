import path from 'path'
import { defineConfig } from 'vite'
import { getBuild, getPlugins } from './build/config'
import { viteVar } from './build/config/vite-tools'
import { globalVar } from './build/env/globalVar'
import { initLog } from './build/env/log'

// https://vitejs.dev/config/
// 读取配置文件
// const config = yaml.load(fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf8')) as any

initLog()
export default ({ mode }: { mode: string }) => {
  const env = globalVar(mode)
  //  const proxyTarget ='http://192.168.31.116:8089/'
  const proxyTarget = process.env.ONEINSTACK_DEV_PROXY || 'http://192.168.31.116:8089'
  const proxyOrigin = new URL(proxyTarget).origin
  return defineConfig({
    base: mode === 'production' ? './' : '/',
    plugins: getPlugins(env),
    css: { postcss: { plugins: [viteVar(env as any)] } },
    define: {
      __ONEINSTACK_GLOBAL__: JSON.stringify(env.global)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: env.port || 5100,
      proxy: {
        '/v1': {
          target: proxyTarget,
          secure: false,
          changeOrigin: true,
          ws: true,
          cookieDomainRewrite: 'localhost',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const browserReferer = String(req.headers.referer || '')
              let forwardedReferer = `${proxyOrigin}/`
              if (browserReferer) {
                try {
                  const refererURL = new URL(browserReferer)
                  forwardedReferer = `${proxyOrigin}${refererURL.pathname}${refererURL.search}`
                } catch {
                  forwardedReferer = `${proxyOrigin}/`
                }
              }
              proxyReq.setHeader('origin', proxyOrigin)
              proxyReq.setHeader('referer', forwardedReferer)
              const targetHost = new URL(proxyTarget).host
              proxyReq.setHeader('host', targetHost)
              console.log('[proxy:req]', {
                method: req.method,
                url: req.url,
                browserOrigin: req.headers.origin || '',
                browserReferer: req.headers.referer || '',
                forwardedOrigin: proxyReq.getHeader('origin') || '',
                forwardedReferer: proxyReq.getHeader('referer') || '',
                forwardedHost: proxyReq.getHeader('host') || ''
              })
            })
            proxy.on('proxyReqWs', (proxyReq) => {
              proxyReq.setHeader('origin', proxyOrigin)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[proxy:res]', {
                method: req.method,
                url: req.url,
                statusCode: proxyRes.statusCode,
                allowOrigin: proxyRes.headers['access-control-allow-origin'] || '',
                setCookie: proxyRes.headers['set-cookie'] ? 'present' : 'absent'
              })
            })
            proxy.on('error', (error, req) => {
              console.error('[proxy:error]', {
                method: req.method,
                url: req.url,
                message: error.message
              })
            })
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['tools-javascript']
    },
    build: getBuild(env)
  })
}
