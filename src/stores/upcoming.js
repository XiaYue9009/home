import { defineStore } from 'pinia';
import {
  buildDefaultNoteContent,
  extractTitleFromContent,
  normalizeNoteContent,
} from '@/lib/upcoming/content-title.js';
import {
  cardPreviewHtml,
  createUpcomingCardId,
  loadUpcomingCards,
  persistUpcomingCardDelete,
  persistUpcomingCardFlags,
  persistUpcomingCardReorder,
  persistUpcomingCardUpsert,
  resolveUpcomingCards,
  sortUpcomingCards,
} from '@/lib/upcoming/cards.js';

export const useUpcomingStore = defineStore('upcoming', {
  state: () => ({
    cards: sortUpcomingCards(loadUpcomingCards()),
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
        this.cards = sortUpcomingCards(await resolveUpcomingCards());
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
    /** 编辑完成时调用（失焦 / 弹窗关闭），有变更才同步 */
    async autosaveDraft() {
      const content = normalizeNoteContent(this.draftContent, this.draftTitle);
      if (!content.trim()) return;

      const title = extractTitleFromContent(content);
      this.draftContent = content;

      if (this.editorMode === 'edit' && this.editingId) {
        const card = this.cards.find((entry) => entry.id === this.editingId);
        if (card && card.content === content && card.title === title) return;
      }

      this.saving = true;
      const updatedAt = new Date().toISOString();
      let targetCard = null;

      if (this.editorMode === 'create') {
        const insertAt = this.cards.findIndex((card) => !card.pinned && !card.done);
        targetCard = {
          id: createUpcomingCardId(),
          title,
          content,
          pinned: false,
          done: false,
          updatedAt,
        };
        if (insertAt === -1) {
          const firstDone = this.cards.findIndex((entry) => entry.done);
          if (firstDone === -1) this.cards.push(targetCard);
          else this.cards.splice(firstDone, 0, targetCard);
        } else {
          this.cards.splice(insertAt, 0, targetCard);
        }
        this.editorMode = 'edit';
        this.editingId = targetCard.id;
      } else if (this.editingId) {
        const card = this.cards.find((entry) => entry.id === this.editingId);
        if (card) {
          card.title = title;
          card.content = content;
          card.updatedAt = updatedAt;
          targetCard = card;
        }
      }

      try {
        if (!targetCard) return;
        const result = await persistUpcomingCardUpsert(this.cards, targetCard);
        this.cards = result.cards;
      } finally {
        this.saving = false;
      }
    },
    async togglePin(id) {
      const card = this.cards.find((entry) => entry.id === id);
      if (!card || card.done) return;

      card.pinned = !card.pinned;
      card.updatedAt = new Date().toISOString();
      const result = await persistUpcomingCardFlags(this.cards, id, {
        pinned: card.pinned,
        done: false,
      });
      this.cards = result.cards;
    },
    async toggleDone(id) {
      const card = this.cards.find((entry) => entry.id === id);
      if (!card) return;

      card.done = !card.done;
      if (card.done) card.pinned = false;
      card.updatedAt = new Date().toISOString();
      const result = await persistUpcomingCardFlags(this.cards, id, {
        pinned: card.pinned,
        done: card.done,
      });
      this.cards = result.cards;
    },
    async reorderCards(orderedIds) {
      if (!Array.isArray(orderedIds) || !orderedIds.length) return;

      const map = new Map(this.cards.map((card) => [card.id, card]));
      const next = orderedIds.map((id) => map.get(id)).filter(Boolean);
      if (next.length !== this.cards.length) return;

      const result = await persistUpcomingCardReorder(next);
      this.cards = result.cards;
    },
    async removeCard(id) {
      if (!id) return;
      this.cards = this.cards.filter((card) => card.id !== id);
      if (this.editingId === id) {
        this.closeEditor();
      }
      const result = await persistUpcomingCardDelete(this.cards, id);
      this.cards = result.cards;
    },
    async removeEditingCard() {
      if (!this.editingId) return;
      await this.removeCard(this.editingId);
    },
    cardPreview(card) {
      return cardPreviewHtml(card.content);
    },
  },
});
