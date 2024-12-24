import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.xapp.app',
  appName: 'XApp',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
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
