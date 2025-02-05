<template>
  <div
    id="message-input"
    ref="messageInputDom"
    contenteditable="true"
    spellcheck="false"
    @keydown="conf.enter"
    @input="messageInput"
    @paste="handlePaste"
    @blur="conf.blur"
    :inputmode="conf.inputmode"
    @click="conf.blur"
    v-scroll
  ></div>
</template>
<script setup lang="ts">
import System from '@/utils/System'
import { nextTick, reactive, ref } from 'vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue', 'enter'])

const conf = reactive({
  inputmode: undefined as any,
  enter: (e: any) => {
    const isEnterKey = e.keyCode === 13
    const isShiftEnter = e.shiftKey && isEnterKey
    if (isEnterKey && System.platform !== 'android') {
      if (System.platform === 'pc' && isShiftEnter) return
      e.preventDefault()
      emit('enter', getMessage())
    }
  },
  blur: () => {
    messageInputDom.value.removeAttribute('readonly') // 移除 readonly
    conf.inputmode = undefined
  }
})

// 输入框复制文本事件回调(将复制带样式的文本样式清空, 只保留纯文本)
const handlePaste = (e: any) => {
  e.preventDefault()
  let text
  let clp = (e.originalEvent || e).clipboardData
  if (clp === undefined || clp === null) {
    text = window.clipboardData.getData('text') || ''
    if (text !== '') {
      if (window.getSelection) {
        var newNode = document.createElement('span')
        newNode.innerHTML = text
        //@ts-ignore
        window.getSelection().getRangeAt(0).insertNode(newNode)
      } else {
        //@ts-ignore
        document.selection.createRange().pasteHTML(text)
      }
    }
  } else {
    text = clp.getData('text/plain') || ''
    if (text !== '') {
      document.execCommand('insertText', false, text)
    }
  }
}

let message = ref<string>('')

// 发送消息按钮回调
const getMessage = () => {
  let _msg = message.value.trim()
  _msg = _msg
    .replace(/<br>/g, '')
    .replace(/<div>/g, '')
    .replace(/<\/div>/g, '')
  if (!_msg.length) {
    return ''
  }
  // 识别输入框的内容中是否带有链接
  let reg = /(http:\/\/|https:\/\/|www\.)((\w|=|\?|\.|\/|&|-)+)/g
  let text = message.value
  // 链接处理后的结果
  let message_res = text.replace(reg, (arg: string) => {
    let cur_str = arg
    if (arg.indexOf('http') == -1 && arg.indexOf('https') == -1) {
      cur_str = 'http://' + arg
    }
    return `<a href="${cur_str}" target="_blank" style="text-decoration: underline; cursor: pointer; color: inherit;color:#1a0dab;">${arg}</a>`
  })
  return message_res
}

const clear = (focus = false) => {
  message.value = ''
  messageInputDom.value.innerHTML = ''
  if (focus) messageInputDom.value.focus()
}

// emoji图标是否选中
let emojiActive = ref<boolean>(false)
// emoji组件是否打开
let emojiFlag = ref<boolean>(false)

// emoji组件展示
const handleEmoji = () => {
  emojiActive.value = true
  emojiFlag.value = true
}

// 自定义输入框子节点元素列表
let childNodes = ref<any>([])

// 输入框input事件
const messageInput = (e: Event) => {
  childNodes.value = (e.target as HTMLInputElement).childNodes
  message.value = (e.target as HTMLInputElement).innerHTML
  emit('update:modelValue', message.value)
  messageInputDom.value.scrollTo({
    top: messageInputDom.value.scrollHeight,
    behavior: 'smooth'
  })
  
}

const messageInputDom = ref()

// 没有键盘的聚焦
const focusWithoutKeyboard = (element: HTMLElement) => {
  element.setAttribute('readonly', 'true')
  conf.inputmode = 'none'
  return new Promise((resolve) => {
    nextTick(() => {
      element.focus()
      if (System.platform !== 'ios') {
        setTimeout(() => {
          element.removeAttribute('readonly')
          conf.inputmode = undefined
        }, 300)
      }
      resolve(true)
    })
  })
}

// 选择的emoji
const insertEmoji = async (url: string, size: string = '18rem') => {
  if (document.activeElement != messageInputDom.value) {
    await focusWithoutKeyboard(messageInputDom.value)
  }
  let emojiImg = `<img src="${url}" width="${size}" height="${size}" style="vertical-align: middle;transform: translateY(-3rem);">`
  document.execCommand('insertHTML', false, emojiImg)
}

defineExpose({
  insertEmoji,
  getMessage,
  clear,
  focus: () => {
    messageInputDom.value.focus()
  }
})
</script>
<style lang="less" scoped>
#message-input {
  width: 100%;
  flex: 1;
  margin: 15rem 0;
  box-sizing: border-box;
  resize: none;
  overflow: auto;
  max-height: 286rem;
  font-size: 30rem;
  min-height: 41rem;
  caret-color: #07c261;
}
</style>
