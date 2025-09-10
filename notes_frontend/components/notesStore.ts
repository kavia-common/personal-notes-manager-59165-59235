//
// Reactive notes store with localStorage persistence for Slidev/Vue components
//

import { reactive, computed, toRaw } from 'vue'

// Types
export type NoteId = string

export interface Note {
  id: NoteId
  title: string
  content: string
  createdAt: string // ISO string
  updatedAt: string // ISO string
  tags: string[]
  pinned?: boolean
}

export interface NotesState {
  notes: Note[]
  selectedId: NoteId | null
  search: string
  filterTag: string | null
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'pinned'
}

// Persistence keys
const STORAGE_KEY = 'notes_frontend.v1.notes'
const STORAGE_META_KEY = 'notes_frontend.v1.meta'

// Helpers
function nowIso() {
  return new Date().toISOString()
}

function generateId(): NoteId {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Load from localStorage (safe)
function loadState(): NotesState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const meta = localStorage.getItem(STORAGE_META_KEY)
    const state: NotesState = {
      notes: [],
      selectedId: null,
      search: '',
      filterTag: null,
      sortBy: 'updatedAt',
    }

    if (saved) {
      state.notes = JSON.parse(saved)
    } else {
      // seed with sample notes on first run
      const seed: Note[] = [
        {
          id: generateId(),
          title: 'Welcome to Notes',
          content:
            'This is your first note. Edit me, pin me, add tags, or delete me. Your notes are saved in your browser (localStorage).',
          createdAt: nowIso(),
          updatedAt: nowIso(),
          tags: ['welcome', 'tips'],
          pinned: true,
        },
        {
          id: generateId(),
          title: 'Shortcuts',
          content: '- Click a note to view\n- Use the editor to update\n- Add tags with comma-separated values\n- Search by title/content/tags',
          createdAt: nowIso(),
          updatedAt: nowIso(),
          tags: ['help'],
          pinned: false,
        },
      ]
      state.notes = seed
      state.selectedId = seed[0].id
      persistNotes(seed)
    }

    if (meta) {
      const parsed = JSON.parse(meta)
      state.selectedId = parsed.selectedId ?? state.selectedId
      state.search = parsed.search ?? ''
      state.filterTag = parsed.filterTag ?? null
      state.sortBy = parsed.sortBy ?? 'updatedAt'
    }
    return state
  } catch {
    return {
      notes: [],
      selectedId: null,
      search: '',
      filterTag: null,
      sortBy: 'updatedAt',
    }
  }
}

function persistNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {}
}

function persistMeta(meta: Partial<Pick<NotesState, 'selectedId' | 'search' | 'filterTag' | 'sortBy'>>) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_META_KEY) || '{}')
    const merged = { ...existing, ...meta }
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(merged))
  } catch {}
}

// Reactive store
const state = reactive<NotesState>(loadState())

// Derived getters
const allNotes = computed(() => state.notes)

const filteredNotes = computed(() => {
  const term = state.search.trim().toLowerCase()
  const tag = state.filterTag?.trim().toLowerCase() || null

  let list = [...state.notes]
  if (term) {
    list = list.filter((n) => {
      const hay = `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase()
      return hay.includes(term)
    })
  }
  if (tag) {
    list = list.filter((n) => n.tags.map((t) => t.toLowerCase()).includes(tag))
  }

  const sorter: Record<NotesState['sortBy'], (a: Note, b: Note) => number> = {
    updatedAt: (a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
    createdAt: (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
    title: (a, b) => a.title.localeCompare(b.title),
    pinned: (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)),
  }

  list.sort(sorter[state.sortBy])

  // Always keep pinned notes at top if not explicitly sorting by title/created
  if (state.sortBy !== 'title' && state.sortBy !== 'createdAt') {
    list.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
  }

  return list
})

const selectedNote = computed<Note | null>(() => {
  if (!state.selectedId) return null
  return state.notes.find((n) => n.id === state.selectedId) || null
})

// PUBLIC_INTERFACE
export function useNotesStore() {
  /**
   * Public Notes Store API for CRUD operations and state controls.
   * State is reactive and persisted in localStorage.
   */
  return {
    state,
    allNotes,
    filteredNotes,
    selectedNote,
    // CRUD
    createNote,
    updateNote,
    deleteNote,
    // selection and UI filters
    selectNote,
    setSearch,
    setFilterTag,
    setSortBy,
    // helpers
    togglePin,
    upsertTag,
    removeTag,
    clearFilters,
  }
}

/** Create a new note and set it as selected */
function createNote(partial?: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'pinned'>>): Note {
  const note: Note = {
    id: generateId(),
    title: (partial?.title ?? 'Untitled').trim() || 'Untitled',
    content: partial?.content ?? '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    tags: partial?.tags ?? [],
    pinned: partial?.pinned ?? false,
  }
  state.notes.unshift(note)
  state.selectedId = note.id
  persistNotes(toRaw(state.notes))
  persistMeta({ selectedId: state.selectedId })
  return note
}

/** Update fields of an existing note */
function updateNote(id: NoteId, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) {
  const idx = state.notes.findIndex((n) => n.id === id)
  if (idx === -1) return
  const current = state.notes[idx]
  const next: Note = {
    ...current,
    ...updates,
    title: (updates.title ?? current.title).trim() || 'Untitled',
    updatedAt: nowIso(),
  }
  state.notes.splice(idx, 1, next)
  persistNotes(toRaw(state.notes))
}

/** Delete a note by id. Select a neighbor if the selected is removed. */
function deleteNote(id: NoteId) {
  const idx = state.notes.findIndex((n) => n.id === id)
  if (idx === -1) return
  const wasSelected = state.selectedId === id
  state.notes.splice(idx, 1)
  if (wasSelected) {
    const fallback = state.notes[0]?.id ?? null
    state.selectedId = fallback
  }
  persistNotes(toRaw(state.notes))
  persistMeta({ selectedId: state.selectedId })
}

/** Select note id (or null) */
function selectNote(id: NoteId | null) {
  state.selectedId = id
  persistMeta({ selectedId: id })
}

/** Search term setter */
function setSearch(term: string) {
  state.search = term
  persistMeta({ search: term })
}

/** Filter by tag name (or null to clear) */
function setFilterTag(tag: string | null) {
  state.filterTag = tag
  persistMeta({ filterTag: tag })
}

/** Sort mode setter */
function setSortBy(mode: NotesState['sortBy']) {
  state.sortBy = mode
  persistMeta({ sortBy: mode })
}

/** Toggle pin flag for a note */
function togglePin(id: NoteId) {
  const n = state.notes.find((x) => x.id === id)
  if (!n) return
  updateNote(id, { pinned: !n.pinned })
}

/** Add or ensure tag exists on a note */
function upsertTag(id: NoteId, tag: string) {
  const n = state.notes.find((x) => x.id === id)
  if (!n) return
  const t = tag.trim()
  if (!t) return
  const tags = Array.from(new Set([...(n.tags || []), t]))
  updateNote(id, { tags })
}

/** Remove tag from a note */
function removeTag(id: NoteId, tag: string) {
  const n = state.notes.find((x) => x.id === id)
  if (!n) return
  const tags = (n.tags || []).filter((t) => t !== tag)
  updateNote(id, { tags })
}

/** Clear search and tag filters */
function clearFilters() {
  state.search = ''
  state.filterTag = null
  persistMeta({ search: '', filterTag: null })
}
