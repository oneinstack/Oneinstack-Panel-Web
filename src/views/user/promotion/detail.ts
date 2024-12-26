import { apis } from '@/api';
import sconfig from '@/sstore/sconfig';
import sweb from '@/sstore/sweb';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

export const index = () => {
    const conf = reactive({
        pathUrl: '',
        activityContent: '',
        isAccountLogin: false,
        getDetail(id: any) {
            System.loading()
            apis.getInfoById({
                id,
                success: (res: any) => {
                    // conf.detail = res.data.data
                    conf.activityContent = res.data.activityContent
                    conf.pathUrl = res.data.pathUrl
                },
                final: () => {
                    System.loading(false)
                }
            });
        },
        goWeb() {
            let str = conf.pathUrl.charAt(0)
            if (conf.pathUrl.indexOf('http') != -1) {
                sweb.open(conf.pathUrl)
            } else {
                System.router.push(conf.pathUrl)
            }
        }
    })

    const route = useRoute()
    onMounted(() => {
        if (sconfig.userInfo) {
            conf.isAccountLogin = true
        }
        const routeParams = route.query

        routeParams.id && conf.getDetail(routeParams.id)
        
    })
    return conf
}