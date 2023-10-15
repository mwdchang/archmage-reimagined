import { 
  successCastingRate
} from '../src/magic';

import { loadUnitsAndSpells } from './loader';
loadUnitsAndSpells();


import { createMage } from '../src/base/mage';

const mage = createMage('test', 'ascendant');
mage.currentSpellLevel = 400;

mage.enchantments.push({
  casterId: mage.id,
  casterMagic: mage.magic,
  targetId: mage.id,

  spellId: 'concentration',
  spellMagic: 'phantasm',
  spellLevel: 400,

  isPermanent: true,
  life: 0
});


const r = successCastingRate(mage, 'descentOfHolyBeing');
console.log('success rate', r);
