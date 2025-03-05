import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive,ref } from 'vue'
import { apis } from '@/api'


export const index = ({uploaderRef}:any) => {
  const conf = reactive({
    avatarUrl: '/path/to/default-avatar.jpg' as string,
    username: 'lddbweevqtcc' as string,
    fileList: [] as any[],
    issueUrl: [] as any[],
    isShowImg: false as boolean,

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
        conf.issueUrl.push(res.data.link)
        conf.fileList.length > 0 && (conf.isShowImg = true)
      }
    },
    triggerUpload: () => {
      uploaderRef.value?.chooseFile()
    },
    async handleSubmit() {
      if (!conf.username) {
        System.toast(i18n.t('common.InputNickname'))
        return
      }
      System.loading()
      let ret = await apis.editUserInfo({
        userNickname: conf.username,
        userImgUrl: conf.avatarUrl,
        final: (_, res) => {
          System.loading(false)
        }
      })
      System.toast(i18n.t(`code.${ret.code}`), 'success')
      sconfig.userInfo.userNickname = conf.username
      sconfig.userInfo.userImgUrl = conf.avatarUrl
      sconfig.saveUserInfo()
      setTimeout(() => {
        sutil.pageBack()
      }, 300)
    }
  })
  onMounted(() => {
    conf.username = sconfig.userInfo.userNickname
    conf.avatarUrl = sconfig.userInfo.userImgUrl
  })

  return conf
}
