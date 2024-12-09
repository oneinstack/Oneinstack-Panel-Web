<template>
  <div
    id="message-input"
    ref="messageInputDom"
    contenteditable="true"
    spellcheck="false"
    @input="messageInput"
    @paste="handlePaste"
    @keydown.enter="inputKeyDown"
  ></div>
</template>
<script setup lang="ts">
import System from '@/utils/System'
import { onMounted, ref } from 'vue'

const emit = defineEmits(['handleSendMessage'])

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
let tips = ref<boolean>(false)

// 发送消息按钮回调
const sendMessage = () => {
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
    emit('handleSendMessage', imgTag, msgType)
  } else {
    emit('handleSendMessage', message_res, msgType)
  }
  message.value = ''
  messageInputDom.value.innerHTML = ''
  messageInputDom.value.focus()
}

// input的keydown事件
const inputKeyDown = (e: any) => {
  if (e.shiftKey && e.keyCode === 13) {
    return
  } else if (e.keyCode === 13) {
    e.preventDefault()
    sendMessage()
  }
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
}

const messageInputDom = ref()
// 选择的emoji
const selectEmoji = (index: number) => {
  // 没有焦点就获取输入框焦点
  if (document.activeElement != messageInputDom.value) {
    messageInputDom.value.focus()
  }
  let emojiImg = `<img src="./gif/${index}.gif" width="25" height="25" style="vertical-align: middle;">`
  document.execCommand('insertHTML', false, emojiImg)
  // 保存最近使用的emoji
  recentlyUseEmoji(index)
}

// 最近使用的emoji列表
const historyEmojiList = ref<number[]>([])

onMounted(() => {
  // 加载历史emoji
  historyEmojiList.value = localStorage.getItem('emojiHistory')
    ? JSON.parse(localStorage.getItem('emojiHistory') as string)
    : []
})

// 保存最近使用的emoji
const recentlyUseEmoji = (index: number) => {
  let idx = historyEmojiList.value.indexOf(index)
  if (idx < 0) {
    historyEmojiList.value.unshift(index)
  } else {
    historyEmojiList.value.unshift(historyEmojiList.value.splice(idx, 1)[0])
  }
  // 只要两行emoji(16个)
  historyEmojiList.value = historyEmojiList.value.splice(0, 16)
  // 保存记录
  localStorage.setItem('emojiHistory', JSON.stringify(historyEmojiList.value))
}

// emoji图标是否选中
let codeActive = ref<boolean>(false)
// emoji组件是否打开
let codeFlag = ref<boolean>(false)
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
