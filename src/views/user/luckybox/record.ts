import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onBeforeMount, onMounted, reactive } from 'vue'

export const index = () => {
    const event = Scope.Event()
    const conf = reactive({
    tabs: {
        list: [
        { name: i18n.t('luckyBox.allRecord'), value: null },
        { name: i18n.t('luckyBox.issuedRecord'), value: 2 },
        // { name: i18n.t('luckyBox.drawnRecord'), value: 1 },
        { name: i18n.t('luckyBox.abnormal'), value: '1,3' },
        { name: i18n.t('luckyBox.notDrawnRecord'), value: 0 }
        ],
        currentIndex: null,
        change: ({ value }: any) => {
        conf.tabs.currentIndex = value
        conf.record.queryParams.boxStatus = value
        conf.record.queryParams.current = 1
        conf.record.queryParams.size = 10
        conf.record.loading = false
        conf.record.hasMore = true
        conf.record.list = []
        conf.record.getList()
        }
    },
    record: {
        loading: false,
        hasMore: true,
        list: [] as any[],
        queryParams: {
        boxStatus: null,
        current: 1,
        size: 10
        },
        getList: async () => {
        conf.record.loading = true
        System.loading()
        let _param: any = { ...conf.record.queryParams }
        if (!_param.boxStatus) delete _param.boxStatus
        const { data } = await apis.getBoxRecord(_param)
        JSONUtil.strToObject(data)
        const coinlist = await svalue.getCoinlist()
        const list: any[] = data.records.map((item: any) => {
            let receiveItem, reward: any, coinSymbol, coinCode
            if (item.source < 0) item.source = 0
            item.source = svalue.getSourceValue(item.source)
            if (item.reward) {
            switch (item.rewardType) {
                case 0:
                reward = item.reward
                coinSymbol = coinlist.find((it) => it.coinCode === reward.coinCode)?.coinSymbol
                coinCode = reward.coinCode
                receiveItem = `${coinSymbol}${sutil.dataHandling(reward.amount)}`
                break
                case 1:
                case 2:
                case 4:
                reward = item.reward
                receiveItem = sutil.dataHandling(reward)
                break
            }
            }
            return {
            id: item.id,
            source: item.source,
            boxName: item.boxName,
            boxType: item.boxType,
            receiveTime: new Date(item.pickupTime).Format(),
            receiveItem,
            receiveNum: item.number,
            isOpen: item.boxStatus === 1 || item.boxStatus === 2,
            isReceive: item.boxStatus === 2,
            isErr: item.boxStatus === 3,
            reward,
            rewardType: item.rewardType,
            coinSymbol,
            coinCode
            }
        })
        conf.record.list.push(...list)
        conf.record.hasMore = conf.record.list.length < data.total
        conf.record.loading = false
        System.loading(false)
        },
        nextPage: () => {
        if (!conf.record.hasMore) return
        conf.record.queryParams.current++
        conf.record.getList()
        }
    }
    })

    onBeforeMount(() => {
    conf.tabs.list = conf.tabs.list.map((item: any) => {
        item.label = item.name
        return item
    })
    })
    const init = async () => {
    await svalue.getCoinlist()
    conf.record.getList()
    }
    onMounted(() => {
    init()
    event.on(EPage.scrollBottom, conf.record.nextPage)
    })
    return conf
}
