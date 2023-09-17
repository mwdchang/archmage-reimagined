import { Mage } from 'shared/types/mage';
import { loadUnitData } from "../src/army";
import { loadSpellData } from "../src/magic";
import { battle, Combatant } from '../src/war';

import plainUnits from 'data/src/units/plain-units.json';
import ascendantUnits from 'data/src/units/ascendant-units.json';
import ascendantSpells from 'data/src/spells/ascendant-spells.json';
import eradicationSpells from 'data/src/spells/eradication-spells.json';
import phantasmSpells from 'data/src/spells/phantasm-spells.json';

loadUnitData(plainUnits);
loadUnitData(ascendantUnits);
loadSpellData(ascendantSpells);
loadSpellData(eradicationSpells);
loadSpellData(phantasmSpells);

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
