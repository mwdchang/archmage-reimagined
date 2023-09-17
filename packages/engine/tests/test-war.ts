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
    { id: 'nagaQueen', size: 1000 }
  ],
  spellId: 'forceBolt',
  itemId: ''
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
  itemId: ''
};

battle('siege', attacker, defender);
