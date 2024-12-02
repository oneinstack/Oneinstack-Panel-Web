<template>
  <div ref="imgRef" class="x-img">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import sconfig from '@/sstore/sconfig'
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
const props = defineProps({
  lazyLoad: {
    default: true
  },
  src: { default: '' },
  base64: { default: false },
  extensions: { default: undefined as any as any[] },
  styles: { default: {} as any },
  classs: { default: '' as any },
  zIndex: { default: undefined as any }
})

const emit = defineEmits(['load', 'error'])
const imgRef = ref<HTMLImageElement>()

const config = reactive({
  img: null as HTMLImageElement | null,
  loadId: null as any,
  load: () => {
    if (config.loadId) {
      if (config.img) {
        imgRef.value?.removeChild(config.img)
        config.img = null
      }
    }
    const loadId = StrUtil.getId()
    config.loadId = loadId
    sconfig.img.getLoadPro((resolve: any) => {
      DomUtil.loadImage({
        url: props.src,
        extensions: props.extensions,
        base64: props.base64,
        timeout: 5000,
        load: (img) => {
          if (loadId !== config.loadId) return
          emit('load')
          img.id = 'x_img_' + config.loadId
          imgRef.value?.appendChild(img)
          config.img = img
          config.setStyle()
          resolve(true)
        },
        error: () => {
          if (loadId !== config.loadId) return
          emit('error')
          resolve(false)
        }
      })
    }, props.zIndex)
  },
  defaultStyle: {
    height: '100%',
    width: '100%'
  },
  setStyle: (img: HTMLImageElement = config.img as HTMLImageElement) => {
    if (img) {
      Object.entries(props.styles || {}).forEach(([key, value]) => {
        img.style[key as any] = value as any
      })

      Object.entries(config.defaultStyle).forEach(([key, value]) => {
        if (!props.styles?.[key as any]) {
          img.style[key as any] = value as any
        }
      })
      if (Array.isArray(props.classs)) {
        img.classList.add(...props.classs)
      } else if (props.classs) {
        img.classList.add(props.classs)
      }
    }
  }
})

watch(
  () => [props.styles, props.classs],
  () => {
    config.setStyle()
  }
)

watch(
  () => props.src,
  () => {
    init()
  }
)

const observer = new IntersectionObserver((entries) => {
  if (props.lazyLoad === false) return
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      config.load()
      observer.unobserve(entry.target)
    }
  })
})

const init = () => {
  observer.unobserve(imgRef.value as Element)
  if (props.lazyLoad !== false) {
    observer.observe(imgRef.value as Element)
  } else {
    config.load()
  }
}

onMounted(init)
onUnmounted(() => {
  observer.disconnect()
})
</script>
<style lang="less" scoped>
.x-img {
  height: 100%;
  width: 100%;
}
</style>
