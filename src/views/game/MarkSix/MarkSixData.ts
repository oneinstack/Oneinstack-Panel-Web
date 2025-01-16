/**
 * 获取单列表下注数量
 * @param len 结果长度
 * @param num 最低选中数量
 * @returns
 */
export const getBetNumByLen = (len: any, num: any) => {
  let res = 1
  if (len < num) return 0
  if (len === num) return 1

  let _resRate = 1
  for (let i = 0; i < num; i++) {
    res = res * (len - i)
    _resRate = _resRate * (i + 1)
  }
  res = res / _resRate
  return res
}

export const lhcItem = () => {
    return [
        { num: '01', color: 'red' },
        { num: '02', color: 'red' },
        { num: '03', color: 'blue' },
        { num: '04', color: 'blue' },
        { num: '05', color: 'green' },
        { num: '06', color: 'green' },
        { num: '07', color: 'red' },
        { num: '08', color: 'red' },
        { num: '09', color: 'blue' },
        { num: '10', color: 'blue' },
        { num: '11', color: 'green' },
        { num: '12', color: 'green' },
        { num: '13', color: 'red' },
        { num: '14', color: 'blue' },
        { num: '15', color: 'blue' },
        { num: '16', color: 'green' },
        { num: '17', color: 'green' },
        { num: '18', color: 'red' },
        { num: '19', color: 'red' },
        { num: '20', color: 'blue' },
        { num: '21', color: 'green' },
        { num: '22', color: 'green' },
        { num: '23', color: 'red' },
        { num: '24', color: 'red' },
        { num: '25', color: 'blue' },
        { num: '26', color: 'blue' },
        { num: '27', color: 'green' },
        { num: '28', color: 'green' },
        { num: '29', color: 'red' },
        { num: '30', color: 'red' },
        { num: '31', color: 'blue' },
        { num: '32', color: 'green' },
        { num: '33', color: 'green' },
        { num: '34', color: 'red' },
        { num: '35', color: 'red' },
        { num: '36', color: 'blue' },
        { num: '37', color: 'blue' },
        { num: '38', color: 'green' },
        { num: '39', color: 'green' },
        { num: '40', color: 'red' },
        { num: '41', color: 'blue' },
        { num: '42', color: 'blue' },
        { num: '43', color: 'green' },
        { num: '44', color: 'green' },
        { num: '45', color: 'red' },
        { num: '46', color: 'red' },
        { num: '47', color: 'blue' },
        { num: '48', color: 'blue' },
        { num: '49', color: 'green' }
    ]
}
export const lhcItemMap = lhcItem().reduce((acc: any, cur) => {
    acc[cur.num] = cur
    return acc
}, {})

//1-49号码
const data49 = [
    {
        label: '号码',
        list: lhcItem()
    }
]

const datalm = [
    { num: '大', odds: '1.796' },
    { num: '小', odds: '1.796' },
    { num: '单', odds: '1.796' },
    { num: '双', odds: '1.796' },
    { num: '大单', odds: '3.593' },
    { num: '大双', odds: '3.593' },
    { num: '小单', odds: '3.593' },
    { num: '小双', odds: '3.593' },
    { num: '合大', odds: '1.796' },
    { num: '合小', odds: '1.796' },
    { num: '合单', odds: '1.796' },
    { num: '合双', odds: '1.796' },
    { num: '尾大', odds: '1.796' },
    { num: '尾小', odds: '1.796' },
    { num: '家禽', odds: '1.796' },
    { num: '野兽', odds: '1.724' },
    { num: '红波', odds: '2.536' },
    { num: '绿波', odds: '2.695' },
    { num: '蓝波', odds: '2.695' }
]

const databb = [
    {
        label: '号码',
        list: [
            {
                'num': '红单',
                'odds': '0.000'
            },
            {
                'num': '红双',
                'odds': '0.000'
            },
            {
                'num': '红大',
                'odds': '0.000'
            },
            {
                'num': '红小',
                'odds': '0.000'
            },
            {
                'num': '蓝单',
                'odds': '0.000'
            },
            {
                'num': '蓝双',
                'odds': '0.000'
            },
            {
                'num': '蓝大',
                'odds': '0.000'
            },
            {
                'num': '蓝小',
                'odds': '0.000'
            },
            {
                'num': '绿单',
                'odds': '0.000'
            },
            {
                'num': '绿双',
                'odds': '0.000'
            },
            {
                'num': '绿大',
                'odds': '0.000'
            },
            {
                'num': '绿小',
                'odds': '0.000'
            }
        ]
    }
]

