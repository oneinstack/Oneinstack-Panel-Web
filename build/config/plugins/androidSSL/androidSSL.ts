import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
export const androidSSL = () => {
  return {
    name: 'androidSSL',
    async buildStart(options: any) {
      const androidDir = path.join(
        __dirname,
        '../../../../node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/BridgeWebViewClient.java'
      )
      const androidDirWrite = path.join(__dirname, './BridgeWebViewClient.java')
      const _str = readFileSync(androidDirWrite).toString()
      writeFileSync(androidDir, _str)
    }
  }
}
