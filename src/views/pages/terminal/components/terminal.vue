<template>
  <div class="terminalPage">
    <div class="terminal-container">
      <div class="terminal" ref="terminalDiv"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
// import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';


// 定义终端容器的引用
const terminalDiv = ref<HTMLElement | null>(null);
const baseWsUrl = 'ws://162.14.64.127:8089/v1/ssh/open';
const authorization = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo') || '')?.token : '';
const wsUrl = `${baseWsUrl}?Authorization=${authorization}`;
console.log('ws连接',wsUrl);
// 添加命令提示库
// const commandSuggestions = {
//   'cat': { desc: '显示文件内容' },
//   'cd': { desc: '切换目录' },
//   'clear': { desc: '清屏' },
//   'help': { desc: '显示帮助信息' },
//   'ls': { desc: '列出目录内容' },
//   'pwd': { desc: '显示当前工作目录' },
//   // 可以添加更多命令
// };
// 模拟文件系统测试
// const fileSystem = {
//   '/': {
//     type: 'dir',
//     content: {
//       'home': {
//         type: 'dir',
//         content: {
//           'user': {
//             type: 'dir',
//             content: {
//               'documents': {
//                 type: 'dir',
//                 content: {
//                   'readme.txt': { type: 'file', content: '这是一个测试文件' },
//                   'test.js': { type: 'file', content: 'console.log("Hello World!");' },
//                   'project.zip': { type: 'file', content: 'ZIP文件内容' },
//                   'image.png': { type: 'file', content: '图片文件内容' },
//                   'script.sh': { type: 'file', content: '#!/bin/bash\necho "Hello"' },
//                   'report.pdf': { type: 'file', content: 'PDF文档内容' },
//                   'data.xlsx': { type: 'file', content: '表格内容' }
//                 }
//               },
//               'downloads': {
//                 type: 'dir',
//                 content: {
//                   'archive.tar.gz': { type: 'file', content: '压缩文件内容' },
//                   'movie.mp4': { type: 'file', content: '视频文件内容' },
//                   'setup.exe': { type: 'file', content: '可执行文件内容' }
//                 }
//               },
//               'pictures': {
//                 type: 'dir',
//                 content: {
//                   'avatar.jpg': { type: 'file', content: '照片内容' },
//                   'logo.svg': { type: 'file', content: '矢量图内容' }
//                 }
//               }
//             }
//           }
//         }
//       },
//       'usr': { type: 'dir', content: {} },
//       'etc': { type: 'dir', content: {} }
//     }
//   }
// };
// 当前工作目录测试使用可以删除
// let currentPath = '/home/user';
// 添加状态变量测试使用可以删除
// let suggestions: string[] = [];
// let currentSuggestionIndex = -1;
// 模拟命令处理器测试使用可以删除
// const executeCommand = (command: string): string => {
//   const args = command.trim().split(' ');
//   const cmd = args[0];

//   switch (cmd) {
//     case 'pwd':
//       return currentPath + '\n';

//     case 'ls':
//       const dir = getDirectoryFromPath(currentPath);
//       if (!dir || dir.type !== 'dir') return 'Not a directory\n';

//       let output = '';
//       for (const [name, item] of Object.entries(dir.content)) {
//         let colorCode = '\x1b[0m'; // 默认颜色

//         if ((item as { type: string }).type === 'dir') {
//           colorCode = '\x1b[34m'; // 目录使用蓝色
//         } else if (name.match(/\.(zip|gz|rar|7z|bz2|tar)$/i)) {
//           colorCode = '\x1b[31m'; // 压缩文件使用红色
//         } else if (name.match(/\.(sh|exe|cmd|bat|py|js|pl|ps1|rb)$/i)) {
//           colorCode = '\x1b[32m'; // 可执行文件使用绿色
//         } else if (name.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|mp4|mov)$/i)) {
//           colorCode = '\x1b[35m'; // 图片和视频文件使用洋红色
//         } else if (name.match(/\.(txt|md|doc|docx|pdf|xlsx|xls|csv|ppt|pptx|odt|ods)$/i)) {
//           colorCode = '\x1b[33m'; // 文档文件使用黄色
//         }
//         const prefix = (item as { type: string }).type === 'dir' ? 'd' : '-';
//         output += `${prefix}rw-r--r--  1 user  staff  ${colorCode}${name}\x1b[0m\n`;
//       }
//       return output;

