import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import semver from 'semver'
import System from './System'

export async function UpdateVersion(): Promise<void> {
  return
  if (!Capacitor.isNativePlatform()) return
  try {
    // const { version: publishedVersion, url } = await fetch('http://192.168.31.66:9852/version.json').then((res) =>
    //   res.json()
    // )
    console.log('data------------------1');
    
    const { version: publishedVersion, url } = await fetch('https://xxx.com/temp/version.json').then((res) =>
      res.json()
    )
    console.log('data------------------2');
    if (semver.gt(publishedVersion, System.env.version)) {
      const bundle = await CapacitorUpdater.download({ url:'https://xxx.com/temp/'+url, version: publishedVersion })
      await CapacitorUpdater.set(bundle)
    } else {
    }
  } catch (e) {
  }

  CapacitorUpdater.notifyAppReady()
}
