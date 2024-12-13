export const filterEmptyValue = (obj: any) => {
  for (let key in obj) {
    if (obj[key] === '') {
      delete obj[key]
    }
  }
}
