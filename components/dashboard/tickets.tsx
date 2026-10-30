'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  Plus, Save, Ticket, Trash2, Pencil, Eye,
  Image as ImageIcon, RotateCcw, Sparkles, ShieldCheck, Layers3, Zap, Radio, ExternalLink, RefreshCw, Clock3
} from 'lucide-react'
import { PageHeader } from './page-header'
import { TicketAnalytics } from './ticket-analytics'
import { useChannels, useResource } from '@/hooks/use-cyber'
import type {
  TicketPanel, EmbedConfig, MessageButton,
  ButtonStyle
} from '@/lib/types/config'

type DiscordRole = { id: string; name: string; color?: number; position?: number; managed?: boolean }

const field =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary'

const emptyEmbed = (): EmbedConfig => ({
  id: crypto.randomUUID(),
  title: '🎫・CYBER TICKET',
  description: '🛠️ Welcome to CYBER Support!\n\nPlease describe your issue clearly. Our staff will assist you shortly.',
  url: '',
  color: '#eabf46',
  authorName: '',
  authorIcon: null,
  thumbnail: null,
  image: null,
  footerText: 'ONE COMMUNITY. ONE POWER. ONE LEGACY.',
  footerIcon: null,
  timestamp: false,
  fields: []
})

type TicketCreationSettings = {
  categoryId: string
  channelName: string
  welcomeTitle: string
  welcomeMessage: string
  welcomeColor: string
  welcomeImageUrl: string
  closeButtonLabel: string
  oneTicketPerUser: boolean
  staffRoleIds: string[]
  claimButtonLabel: string
}

type ConfiguredTicketPanel = TicketPanel & {
  ticketSettings?: TicketCreationSettings
}

const defaultTicketSettings = (): TicketCreationSettings => ({
  categoryId: '',
  channelName: 'ticket-{username}',
  welcomeTitle: '🎫 CYBER TICKET SYSTEM',
  welcomeMessage: 'Welcome {user}!\n\nPlease describe your issue or request.\nOur team will assist you soon.',
  welcomeColor: '#eabf46',
  welcomeImageUrl: '',
  closeButtonLabel: 'Close Ticket',
  oneTicketPerUser: true,
  staffRoleIds: [],
  claimButtonLabel: 'Claim Ticket'
})

const emptyButton = (): MessageButton => ({
  id: crypto.randomUUID(),
  label: 'Open Ticket',
  emoji: '🎟️',
  style: 'success'
})

const asset = (url: string) =>
  url.trim()
    ? { url: url.trim(), name: 'Remote image', size: 0, type: 'image/url' }
    : null

type LiveTicket = {
  id: string
  guildId: string
  panelId: string
  ownerId: string
  name: string
  status: 'open' | 'closed'
  createdAt: string | null
  claimedById: string | null
  url: string
}

type LiveTicketResponse = {
  tickets: LiveTicket[]
  totalVisible: number
  truncated: boolean
  fetchedAt: string
}

