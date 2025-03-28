import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import i18n from '@/lang'
import { onMounted, reactive } from 'vue'
import { Scope } from 'tools-vue3'

export const index = () => {
  const conf = reactive({})

  onMounted(() => {})

  return conf
}
