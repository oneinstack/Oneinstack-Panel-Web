<template>
  <div
    id="message-input"
    ref="messageInputDom"
    contenteditable="true"
    spellcheck="false"
    @input="messageInput"
    @paste="handlePaste"
  ></div>
</template>
<script setup lang="ts">
import System from '@/utils/System'
import { ref } from 'vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

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
  if (!message.value || message.value.length > 2000) {
    return System.toast(!message.value ? '消息不能为空' : '你的小作文别超过2000字')
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
    return `<a href="${cur_str}" target="_blank" style="text-decoration: underline; cursor: pointer; color: inherit;">${arg}</a>`
  })
  // 默认消息类型
  let msgType = 0
  if (childNodes.value.length === 1 && childNodes.value[0].nodeName.toLowerCase() === 'img') {
    // 单个emoji 变为大图emoji (4为前后端约定的参数)
    msgType = 4
    let imgTag = `<img src="${childNodes.value[0].getAttribute('src')}" width="65" height="65">`
    return {
      imgTag,
      msgType
    }
  } else {
    return {
      msg: message_res,
      msgType
    }
  }
}

const clear = () => {
  message.value = ''
  messageInputDom.value.innerHTML = ''
  messageInputDom.value.focus()
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
}

const messageInputDom = ref()

// 选择的emoji
const insertEmoji = (url: string, size: string = '25rem') => {
  // 没有焦点就获取输入框焦点
  if (document.activeElement != messageInputDom.value) {
    messageInputDom.value.focus()
  }
  let emojiImg = `<img src="${url}" width="${size}" height="${size}" style="vertical-align: middle;">`
  document.execCommand('insertHTML', false, emojiImg)
}

defineExpose({
  insertEmoji,
  getMessage,
  clear
})
</script>
<style lang="less" scoped>
#message-input {
  width: 100%;
  flex: 1;
  margin: 20rem 0;
  box-sizing: border-box;
  resize: none;
  overflow: auto;
  max-height: 300rem;
  &::placeholder {
    font-size: 24rem;
  }
}
</style>