function LiveTicketManager({ serverId }: { serverId: string }) {
  const [data, setData] = useState<LiveTicketResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/servers/${encodeURIComponent(serverId)}/tickets`, {
          credentials: 'include', cache: 'no-store', signal: controller.signal
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
        if (!Array.isArray(result.tickets)) throw new Error('Invalid tickets response')
        if (!controller.signal.aborted) setData(result as LiveTicketResponse)
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load tickets')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [serverId, refresh])

  const tickets = data?.tickets ?? []
  const visible = tickets.filter(t => filter === 'all' || t.status === filter)
  const open = tickets.filter(t => t.status === 'open').length
  const closed = tickets.filter(t => t.status === 'closed').length

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">CYBER V7 · Discord Live Data</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold"><Radio className="size-5 text-primary" /> Live Ticket Manager</h2>
          <p className="mt-1 text-xs text-muted-foreground">Read-only monitoring. Support replies directly inside Discord.</p>
        </div>
        <button type="button" onClick={() => setRefresh(v => v + 1)} disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { title: 'Visible tickets', value: tickets.length },
          { title: 'Open tickets', value: open },
          { title: 'Closed tickets', value: closed }
        ].map(s => <div key={s.title} className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{s.title}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{s.value}</p>
        </div>)}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'open', 'closed'] as const).map(f => <button type="button" key={f} onClick={() => setFilter(f)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>{f}</button>)}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error === 'bot_api_not_configured' ? 'Configure BOT_API_URL and BOT_API_SECRET in Vercel.' : `Could not load live tickets: ${error}`}</p>}
      {loading && <p className="py-5 text-sm text-muted-foreground">Loading Discord tickets...</p>}
      {!loading && !error && visible.length === 0 && <p className="py-5 text-sm text-muted-foreground">No {filter === 'all' ? '' : filter} tickets found.</p>}
      {!loading && !error && <div className="grid gap-3">
        {visible.map(ticket => <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/40">
          <div className="min-w-0 space-y-1">
            <p className="break-all text-sm font-semibold"># {ticket.name}</p>
            <p className="text-xs text-muted-foreground">Opened by: {ticket.ownerId} · Claimed by: {ticket.claimedById || 'Unclaimed'}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Unknown date'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${ticket.status === 'open' ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>{ticket.status.toUpperCase()}</span>
            <a href={`https://discord.com/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(ticket.id)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary"><ExternalLink className="size-3" /> Discord</a>
          </div>
        </div>)}
      </div>}
      {data?.truncated && <p className="mt-3 text-xs text-muted-foreground">Showing first 100 tickets. More exist on Discord.</p>}
      {data?.fetchedAt && <p className="mt-3 text-xs text-muted-foreground">Last refreshed: {new Date(data.fetchedAt).toLocaleString()}</p>}
    </motion.section>
  )
}

