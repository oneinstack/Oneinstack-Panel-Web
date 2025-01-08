import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import sshake from '@/sstore/sshake'


export const index = () => {
  const conf = reactive({
    typeList: [] as any[],
    imgList: [] as any[],
    dataObj:{} as any,
    detailObj:{} as any,
    replyContent:'',
    //返回
    goBack() {
      Cookie.remove('detailObj')
      sutil.pageBack()
    },

    //获取详情
    getDetail(){
      apis.questionDetail({id:conf.dataObj.id}).then((res: any) => {
        conf.detailObj = res.data
        conf.detailObj.typeName = conf.typeList.find((item: any) => item.dictKey == String(conf.dataObj.issueType))?.dictValue
        conf.imgList = res.data.issueUrl.split(',') || []
        conf.detailObj.reolyList?.forEach((item: any) => {
          item.replyTime = new Date(item.replyTime).Format()
        })
      })
    },

    handleDataSubmit(){
      if(!conf.replyContent){
        System.toast(i18n.t('Feedback.replyContentTip'))
        return
      }

      let obj = {
        replyDepict:conf.replyContent,
        id:conf.dataObj.id,
      }

      sshake.shakeFunction({
        key: 'bindPaymentBtn',
        time: 2000,
        success: () => {
          // 点击按钮执行的操作
          System.loading()
          apis.reoly({
            ...obj,
            success: (res: any) => {
              if (res.code == 200) {
                setTimeout(() => {
                  conf.goBack()
                }, 2000)
                System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
              } else {
                System.toast(i18n.t(`code.${res.code}`) || 'fail')
              }
            },
            complete: () => {
              System.loading(false)
            }
          })
        },
        fail: () => {
          // 请勿连续点击
          System.toast(i18n.t('user.shakeTip'))
        }
      })
    
    }

    
  })

  onMounted(() => {
    conf.dataObj = Cookie.get('detailObj') || {}
    conf.typeList = Cookie.get('typeList') || []
    conf.getDetail()

  })

  return conf
}
