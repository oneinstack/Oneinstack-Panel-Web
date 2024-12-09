/// <reference types="vite/client" />
/// <reference types="./components/types" />
/// <reference types="../build/auto/components" />
declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const componentOptions: ComponentOptions
  export default componentOptions
}

declare var NavigationBar: {
  backgroundColorByHexString: (hex: string, overlay: boolean) => void
  hide: () => void
  show: () => void
}