export function TicketsDashboard({
  serverId
}: {
  serverId: string
}) {
  const panels = useResource(serverId, 'ticketPanels')
  const channels = useChannels(serverId)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [channelId, setChannelId] = useState('')
  const [content, setContent] = useState('')
  const [embed, setEmbed] = useState<EmbedConfig | null>(null)
  const [buttons, setButtons] = useState<MessageButton[]>([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({})
  const [ticketSettings, setTicketSettings] = useState<TicketCreationSettings>(defaultTicketSettings)
  const [roles, setRoles] = useState<DiscordRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState('')
  const [roleToAdd, setRoleToAdd] = useState('')
  const [previewMode, setPreviewMode] = useState<'panel' | 'welcome'>('panel')
  const [editorTab, setEditorTab] = useState<'panel' | 'settings' | 'welcome'>('panel')

  useEffect(() => {
    const controller = new AbortController()
    setRolesLoading(true)
    setRolesError('')
    setRoles([])

    async function loadRoles() {
      try {
        const response = await fetch(`/api/servers/${encodeURIComponent(serverId)}/roles`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal
        })
        if (!response.ok) throw new Error(`Discord roles API: HTTP ${response.status}`)
        const payload: unknown = await response.json()
        const object = payload && typeof payload === 'object' && !Array.isArray(payload)
          ? payload as Record<string, unknown> : null
        const list = Array.isArray(payload) ? payload
          : Array.isArray(object?.roles) ? object.roles
          : Array.isArray(object?.data) ? object.data : null
        if (!list) throw new Error('Unexpected roles API response format')
        const parsed = list.filter((item): item is DiscordRole => {
          if (!item || typeof item !== 'object') return false
          const role = item as Record<string, unknown>
          return typeof role.id === 'string' && /^\d{17,20}$/.test(role.id) && typeof role.name === 'string'
        })
        parsed.sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
        if (!controller.signal.aborted) setRoles(parsed)
      } catch (error) {
        if (!controller.signal.aborted) {
          setRolesError(error instanceof Error ? error.message : 'Failed to load Discord roles')
        }
      } finally {
        if (!controller.signal.aborted) setRolesLoading(false)
      }
    }
    void loadRoles()
    return () => controller.abort()
  }, [serverId])

  function toggleStaffRole(roleId: string) {
    setTicketSettings(previous => ({
      ...previous,
      staffRoleIds: previous.staffRoleIds.includes(roleId)
        ? previous.staffRoleIds.filter(id => id !== roleId)
        : [...previous.staffRoleIds, roleId]
    }))
  }

  const items = panels.data ?? []


  function reset() {
    setEditingId(null)
    setName('')
    setChannelId('')
    setContent('')
    setEmbed(null)
    setButtons([])
    setTicketSettings(defaultTicketSettings())
    setRoleToAdd('')
    setNotice('')
  }

  function updateEmbed<K extends keyof EmbedConfig>(
    key: K,
    value: EmbedConfig[K]
  ) {
    setEmbed(previous => ({
      ...(previous ?? emptyEmbed()),
      [key]: value
    }))
  }

  function editPanel(panel: TicketPanel) {
    setEditingId(panel.id)
    setName(panel.name)
    setChannelId(panel.channelId ?? '')
    setContent(panel.message.content)
    setEmbed(panel.message.embeds[0] ?? emptyEmbed())
    setButtons(panel.message.buttons)
    const savedSettings = (panel as ConfiguredTicketPanel).ticketSettings
    setTicketSettings({ ...defaultTicketSettings(), ...savedSettings })
    setRoleToAdd('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function savePanel() {
    if (!panels.data || !name.trim() || !channelId) {
      setNotice('Enter a panel name and select a channel.')
      return
    }

    const roleIds = [...new Set(ticketSettings.staffRoleIds)]
    if (roleIds.some(id => !/^\d{17,20}$/.test(id))) {
      setNotice('Invalid Staff Role ID in saved settings.')
      return
    }

    const previous = items.find(p => p.id === editingId)

    const panel: ConfiguredTicketPanel = {
      id: editingId ?? crypto.randomUUID(),
      name: name.trim(),
      channelId,
      state: previous?.state ?? 'draft',
      updatedAt: new Date().toISOString(),
      ticketSettings: { ...ticketSettings, staffRoleIds: roleIds },
      message: {
        content,
        embeds: embed ? [embed] : [],
        buttons
      }
    }

    const next = editingId
      ? items.map(p => p.id === editingId ? panel : p)
      : [...items, panel]

    setSaving(true)
    setNotice('')

    try {
      await panels.save(next, 'Saved ticket panel')
      reset()
      setNotice('Ticket panel saved successfully.')
    } catch {
      setNotice('Failed to save ticket panel.')
    } finally {
      setSaving(false)
    }
  }

  async function publishPanel(panelId: string) {
    if (saving) return

    setSaving(true)
    setNotice('Publishing ticket panel to Discord...')

    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(serverId)}/messages`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ panelId, webhookUrl: webhookUrls[panelId]?.trim() || undefined })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Publish failed')
      }

      setNotice(result.message || 'Ticket panel published successfully!')
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Publish failed'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deletePanel(id: string) {
    if (!panels.data || !window.confirm('Delete this panel?')) return
    setSaving(true)

    try {
      await panels.save(
        items.filter(p => p.id !== id),
        'Deleted ticket panel'
      )
      if (editingId === id) reset()
      setNotice('Panel deleted.')
    } catch {
      setNotice('Failed to delete panel.')
    } finally {
      setSaving(false)
    }
  }

  const previewEmbed = embed
  const previewButtons = buttons

  return (
    <div className="relative flex flex-col gap-8 pb-10">
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-0 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
      <PageHeader
        eyebrow="CYBER CONTROL CENTER"
        title="Ticket Studio"
        description="Design, preview and manage your Discord ticket panels."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7"
      >
        <motion.div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-primary/20" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary"><Sparkles className="size-3" /> CYBER STUDIO V7</span>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Build the perfect <span className="text-primary">support experience.</span></h2>
            <p className="max-w-xl text-sm text-muted-foreground">Design Discord ticket panels, manage staff access and publish with confidence.</p>
          </div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 shadow-[0_0_35px_rgba(234,191,70,0.13)]"><Ticket className="size-8 text-primary" /></motion.div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Saved panels', value: String(items.length).padStart(2, '0'), icon: Layers3 },
          { label: 'Selected staff roles', value: String(ticketSettings.staffRoleIds.length).padStart(2, '0'), icon: ShieldCheck },
          { label: 'Studio status', value: panels.error ? 'ERROR' : panels.data ? 'READY' : 'SYNC', icon: Zap }
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.09 }} whileHover={{ y: -3 }} className="group flex items-center gap-4 rounded-xl border border-border bg-card/90 p-4 transition-colors hover:border-primary/40">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary"><stat.icon className="size-5" /></div>
            <div><p className="text-xs text-muted-foreground">{stat.label}</p><p className="text-xl font-bold tracking-tight">{stat.value}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card/95 p-5 shadow-lg shadow-black/5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Ticket className="size-5 text-primary" />
              {editingId ? 'Edit Panel' : 'Create Panel'}
            </h2>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label="Ticket editor sections">
            {([
              { id: 'panel', label: 'Create Panel', number: '01', icon: <Ticket className="size-4" /> },
              { id: 'settings', label: 'Ticket Creation Settings', number: '02', icon: <ShieldCheck className="size-4" /> },
              { id: 'welcome', label: 'Ticket Welcome Editor', number: '03', icon: <Sparkles className="size-4" /> }
            ] as const).map(tab => (
              <motion.button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={editorTab === tab.id}
                onClick={() => setEditorTab(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${editorTab === tab.id ? 'border-primary bg-primary/10 text-primary shadow-[0_0_18px_rgba(234,191,70,0.08)]' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">{tab.icon}</span>
                <span className="min-w-0"><span className="block text-[10px] font-semibold opacity-70">STEP {tab.number}</span><span className="block text-xs font-semibold leading-4">{tab.label}</span></span>
              </motion.button>
            ))}
          </div>

          {editorTab === 'panel' && <motion.section key="panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5 rounded-xl border border-primary/20 bg-background/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-border pb-3"><Ticket className="size-4 text-primary" /><h3 className="font-semibold">01 · Create Panel</h3></div>
          <label className="flex flex-col gap-2 text-sm">
            Panel Name
            <input className={field} value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100} placeholder="CYBER SUPPORT" />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Publish Channel
            <select className={field} value={channelId}
              onChange={e => setChannelId(e.target.value)}>
              <option value="">Select a channel</option>
              {(channels.data ?? [])
                .filter(c => c.kind === 'text' || c.kind === 'announcement')
                .map(c => (
                  <option key={c.id} value={c.id}># {c.name}</option>
                ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Message Content (outside embed)
            <textarea className={field} rows={3} value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={2000}
              placeholder="Welcome to CYBER!" />
          </label>

          <div className="flex items-center justify-between border-t border-border pt-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <ImageIcon className="size-4 text-primary" />
              Embed Builder
            </h3>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary"
              onClick={() => setEmbed(embed ? null : emptyEmbed())}
            >
              {embed ? 'Disable Embed' : 'Enable Embed'}
            </button>
          </div>

          {embed && (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm">
                Embed Title
                <input className={field} value={embed.title}
                  maxLength={256}
                  onChange={e => updateEmbed('title', e.target.value)} />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Embed Description
                <textarea className={field} rows={6}
                  maxLength={4096} value={embed.description}
                  onChange={e => updateEmbed('description', e.target.value)} />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Embed Color
                <div className="flex gap-2">
                  <input type="color" value={embed.color}
                    onChange={e => updateEmbed('color', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-border bg-background" />
                  <input className={field} value={embed.color}
                    onChange={e => updateEmbed('color', e.target.value)}
                    placeholder="#eabf46" />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Thumbnail Image URL (right side)
                <input className={field}
                  value={embed.thumbnail?.url ?? ''}
                  onChange={e => updateEmbed('thumbnail', asset(e.target.value))}
                  placeholder="https://example.com/logo.png" />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Banner Image URL (bottom)
                <input className={field}
                  value={embed.image?.url ?? ''}
                  onChange={e => updateEmbed('image', asset(e.target.value))}
                  placeholder="https://example.com/banner.png" />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Footer Text
                <input className={field} value={embed.footerText}
                  maxLength={2048}
                  onChange={e => updateEmbed('footerText', e.target.value)} />
              </label>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-5">
            <h3 className="font-semibold">Ticket Buttons</h3>
            <button
              disabled={buttons.length >= 5}
              onClick={() => setButtons([...buttons, emptyButton()])}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary disabled:opacity-50"
            >
              <Plus className="size-3" /> Add Button
            </button>
          </div>

          {buttons.map((button, index) => (
            <div key={button.id} className="rounded-lg border border-border bg-background p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Button {index + 1}
                </span>
                <button
                  onClick={() => setButtons(buttons.filter(b => b.id !== button.id))}
                  aria-label="Remove button"
                  className="text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <input className={field} value={button.label}
                  maxLength={80} placeholder="Button text"
                  onChange={e => setButtons(buttons.map(b =>
                    b.id === button.id ? { ...b, label: e.target.value } : b
                  ))} />

                <input className={field} value={button.emoji}
                  placeholder="🎟️"
                  onChange={e => setButtons(buttons.map(b =>
                    b.id === button.id ? { ...b, emoji: e.target.value } : b
                  ))} />

                <select className={field} value={button.style}
                  onChange={e => setButtons(buttons.map(b =>
                    b.id === button.id
                      ? { ...b, style: e.target.value as ButtonStyle }
                      : b
                  ))}>
                  <option value="primary">Blue</option>
                  <option value="secondary">Gray</option>
                  <option value="success">Green</option>
                  <option value="danger">Red</option>
                </select>
              </div>
            </div>
          ))}

          </motion.section>}

          {editorTab === 'settings' && <motion.section key="settings" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5 rounded-xl border border-primary/20 bg-background/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Ticket className="size-4 text-primary" /> 02 · Ticket Creation Settings
            </h3>
            <label className="flex flex-col gap-2 text-sm">
              Discord Ticket Category
              <select className={field} value={ticketSettings.categoryId}
                onChange={e => setTicketSettings(p => ({ ...p, categoryId: e.target.value }))}>
                <option value="">No category selected</option>
                {(channels.data ?? []).filter(c => String(c.kind) === 'category').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">Categories are loaded from the selected Discord server.</span>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Ticket Channel Name
              <input className={field} value={ticketSettings.channelName} maxLength={90}
                onChange={e => setTicketSettings(p => ({ ...p, channelName: e.target.value }))}
                placeholder="ticket-{username}" />
              <span className="text-xs text-muted-foreground">Variables: {'{username}'}, {'{userid}'}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ticketSettings.oneTicketPerUser}
                onChange={e => setTicketSettings(p => ({ ...p, oneTicketPerUser: e.target.checked }))} />
              Limit to one open ticket per user per panel
            </label>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-5">
            <h3 className="font-semibold">Staff Access &amp; Claim Settings</h3>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor="staff-role-select" className="font-medium">Select Staff Roles</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  id="staff-role-select"
                  className={field}
                  value={roleToAdd}
                  disabled={rolesLoading || Boolean(rolesError)}
                  onChange={e => setRoleToAdd(e.target.value)}
                >
                  <option value="">{rolesLoading ? 'Loading Discord roles...' : 'Select a role'}</option>
                  {roles.filter(role =>
                    role.id !== serverId && !role.managed &&
                    !ticketSettings.staffRoleIds.includes(role.id)
                  ).map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!roleToAdd}
                  onClick={() => {
                    if (roleToAdd && !ticketSettings.staffRoleIds.includes(roleToAdd)) {
                      setTicketSettings(previous => ({
                        ...previous,
                        staffRoleIds: [...previous.staffRoleIds, roleToAdd]
                      }))
                    }
                    setRoleToAdd('')
                  }}
                  className="shrink-0 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  + Add Role
                </button>
              </div>
              {rolesError && <p role="alert" className="text-xs text-destructive">{rolesError}</p>}
              <div className="flex flex-wrap gap-2">
                {ticketSettings.staffRoleIds.map(id => {
                  const role = roles.find(item => item.id === id)
                  return (
                    <span key={id} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-foreground">
                      <span>{role?.name ?? `Unknown role (${id})`}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${role?.name ?? id}`}
                        onClick={() => toggleStaffRole(id)}
                        className="font-bold text-destructive hover:opacity-70"
                      >×</button>
                    </span>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {ticketSettings.staffRoleIds.length} role(s). Add multiple roles; their Discord IDs are saved automatically.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm">
              Claim Button Label
              <input className={field} maxLength={80} value={ticketSettings.claimButtonLabel}
                onChange={e => setTicketSettings(p => ({ ...p, claimButtonLabel: e.target.value }))}
                placeholder="Claim Ticket" />
              <span className="text-xs text-muted-foreground">
                The Claim action needs a matching KataBump bot update before it becomes functional.
              </span>
            </label>
          </div>

          </motion.section>}

          {editorTab === 'welcome' && <motion.section key="welcome" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5 rounded-xl border border-primary/20 bg-background/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" /> 03 · Ticket Welcome Editor</h3>
            <label className="flex flex-col gap-2 text-sm">
              Welcome Embed Title
              <input className={field} maxLength={256} value={ticketSettings.welcomeTitle}
                onChange={e => setTicketSettings(p => ({ ...p, welcomeTitle: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Welcome Message Inside Ticket
              <textarea className={field} rows={5} maxLength={4000}
                value={ticketSettings.welcomeMessage}
                onChange={e => setTicketSettings(p => ({ ...p, welcomeMessage: e.target.value }))} />
              <span className="text-xs text-muted-foreground">Variables: {'{user}'}, {'{username}'}</span>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Welcome Embed Color
              <input type="color" className="h-10 w-20 rounded border border-border"
                value={ticketSettings.welcomeColor}
                onChange={e => setTicketSettings(p => ({ ...p, welcomeColor: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Welcome Image URL (optional)
              <input className={field} value={ticketSettings.welcomeImageUrl}
                onChange={e => setTicketSettings(p => ({ ...p, welcomeImageUrl: e.target.value }))}
                placeholder="https://example.com/image.png" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Close Ticket Button Label
              <input className={field} maxLength={80} value={ticketSettings.closeButtonLabel}
                onChange={e => setTicketSettings(p => ({ ...p, closeButtonLabel: e.target.value }))} />
            </label>
            <div className="rounded-lg bg-[#313338] p-4 text-sm text-white">
              <p className="mb-2 font-semibold">Ticket Welcome Preview</p>
              <div className="rounded bg-[#2b2d31] p-3" style={{ borderLeft: `4px solid ${ticketSettings.welcomeColor}` }}>
                <p className="font-semibold">{ticketSettings.welcomeTitle}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-[#dbdee1]">
                  {ticketSettings.welcomeMessage.replaceAll('{user}', '@username').replaceAll('{username}', 'username')}
                </p>
                {ticketSettings.welcomeImageUrl && (
                  <img src={ticketSettings.welcomeImageUrl} alt="Welcome" className="mt-3 max-h-48 rounded object-contain" />
                )}
              </div>
              <span className="mt-3 inline-block rounded bg-[#da373c] px-3 py-2 text-xs font-medium">
                🔒 {ticketSettings.closeButtonLabel}
              </span>
            </div>
          </div>

          </motion.section>}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>All three sections share the same panel. Your inputs stay when switching tabs.</span>
            <span className="text-primary">{editorTab === 'panel' ? 'Step 1 / 3' : editorTab === 'settings' ? 'Step 2 / 3' : 'Step 3 / 3'}</span>
          </div>

          <button
            onClick={savePanel}
            disabled={saving || !panels.data}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Saving...' : editingId ? 'Update Panel' : 'Save Panel'}
          </button>

          {notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }} className="sticky top-5 rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><Eye className="size-4 text-primary" /> Discord Live Preview</h2>
              <div className="inline-flex rounded-lg border border-border bg-background p-1 text-xs">
                <button type="button" onClick={() => setPreviewMode('panel')} className={`rounded-md px-3 py-1.5 transition-colors ${previewMode === 'panel' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Panel</button>
                <button type="button" onClick={() => setPreviewMode('welcome')} className={`rounded-md px-3 py-1.5 transition-colors ${previewMode === 'welcome' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Welcome</button>
              </div>
            </div>

            {previewMode === 'panel' ? <div className="rounded-lg bg-[#313338] p-4 text-[#dbdee1]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#eabf46] font-bold text-black">
                  C
                </div>
                <span className="text-sm font-bold text-white">CYBER</span>
                <span className="rounded bg-[#5865f2] px-1 text-[10px] text-white">
                  APP
                </span>
              </div>

              {content && (
                <p className="mb-3 whitespace-pre-wrap break-words text-sm">
                  {content}
                </p>
              )}

              {previewEmbed && (
                <div
                  className="rounded bg-[#2b2d31] p-3"
                  style={{ borderLeft: `4px solid ${previewEmbed.color}` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 break-words font-bold text-white">
                        {previewEmbed.title}
                      </h3>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {previewEmbed.description}
                      </p>
                    </div>
                    {previewEmbed.thumbnail?.url && (
                      <img
                        src={previewEmbed.thumbnail.url}
                        alt="Thumbnail"
                        className="size-20 rounded object-cover"
                      />
                    )}
                  </div>

                  {previewEmbed.image?.url && (
                    <img
                      src={previewEmbed.image.url}
                      alt="Banner"
                      className="mt-4 max-h-64 w-full rounded object-contain"
                    />
                  )}

                  {previewEmbed.footerText && (
                    <p className="mt-3 text-xs text-[#949ba4]">
                      {previewEmbed.footerText}
                    </p>
                  )}
                </div>
              )}

              {previewButtons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewButtons.map(b => (
                    <div
                      key={b.id}
                      className="rounded px-3 py-2 text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          b.style === 'success' ? '#248046' :
                          b.style === 'danger' ? '#da373c' :
                          b.style === 'primary' ? '#5865f2' :
                          '#4e5058'
                      }}
                    >
                      {b.emoji} {b.label}
                    </div>
                  ))}
                </div>
              )}
            </div> : <div className="rounded-lg bg-[#313338] p-4 text-[#dbdee1]">
              <div className="mb-3 flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-[#eabf46] font-bold text-black">C</span><span className="font-bold text-white">CYBER</span><span className="rounded bg-[#5865f2] px-1 text-[10px] text-white">APP</span></div>
              <div className="rounded bg-[#2b2d31] p-4" style={{ borderLeft: `4px solid ${ticketSettings.welcomeColor}` }}>
                <p className="font-bold text-white">{ticketSettings.welcomeTitle}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{ticketSettings.welcomeMessage.replaceAll('{user}', '@username').replaceAll('{username}', 'username')}</p>
                {ticketSettings.welcomeImageUrl && <img src={ticketSettings.welcomeImageUrl} alt="Ticket welcome" className="mt-3 max-h-52 rounded object-contain" />}
              </div>
              <div className="mt-3 inline-flex rounded bg-[#da373c] px-3 py-2 text-xs font-medium text-white">🔒 {ticketSettings.closeButtonLabel}</div>
            </div>}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Radio className="size-3 text-primary" /> Preview updates as you type</div>
          </motion.div>
        </div>
      </div>

      <TicketAnalytics serverId={serverId} />

      <LiveTicketManager serverId={serverId} />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5">
        <h2 className="mb-5 font-semibold">
          Saved Ticket Panels ({items.length})
        </h2>

        {panels.error && (
          <p className="text-sm text-destructive">
            Unable to load ticket panels.
          </p>
        )}

        {!panels.data && !panels.error && (
          <p className="text-sm text-muted-foreground">
            Loading panels...
          </p>
        )}

        <div className="flex flex-col gap-3">
          {items.map((panel, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.06, 0.5) }}
              whileHover={{ y: -2 }}
              key={panel.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{panel.name}</p>
                <p className="text-xs text-muted-foreground">
                  {panel.state} · {panel.message.buttons.length} buttons
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="password"
                  autoComplete="off"
                  aria-label={`Webhook URL for ${panel.name} (optional)`}
                  placeholder="Webhook URL (optional)"
                  value={webhookUrls[panel.id] ?? ''}
                  onChange={e => setWebhookUrls(old => ({ ...old, [panel.id]: e.target.value }))}
                  className="min-w-0 w-48 rounded border border-border bg-background px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => publishPanel(panel.id)}
                  disabled={saving}
                  className="rounded border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  Publish
                </button>
                <button
                  onClick={() => editPanel(panel)}
                  className="rounded border border-border p-2 hover:border-primary"
                  aria-label={`Edit ${panel.name}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => deletePanel(panel.id)}
                  disabled={saving}
                  className="rounded border border-border p-2 text-destructive"
                  aria-label={`Delete ${panel.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
