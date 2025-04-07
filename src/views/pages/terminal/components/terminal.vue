<template>
  <div class="terminalPage">
    <div class="terminal-container">
      <div class="terminal" ref="terminalDiv" ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
// import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import { linuxCommands, getCommandSuggestions, CommandInfo } from '../config/commands';
// 添加状态变量
let suggestions: CommandInfo[] = [];
let currentSuggestionIndex = -1;
// 定义终端容器的引用
const terminalDiv = ref<HTMLElement | null>(null);
const baseWsUrl = 'ws://162.14.64.127:8089/v1/ssh/open';
const authorization = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo') || '')?.token : '';
const wsUrl = `${baseWsUrl}?Authorization=${authorization}`;
// console.log('ws连接',wsUrl);
// 添加命令提示库
// 添加命令历史记录
const commandHistory: string[] = [];
let historyIndex = -1;
// 定义状态变量
let xterm: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;
// 添加一个变量来存储最后发送的命令
let lastCommand = '';
let commandBuffer = '';
// 添加一个标志位，用于记录 WebSocket 是否已经连接
let cursorPosition = 0;
let isWebSocketConnected = false;

// 添加一个辅助函数来计算字符串的显示长度
const getStringDisplayLength = (str: string): number => {
  return [...str].reduce((len, char) => len + (/[\u4e00-\u9fa5]/.test(char) ? 2 : 1), 0);
};
// 处理终端输入数据的方法
const terminalOnData = (data: string) => {
  // 处理退格键
  if (data === '\u007f') {
    if (cursorPosition > 0) {
      // 获取要删除的字符
      const lastChar = [...commandBuffer].pop() || '';
      // 删除最后一个字符
      commandBuffer = [...commandBuffer].slice(0, -1).join('');
      // 计算要删除的字符的显示宽度
      const charWidth = /[\u4e00-\u9fa5]/.test(lastChar) ? 2 : 1;
      cursorPosition -= charWidth;
      // 执行退格操作
      for (let i = 0; i < charWidth; i++) {
        xterm?.write('\b \b');
      }
    }
    return;
  }

  // 处理回车键- 同时处理 \r 和 \n
  if (data === '\r' || data === '\n') {
    // 如果命令缓冲区为空且最后一个命令也为空，说明可能是输入法的回车，直接返回
    if (!commandBuffer && !lastCommand) {
      return;
    }
    // 保存最后发送的命令
    lastCommand = commandBuffer;

    // 使用 UTF-8 编码处理中文
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(commandBuffer + '\n');
  // 将 Uint8Array 转换为数组
  const base64Command = btoa(String.fromCharCode(...Array.from(utf8Bytes)));
  ws?.send(base64Command);

    // 保存命令历史
    if (commandBuffer) {
      commandHistory.push(commandBuffer);
      historyIndex = commandHistory.length;
    }

    // 重置命令缓冲区和光标位置
    commandBuffer = '';
    cursorPosition = 0;
    return;
  }

  // 处理普通字符输入（包括中文）
  xterm?.write(data);
  commandBuffer += data;
  // 更新光标位置，使用实际显示长度
  cursorPosition += getStringDisplayLength(data);
};

