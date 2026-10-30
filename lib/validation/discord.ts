import type { EmbedConfig, MessageButton, MessageConfig, Question } from '@/lib/types/config'

/** Discord API constraints. Source: discord.com/developers/docs (embed, component, modal limits). */
export const DISCORD_LIMITS = {
  content: 2000,
  embedsPerMessage: 10,
  embedTotal: 6000,
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  author: 256,
  buttonsTotal: 25,
  buttonsPerRow: 5,
  buttonLabel: 80,
  modalQuestions: 5,
  modalLabel: 45,
  modalPlaceholder: 100,
  modalMaxLength: 4000,
  selectOptions: 25,
  selectOptionLabel: 100,
  channelName: 100,
  uploadBytes: 8 * 1024 * 1024,
} as const

export interface ValidationIssue {
  path: string
  message: string
}

export const SNOWFLAKE_PATTERN = /^\d{17,20}$/

export function isSnowflake(value: string) {
  return SNOWFLAKE_PATTERN.test(value.trim())
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function embedCharacterCount(embed: EmbedConfig) {
  return (
    embed.title.length +
    embed.description.length +
    embed.footerText.length +
    embed.authorName.length +
    embed.fields.reduce((sum, f) => sum + f.name.length + f.value.length, 0)
  )
}

export function validateEmbed(embed: EmbedConfig, prefix = 'embed'): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const L = DISCORD_LIMITS
  const hasContent =
    embed.title.trim() ||
    embed.description.trim() ||
    embed.fields.length > 0 ||
    embed.image ||
    embed.thumbnail ||
    embed.authorName.trim()

  if (!hasContent) issues.push({ path: prefix, message: 'Embed needs a title, description, field, or image.' })
  if (embed.title.length > L.title) issues.push({ path: `${prefix}.title`, message: `Title exceeds ${L.title} characters.` })
  if (embed.description.length > L.description)
    issues.push({ path: `${prefix}.description`, message: `Description exceeds ${L.description} characters.` })
  if (embed.footerText.length > L.footer) issues.push({ path: `${prefix}.footer`, message: `Footer exceeds ${L.footer} characters.` })
  if (embed.authorName.length > L.author) issues.push({ path: `${prefix}.author`, message: `Author exceeds ${L.author} characters.` })
  if (embed.url && !isHttpUrl(embed.url)) issues.push({ path: `${prefix}.url`, message: 'Title URL must be a valid http(s) link.' })
  if (embed.fields.length > L.fields) issues.push({ path: `${prefix}.fields`, message: `Maximum ${L.fields} fields per embed.` })
  embed.fields.forEach((field, i) => {
    if (!field.name.trim()) issues.push({ path: `${prefix}.fields.${i}.name`, message: `Field ${i + 1} needs a name.` })
    if (!field.value.trim()) issues.push({ path: `${prefix}.fields.${i}.value`, message: `Field ${i + 1} needs a value.` })
    if (field.name.length > L.fieldName)
      issues.push({ path: `${prefix}.fields.${i}.name`, message: `Field ${i + 1} name exceeds ${L.fieldName} characters.` })
    if (field.value.length > L.fieldValue)
      issues.push({ path: `${prefix}.fields.${i}.value`, message: `Field ${i + 1} value exceeds ${L.fieldValue} characters.` })
  })
  if (embedCharacterCount(embed) > L.embedTotal)
    issues.push({ path: prefix, message: `Embed text exceeds the ${L.embedTotal} character total.` })
  return issues
}

