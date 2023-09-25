import { Mage } from 'shared/types/mage';
import { battle, Combatant } from '../src/war';

import { loadUnitsAndSpells } from './loader';

loadUnitsAndSpells();

const attacker: Combatant = {
  mage: { 
    name: 'attacker', 
    magic: 'ascendant',
    currentSpellLevel: 800
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
    currentSpellLevel: 400
  } as Mage,
  army: [
    { id: 'archer', size: 200000 },
    { id: 'militia', size: 7000 }
  ],
  spellId: 'blaze',
  itemId: 'carpetOfFlying'
};

battle('siege', attacker, defender);
