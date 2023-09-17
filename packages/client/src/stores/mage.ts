import { defineStore } from 'pinia';
import type { Mage } from 'shared/types/mage';

export const useMageStore = defineStore('mage', {
  state: () => ({
    loginstatus: 0,
    _mage: null as Mage | null
  }),
  getters: {
    loginStatus(state) {
      return state.loginstatus;
    },
    mage(state) {
      return state._mage;
    }
  },
  actions: {
    setLoginStatus(v: number) {
      this.$state.loginstatus = v;
    },
    setMage(v: Mage) {
      this.$state._mage = v;
    }
  }
});