//     case 'cd':
//       const newPath = args[1] || '/home/user';
//       if (newPath === '..') {
//         const parentPath = currentPath.split('/').slice(0, -1).join('/');
//         currentPath = parentPath || '/';
//         return '';
//       }
//       const targetDir = getDirectoryFromPath(newPath.startsWith('/') ? newPath : `${currentPath}/${newPath}`);
//       if (targetDir && targetDir.type === 'dir') {
//         currentPath = newPath.startsWith('/') ? newPath : `${currentPath}/${newPath}`;
//         return '';
//       }
//       return 'No such directory\n';

//     case 'cat':
//       if (!args[1]) return 'Please specify a file\n';
//       const file = getFileFromPath(`${currentPath}/${args[1]}`);
//       if (!file || file.type !== 'file') return 'No such file\n';
//       return file.content + '\n';

//     case 'clear':
//       xterm?.clear();
//       return '';

//     case 'help':
//       return 'Available commands:\n' +
//         'pwd - Print working directory\n' +
//         'ls - List directory contents\n' +
//         'cd [dir] - Change directory\n' +
//         'cat [file] - Show file contents\n' +
//         'clear - Clear screen\n' +
//         'help - Show this help\n';

//     default:
//       return `Command not found: ${cmd}\n`;
//   }
// };

// 辅助函数：从路径获取目录或文件测试使用可以删除
// const getDirectoryFromPath = (path: string) => {
//   const parts = path.split('/').filter(p => p);
//   let current: any = fileSystem['/'];

//   for (const part of parts) {
//     if (!current.content[part]) return null;
//     current = current.content[part];
//   }
//   return current;
// };

// const getFileFromPath = (path: string) => {
//   const parts = path.split('/').filter(p => p);
//   const fileName = parts.pop();
//   const dir = getDirectoryFromPath('/' + parts.join('/'));
//   return dir?.content[fileName!];
// };

