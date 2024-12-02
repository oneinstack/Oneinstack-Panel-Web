import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.xapp.app',
  appName: 'XApp',
  webDir: 'dist',
  server: {
    url: 'http://192.168.31.66:5173',
    cleartext: true
  },
  plugins: {
    'CapacitorUpdater': {
      'autoUpdate': false,
      'statsUrl':''
    }
  }
}

export default config
