import { useMemo, useState, type CSSProperties } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import './App.css'

type Category = 'Idea' | 'Note' | 'Reference' | 'Task' | 'Research'
type IdeaStatus = 'Unsorted' | 'Saved' | 'In Progress'
type SortMode = 'manual' | 'newest' | 'oldest' | 'category'

type IdeaCard = {
  id: string
  title: string
  category: Category
  status: IdeaStatus
  source: string
  createdAt: string
  summary: string
  tags: string[]
  relatedIds: string[]
  x: number
  y: number
  rotation: number
  z: number
  accent: string
}

const categoryColors: Record<Category, string> = {
  Idea: '#8b5cf6',
  Note: '#14b8a6',
  Reference: '#3b82f6',
  Task: '#22c55e',
  Research: '#f59e0b',
}

const initialIdeas: IdeaCard[] = [
  {
    id: 'frontend-ui',
    title: 'Frontend UI skill',
    category: 'Idea',
    status: 'In Progress',
    source: 'Design system',
    createdAt: '2026-06-04',
    summary: 'Build a visual board for collecting ideas, notes, references, links, and project concepts.',
    tags: ['React', 'UI', 'portfolio'],
    relatedIds: ['drag-drop', 'detail-modal', 'filter-sort'],
    x: 70,
    y: 40,
    rotation: -2,
    z: 1,
    accent: categoryColors.Idea,
  },
  {
    id: 'drag-drop',
    title: 'Drag and drop interaction',
    category: 'Task',
    status: 'Unsorted',
    source: 'Interaction note',
    createdAt: '2026-06-03',
    summary: 'Move cards freely across the canvas and stack them like a real pinboard.',
    tags: ['dnd-kit', 'canvas', 'drag'],
    relatedIds: ['frontend-ui', 'backend-crud'],
    x: 330,
    y: 82,
    rotation: 2,
    z: 2,
    accent: categoryColors.Task,
  },
  {
    id: 'backend-crud',
    title: 'Backend CRUD',
    category: 'Reference',
    status: 'Saved',
    source: 'Laravel API',
    createdAt: '2026-06-02',
    summary: 'Store, update, delete, filter, sort, and sync card positions from the backend.',
    tags: ['API', 'CRUD', 'Laravel'],
    relatedIds: ['database-relationship', 'drag-drop'],
    x: 610,
    y: 38,
    rotation: -1,
    z: 3,
    accent: categoryColors.Reference,
  },
  {
    id: 'database-relationship',
    title: 'Database relationship',
    category: 'Research',
    status: 'In Progress',
    source: 'Schema draft',
    createdAt: '2026-06-01',
    summary: 'Ideas belong to boards, use reusable tags, and connect to related cards.',
    tags: ['schema', 'relations'],
    relatedIds: ['backend-crud', 'filter-sort'],
    x: 870,
    y: 76,
    rotation: 2,
    z: 4,
    accent: categoryColors.Research,
  },
  {
    id: 'filter-sort',
    title: 'Filtering and sorting',
    category: 'Task',
    status: 'Unsorted',
    source: 'Workflow',
    createdAt: '2026-05-31',
    summary: 'Filter by category or status, then sort by date, category, or manual placement.',
    tags: ['filter', 'sort'],
    relatedIds: ['frontend-ui', 'detail-modal'],
    x: 220,
    y: 340,
    rotation: 2,
    z: 5,
    accent: categoryColors.Task,
  },
  {
    id: 'detail-modal',
    title: 'Detail modal',
    category: 'Note',
    status: 'Saved',
    source: 'UX notes',
    createdAt: '2026-05-30',
    summary: 'Open a card to inspect notes, tags, source details, and related ideas.',
    tags: ['modal', 'details'],
    relatedIds: ['frontend-ui', 'filter-sort'],
    x: 540,
    y: 340,
    rotation: -1,
    z: 6,
    accent: categoryColors.Note,
  },
]

const emptyDraft = {
  title: '',
  category: 'Idea' as Category,
  status: 'Unsorted' as IdeaStatus,
  source: '',
  summary: '',
  tags: '',
}

