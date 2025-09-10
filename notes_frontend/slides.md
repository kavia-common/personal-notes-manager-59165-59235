---
# Global deck settings
theme: default
title: "Notes — Slidev App"
info: |
  A Slidev-based personal notes application with full CRUD using Vue + localStorage.
class: text-left
mdc: true
transition: slide-left
fonts:
  sans: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial
  mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace
css: |
  @import "./style.css";
layout: cover
---

# Notes
A Slidev-based personal notes manager

<div class="muted">Create, view, edit, and delete notes. Data is stored locally in your browser.</div>

<div class="section-divider"></div>

- Click "Open App" below to use the notes manager
- Uses Vue 3 reactivity and persists to localStorage
- Clean, dark UI built with the custom theme

<div class="mt-2">
  <a href="#/app" class="button">Open App</a>
</div>

---

# App Overview

- Notes are stored in your browser (no backend needed)
- Search across title, content, and tags
- Filter by tag and sort (updated, created, title, pinned)
- Pin important notes to the top
- Edit title/content inline; tags via comma-separated input
- Delete safely; selection moves to next note

<div class="section-divider"></div>
<div class="muted small">Tip: This app is implemented as components inside Slidev. Navigate to the next slide to use it.</div>

---

# Notes App
id: app

<div class="grid-2">
  <div>
    <NoteList @create="onCreate" @select="onSelect" @delete="onDeleted" />
  </div>
  <div>
    <NoteEditor @create="onCreate" @deleted="onDeleted" />
  </div>
</div>

<script setup lang="ts">
import NoteList from './components/NoteList.vue'
import NoteEditor from './components/NoteEditor.vue'
import { useNotesStore } from './components/notesStore'

const { createNote, selectNote } = useNotesStore()

function onCreate() {
  const n = createNote({ title: 'New note' })
  // select handled by store's createNote already, but keeping explicit call for clarity
  selectNote(n.id)
}

function onSelect(id: string | null) {
  selectNote(id)
}

function onDeleted() {
  // No-op; store already reselects a neighbor. Kept for potential notifications.
}
</script>

---

# Usage & Shortcuts

- New note: Use "New" buttons in list or editor
- Pin/Unpin: Click the 📌 button or the Pin/Unpin button in the editor
- Delete: Trash icon in the list or Delete in the editor
- Search: Filters list by title, content, and tags
- Tags: Enter comma-separated list in the editor; click a tag in the list to filter by it

<div class="section-divider"></div>

<div class="card">
  <div class="eyebrow">Storage & Privacy</div>
  <ul class="points-clean">
    <li>Notes are saved in your browser's localStorage only.</li>
    <li>Clearing browser storage will remove your notes.</li>
    <li>No data is sent to any server.</li>
  </ul>
</div>

---

layout: center
class: text-center
---

# Thank You

Use arrow keys to navigate • Press S for presenter mode • Press E to open editor
