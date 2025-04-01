import { reactive } from "vue";

export const notice = reactive({
    num: 0,
    show: false,
    currentNotice: "",
    list: [] as any[],
    open() {
        notice.show = true
    },
    close() {
        notice.show = false
    },
    getList() {
        return []
    },
    delete(index: number) {
        notice.list.splice(index, 1)
    }
})