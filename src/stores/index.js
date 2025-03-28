import {
  defineStore
} from 'pinia';

export const useCounterStore = defineStore('store', {
  state: () => ({
    selectedIndex: -1, // 默认没有选中任何项
  }),
  getters: {

  },
  actions: {
    // 设置选中的导航项下标
    setSelectedIndex(index) {
      this.selectedIndex = index;
      console.log('index',index)
    },
  },
});
