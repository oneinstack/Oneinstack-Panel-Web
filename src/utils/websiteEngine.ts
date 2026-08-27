import i18n from '@/lang'

const websiteEnginePalette: Record<string, { label: string; color: string }> = {
  nginx: { label: 'Nginx', color: '#22c55e' },
  openresty: { label: 'OpenResty', color: '#3b82f6' },
  tengine: { label: 'Tengine', color: '#8b5cf6' },
  apache: { label: 'Apache HTTP Server', color: '#f97316' },
  caddy: { label: 'Caddy', color: '#14b8a6' }
}

const getWebsiteEngineKey = (engine: unknown) => {
  const value = typeof engine === 'string' ? engine.trim().toLowerCase() : ''
  return value
}

export const getWebsiteEngineLabel = (engine: unknown) => {
  const key = getWebsiteEngineKey(engine)
  if (!key) return '—'
  const fallback = websiteEnginePalette[key]?.label || key
  const value = (i18n.t as any)(`website.webServerEngines.${key}`)
  return value && value !== `website.webServerEngines.${key}` ? value : fallback
}

export const getWebsiteEngineTagStyle = (engine: unknown): Record<string, string> => {
  const key = getWebsiteEngineKey(engine)
  const palette = websiteEnginePalette[key]
  if (!palette) {
    return {
      '--el-tag-bg-color': 'rgba(148, 163, 184, 0.12)',
      '--el-tag-border-color': 'rgba(148, 163, 184, 0.24)',
      '--el-tag-text-color': 'var(--text-secondary)',
      color: 'var(--text-secondary)'
    }
  }
  return {
    '--el-tag-bg-color': `color-mix(in srgb, ${palette.color} 12%, transparent)`,
    '--el-tag-border-color': `color-mix(in srgb, ${palette.color} 30%, transparent)`,
    '--el-tag-text-color': palette.color,
    color: palette.color
  }
}

