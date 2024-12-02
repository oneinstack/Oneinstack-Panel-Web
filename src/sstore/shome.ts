import { apis } from '@/api/index'
import i18n, { langobj } from '@/lang'
import System from '@/utils/System'
import { reactive } from 'vue'

const { activityList, announcementList, languageList } = apis

export const shome = reactive({
  languagId: '',
  languageList: [],
  // 获取当前语言信息
  async currentLanguage() {
    let _list = shome.languageList
    //会话级缓存
    if (!_list.length) {
      const { data } = await languageList({})
      _list = data
      shome.languageList = data
    }
    let item: any = _list.find((x: any) => x.countryCode == langobj[i18n.locale])
    if (!item) item = _list.find((x: any) => x.areaCode == langobj['en-us'])
    if (item) {
      shome.languagId = item.id
      if (!shome.data[item.id]) {
        shome.data[item.id] = {
          noticelist: [],
          activityList: []
        }
      }
      return item
    }
  },
  data: {} as any,
  /**
   * 获取公告列表
   * @returns
   */
  async getNoticeList() {
    let current = await shome.currentLanguage()
    if (current) {
      let _list = shome.data[current.id].noticelist
      if (!_list.length) {
        System.loading()
        const { data } = await activityList({
          current: 1,
          size: 1000,
          languageId: current.id,
          final: () => {
            System.loading(false)
          }
        })
        _list = data.records ?? []
        shome.data[current.id].noticelist = _list
      }
      return _list
    }
  },

  /**
   * 获取轮播图
   * @returns
   */
  async getActivityList() {
    let current = await shome.currentLanguage()
    if (current) {
      let _list = shome.data[current.id].activityList
      if (!_list.length) {
        const { data } = await announcementList({
          current: 1,
          size: 1000,
          languageId: current.id
        })
        _list = data.records ?? []
        shome.data[current.id].activityList = _list
      }
      return _list
    }
    return []
  }
})

export default shome
