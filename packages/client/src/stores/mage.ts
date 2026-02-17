import { defineStore } from 'pinia';
import { GameTable } from 'shared/types/common';
import type { Mage } from 'shared/types/mage';

export const useMageStore = defineStore('mage', {
  state: () => ({
    _loginUser: '',
    _mage: null as Mage | null,
    _gameTable: null as GameTable | null
  }),
  getters: {
    loginUser(state) {
      return state._loginUser;
    },
    mage(state) {
      return state._mage;
    },
    gameTable(state) {
      return state._gameTable;
    }
  },
  actions: {
    setLoginUser(v: string) {
      this.$state._loginUser= v;
    },
    setMage(v: Mage | null) {
      this.$state._mage = v;
    },
    setGameTable(t: GameTable) {
      this.$state._gameTable = t;
    }
  }
});
