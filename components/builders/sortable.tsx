'use client'

import { Reorder, useDragControls } from 'motion/react'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { moveItem } from '@/lib/factories'
import { cn } from '@/lib/utils'

interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode
  className?: string
  label: string
}

/**
 * Drag-and-drop list (pointer, via handle) with keyboard-accessible
 * move up / move down controls.
 */
export function SortableList<T extends { id: string }>({ items, onReorder, renderItem, className, label }: SortableListProps<T>) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className={cn('flex flex-col gap-2', className)} aria-label={label}>
      {items.map((item, index) => (
        <SortableItem key={item.id} item={item} index={index} count={items.length} onMove={(to) => onReorder(moveItem(items, index, to))} label={label}>
          {(handle) => renderItem(item, index, handle)}
        </SortableItem>
      ))}
    </Reorder.Group>
  )
}

function SortableItem<T extends { id: string }>({
  item,
  index,
  count,
  onMove,
  children,
  label,
}: {
  item: T
  index: number
  count: number
  onMove: (to: number) => void
  children: (handle: ReactNode) => ReactNode
  label: string
}) {
  const controls = useDragControls()

  const handle = (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => {
          e.preventDefault()
          controls.start(e)
        }}
        className="grid size-7 cursor-grab touch-none place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex flex-col">
        <button
          type="button"
          aria-label={`Move ${label} item ${index + 1} up`}
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
          className="grid h-3.5 w-5 place-items-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-25"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          aria-label={`Move ${label} item ${index + 1} down`}
          disabled={index === count - 1}
          onClick={() => onMove(index + 1)}
          className="grid h-3.5 w-5 place-items-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-25"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  )

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="relative list-none"
      whileDrag={{ scale: 1.01, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,212,0,0.4)', zIndex: 20 }}
      layout="position"
    >
      {children(handle)}
    </Reorder.Item>
  )
}
