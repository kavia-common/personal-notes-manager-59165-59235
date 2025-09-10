# Notes Frontend (Slidev)

A Slidev-based personal notes application where users can create, view, edit, and delete notes. State is stored locally in the browser using localStorage.

How to run:
- pnpm install
- pnpm dev
- visit http://localhost:3030 and navigate to the "Open App" button on the first slide, or go directly to the "Notes App" slide.

Features:
- Create, view, edit, delete notes
- Search notes (title, content, tags)
- Tag management (comma-separated input)
- Sorting (updated, created, title, pinned)
- Pin/Unpin notes
- Local persistence (no backend)

Project structure:
- slides.md — Slidev deck, includes app slides wired to components
- components/notesStore.ts — reactive store and CRUD operations with localStorage
- components/NoteList.vue — notes list with search, filter, sort, pin, delete
- components/NoteEditor.vue — editor for the selected note
- theme/custom.css — dark theme styles
- style.css — connects custom theme to Slidev (required pattern)
