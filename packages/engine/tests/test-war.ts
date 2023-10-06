import { Mage } from 'shared/types/mage';
import { battle, resolveBattleAftermath, Combatant } from '../src/war';

import { loadUnitsAndSpells } from './loader';

loadUnitsAndSpells();

const dummyLand = {
  farms: 0,
  towns: 0,
  workshops: 0,
  barracks: 0,
  nodes: 0,
  libraries: 0,
  barriers: 0,
  forts: 0,
  wilderness: 2000
}

const attacker: Combatant = {
  mage: { 
    id: 1,
    name: 'attacker', 
    magic: 'ascendant',
    currentSpellLevel: 800,
    ...dummyLand,
    forts: 10,
  } as Mage,
  army: [
    { id: 'archangel', size: 5000 },
    { id: 'archer', size: 500000 }
  ],
  spellId: 'healing',
  itemId: 'potionOfValor'
};

const defender: Combatant = {
  mage: { 
    id: 2,
    name: 'defender', 
    magic: 'phantasm',
    currentSpellLevel: 400,
    ...dummyLand,
    forts: 100,
  } as Mage,
  army: [
    { id: 'militia', size: 500000 }
  ],
  spellId: 'blaze',
  itemId: 'carpetOfFlying'
};

const report = battle('siege', attacker, defender);
resolveBattleAftermath('siege', attacker.mage, defender.mage, report);

console.log('');
console.log(defender);
