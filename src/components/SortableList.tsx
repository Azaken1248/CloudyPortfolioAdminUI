import { useState, type ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical } from '@phosphor-icons/react'
import './SortableList.css'

type SortableItem = {
  id: string
  [key: string]: unknown
}

type SortableListProps<T extends SortableItem> = {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T) => string
}

function SortableRow<T extends SortableItem>({
  item,
  children,
}: {
  item: T
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-row ${isDragging ? 'dragging' : ''}`}
    >
      <button
        className="sortable-handle"
        type="button"
        {...attributes}
        {...listeners}
      >
        <DotsSixVertical size={18} weight="bold" />
      </button>
      <div className="sortable-content">{children}</div>
    </div>
  )
}

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
}: SortableListProps<T>) {
  const [_activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(
        (i) => (keyExtractor ? keyExtractor(i) : i.id) === active.id
      )
      const newIndex = items.findIndex(
        (i) => (keyExtractor ? keyExtractor(i) : i.id) === over.id
      )

      if (oldIndex === -1 || newIndex === -1) return

      const newItems = [...items]
      const [removed] = newItems.splice(oldIndex, 1)
      newItems.splice(newIndex, 0, removed)
      onReorder(newItems)
    }
  }

  const ids = items.map((i) => (keyExtractor ? keyExtractor(i) : i.id))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="sortable-list">
          {items.map((item, index) => (
            <SortableRow
              key={keyExtractor ? keyExtractor(item) : item.id}
              item={{ ...item, id: keyExtractor ? keyExtractor(item) : item.id }}
            >
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
