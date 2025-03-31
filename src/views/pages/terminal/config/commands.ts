import linuxCommandData from 'linux-command/dist/data.json';

export interface CommandInfo {
  name: string;
  desc: string;
  category?: string;
}

// 将 linux-command 的数据转换为我们需要的格式
export const linuxCommands: CommandInfo[] = Object.entries(linuxCommandData).map(([name, info]: [string, any]) => {
    // console.log('命令名称:', name);
    // console.log('命令信息:', info);
    return {
      name,
      desc: info.d,
      category: info.p || 'other'
    };
  });

// 获取命令建议
export const getCommandSuggestions = (input: string): CommandInfo[] => {
  const lowercaseInput = input.toLowerCase();
  return linuxCommands.filter(cmd => 
    cmd.name.toLowerCase().startsWith(lowercaseInput)
  );
};