// 处理终端按键事件的方法
const terminalOnKey = (event: { domEvent: KeyboardEvent }) => {
  const { domEvent } = event;
  const ctrlKey = checkCtrlKeyAllSystem(domEvent);
  console.log("suggestions",commandBuffer);
  
  // 处理 Tab 键处理逻辑
  if (domEvent.key === 'Tab') {
    domEvent.preventDefault();
    domEvent.stopPropagation();

    if (suggestions.length === 0) {
      suggestions = getCommandSuggestions(commandBuffer);
      if (suggestions.length > 0) {
        if (suggestions.length === 1) {
          // 只有一个匹配项时，直接补全
          const remainingText = suggestions[0].name.slice(commandBuffer.length);
          commandBuffer = suggestions[0].name;
          cursorPosition = commandBuffer.length;
          xterm?.write(remainingText);
        } else {
          // 多个匹配项，显示所有选项
          xterm?.write('\r\n');
          // 将命令列表按每行7个进行分组显示
          const commands = suggestions.map(cmd => cmd.name);
          const maxLength = Math.max(...commands.map(cmd => cmd.length)) + 2;
          let line = '';
          commands.forEach((cmd, index) => {
            // 补充空格以对齐
            const paddedCmd = cmd.padEnd(maxLength, ' ');
            line += paddedCmd;
            // 每7个命令或最后一个命令时换行
            if ((index + 1) % 7 === 0 || index === commands.length - 1) {
              xterm?.write(line + '\r\n');
              line = '';
            }
          });
          xterm?.write('$ ' + commandBuffer);
        }
        currentSuggestionIndex = 0;
      }
    } else {
      // 循环选择建议
      currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
      while (cursorPosition > 0) {
        xterm?.write('\b \b');
        cursorPosition--;
      }
      commandBuffer = suggestions[currentSuggestionIndex].name;
      cursorPosition = commandBuffer.length;
      xterm?.write(commandBuffer);
    }
    return;
  }

  // 其他按键时重置建议列表
  if (domEvent.key !== 'Tab') {
    suggestions = [];
    currentSuggestionIndex = -1;
  }

  // 处理左箭头键
  if (domEvent.key === 'ArrowLeft') {
    if (cursorPosition > 0) {
      cursorPosition--;
      xterm?.write('\b');
    }
    return;
  }

  // 处理右箭头键
  if (domEvent.key === 'ArrowRight') {
    if (cursorPosition < commandBuffer.length) {
      xterm?.write(commandBuffer[cursorPosition]);
      cursorPosition++;
    }
    return;
  }

  // 处理方向键
  if (domEvent.key === 'ArrowUp') {
    if (historyIndex > 0) {
      historyIndex--;
      const command = commandHistory[historyIndex];
      // 清除当前行
      while (cursorPosition > 0) {
        xterm?.write('\b \b');
        cursorPosition--;
      }
      commandBuffer = command;
      cursorPosition = command.length;
      xterm?.write(command);
    }
    return;
  }

  if (domEvent.key === 'ArrowDown') {
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      const command = commandHistory[historyIndex];
      // 清除当前行
      while (cursorPosition > 0) {
        xterm?.write('\b \b');
        cursorPosition--;
      }
      commandBuffer = command;
      cursorPosition = command.length;
      xterm?.write(command);
    } else if (historyIndex === commandHistory.length - 1) {
      historyIndex++;
      // 清除当前行
      while (cursorPosition > 0) {
        xterm?.write('\b \b');
        cursorPosition--;
      }
      commandBuffer = '';
      cursorPosition = 0;
    }
    return;
  }

  // 处理 Ctrl+C
  if (ctrlKey && domEvent.key.toLowerCase() === 'c') {
    xterm?.write('^C\r\n$ ');
    commandBuffer = '';
    cursorPosition = 0;
    return;
  }
};


// 判断是否按了Ctrl键 - 兼容Mac和Win不同系统
const checkCtrlKeyAllSystem = (domEvent: KeyboardEvent): boolean => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isPressCtrlKey = isMac ? domEvent.metaKey : domEvent.ctrlKey;
  return isPressCtrlKey;
};

// 初始化 WebSocket 的方法
const initSocket = () => {
  // 只有当 WebSocket 未连接时，才进行连接操作实际方法
  if (!isWebSocketConnected) {
    ws = new WebSocket(wsUrl);
    ws.onopen = socketOnOpen;
    ws.onmessage = socketOnMessage;
    ws.onclose = socketOnClose;
    ws.onerror = socketOnError;
    isWebSocketConnected = true;
  }
};
// WebSocket 连接成功的回调方法
const socketOnOpen = () => {
  xterm?.write(`连接成功 \r\n`);
  // // 连接成功后添加输入提示
  xterm?.write('$ ');
};
// 添加一个变量来存储当前目录
let currentPath = '~';
// 修改 socketOnMessage 消息处理方法
const socketOnMessage = async (event: MessageEvent) => {
  try {
    const text = event.data as string;

    // 如果有最后发送的命令，检查响应是否包含该命令
    if (lastCommand && text.includes(lastCommand)) {
      // 找到命令在响应中的位置
      const cmdIndex = text.indexOf(lastCommand);
      // 只输出命令后面的部分
      const output = text.substring(cmdIndex + lastCommand.length);
      xterm?.write(output);
      // 清除最后发送的命令
      lastCommand = '';
    } else {
      // 处理命令提示符
      if (text.endsWith('$ ') || text.endsWith('# ')) {
        xterm?.write(text);
        commandBuffer = '';
        cursorPosition = 0;
      } else {
        // 处理命令输出
        xterm?.write(text);
      }
    }
    console.log('收到服务器响应:', text);
  } catch (error) {
    console.error('处理 WebSocket 消息时出错:', error);
    xterm?.write('\r\n\x1b[91m处理服务器响应时出错\x1b[0m\r\n');
  }
};

