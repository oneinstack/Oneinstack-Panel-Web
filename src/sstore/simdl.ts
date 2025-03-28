import ArrayUtil from '@/utils/ArrayUtil'

export const DialogName = {
  /**
   * 加载中
   */
  loading: 'loading',

}

export const simdl = {
  data:{} as any,
  list: [] as any[],
  listType: [] as any[],
  getItem(type:any) {
    return simdl.list.find((v:any) => v.type === type)
  },
  open(item:any) {
    if (typeof item === 'string') {
      item = {
        type: item
      }
    }
    const _this = simdl
    item.zIndex = _this.list.length ? _this.list[_this.list.length - 1].zIndex + 1 : 1000
    _this.list.push(item)
    _this.listType.push(item.type)
  },
  close(type:any) {
    const _this = simdl
    ArrayUtil.remove(_this.list, (v:any) => v.type === type)
    ArrayUtil.remove(_this.listType, type)
  },
  clear(){
    simdl.list =  []
    simdl.listType =  []
  }
}
