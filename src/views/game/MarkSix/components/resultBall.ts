export const lhc = {
  source: {
    red: ['01', '02', '07', '08', '12', '13', '18', '19', '23', '24', '29', '30', '34', '35', '40', '45', '46'],
    blue: ['03', '04', '09', '10', '14', '15', '20', '25', '26', '31', '36', '37', '41', '42', '47', '48'],
    green: ['05', '06', '11', '16', '17', '21', '22', '27', '28', '32', '33', '38', '39', '43', '44', '49']
  } as any,
  colors: {
    red: '#F22C49',
    blue: '#36AAFF',
    green: '#54C37F'
  } as any,
  init: () => {
    Object.keys(lhc.source).forEach((key) => {
      lhc.source[key].forEach((v: any) => {
        lhc.source[v] = key
      })
    })
  },
  val: {} as any,
  getVal: (number: any) => {
    const obj = number
    let val = 1
    if (obj?.num) val = parseInt(obj.num)
    return val < 10 ? '0' + val : val + ''
  },
  getColor: (number: any, active: boolean) => {
    if (active) return '#fff'
    return lhc.colors[lhc.source[lhc.getVal(number)]]
  },
  getImg: (number: any, active: boolean) => {
    return lhc.source[lhc.getVal(number)] + (active ? '-active' : '')
  }
}

lhc.init()
