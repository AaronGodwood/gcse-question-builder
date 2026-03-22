import { create } from 'zustand';
import type { CanvasObject } from '@/types/canvas';

const MAX_HISTORY = 50;

interface CanvasState {
  objects: CanvasObject[];
  selectedIds: string[];
  history: CanvasObject[][];
  historyIndex: number;

  // Object management
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  reorderObject: (id: string, direction: 'forward' | 'backward' | 'front' | 'back') => void;

  // Selection
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Serialisation
  setObjects: (objects: CanvasObject[]) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  objects: [],
  selectedIds: [],
  history: [[]],
  historyIndex: 0,

  addObject: (obj) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({ objects: [...state.objects, obj] }));
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? ({ ...obj, ...updates } as CanvasObject) : obj
      ),
    }));
  },

  removeObjects: (ids) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      objects: state.objects.filter((obj) => !ids.includes(obj.id)),
      selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
    }));
  },

  duplicateObjects: (ids) => {
    const { pushHistory, objects } = get();
    pushHistory();
    const toBeDuplicated = objects.filter((obj) => ids.includes(obj.id));
    const newObjects = toBeDuplicated.map((obj) => ({
      ...obj,
      id: crypto.randomUUID(),
      x: obj.x + 20,
      y: obj.y + 20,
      zIndex: Math.max(...objects.map((o) => o.zIndex), 0) + 1,
    }));
    set((state) => ({
      objects: [...state.objects, ...newObjects],
      selectedIds: newObjects.map((o) => o.id),
    }));
  },

  reorderObject: (id, direction) => {
    set((state) => {
      const sorted = [...state.objects].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx === -1) return state;

      const newSorted = [...sorted];
      if (direction === 'forward' && idx < sorted.length - 1) {
        const tmp = newSorted[idx].zIndex;
        newSorted[idx] = { ...newSorted[idx], zIndex: newSorted[idx + 1].zIndex };
        newSorted[idx + 1] = { ...newSorted[idx + 1], zIndex: tmp };
      } else if (direction === 'backward' && idx > 0) {
        const tmp = newSorted[idx].zIndex;
        newSorted[idx] = { ...newSorted[idx], zIndex: newSorted[idx - 1].zIndex };
        newSorted[idx - 1] = { ...newSorted[idx - 1], zIndex: tmp };
      } else if (direction === 'front') {
        const maxZ = Math.max(...sorted.map((o) => o.zIndex));
        newSorted[idx] = { ...newSorted[idx], zIndex: maxZ + 1 };
      } else if (direction === 'back') {
        const minZ = Math.min(...sorted.map((o) => o.zIndex));
        newSorted[idx] = { ...newSorted[idx], zIndex: minZ - 1 };
      }
      return { objects: newSorted };
    });
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  pushHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.objects]);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return { history: newHistory, historyIndex: newHistory.length - 1 };
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ objects: [...history[newIndex]], historyIndex: newIndex });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ objects: [...history[newIndex]], historyIndex: newIndex });
  },

  setObjects: (objects) => set({ objects }),
  clearCanvas: () => set({ objects: [], selectedIds: [], history: [[]], historyIndex: 0 }),
}));
