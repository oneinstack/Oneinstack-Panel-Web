import { apis } from '@/api'
import { sstatus } from '@/sstore/sstatus'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = ({ typeRefs }: any) => {
  const conf = reactive({
    lotteryId: '',
    lotteryList: [] as any[],
    timesList: [] as any[],
    resultList: [] as any[],
    pageSize: 10,
    pageNum: 1,
    total: 0,
    isTips: false,
    typeIndex: 0 as any,
    timeIndex: 0,
    listNumArr: [] as any[],

    //判断为大小
    BSFun(num: any) {
      let a = null
      num
        .toString()
        .split(',')
        .forEach((item: any) => {
          if (item > 5) {
            a = 'B'
          } else {
            a = 'S'
          }
        })
      return a
    },
    OEFun(num: any) {
      let a = null
      num
        .toString()
        .split(',')
        .forEach((item: any) => {
          if (item % 2 == 0) {
            a = 'E'
          } else {
            a = 'O'
          }
        })
      return a
    },
    //数据小于10处理
    ripr(num: any) {
      num = parseFloat(num)
      return num < 10 ? `0${num}` : num
    },

    getLotteryList: async () => {
      System.loading()
      const res = await apis.lotteryList({
        final(status, config, xhr) {
          System.loading(false)
        }
      })

      let datas = res.data
      datas?.forEach((item: any) => {
        item.lotteryVOList?.forEach((into: any) => {
          if (into.lotteryShowname.includes(item.lotteryTypeVO.lotteryTypeName)) {
            into.newName = into.lotteryShowname.replace(item.lotteryTypeVO.lotteryTypeName, '')
          }
        })
      })
      conf.lotteryList = datas
      conf.timesList = conf.lotteryList[0].lotteryVOList
      conf.lotteryId = conf.timesList[0].id
      conf.typeIndex = conf.lotteryList[0].lotteryTypeVO.lotteryTypeCode
      conf.getLotteryResult()
    },
    getLotteryResult: async () => {
      System.loading()
      const res = await apis.lotteryOpenResult({
        current: conf.pageNum,
        size: conf.pageSize,
        lotteryId: conf.lotteryId,
        final(status, config, xhr) {
          System.loading(false)
        }
      })
      conf.resultList = [...conf.resultList, ...res.data.records]
      if (conf.typeIndex == 'Trx_Win_Go') {
        conf.resultList?.forEach((item) => {
          item.openNumberStr = conf.toUpperCase(item.openCode.slice(item.openCode.length - 5, item.openCode.length))
          let index = conf.findLastDigitIndex(item.openNumberStr)
          item.openNumber = parseFloat(item.openNumberStr.slice(index, index + 1))

          let color = conf.listNumArr.find((into) => into.label == item.openNumber)?.color || ''
          item.color = color
        })
      }
      conf.total = res.data.total
      conf.isTips = false
      if (conf.pageSize * conf.pageNum >= conf.total) conf.isTips = true
    },

    // 使用正则表达式匹配字符串中的所有字母，并将其转换为大写
    toUpperCase(str: any) {
      return str.replace(/[a-z]/g, function (letter: any) {
        return letter.toUpperCase()
      })
    },

    //匹配开奖结果最后一个数字的位置
    findLastDigitIndex(str: any) {
      const matches = str.match(/\d(?!.*\d)/)
      const index = matches ? str.search(/\d(?!.*\d)/) : -1
      return index
    },

    handleChangeTab(val: any, i: any) {
      sstatus.getscrollLeft(typeRefs, 700, i, 220)
      conf.typeIndex = val.lotteryTypeVO.lotteryTypeCode

      conf.timesList = []
      conf.resultList = []
      let current = conf.lotteryList[i]
      if (current.lotteryVOList.length > 0) {
        conf.timesList = current.lotteryVOList
        conf.handleChangeTime(conf.timesList[0], 0)
      }
    },
    handleChangeTime(val: any, i: any) {
      conf.timeIndex = i
      conf.lotteryId = val.id
      conf.resultList = []
      conf.pageNum = 1
      conf.total = 0
      conf.getLotteryResult()
    },
    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isTips = true)
      conf.pageNum++
      conf.getLotteryResult()
    },
    getValue(item: any) {
      let arr = item.openCode.split(',')
      let num1 = parseInt(arr[0])
      let num2 = parseInt(arr[1])
      let num3 = parseInt(arr[2])
      if (num1 == num2 && num1 == num3 && num2 == num3) {
        return 0
      } else if (num1 + num2 + num3 < 11) {
        return 1
      } else {
        return 2
      }
    },
    getNumber(item: any) {
      let arr = item.openCode.split(',')
      let num1 = parseInt(arr[0])
      let num2 = parseInt(arr[1])
      let num3 = parseInt(arr[2])
      if (num1 == num2 && num1 == num3 && num2 == num3) {
        return 0
      } else if ((num1 + num2 + num3) % 2 == 0) {
        return 2
      } else {
        return 1
      }
    },
    getNum(item: any, index: any) {
      let arr = item.openCode.split(',')
      return arr[index]
    },
    getTotal(code: any) {
      let arr = code.split(',')
      return arr.reduce(function (prev: any, curr: any) {
        return parseInt(prev) + parseInt(curr)
      })
    }
  })

  const init = async () => {
    conf.listNumArr = []
    let greenArr = [1, 3, 7, 9]
    for (let i = 0; i < 10; i++) {
      let color = ''
      if (i == 0) {
        color = 'rv'
      } else if (greenArr.includes(i)) {
        color = 'g'
      } else if (i == 5) {
        color = 'gv'
      } else {
        color = 'r'
      }
      conf.listNumArr.push({
        // sort: i + 4,
        key: i,
        label: i,
        color
        // type: 'num',
        // odds: 9
      })
    }
    conf.getLotteryList()
  }
  onMounted(() => {
    init()
  })

  return conf
}
