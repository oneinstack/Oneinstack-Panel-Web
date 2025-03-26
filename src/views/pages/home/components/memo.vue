<script setup lang="ts">
import { onMounted, nextTick, reactive } from "vue";
import CustomDialog from "@/components/custom-dialog.vue";
import { Api } from "@/api/Api";
import { ElMessage } from "element-plus";
const emit = defineEmits(["update"]);
const conf = reactive({
  memo: {
    show: false,
    data: {
      id: null as number | null,
      content: "",
    },
    open: async (item:any) => {
      conf.memo.show = true;
      conf.memo.data = item;
      conf.memo.data.id = 1;
    },
    close: () => {
      conf.memo.show = false
      conf.memo.data = {
        id: null,
        content: "",
      };
    },
    update: async () => {
      await Api.updateSysRemark(conf.memo.data);
      ElMessage.success("保存成功");
      conf.memo.show = false;
      // props.update();
      emit("update");
    },
  },
});
defineExpose({
  open: conf.memo.open,
});
// 处理回车事件
const handleKeydown = (e: KeyboardEvent | Event) => {
  const event = e as KeyboardEvent;
  if (event.key === "Enter") {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;
    const content = textarea.value;
    const cursorPos = textarea.selectionStart;
    const lines = content.split("\n");

    // 找到光标所在的行和位置
    const currentLineNumber =
      content.substr(0, cursorPos).split("\n").length - 1;
    const currentLine = lines[currentLineNumber] || "";
    const cursorPosInLine =
      cursorPos -
      content.split("\n").slice(0, currentLineNumber).join("\n").length -
      1;

    // 分割当前行
    const beforeText = currentLine.substring(0, cursorPosInLine);
    const afterText = currentLine.substring(cursorPosInLine);

    // 更新行内容
    lines[currentLineNumber] = beforeText;
    lines.splice(currentLineNumber + 1, 0, afterText);

    // 重新计算所有行的序号
    const newLines = lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine || index === currentLineNumber + 1) {
        // 修改这里，确保新行也会添加序号
        const content = trimmedLine.replace(/^\d+\.\s*/, "");
        return `${index + 1}. ${content}`;
      }
      return line;
    });

    conf.memo.data.content = newLines.join("\n");

    // 设置光标位置
    nextTick(() => {
      const newPos =
        newLines.slice(0, currentLineNumber + 1).join("\n").length +
        `\n${currentLineNumber + 2}. `.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }
};
</script>

<template>
  <custom-dialog
    :show="conf.memo.show"
    title="新建备忘录"
    width="624px"
    :show-close="false"
    @update:show="conf.memo.close"
  >
    <el-input
      v-model="conf.memo.data.content"
      type="textarea"
      :rows="20"
      placeholder="请输入备忘录内容"
      @keydown="handleKeydown"
    />
    <template #footer>
      <el-button type="primary" @click="conf.memo.update">保存</el-button>
      <el-button @click="conf.memo.close">取消</el-button>
    </template>
  </custom-dialog>
</template>

<style scoped lang="less"></style>
