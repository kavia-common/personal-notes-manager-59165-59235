<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNotesStore, type Note } from './notesStore'

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'create'): void
  (e: 'delete', id: string): void
}>()

const { state, filteredNotes, selectNote, setSearch, setFilterTag, setSortBy, togglePin, deleteNote, clearFilters } =
  useNotesStore()

// Local input bindings (debounced for search)
const searchInput = ref(state.search)
watch(
  searchInput,
  (val) => {
    const t = setTimeout(() => setSearch(val), 200)
    return () => clearTimeout(t)
  },
  { immediate: true }
)

const sortOptions: { label: string; value: typeof state.sortBy }[] = [
  { label: 'Updated', value: 'updatedAt' },
  { label: 'Created', value: 'createdAt' },
  { label: 'Title', value: 'title' },
  { label: 'Pinned', value: 'pinned' },
]

const uniqueTags = computed(() => {
  const set = new Set<string>()
  for (const n of filteredNotes.value) (n.tags || []).forEach((t) => set.add(t))
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

function onSelect(id: string | null) {
  selectNote(id)
  emit('select', id)
}

function onDelete(id: string) {
  deleteNote(id)
  emit('delete', id)
}
</script>

<template>
  <div class="note-list card" style="height: 100%; display: grid; grid-template-rows: auto auto 1fr;">
    <!-- Controls -->
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
      <input
        v-model="searchInput"
        placeholder="Search notes (title, content, tags)"
        class="input"
        style="width: 100%;"
      />
      <button class="btn-primary" @click="emit('create')">New Note</button>
    </div>

    <div style="display: grid; grid-template-columns: auto auto 1fr; gap: 8px; align-items: center; margin-top: 8px;">
      <select
        class="input"
        :value="state.sortBy"
        @change="setSortBy(($event.target as HTMLSelectElement).value as any)"
      >
        <option v-for="op in sortOptions" :key="op.value" :value="op.value">{{ op.label }}</option>
      </select>

      <select
        class="input"
        :value="state.filterTag ?? ''"
        @change="setFilterTag(($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">All tags</option>
        <option v-for="t in uniqueTags" :key="t" :value="t">{{ t }}</option>
      </select>

      <div style="text-align: right;">
        <button class="btn-secondary" @click="clearFilters()">Clear Filters</button>
      </div>
    </div>

    <!-- List -->
    <div class="list-scroll" style="margin-top: 10px; overflow: auto; display: grid; gap: 8px;">
      <div
        v-for="n in filteredNotes"
        :key="n.id"
        class="note-row"
        :class="{ selected: n.id === state.selectedId }"
        @click="onSelect(n.id)"
      >
        <div style="display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px;">
          <div>
            <div class="row-title">
              <span v-if="n.pinned" class="badge" title="Pinned">Pinned</span>
              {{ n.title || 'Untitled' }}
            </div>
            <div class="row-subtle">
              {{ new Date(n.updatedAt).toLocaleString() }}
            </div>
          </div>
          <div style="display: inline-flex; gap: 6px;">
            <button class="icon-btn" title="Pin / Unpin" @click.stop="togglePin(n.id)">📌</button>
            <button class="icon-btn danger" title="Delete" @click.stop="onDelete(n.id)">🗑️</button>
          </div>
        </div>
        <div v-if="n.tags?.length" class="tags">
          <span v-for="t in n.tags" :key="t" class="tag" @click.stop="setFilterTag(t)">{{ t }}</span>
        </div>
      </div>
      <div v-if="!filteredNotes.length" class="placeholder">No notes match your search/filters.</div>
    </div>
  </div>
</template>

<style scoped>
.input {
  background: var(--theme-bg-elevated);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-subtle);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
}
.input:focus {
  border-color: var(--theme-primary-500);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--theme-primary-500) 15%, #0000);
}

.note-row {
  background: var(--theme-bg-elevated);
  border: 1px solid var(--theme-border-subtle);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
}
.note-row.selected {
  border-color: color-mix(in oklab, var(--theme-primary-500) 35%, var(--theme-border-subtle));
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
.row-title {
  font-weight: 700;
  letter-spacing: -0.01em;
}
.row-subtle {
  color: var(--theme-text-secondary);
  font-size: 12px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.tag {
  background: var(--theme-chip-bg);
  color: var(--theme-chip-fg);
  border: 1px solid var(--theme-border-subtle);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}
.icon-btn {
  background: transparent;
  border: 1px solid var(--theme-border-subtle);
  color: var(--theme-text-secondary);
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
}
.icon-btn:hover { background: var(--theme-btn-ghost-hover-bg); }
.icon-btn.danger:hover { border-color: var(--theme-danger); color: var(--theme-danger); }
</style>
