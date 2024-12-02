export const routeTheme = (privateRoutes: any, theme: any) => {
  const modules = import.meta.glob('@/views/**/*.vue')
  ObjectUtil.getObjectByChildren(privateRoutes, (o) => {
    if (o.path && o.component) {
      o.component = modules?.[`/src/views${o.component}-${theme}.vue`] ?? modules?.[`/src/views${o.component}.vue`]
    }
  })
}