const dataws = [
    {
        label: '号码',
        list: [
            { num: '0尾', odds: '0.000' },
            { num: '1尾', odds: '0.000' },
            { num: '2尾', odds: '0.000' },
            { num: '3尾', odds: '0.000' },
            { num: '4尾', odds: '0.000' },
            { num: '5尾', odds: '0.000' },
            { num: '6尾', odds: '0.000' },
            { num: '7尾', odds: '0.000' },
            { num: '8尾', odds: '0.000' },
            { num: '9尾', odds: '0.000' }
        ]
    }
]

export const comCodeObj = () => {
    return {
        'TM': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZM': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZMT1': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZMT2': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZMT3': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZMT4': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZMT5': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'ZMT6': {
            index: 'LHC1',
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return clickList.length
            },
            getData: () => data49
        },
        'SQZ': {
            index: 'LHC1',
            max: 12,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 3)
            },
            getData: () => data49
        },
        'SZE': {
            index: 'LHC1',
            max: 12,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 3)
            },
            detail: {
                label: '奖金详情',
                list: [
                    {
                        t1: '猜中',
                        t2: '单注最高金额'
                    },
                    {
                        t1: '中二',
                        t2: '18.66元'
                    },
                    {
                        t1: '中三',
                        t2: '98.01元'
                    }
                ]
            },
            getData: () => data49
        },
        'EQZ': {
            index: 'LHC1',
            max: 12,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 2)
            },
            getData: () => data49
        },
        'EZT': {
            index: 'LHC1',
            max: 12,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 2)
            },
            detail: {
                label: '奖金详情',
                list: [
                    {
                        t1: '猜中',
                        t2: '单注最高金额'
                    },
                    {
                        t1: '二中',
                        t2: '47.66元'
                    },
                    {
                        t1: '中特',
                        t2: '29.79元'
                    }
                ]
            },
            getData: () => data49
        },
        'TC': {
            index: 'LHC1',
            max: 12,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 2)
            },
            getData: () => data49
        },
        'TBB': {
            index: 'LHC4',
            getData: () => databb
        },
        'WS': {
            index: 'LHC2',
            getData: () => dataws
        },
        'WBZ': {
            index: 'LHC1',
            max: 5,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 5)
            },
            getData: () => data49
        },
        'LBZ': {
            index: 'LHC1',
            max: 6,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 6)
            },
            getData: () => data49
        },
        'QBZ': {
            index: 'LHC1',
            max: 7,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 7)
            },
            getData: () => data49
        },
        'BBZ': {
            index: 'LHC1',
            max: 8,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 8)
            },
            getData: () => data49
        },
        'JBZ': {
            index: 'LHC1',
            max: 9,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 9)
            },
            getData: () => data49
        },
        'SBZ': {
            index: 'LHC1',
            max: 10,
            getBetNum: (clickList: any[], conf: any, mconf: any) => {
                if (conf) {
                    return clickList.reduce((a, b) => a + b.betNum, 0)
                }
                return getBetNumByLen(clickList.length, 10)
            },
            getData: () => data49
        }
    }
}

//获取菜单列表，初始化配置内容，只加载一次
export const comValue = (item: any) => {
    //添加对特定玩法的适配
    const _val = item.value()
    item.value = (lc: any) => typeToNew(lc, _val, 'value')

    item.getComItem = (lc: any) => {
        let _comItem = typeToNew(lc, _val, 'comItem')
        if (Array.isArray(_comItem)) _comItem = {}
        let _odds = item.odds
        item.comItem = {}
        Object.keys(item._comItem).forEach((key) => {
            item.comItem[key] = item._comItem[key]
        })
        //当存在要覆盖的配置时执行覆盖
        if (typeof _comItem === 'object') {
            Object.keys(_comItem).forEach((key) => {
                item.comItem[key] = _comItem[key]
            })
        }
        if (item.comItem.index === 'LHC1') {
            const _key = Object.keys(item.odds[0])[0]
            _odds = [
                {
                    [_key]: item.odds[0][_key]
                }
            ]
            item.odds = _odds
        }
    }
}