export function validateButtons(buttons: MessageButton[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (buttons.length > DISCORD_LIMITS.buttonsTotal)
    issues.push({ path: 'buttons', message: `Maximum ${DISCORD_LIMITS.buttonsTotal} buttons per message.` })
  buttons.forEach((b, i) => {
    if (!b.label.trim() && !b.emoji.trim())
      issues.push({ path: `buttons.${i}.label`, message: `Button ${i + 1} needs a label or emoji.` })
    if (b.label.length > DISCORD_LIMITS.buttonLabel)
      issues.push({ path: `buttons.${i}.label`, message: `Button ${i + 1} label exceeds ${DISCORD_LIMITS.buttonLabel} characters.` })
    if (b.style === 'link' && (!b.url || !isHttpUrl(b.url)))
      issues.push({ path: `buttons.${i}.url`, message: `Link button ${i + 1} needs a valid URL.` })
  })
  return issues
}

export function validateMessage(message: MessageConfig, options: { requireButtons?: boolean } = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (message.content.length > DISCORD_LIMITS.content)
    issues.push({ path: 'content', message: `Message content exceeds ${DISCORD_LIMITS.content} characters.` })
  if (message.embeds.length > DISCORD_LIMITS.embedsPerMessage)
    issues.push({ path: 'embeds', message: `Maximum ${DISCORD_LIMITS.embedsPerMessage} embeds per message.` })
  const total = message.embeds.reduce((sum, e) => sum + embedCharacterCount(e), 0)
  if (total > DISCORD_LIMITS.embedTotal)
    issues.push({ path: 'embeds', message: `Combined embed text exceeds ${DISCORD_LIMITS.embedTotal} characters.` })
  if (!message.content.trim() && message.embeds.length === 0)
    issues.push({ path: 'content', message: 'Message needs content or at least one embed.' })
  message.embeds.forEach((e, i) => issues.push(...validateEmbed(e, `embeds.${i}`)))
  if (options.requireButtons && message.buttons.length === 0)
    issues.push({ path: 'buttons', message: 'Add at least one button.' })
  issues.push(...validateButtons(message.buttons))
  return issues
}

export function validateQuestions(questions: Question[], options: { modal?: boolean; max?: number } = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const max = options.max ?? (options.modal ? DISCORD_LIMITS.modalQuestions : 25)
  if (questions.length > max) issues.push({ path: 'questions', message: `Maximum ${max} questions.` })
  questions.forEach((q, i) => {
    const n = i + 1
    if (!q.label.trim()) issues.push({ path: `questions.${i}.label`, message: `Question ${n} needs a label.` })
    if (options.modal && q.label.length > DISCORD_LIMITS.modalLabel)
      issues.push({ path: `questions.${i}.label`, message: `Question ${n} label exceeds ${DISCORD_LIMITS.modalLabel} characters (Discord modal limit).` })
    if (q.placeholder.length > DISCORD_LIMITS.modalPlaceholder)
      issues.push({ path: `questions.${i}.placeholder`, message: `Question ${n} placeholder exceeds ${DISCORD_LIMITS.modalPlaceholder} characters.` })
    if ((q.type === 'dropdown' || q.type === 'multiple') && q.options.filter((o) => o.trim()).length < 2)
      issues.push({ path: `questions.${i}.options`, message: `Question ${n} needs at least two options.` })
    if (q.options.length > DISCORD_LIMITS.selectOptions)
      issues.push({ path: `questions.${i}.options`, message: `Question ${n} exceeds ${DISCORD_LIMITS.selectOptions} options.` })
    if (q.minLength != null && q.maxLength != null && q.minLength > q.maxLength)
      issues.push({ path: `questions.${i}.length`, message: `Question ${n} minimum length is greater than maximum.` })
    if (q.maxLength != null && q.maxLength > DISCORD_LIMITS.modalMaxLength)
      issues.push({ path: `questions.${i}.length`, message: `Question ${n} max length exceeds ${DISCORD_LIMITS.modalMaxLength}.` })
  })
  return issues
}

export function validateMedia(file: File, maxBytes: number = DISCORD_LIMITS.uploadBytes): string | null {
  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) return 'Use a PNG, JPG, GIF, or WEBP image.'
  if (file.size > maxBytes) return `Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`
  return null
}
