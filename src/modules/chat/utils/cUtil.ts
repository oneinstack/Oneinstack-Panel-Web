export const filterEmptyValue = (obj: any) => {
  for (let key in obj) {
    if (obj[key] === '') {
      delete obj[key]
    }
  }
}

export const conversationSort = (conversationList: any[]) => {
  const arr: any[] = []
  const filterArr = conversationList.filter((c: any) => !arr.includes(c.conversationID) && arr.push(c.conversationID))
  filterArr.sort((a: any, b: any) => {
    if (a.isPinned === b.isPinned) {
      const aCompare = a.draftTextTime > a.latestMsgSendTime ? a.draftTextTime : a.latestMsgSendTime
      const bCompare = b.draftTextTime > b.latestMsgSendTime ? b.draftTextTime : b.latestMsgSendTime
      if (aCompare > bCompare) {
        return -1
      } else if (aCompare < bCompare) {
        return 1
      } else {
        return 0
      }
    } else if (a.isPinned && !b.isPinned) {
      return -1
    } else {
      return 1
    }
  })
  return filterArr
}
