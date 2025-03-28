import { apis } from '@/api/index'
import i18n, { langobj } from '@/lang'
import System from '@/utils/System'
import { reactive } from 'vue'


export const shome = reactive({
  languagId: '',
  data: {} as any,
})

export default shome
