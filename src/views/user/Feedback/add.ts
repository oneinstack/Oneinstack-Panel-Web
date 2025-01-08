import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import sshake from '@/sstore/sshake'

export const index = () => {
  const conf = reactive({
    modalShow: false as boolean,
    modalTitle: '' as any,
    typeList: [] as any[],
    formData: {
      type: '',
      typeName:'',
      description: '',
      fileList: [],
      issueUrl: [],
      account:'',
    } as any,
    isShowImg:false,

    getDict(){
      let data = Cookie.get('typeList')
      data.forEach((item: any) => {
          item.isChecked = false
      })
      conf.typeList = data
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    //打开模态框
    handleOpenMadal() {
      conf.modalShow = true
      conf.modalTitle = 'Select Type'
    },

    //关闭模态框
    hideModal() {
      conf.modalShow = false
      conf.modalTitle = null
    },

    //模态框选择
    handleModalSelect(item: any) {
        conf.typeList.forEach((res: any) => {
            res.isChecked = false
        })
        item.isChecked = true
        conf.formData.typeName = item.dictValue
        conf.formData.type = item.dictKey
        conf.hideModal()
    },

    //清除输入框
    handleClearInput(key: string) {
      conf.formData[key] = ''
    },

    //图片上传
    handleSelectPhoto: async (file: any) => {
        if (file.content.startsWith('data:image')) {
            System.loading()
            const res = await apis.upload({
              file: file.file,
              final: (_, res) => {
                System.loading(false)
              }
            })
            conf.formData.issueUrl.push(res.data.link)
            conf.formData.fileList.length > 3 && (conf.isShowImg = true)
          }
    },

    //提交  
    handleDataSubmit:() => {
        let isNull = false
        Object.keys(conf.formData).forEach((key: string) => {
            if(!conf.formData[key] || conf.formData[key].length == 0){
                isNull = true
            }
        })
        if(isNull){
            System.toast(i18n.t('Feedback.pleaseFillInAllFields'))
            return
        }

        let obj = {
            issueType: conf.formData.type,
            issueDepict: conf.formData.description,
            issueUrl: conf.formData.issueUrl.join(','),
            userPhone: conf.formData.account,
        }

        sshake.shakeFunction({
            key: 'bindPaymentBtn',
            time: 2000,
            success: () => {
              // 点击按钮执行的操作
              System.loading()
              apis.addQuestion({
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
    },

    
  })

  onMounted(() => {
    conf.getDict()

  })

  return conf
}
