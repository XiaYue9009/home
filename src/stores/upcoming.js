import { defineStore } from 'pinia';
import {
  buildDefaultNoteContent,
  extractTitleFromContent,
  normalizeNoteContent,
} from '@/lib/upcoming/content-title.js';
import {
  cardExcerpt,
  createUpcomingCardId,
  loadUpcomingCards,
  persistUpcomingCards,
  resolveUpcomingCards,
} from '@/lib/upcoming/cards.js';

export const useUpcomingStore = defineStore('upcoming', {
  state: () => ({
    cards: loadUpcomingCards(),
    editorOpen: false,
    editorMode: 'create',
    editingId: null,
    draftContent: '',
    saving: false,
    loading: false,
  }),
  getters: {
    editingCard: (state) => state.cards.find((card) => card.id === state.editingId) || null,
    draftTitle: (state) => extractTitleFromContent(state.draftContent),
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.cards = await resolveUpcomingCards();
      } finally {
        this.loading = false;
      }
    },
    openCreate() {
      this.editorMode = 'create';
      this.editingId = null;
      this.draftContent = buildDefaultNoteContent(this.cards);
      this.editorOpen = true;
    },
    openEdit(id) {
      const card = this.cards.find((entry) => entry.id === id);
      if (!card) return;

      this.editorMode = 'edit';
      this.editingId = id;
      this.draftContent = normalizeNoteContent(card.content, card.title);
      this.editorOpen = true;
    },
    closeEditor() {
      this.editorOpen = false;
      this.editorMode = 'create';
      this.editingId = null;
      this.draftContent = '';
    },
    setDraftContent(value) {
      this.draftContent = value;
    },
    async autosaveDraft() {
      const content = normalizeNoteContent(this.draftContent, this.draftTitle);
      if (!content.trim()) return;

      const title = extractTitleFromContent(content);
      this.draftContent = content;
      this.saving = true;
      const updatedAt = new Date().toISOString();

      if (this.editorMode === 'create') {
        const card = {
          id: createUpcomingCardId(),
          title,
          content,
          updatedAt,
        };
        this.cards.unshift(card);
        this.editorMode = 'edit';
        this.editingId = card.id;
      } else if (this.editingId) {
        const card = this.cards.find((entry) => entry.id === this.editingId);
        if (card) {
          card.title = title;
          card.content = content;
          card.updatedAt = updatedAt;
        }
      }

      await persistUpcomingCards(this.cards);
      this.saving = false;
    },
    async removeCard(id) {
      if (!id) return;
      this.cards = this.cards.filter((card) => card.id !== id);
      if (this.editingId === id) {
        this.closeEditor();
      }
      await persistUpcomingCards(this.cards);
    },
    async removeEditingCard() {
      if (!this.editingId) return;
      await this.removeCard(this.editingId);
    },
    cardPreview(card) {
      return cardExcerpt(card.content);
    },
  },
});