// 添加命令历史记录
const commandHistory: string[] = [];
let historyIndex = -1;
// 定义状态变量
let xterm: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;
let commandBuffer = '';
// 添加一个标志位，用于记录 WebSocket 是否已经连接
let cursorPosition = 0;
let isWebSocketConnected = false;
// 处理终端输入数据的方法
const terminalOnData = (data: string) => {
  // 更严格的输入验证，只允许直接输入的ASCII字符
  if (!/^[\x00-\x7F]$/.test(data) || data.length > 1) {
    return; // 如果是组合键输入或非单个ASCII字符，直接返回不处理
  }
  // 处理退格键
  if (data === '\u007f') {
    if (cursorPosition > 0) {
      commandBuffer = commandBuffer.slice(0, -1);
      cursorPosition--;
      xterm?.write('\b \b');
    }
    return;
  }

  // 处理回车键
  if (data === '\r') {
    // 添加换行符
    xterm?.write('\r\n');

    // 发送命令到服务器
    const encodedCommand = btoa(commandBuffer + '\n');
    ws?.send(encodedCommand);

    // 保存命令历史
    if (commandBuffer) {
      commandHistory.push(commandBuffer);
      historyIndex = commandHistory.length;
    }

    // 重置命令缓冲区和光标位置
    commandBuffer = '';
    cursorPosition = 0;
    return;
    //测试版本可以删除
    // xterm?.write('\r\n');
    // if (commandBuffer.trim()) {
    //   const output = executeCommand(commandBuffer);
    //   xterm?.write(output);
    // }
    // xterm?.write('$ ');
    // commandBuffer = '';
    // cursorPosition = 0;
    // return;
  }

  // 处理普通字符输入
  xterm?.write(data);
  commandBuffer += data;
  cursorPosition++;
};
// 处理终端按键事件的方法
const terminalOnKey = (event: { domEvent: KeyboardEvent }) => {
  const { domEvent } = event;
  const ctrlKey = checkCtrlKeyAllSystem(domEvent);

  // 处理 Tab 键
  if (domEvent.key === 'Tab') {
    domEvent.preventDefault();// 阻止 Tab 键的默认行为
    domEvent.stopPropagation();
    // if (suggestions.length === 0) {//这个可以删
    //   const input = commandBuffer.trim();
    //   suggestions = Object.keys(commandSuggestions).filter(cmd =>
    //     cmd.startsWith(input)
    //   );
    //   if (suggestions.length > 0) {
    //     if (suggestions.length === 1) {
    //       // 只有一个匹配项时，直接补全剩余部分
    //       const remainingText = suggestions[0].slice(input.length);
    //       commandBuffer = suggestions[0];
    //       cursorPosition = commandBuffer.length;

    //       xterm?.write(remainingText);
    //     } else {
    //       // 多个匹配项，显示所有选项
    //       xterm?.write('\r\n');

    //       // 计算最长命令的长度，用于对齐描述
    //       const maxLength = Math.max(...suggestions.map(cmd => cmd.length));
    //       suggestions.forEach(cmd => {
    //         const padding = ' '.repeat(maxLength - cmd.length + 2); // 添加固定间距
    //         xterm?.write(`  ${cmd}${padding}- ${commandSuggestions[cmd as keyof typeof commandSuggestions].desc}\r\n`);
    //       });
    //       xterm?.write('$ ' + input); // 使用原始输入而不是整个命令
    //     }
    //     currentSuggestionIndex = 0;
    //   }
    // } else {
    //   // 再次按 Tab，循环选择
    //   currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
    //   while (cursorPosition > 0) {
    //     xterm?.write('\b \b');
    //     cursorPosition--;
    //   }
    //   commandBuffer = suggestions[currentSuggestionIndex];
    //   cursorPosition = commandBuffer.length;
    //   xterm?.write(commandBuffer);
    // }
    return;
  }

  // 其他按键时重置建议列表
  if (domEvent.key !== 'Tab') {
    // suggestions = [];
    // currentSuggestionIndex = -1;
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
  // 模拟 WebSocket 连接可以删除
  // setTimeout(() => {
  //   socketOnOpen();
  //   xterm?.write('$ ');
  // }, 500);
};
// WebSocket 连接成功的回调方法
const socketOnOpen = () => {
  xterm?.write(`连接成功 \r\n`);
  // // 连接成功后添加输入提示
  // xterm?.write('$ ');
};

// 修改 WebSocket 消息处理方法
const socketOnMessage = async (event: MessageEvent) => {
  try {
    const encodedText = event.data as string;

    // 添加调试日志
    console.log('收到的原始数据:', encodedText);

    // 验证数据是否为 Base64
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(encodedText);
    let text;

    if (isBase64) {
      try {
        text = atob(encodedText);
      } catch (error) {
        console.error('Base64 解码失败:', error);
        text = encodedText; // 如果解码失败，使用原始数据
      }
    } else {
      text = encodedText; // 如果不是 Base64，直接使用原始数据
    }

    console.log('解码后的数据:', text);

    // 处理命令提示符
    if (text.endsWith('$ ') || text.endsWith('# ')) {
      xterm?.write(text);
      commandBuffer = '';
      cursorPosition = 0;
    } else {
      // 处理命令输出
      const coloredText = text.replace(/([^\n]*)([\n\r]*)/g, (match, line, lineEnd) => {
        if (!line) return lineEnd; // 处理空行

        // 目录蓝色
        if (line.match(/^d/)) {
          return '\x1b[34m' + line + '\x1b[0m' + lineEnd;
        }
        // 压缩文件红色
        else if (line.match(/^-.*\.(zip|gz|rar|7z|bz2|tar)(\s|$)/i)) {
          return '\x1b[31m' + line + '\x1b[0m' + lineEnd;
        }
        // 可执行文件或脚本绿色
        else if (line.match(/^-.*\.(sh|exe|cmd|bat|py|js|pl|ps1|rb)(\s|$)/i) || line.match(/^-.*\*\s/)) {
          return '\x1b[32m' + line + '\x1b[0m' + lineEnd;
        }
        // 图片文件洋红色
        else if (line.match(/^-.*\.(jpg|jpeg|png|gif|bmp|svg|webp|ico)(\s|$)/i)) {
          return '\x1b[35m' + line + '\x1b[0m' + lineEnd;
        }
        // 文档文件黄色
        else if (line.match(/^-.*\.(txt|md|doc|docx|pdf|xlsx|xls|csv|ppt|pptx|odt|ods)(\s|$)/i)) {
          return '\x1b[33m' + line + '\x1b[0m' + lineEnd;
        }
        return match;
      });

      xterm?.write(coloredText);
    }
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
    // 终端主题
    theme: {
      foreground: '#ffffff',
      background: '#000000',
      cursor: '#ffffff',
      // 添加更多颜色定义
      blue: '#0066ff',
      cyan: '#00ffff',
      green: '#33ff33',
      magenta: '#ff00ff',
      red: '#ff0000',
      yellow: '#ffff00',
    },
    fontFamily: 'Consolas, Courier, monospace',
    fontSize: 14,
    convertEol: true, // 确保换行符能正确转换
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
  margin-top: 2%;
  border-radius: 5px;
  height: calc(100vh - 200px);
  /* 减去顶部margin和其他可能的间距 */
  max-height: 750px;
  /* 添加最大高度限制 */
  display: flex;
  flex-direction: column;
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
  padding: 0px 10px;
}

:deep(.xterm-viewport) {
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #666 #333;
}

:deep(.xterm-viewport::-webkit-scrollbar) {
  width: 8px;
}

:deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: #333;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background-color: #666;
  border-radius: 4px;
}
</style>