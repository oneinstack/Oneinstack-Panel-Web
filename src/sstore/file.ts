import { reactive } from 'vue'
import { apis } from '@/api'
export const file = reactive({
  downloadList: [],
  uploadList: [],
  getUploadList: () => {},
  getDownloadList: () => {}
})
