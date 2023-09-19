import { Mage } from 'shared/types/mage';
import { battle, Combatant } from '../src/war';

import { loadUnitsAndSpells } from './loader';

loadUnitsAndSpells();

const attacker: Combatant = {
  mage: { 
    name: 'attacker', 
    magic: 'ascendant',
    currentSpellLevel: 400
  } as Mage,
  army: [
    { id: 'nagaQueen', size: 2000 }
  ],
  spellId: 'forceBolt',
  itemId: 'potionOfValor'
};

const defender: Combatant = {
  mage: { 
    name: 'defender', 
    magic: 'phantasm',
    currentSpellLevel: 400
  } as Mage,
  army: [
    { id: 'archer', size: 2000000 }
  ],
  spellId: 'flameArrow',
  itemId: 'oilFlasks'
};

battle('siege', attacker, defender);