const typeNewObj = (): any => {
    return {
        'TM': {
            'AMLHC_49': {
                value: ['TEMA@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZM': {
            'AMLHC_49': {
                value: ['ZHENGMA@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZMT1': {
            'AMLHC_49': {
                value: ['ZHENGMATE1@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZMT2': {
            'AMLHC_49': {
                value: ['ZHENGMATE2@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZMT3': {
            'AMLHC_49': {
                value: ['ZHENGMATE3@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZMT4': {
            'AMLHC_49': {
                value: ['ZHENGMATE4@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZMT5': {
            'AMLHC_49': {
                value: ['ZHENGMATE5@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'ZMT6': {
            'AMLHC_49': {
                value: ['ZHENGMATE6@XY'],
                comItem: {
                    listMultipleType: 1
                }
            }
        },
        'SQZ': {
            'AMLHC_49': {
                value: ['LIANMA_3QUANZHONG3@XY'],
                max: 12,
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 3
                }
            }
        },
        'SZE': {
            'AMLHC_49': {
                value: ['LIANMA_3ZHONG2@XY'],
                max: 12,
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 3
                }
            }
        },
        'EQZ': {
            'AMLHC_49': {
                value: ['LIANMA_2QUANZHONG@XY'],
                max: 12,
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 2
                }
            }
        },

        'EZT': {
            'AMLHC_49': {
                value: ['LIANMA_2ZHONGTE@XY'],
                max: 12,
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 2
                }
            }
        },
        'TC': {
            'AMLHC_49': {
                value: ['LIANMA_TECHUAN@XY'],
                max: 12,
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 2
                }
            }
        },
        'TBB': {
            'AMLHC_49': {
                value: ['SEBO@XY']
            }
        },
        'TX': {
            'AMLHC_49': {
                value: ['TEXIAO@XY']
            }
        },
        'YX': {
            'AMLHC_49': {
                value: ['YIXIAO@XY']
            }
        },
        'ELX': {
            'AMLHC_49': {
                value: ['LIANXIAO_2@XY'],
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 2
                }
            }
        },
        'SLX': {
            'AMLHC_49': {
                value: ['LIANXIAO_3@XY'],
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 3
                }
            }
        },
        'SILX': {
            'AMLHC_49': {
                value: ['LIANXIAO_4@XY'],
                comItem: {
                    listMultipleType: 2,
                    listMultipleLength: 4
                }
            }
        },
        'WS': {
            'AMLHC_49': {
                value: ['WEISHU@XY']
            }
        },
        'WBZ': {
            'AMLHC_49': {
                value: ['ZIXUANBUZHONG_5@XY']
            }
        },
        'LBZ': {
            'AMLHC_49': {
                value: ['ZIXUANBUZHONG_6@XY']
            }
        },
        'QBZ': {
            'AMLHC_49': {
                value: ['ZIXUANBUZHONG_7@XY']
            }
        },
        'BBZ': {
            'AMLHC_49': {
                value: ['ZIXUANBUZHONG_8@XY']
            }
        },
        'JBZ': {
            'AMLHC_49': {
                value: ['ZIXUANBUZHONG_9@XY']
            }
        },
        'SBZ': {
            'AMLHC_49': {
                value: ['ZIXUANBUZHONG_10@XY']
            }
        }
    }
}
//将玩法的value进行动态转换
const typeToNew = (lc: any, value: any, newField: any) => {
    const _obj1 = typeNewObj()[value[0]]
    if (_obj1 && _obj1[lc]) {
        return _obj1[lc][newField] || value
    }
    return value
}

export const comMenuList = () => {
    return [
        {
            label: '特码',
            list: [
                {
                    label: '特码',
                    list: [
                        {
                            label: '直选',
                            value: ['TM'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码中包含特码，即为中奖。 赔率'
                        }
                    ]
                }
            ]
        },
        {
            label: '正码',
            list: [
                {
                    label: '正码',
                    value: ['ZM'],
                }
            ]
        },
        {
            label: '正码',
            list: [
                {
                    label: '正码',
                    list: [
                        {
                            label: '任选',
                            value: ['ZM'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码在开奖号码前六位中存在，即为中奖。 赔率'
                        },
                        {
                            label: '正１特',
                            value: ['ZMT1'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码与开奖号码第一位相同，即为中奖。 赔率'
                        },
                        {
                            label: '正２特',
                            value: ['ZMT2'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码与开奖号码第二位相同，即为中奖。 赔率'
                        },
                        {
                            label: '正３特',
                            value: ['ZMT3'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码与开奖号码第三位相同，即为中奖。 赔率'
                        },
                        {
                            label: '正４特',
                            value: ['ZMT4'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码与开奖号码第四位相同，即为中奖。 赔率'
                        },
                        {
                            label: '正５特',
                            value: ['ZMT5'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码与开奖号码第五位相同，即为中奖。 赔率'
                        },
                        {
                            label: '正６特',
                            value: ['ZMT6'],
                            desc: '从1-49中任选1个或多个号码，每个号码为一注，所选号码与开奖号码第六位相同，即为中奖。 赔率'
                        }
                    ]
                }
            ]
        },
        {
            label: '连码',
            list: [
                {
                    label: '连码',
                    list: [
                        {
                            label: '三全中',
                            value: ['SQZ'],
                            desc: '所投注的每三个号码为一组合，若三个号码都是开奖号码之正码（不含特码），即为中奖。 赔率'
                        },
                        {
                            label: '三中二',
                            value: ['SZE'],
                            desc: '所投注的每三个号码为一组合，若其中至少有两个是开奖号码中的正码（不含特码），即为中奖。若中两码，叫三中二之中二;若三码全中，叫三中二之中三。'
                        },
                        {
                            label: '二全中',
                            value: ['EQZ'],
                            desc: '所投注的每二个码号为一组合，二个号码都是开奖码号之正码（不含特码），即为中奖。 赔率'
                        },
                        {
                            label: '二中特',
                            value: ['EZT'],
                            desc: '所投注的每二个号码为一组合，二个号码都是开奖号码（含特码），即为中奖。若两个都是正码，叫二中特之二中。若选号中包含特码，叫二中特之中特。'
                        },
                        {
                            label: '特串',
                            value: ['TC'],
                            desc: '所投注的每二个号码为一组合，其中一个是正码，一个是特别号码，即为中奖。 赔率'
                        }
                    ]
                }
            ]
        },
        {
            label: '半波',
            list: [
                {
                    label: '半波',
                    list: [
                        {
                            label: '特码半波',
                            value: ['TBB'],
                            desc: '根据特码对应的特性来区分。分为红蓝绿三个色波，以及号码大于或等于25为大，小于或等于24为小；奇数为单，偶数为双；合单合双为开奖号的十位与个位相加后得数的单双。下注内容与号码特性完全吻合即为中奖。特码为49时为和，不算任何大小单双。'
                        }
                    ]
                }
            ]
        },
        {
            label: '生肖',
            list: [
                {
                    label: '生肖',
                    list: [
                        {
                            label: '特肖',
                            value: ['TX'],
                            desc: '从十二生肖中任选1个或多个，每个生肖为一注，所选生肖与特码对应的生肖相同，即为中奖。'
                        },
                        {
                            label: '一肖',
                            value: ['YX'],
                            desc: '从十二生肖中任选1个或多个，每个生肖为一注，开奖号码（含特码）中含有投注所属生肖，即为中奖。'
                        },
                        {
                            label: '二肖连',
                            value: ['ELX'],
                            desc: '至少选择两个生肖，每二个生肖为一组合，开奖号码（含特码）中含有投注所属全部生肖，即为中奖。'
                        },
                        {
                            label: '三肖连',
                            value: ['SLX'],
                            desc: '至少选择三个生肖，每三个生肖为一组合，开奖号码（含特码）中含有投注所属全部生肖，即为中奖。'
                        },
                        {
                            label: '四肖连',
                            value: ['SILX'],
                            desc: '至少选择四个生肖，每四个生肖为一组合，开奖号码（含特码）中含有投注所属全部生肖，即为中奖。'
                        }
                    ]
                }
            ]
        },
        {
            label: '尾数',
            list: [
                {
                    label: '尾数',
                    list: [
                        {
                            label: '尾数',
                            value: ['WS'],
                            desc: '指开奖正码及特码７个号码中含有所投注尾数的一个或多个号码则视为中奖，但派彩只派一次，即不论同生肖号码出现一个或多个号码都只派彩一次。'
                        }
                    ]
                }
            ]
        },
        {
            label: '不中',
            list: [
                {
                    label: '不中',
                    list: [
                        {
                            label: '五不中',
                            value: ['WBZ'],
                            desc: '至少选择五个号码，每五个号码为一注，所有号码均未在开奖号码中出现，即为中奖。 赔率'
                        },
                        {
                            label: '六不中',
                            value: ['LBZ'],
                            desc: '至少选择六个号码，每六个号码为一注，所有号码均未在开奖号码中出现，即为中奖。 赔率'
                        },
                        {
                            label: '七不中',
                            value: ['QBZ'],
                            desc: '至少选择七个号码，每七个号码为一注，所有号码均未在开奖号码中出现，即为中奖。 赔率'
                        },
                        {
                            label: '八不中',
                            value: ['BBZ'],
                            desc: '至少选择八个号码，每八个号码为一注，所有号码均未在开奖号码中出现，即为中奖。 赔率'
                        },
                        {
                            label: '九不中',
                            value: ['JBZ'],
                            desc: '至少选择九个号码，每九个号码为一注，所有号码均未在开奖号码中出现，即为中奖。 赔率'
                        },
                        {
                            label: '十不中',
                            value: ['SBZ'],
                            desc: '至少选择十个号码，每十个号码为一注，所有号码均未在开奖号码中出现，即为中奖。 赔率'
                        }
                    ]
                }
            ]
        }
    ]
}

