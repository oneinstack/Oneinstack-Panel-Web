import { svalue } from '@/sstore/svalue';
import { onMounted, reactive } from 'vue';
import i18n from '@/lang';
import { apis } from '@/api';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';

export const index = () => {
    const conf = reactive({
        currentSign: 1,
        signList: [] as any[],
        signDay: '',
        isTouch: false,
        isClickIndex: 0,
        bgcolor: '',
        //获取签到列表数据
        async loadData() {
            svalue.coinlist = []
            let clist = await svalue.getCoinlist()
            let defaultCoinWallet = clist.find(item => item.isDefault)
            let datas = Cookie.get('signData')
            let index = 0
            datas.forEach((item: any, itemIndex: any) => {
                item.isSgnin && (index += 1)
                item.signMoney = item.signinAward ? defaultCoinWallet.coinSymbol + item.signinAward : '0'
            })
            conf.signDay = i18n.t(`signInModule.signList.${index}`)
            conf.signList = datas
            conf.isClickIndex = 0
            conf.signList?.forEach((item: any) => {
                item.isSgnin && (conf.isClickIndex += 1)
            })
        },
    
        //长按开始
        handleTouchstart() {
            conf.isTouch = true
        },
    
        //长按结束
        handleTouchend() {
            conf.isTouch = false
        },
    
        //签到数据提交
        handleSign(index: any) {
            if (!index) {
                index = 0
                conf.signList?.forEach((item, itemIndex) => {
                    item.isSgnin && (index = itemIndex)
                })
            }
            apis.savaSigninRecord({
                success: (res: any) => {
                    System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
                    conf.signList[index].isSgnin = 1
                    Cookie.set('signData', conf.signList)
                }
            });
        },
    })
    onMounted(() => {
        conf.loadData()
    })
    const event = Scope.Event()
    event.on(EPage.scroll, (e) => {
        if (e.top > 50) {
            conf.bgcolor = 'linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)'
        } else {
            conf.bgcolor = ''
        }
    })
    return conf
}   