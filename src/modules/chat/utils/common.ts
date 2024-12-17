import IMSDK from 'openim-uniapp-polyfill'
import PinYin from './pinyin'

export const formatChooseData = (data: any, key = 'nickname') => {
  const ucfirst = (l1: any) => {
    if (l1.length > 0) {
      var first = l1.substr(0, 1).toUpperCase()
      var spare = l1.substr(1, l1.length)
      return first + spare
    }
  }

  const arraySearch = (l1: any, l2: any) => {
    let Pinarr: any = PinYin
    for (let name in Pinarr) {
      if (Pinarr[name].indexOf(l1) != -1) {
        return ucfirst(name)
        break
      }
    }
    return false
  }

  const codefans = (l1: any) => {
    l1 = l1 ?? 'unkown'
    var l2 = l1.length
    var I1 = ''
    var reg = new RegExp('[a-zA-Z0-9- ]')
    for (var i = 0; i < l2; i++) {
      var val = l1.substr(i, 1)
      var name = arraySearch(val, PinYin)
      if (reg.test(val)) {
        I1 += val
      } else if (name !== false) {
        I1 += name
      }
    }
    I1 = I1.replace(/ /g, '-')
    while (I1.indexOf('--') > 0) {
      I1 = I1.replace('--', '-')
    }
    return I1
  }

  var arr = [],
    firstName

  for (var i = 0; i < data.length; i++) {
    firstName = data[i].initial = codefans(data[i][key]).substr(0, 1)
    arr.push(firstName.toUpperCase())
  }

  var arrlist = []
  for (i = 0; i < arr.length; i++) {
    if (arrlist.indexOf(arr[i]) == -1) {
      arrlist.push(arr[i])
    }
  }

  var dataSort = [] as any
  for (var i = 0; i < arrlist.length; i++) {
    dataSort[i] = {
      initial: arrlist[i]
    }
    dataSort[i].data = []
    for (var j = 0; j < data.length; j++) {
      if (data[j].initial.toUpperCase() == dataSort[i].initial) {
        dataSort[i].data.push(data[j])
      }
    }
  }
  for (var i = 0; i < dataSort.length - 1; i++) {
    for (var j = 1; j < dataSort.length - i; j++) {
      if (dataSort[j - 1].initial > dataSort[j].initial) {
        var a = dataSort[j]
        dataSort[j] = dataSort[j - 1]
        dataSort[j - 1] = a
      }
    }
  }
  const NomalInitial = 'QWERTYUIOPLKJHGFDSAZXCVBNM'.split('')
  const special = {
    initial: '#',
    data: []
  } as any
  const newFilterData = dataSort.filter((d: any) => {
    if (!NomalInitial.includes(d.initial)) {
      special.data = [...special.data, ...d.data]
    } else {
      return d
    }
  })
  if (special.data.length > 0) {
    newFilterData.push(special)
  }
  const indexList = newFilterData.map((item: any) => item.initial)
  const dataList = newFilterData.map((item: any) => item.data)
  return {
    indexList,
    dataList
  }
}
