import ascendantSpells from 'data/src/spells/ascendant-spells.json';
import verdantSpells from 'data/src/spells/verdant-spells.json';
import eradicationSpells from 'data/src/spells/eradication-spells.json';
import netherSpells from 'data/src/spells/nether-spells.json';
import phantasmSpells from 'data/src/spells/phantasm-spells.json';

import plainUnits from 'data/src/units/plain-units.json';
import ascendantUnits from 'data/src/units/ascendant-units.json';
import verdantUnits from 'data/src/units/verdant-units.json';
import eradicationUnits from 'data/src/units/eradication-units.json';
import netherUnits from 'data/src/units/nether-units.json';
import phantasmUnits from 'data/src/units/phantasm-units.json';

import lesserItems from 'data/src/items/lesser.json';
import uniqueItems from 'data/src/items/unique.json';

import { 
  loadSpellData,
  loadItemData,
  loadUnitData,
  initializeResearchTree
} from '../src/base/references';

export const loadUnitsAndSpells = () => {
  loadUnitData(plainUnits);
  loadUnitData(ascendantUnits);
  loadUnitData(verdantUnits);
  loadUnitData(eradicationUnits);
  loadUnitData(netherUnits);
  loadUnitData(phantasmUnits);

  loadSpellData(ascendantSpells);
  loadSpellData(verdantSpells);
  loadSpellData(eradicationSpells);
  loadSpellData(netherSpells);
  loadSpellData(phantasmSpells);
  initializeResearchTree();

  loadItemData(lesserItems);
  loadItemData(uniqueItems);
}