function App() {
  const [ideas, setIdeas] = useState<IdeaCard[]>(initialIdeas)
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All')
  const [unsortedOnly, setUnsortedOnly] = useState(false)
  const [showConnections, setShowConnections] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyDraft)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const maxZ = Math.max(...ideas.map((idea) => idea.z), 1)

  const visibleIdeas = useMemo(() => {
    const filtered = ideas.filter((idea) => {
      const categoryMatches = categoryFilter === 'All' || idea.category === categoryFilter
      const statusMatches = !unsortedOnly || idea.status === 'Unsorted'
      return categoryMatches && statusMatches
    })

    if (sortMode === 'manual') return filtered.sort((a, b) => a.z - b.z)

    return [...filtered].sort((a, b) => {
      if (sortMode === 'category') return a.category.localeCompare(b.category)
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return sortMode === 'newest' ? bTime - aTime : aTime - bTime
    })
  }, [ideas, sortMode, categoryFilter, unsortedOnly])

  const selectedIdea = ideas.find((idea) => idea.id === selectedId) ?? null

  const connectionPairs = useMemo(() => {
    const visibleMap = new Map(visibleIdeas.map((idea) => [idea.id, idea]))
    return visibleIdeas.flatMap((idea) =>
      idea.relatedIds
        .map((relatedId) => visibleMap.get(relatedId))
        .filter((relatedIdea): relatedIdea is IdeaCard => Boolean(relatedIdea))
        .map((relatedIdea) => ({ from: idea, to: relatedIdea })),
    )
  }, [visibleIdeas])

  function bringForward(ideaId: string) {
    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) => (idea.id === ideaId ? { ...idea, z: maxZ + 1 } : idea)),
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const { x, y } = event.delta

    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) =>
        idea.id === activeId
          ? {
              ...idea,
              x: Math.max(0, Math.min(1010, idea.x + x)),
              y: Math.max(0, Math.min(500, idea.y + y)),
              z: maxZ + 1,
            }
          : idea,
      ),
    )
    setSortMode('manual')
  }

  function resetDraft() {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  function editIdea(idea: IdeaCard) {
    setEditingId(idea.id)
    setDraft({
      title: idea.title,
      category: idea.category,
      status: idea.status,
      source: idea.source,
      summary: idea.summary,
      tags: idea.tags.join(', '),
    })
  }

  function saveIdea() {
    if (!draft.title.trim() || !draft.summary.trim()) return

    const payload = {
      title: draft.title.trim(),
      category: draft.category,
      status: draft.status,
      source: draft.source.trim() || 'Workspace note',
      summary: draft.summary.trim(),
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      accent: categoryColors[draft.category],
    }

    if (editingId) {
      setIdeas((currentIdeas) =>
        currentIdeas.map((idea) => (idea.id === editingId ? { ...idea, ...payload } : idea)),
      )
      resetDraft()
      return
    }

    const id = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    setIdeas((currentIdeas) => [
      ...currentIdeas,
      {
        ...payload,
        id,
        createdAt: new Date().toISOString().slice(0, 10),
        relatedIds: currentIdeas.slice(0, 2).map((idea) => idea.id),
        x: 90 + ((currentIdeas.length * 68) % 720),
        y: 86 + ((currentIdeas.length * 54) % 360),
        rotation: ((currentIdeas.length % 5) - 2) * 1.2,
        z: maxZ + 1,
      },
    ])
    resetDraft()
  }

  function deleteIdea(ideaId: string) {
    setIdeas((currentIdeas) =>
      currentIdeas
        .filter((idea) => idea.id !== ideaId)
        .map((idea) => ({
          ...idea,
          relatedIds: idea.relatedIds.filter((relatedId) => relatedId !== ideaId),
        })),
    )
    if (selectedId === ideaId) setSelectedId(null)
    if (editingId === ideaId) resetDraft()
  }

  return (
    <main className="studio-shell">
      <section className="board" aria-label="Pinboard Studio idea canvas">
        <div className="board-grain" aria-hidden="true" />
        <div className="brand-stamp" aria-hidden="true">
          STUDIO
        </div>

        <header className="board-header">
          <div>
            <p className="eyebrow">Project name: Pinboard Studio</p>
            <h1>Idea Canvas</h1>
            <p className="purpose">
              A visual board to collect ideas, notes, references, links, and project concepts.
            </p>
          </div>
          <div className="board-stats" aria-label="Board statistics">
            <span>{ideas.length} ideas</span>
            <span>{ideas.filter((idea) => idea.status === 'Unsorted').length} unsorted</span>
            <span>{connectionPairs.length} connections</span>
          </div>
        </header>

        <section className="board-controls" aria-label="Board controls">
          <div className="control-group">
            {(['manual', 'newest', 'oldest', 'category'] as SortMode[]).map((mode) => (
              <button
                className={sortMode === mode ? 'ctrl is-active' : 'ctrl'}
                key={mode}
                onClick={() => setSortMode(mode)}
                type="button"
              >
                Sort: {mode}
              </button>
            ))}
          </div>
          <div className="control-group">
            <select
              aria-label="Filter by category"
              className="select-control"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as 'All' | Category)}
            >
              {['All', 'Idea', 'Note', 'Reference', 'Task', 'Research'].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <label className="check-control">
              <input
                checked={unsortedOnly}
                onChange={(event) => setUnsortedOnly(event.target.checked)}
                type="checkbox"
              />
              Unsorted only
            </label>
            <button className="ctrl" onClick={() => setShowConnections((value) => !value)} type="button">
              {showConnections ? 'Hide connections' : 'Show connections'}
            </button>
          </div>
        </section>

        <p className="hint">drag any card to rearrange - tap a title for details - connections show related ideas</p>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <section className="pinboard" aria-label="Pinned ideas">
            {showConnections && <ConnectionLines pairs={connectionPairs} />}
            {visibleIdeas.map((idea) => (
              <BoardCard
                idea={idea}
                key={idea.id}
                onDelete={() => deleteIdea(idea.id)}
                onEdit={() => editIdea(idea)}
                onFocus={() => bringForward(idea.id)}
                onOpen={() => {
                  bringForward(idea.id)
                  setSelectedId(idea.id)
                }}
              />
            ))}
          </section>
        </DndContext>

        <section className="idea-form" aria-label="Create or edit idea">
          <h2>{editingId ? 'Edit idea' : 'New idea'}</h2>
          <input
            aria-label="Title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Title"
          />
          <select
            aria-label="Category"
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}
          >
            {(['Idea', 'Note', 'Reference', 'Task', 'Research'] as Category[]).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as IdeaStatus })}
          >
            {(['Unsorted', 'Saved', 'In Progress'] as IdeaStatus[]).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            aria-label="Reference"
            value={draft.source}
            onChange={(event) => setDraft({ ...draft, source: event.target.value })}
            placeholder="Reference"
          />
          <input
            aria-label="Tags"
            value={draft.tags}
            onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
            placeholder="Tags"
          />
          <textarea
            aria-label="Summary"
            value={draft.summary}
            onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
            placeholder="Summary"
          />
          <button className="primary-action" onClick={saveIdea} type="button">
            {editingId ? 'Save note' : 'Add idea'}
          </button>
          <button className="ghost-action" onClick={resetDraft} type="button">
            Reset
          </button>
        </section>
      </section>

      {selectedIdea && (
        <DetailPanel
          idea={selectedIdea}
          relatedIdeas={ideas.filter((idea) => selectedIdea.relatedIds.includes(idea.id))}
          onClose={() => setSelectedId(null)}
          onEdit={() => editIdea(selectedIdea)}
        />
      )}
    </main>
  )
}