// 初始化终端的方法
const initTerminal = () => {
  xterm = new Terminal({
    rows: 30, // 可视窗口的行数
    cols: 80, // 可视窗口的列数
    cursorBlink: true, // 光标是否闪烁
    fontFamily: 'Consolas, Courier, monospace',
    fontSize: 14,
    lineHeight: 1.4,
    convertEol: true, // 确保换行符能正确转换
    theme: {
      foreground: '#a6abaa',  // 设置文字颜色
      cursor: '#a6abaa',      // 设置光标颜色
    }
  });

  if (terminalDiv.value) {
    xterm.open(terminalDiv.value);
    // 添加自定义按键处理器来禁用 Tab 键的默认行为
    xterm.attachCustomKeyEventHandler((event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        terminalOnKey({ domEvent: { key: 'Tab', preventDefault: () => { }, stopPropagation: () => { } } as KeyboardEvent }); // 创建一个模拟的事件对象来调用Tab键补全逻辑
        return false; // 阻止 xterm 处理 Tab 键
      }
      return true; // 允许其他按键正常处理
    });

  }

  fitAddon = new FitAddon();
  xterm.loadAddon(fitAddon);
  fitAddon.fit();

  const handleResize = () => {
    try {
      fitAddon?.fit();
    } catch (e) {
      console.error((e as Error).message);
    }
  };

  window.addEventListener('resize', handleResize);

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
  });

  xterm.write('Connecting \r\n');
  xterm.onData((data) => terminalOnData(data));
  xterm.onKey((event) => terminalOnKey(event));
};

// WebSocket 连接关闭的回调方法
const socketOnClose = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    xterm?.write('\r\n\x1b[91m连接已关闭，请刷新重试！');
  }
  // 当连接关闭时，将标志位重置为 false
  isWebSocketConnected = false;
};

// WebSocket 连接出错的回调方法
const socketOnError = (err: Event) => {
  console.error('WebSocket connection error:', err);
  // 当连接出错时，将标志位重置为 false
  isWebSocketConnected = false;
};


// 组件挂载时初始化终端和 WebSocket
onMounted(() => {
  initTerminal();
  initSocket();
  // new WebSocket(wsUrl);
});

// 组件销毁前关闭 WebSocket 连接
// onBeforeUnmount(() => {
//   ws?.close();
// });
</script>

<style scoped>
/* 可以在这里添加样式 */
.terminalPage {
  padding: 0px;
  /* background-color: #fff; */
  margin-top: 1%;
  border-radius: 5px;
  height: calc(100vh - 100px); /* 默认高度 */
  min-height: 500px;          /* 最小高度 */
  max-height: 900px;          /* 最大高度 */
  display: flex;
  flex-direction: column;
  
}

/* 小屏幕设备 (平板和小屏电脑, 小于 1024px) */
@media screen and (max-width: 1024px) {
  .terminalPage {
    height: calc(100vh - 100px);
    margin-top: 1%;
  }
}

/* 中等屏幕设备 (大于等于 1024px) */
@media screen and (min-width: 1024px) and (max-width: 1440px) {
  .terminalPage {
    height: calc(100vh - 100px);
    margin-top: 1.5%;
  }
}

/* 大屏幕设备 (大于等于 1440px) */
@media screen and (min-width: 1440px) {
  .terminalPage {
    height: calc(100vh - 100px);
    margin-top: 1.5%;
  }
}

.terminal-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.terminal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

:deep(.xterm-rows) {
  padding: 0px 10px 0 10px;
}

:deep(.xterm-viewport) {
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #666 #333;
  border-radius: 5px;
}

/* :deep(.xterm-viewport::-webkit-scrollbar) {
  width: 8px;
} */
/* 
:deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: #333;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background-color: #666;
  border-radius: 4px;
} */

</style>