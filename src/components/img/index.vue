<template>
  <div ref="imgRef" class="x-img">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import uximg from '.'
const props = defineProps({
  lazyLoad: {
    default: true
  },
  src: { default: '' },
  base64: { default: true },
  extensions: { default: undefined as any as any[] },
  styles: { default: {} as any },
  classs: { default: '' as any },
  zIndex: { default: 0 as any },
  cache: { default: false },
  timeout: { default: 30000 }
})

const emit = defineEmits(['load', 'error'])
const imgRef = ref<HTMLImageElement>()
const timer = Scope.Timer()

const config = reactive({
  img: null as HTMLImageElement | null,
  loadId: null as any,
  loadEnd: false,
  errorFun: () => {
    if (config.loadEnd) return
    config.loadEnd = true
    emit('error')
    uximg.errorCache[props.src] = true
    timer.once(() => {
      delete uximg.errorCache[props.src]
    }, 10000)
  },
  loadimg: null as any,
  load: async () => {
    //如果已经加载过，加载过就删除
    if (config.loadId) {
      if (config.img) {
        imgRef.value?.removeChild(config.img)
        config.img = null
      }
    }

    //如果缓存有，直接使用缓存
    if (props.cache !== false) {
      const _res = uximg.cache[props.src]
      if (_res) {
        const _img = new Image()
        _img.src = _res
        emit('load')
        imgRef.value?.appendChild(_img)
        config.img = _img
        config.setStyle()
        return
      }
    }

    //如果缓存有，直接使用跳过加载
    if (uximg.errorCache[props.src]) {
      config.errorFun()
      return
    }

    //创建加载img的任务
    let isLoad = false
    const task = {
      action: () => {
        return new Promise((_resolve, _reject) => {
          config.loadimg = DomUtil.loadImage({
            url: props.src,
            extensions: props.extensions,
            base64: props.base64,
            timeout: props.timeout,
            load: (img, res) => {
              if (isLoad) return
              isLoad = true
              if (props.cache !== false) {
                uximg.cache[props.src] = res.dataBase64
              }
              _resolve(res.dataBase64)
            },
            error: () => {
              if (isLoad) return
              isLoad = true
              _resolve(false)
            }
          })
          timer.once(() => {
            if (isLoad) return
            isLoad = true
            config.loadimg?.abort()
            task.abort()
            _resolve(false)
          }, props.timeout)
        })
      },
      zIndex: props.zIndex,
      url: props.src,
      abort: null as any
    }
    const res: any = await uximg.task.create(task)

    config.loadId = StrUtil.getId()

    //如果加载成功，添加到dom，并设置样式
    if (res) {
      const _img = new Image()
      _img.src = res
      _img.id = 'x_img_' + config.loadId
      imgRef.value?.appendChild(_img)
      config.img = _img
      config.setStyle()
      emit('load')
    } else {
      //如果加载失败，设置错误回调
      config.errorFun()
    }
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
  config.loadimg?.abort()
})
</script>
<style lang="less" scoped>
.x-img {
  height: 100%;
  width: 100%;
}
</style>
