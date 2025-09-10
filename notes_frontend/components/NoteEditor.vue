<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNotesStore } from './notesStore'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'deleted'): void
}>()

const { selectedNote, updateNote, deleteNote, upsertTag, removeTag, togglePin } = useNotesStore()

// Local editable fields with debounced persistence
const title = ref('')
const content = ref('')
const tagsInput = ref('')

watch(
  selectedNote,
  (n) => {
    title.value = n?.title || ''
    content.value = n?.content || ''
    tagsInput.value = n?.tags?.join(', ') || ''
  },
  { immediate: true }
)

function debounced(fn: () => void, ms = 250) {
  let t: any
  return () => {
    clearTimeout(t)
    t = setTimeout(fn, ms)
  }
}

const persistTitle = debounced(() => {
  if (!selectedNote.value) return
  updateNote(selectedNote.value.id, { title: title.value })
})

const persistContent = debounced(() => {
  if (!selectedNote.value) return
  updateNote(selectedNote.value.id, { content: content.value })
})

function applyTags() {
  const note = selectedNote.value
  if (!note) return
  const parsed = (tagsInput.value || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  // Rebuild tag set to exactly match parsed
  const existing = new Set(parsed)
  const toRemove = (note.tags || []).filter((t) => !existing.has(t))
  const toAdd = parsed.filter((t) => !(note.tags || []).includes(t))
  toRemove.forEach((t) => removeTag(note.id, t))
  toAdd.forEach((t) => upsertTag(note.id, t))
}

function onDelete() {
  const note = selectedNote.value
  if (!note) return
  deleteNote(note.id)
  emit('deleted')
}
</script>

<template>
  <div class="editor card" style="height: 100%; display: grid; grid-template-rows: auto auto 1fr auto; gap: 10px;">
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
      <input
        class="input title"
        v-model="title"
        placeholder="Note title"
        @input="persistTitle()"
      />
      <div style="display:flex; gap:8px;">
        <button v-if="selectedNote" class="btn-secondary" @click="togglePin(selectedNote.id)">
          {{ selectedNote?.pinned ? 'Unpin' : 'Pin' }}
        </button>
        <button class="btn-primary" @click="emit('create')">New</button>
        <button v-if="selectedNote" class="btn-secondary" @click="onDelete()">Delete</button>
      </div>
    </div>

    <div>
      <label class="label">Tags</label>
      <input
        class="input"
        v-model="tagsInput"
        placeholder="Comma separated tags e.g. work, ideas, todo"
        @change="applyTags"
      />
    </div>

    <div style="display: grid;">
      <label class="label">Content</label>
      <textarea
        class="textarea"
        v-model="content"
        placeholder="Write your note here…"
        @input="persistContent()"
      ></textarea>
    </div>

    <div v-if="selectedNote" class="footer subtle">
      <span>Created: {{ new Date(selectedNote.createdAt).toLocaleString() }}</span>
      <span>Updated: {{ new Date(selectedNote.updatedAt).toLocaleString() }}</span>
      <span v-if="selectedNote.tags?.length">Tags: {{ selectedNote.tags.join(', ') }}</span>
    </div>

    <div v-else class="placeholder">Select a note from the list or create a new one.</div>
  </div>
</template>

<style scoped>
.input, .textarea {
  background: var(--theme-bg-elevated);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-subtle);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
  width: 100%;
}
.input:focus, .textarea:focus {
  border-color: var(--theme-primary-500);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--theme-primary-500) 15%, #0000);
}
.textarea {
  min-height: 280px;
  resize: vertical;
}
.title {
  font-size: 18px;
  font-weight: 700;
}
.label {
  display: block;
  color: var(--theme-text-secondary);
  font-size: 12px;
  margin-bottom: 6px;
}
.footer {
  display: flex;
  gap: 16px;
  font-size: 12px;
}
</style>
