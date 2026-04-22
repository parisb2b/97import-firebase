// src/lib/useToast.ts
// Hook et helper global pour les notifications Toast
// Remplace les alert(), confirm() et popups "Firebase OK"

import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

// Store global en mémoire (pour usage hors React)
let listeners: ((toasts: ToastMessage[]) => void)[] = [];
let toastsStore: ToastMessage[] = [];
let nextId = 1;

function notifyListeners() {
  listeners.forEach(l => l([...toastsStore]));
}

function addToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = nextId++;
  const toast: ToastMessage = { id, message, type, duration };
  toastsStore.push(toast);
  notifyListeners();

  setTimeout(() => {
    toastsStore = toastsStore.filter(t => t.id !== id);
    notifyListeners();
  }, duration);
}

// API globale (utilisable depuis n'importe où : toast.success(...), toast.error(...))
export const toast = {
  success: (message: string, duration = 3000) => addToast(message, 'success', duration),
  error: (message: string, duration = 5000) => addToast(message, 'error', duration),
  info: (message: string, duration = 3000) => addToast(message, 'info', duration),
  warning: (message: string, duration = 4000) => addToast(message, 'warning', duration),
};

// Hook React pour le composant ToastContainer
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter(l => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    toastsStore = toastsStore.filter(t => t.id !== id);
    notifyListeners();
  }, []);

  return { toasts, dismiss };
}
