import { reactive } from "vue";

export const notice = reactive({
  num: 0,
  show: false,
  currentNotice: "",
  list: [] as any[],
  open() {
    notice.show = true;
    notice.getList();
  },
  close() {
    notice.show = false;
  },
  noticeList() {
    return new Promise((resolve, reject) => {
      resolve({
        code: 200,
        data: [
          {
            title: "公告标题",
            content: "公告内容",
            install: false,
          },
          {
            title: "公告标题",
            content: "公告内容",
            install: false,
          },
          {
            title: "公告标题",
            content: "公告内容",
            install: false,
          },
        ],
      });
    });
  },
  async getList() {
    const res: any = await notice.noticeList();
    if (res && res.data.length > 0) {
      notice.list = res.data.filter((item:any) => {
        res.data[0].install = true;
        return !item.install;
      });
      notice.num = notice.list.length;
    }
  },
});
