import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
import { apis } from '@/api'


export const index = () => {
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
        conf.fileList.length > 3 && (conf.isShowImg = true)
      }
    },
    triggerUpload: () => {

    },
    handleAvatarChange: (event: any) => {

    },
    handleSubmit: () => {

    },
  })
  onMounted(() => {

  })

  return conf
}
