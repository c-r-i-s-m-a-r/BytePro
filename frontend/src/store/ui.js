import { defineStore } from 'pinia';

let counter = 0;
let confirmResolver = null;

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [],
    cartDrawerOpen: false,
    confirmDialog: {
      open: false,
      title: 'Confirmar acción',
      message: '',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar / Volver',
      variant: 'danger',
    },
  }),
  actions: {
    push(message, type = 'info', timeout = 4000) {
      const id = ++counter;
      this.toasts.push({ id, message, type });
      if (timeout > 0) {
        setTimeout(() => this.remove(id), timeout);
      }
      return id;
    },
    success(message) {
      return this.push(message, 'success');
    },
    error(message) {
      return this.push(message, 'error', 6000);
    },
    warning(message) {
      return this.push(message, 'warning', 6000);
    },
    info(message) {
      return this.push(message, 'info');
    },
    remove(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
    openCartDrawer() {
      this.cartDrawerOpen = true;
    },
    closeCartDrawer() {
      this.cartDrawerOpen = false;
    },
    confirm(options = {}) {
      if (confirmResolver) {
        confirmResolver(false);
        confirmResolver = null;
      }
      this.confirmDialog = {
        open: true,
        title: options.title || 'Confirmar acción',
        message:
          options.message || '¿Estás seguro de que deseas continuar con esta operación?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar / Volver',
        variant: options.variant === 'primary' ? 'primary' : 'danger',
      };
      return new Promise((resolve) => {
        confirmResolver = resolve;
      });
    },
    acceptConfirm() {
      this.confirmDialog.open = false;
      if (confirmResolver) {
        const resolve = confirmResolver;
        confirmResolver = null;
        resolve(true);
      }
    },
    cancelConfirm() {
      this.confirmDialog.open = false;
      if (confirmResolver) {
        const resolve = confirmResolver;
        confirmResolver = null;
        resolve(false);
      }
    },
  },
});
