import { Mage } from 'shared/types/mage';
import { battle, Combatant } from '../src/war';

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
    name: 'attacker', 
    magic: 'ascendant',
    currentSpellLevel: 800,
    ...dummyLand,
    forts: 10,
  } as Mage,
  army: [
    { id: 'archangel', size: 2000 },
    { id: 'dominion', size: 5}
  ],
  spellId: 'healing',
  itemId: 'potionOfValor'
};

const defender: Combatant = {
  mage: { 
    name: 'defender', 
    magic: 'phantasm',
    currentSpellLevel: 400,
    ...dummyLand,
    forts: 100,
  } as Mage,
  army: [
    { id: 'archer', size: 200000 },
    { id: 'militia', size: 7000 }
  ],
  spellId: 'blaze',
  itemId: 'carpetOfFlying'
};

battle('siege', attacker, defender);
