import { apis } from '@/api'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    listData: [] as any[],
    pageNum: 1,
    pageSize: 10,
    total: 0,
    typeList: [] as any[],
    //返回
    goBack() {
      sutil.pageBack()
      Cookie.remove('typeList')
    },

    getQuestionList(){
      apis.questionList({current:conf.pageNum,pageSize:conf.pageSize}).then((res: any) => {
        res.data.forEach((item: any) => {
          item.typeName = conf.typeList.find((type: any) => type.dictKey == String(item.issueType))?.dictValue
        })
        conf.listData = [...conf.listData,...res.data]
      })
    },

    getDict(){
      apis.dictBycode({code:'lottery_internal_message'}).then((res: any) => {
        conf.typeList = res.data
        Cookie.set('typeList',conf.typeList)
        conf.getQuestionList()
      })
    },

    handlePageInto(type: string,obj:any) {
      type == 'detail' && (Cookie.set('detailObj',JSON.stringify(obj)))
      let url = '/user/Feedback/' + type
      System.router.push(url)
    },

    // 分页
    moreMessage(event: any) {
      const { scrollTop, clientHeight, scrollHeight } = event.target
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        // 5是一个缓冲值，避免提前加载
        if (conf.pageSize * conf.pageNum >= conf.total) return
        conf.pageNum++
        conf.getQuestionList()
      }
    },
  })


  onMounted(() => {
    conf.getDict()  
  })

  return conf
}
