import { defineStore } from 'pinia';
import { GameTable } from 'shared/types/common';
import type { Mage } from 'shared/types/mage';

export const useMageStore = defineStore('mage', {
  state: () => ({
    loginstatus: 0,
    _mage: null as Mage | null,
    _gameTable: null as GameTable | null
  }),
  getters: {
    loginStatus(state) {
      return state.loginstatus;
    },
    mage(state) {
      return state._mage;
    },
    gameTable(state) {
      return state._gameTable;
    }
  },
  actions: {
    setLoginStatus(v: number) {
      this.$state.loginstatus = v;
    },
    setMage(v: Mage) {
      this.$state._mage = v;
    },
    setGameTable(t: GameTable) {
      this.$state._gameTable = t;
    }
  }
});