function BoardCard({
  idea,
  onDelete,
  onEdit,
  onFocus,
  onOpen,
}: {
  idea: IdeaCard
  onDelete: () => void
  onEdit: () => void
  onFocus: () => void
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: idea.id })
  const style = {
    left: idea.x,
    top: idea.y,
    zIndex: isDragging ? 1000 : idea.z,
    transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0) rotate(${idea.rotation}deg)`,
    '--accent': idea.accent,
  } as CSSProperties

  return (
    <article
      className={`idea-card ${isDragging ? 'is-dragging' : ''}`}
      ref={setNodeRef}
      style={style}
      onMouseDown={onFocus}
      {...attributes}
      {...listeners}
    >
      <span className="color-pin" aria-hidden="true" />
      <span className="soft-tape" aria-hidden="true" />
      <div className="card-meta">
        <span>{idea.category}</span>
        <time>{idea.createdAt}</time>
      </div>
      <button className="card-title" onClick={onOpen} type="button">
        {idea.title}
      </button>
      <p>{idea.summary}</p>
      <div className="tag-row">
        {idea.tags.slice(0, 3).map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <div className="card-footer">
        <span>{idea.status}</span>
        <div>
          <button onClick={onEdit} type="button">
            Edit
          </button>
          <button onClick={onDelete} type="button">
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

function ConnectionLines({ pairs }: { pairs: { from: IdeaCard; to: IdeaCard }[] }) {
  return (
    <svg className="connections" aria-hidden="true" viewBox="0 0 1180 650" preserveAspectRatio="none">
      {pairs.map(({ from, to }, index) => {
        const startX = from.x + 132
        const startY = from.y + 18
        const endX = to.x + 132
        const endY = to.y + 18
        const midX = (startX + endX) / 2
        return (
          <path
            d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
            key={`${from.id}-${to.id}-${index}`}
          />
        )
      })}
    </svg>
  )
}

function DetailPanel({
  idea,
  relatedIdeas,
  onClose,
  onEdit,
}: {
  idea: IdeaCard
  relatedIdeas: IdeaCard[]
  onClose: () => void
  onEdit: () => void
}) {
  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="detail-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${idea.title} details`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} type="button" aria-label="Close details">
          x
        </button>
        <p className="eyebrow" style={{ color: idea.accent }}>
          {idea.category}
        </p>
        <h2>{idea.title}</h2>
        <p>{idea.summary}</p>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{idea.status}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{idea.source}</dd>
          </div>
          <div>
            <dt>Added</dt>
            <dd>{idea.createdAt}</dd>
          </div>
        </dl>
        <div className="tag-row">
          {idea.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <div className="related-box">
          <h3>Related ideas</h3>
          {relatedIdeas.length ? (
            relatedIdeas.map((relatedIdea) => <span key={relatedIdea.id}>{relatedIdea.title}</span>)
          ) : (
            <span>No related ideas yet</span>
          )}
        </div>
        <button className="primary-action" onClick={onEdit} type="button">
          Edit idea
        </button>
      </section>
    </div>
  )
}

export default App
