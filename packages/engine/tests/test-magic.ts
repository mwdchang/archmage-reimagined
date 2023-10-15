import { 
  getSpellById, 
  getResearchTree 
} from '../src/base/references';

import { 
  summonUnit,
  successCastingRate
} from '../src/magic';

import { loadUnitsAndSpells } from './loader';

loadUnitsAndSpells();

// const spell = getSpellById('bless');
// console.log(spell.id);

// const tree = getResearchTree();
// console.log(tree);

// console.log(summonUnit({ magic: 'ascendant' } as any, 'summonPegasus'));
//

// summonUnit({ magic: 'ascendant', currentSpellLevel: 40 } as any, 'descentOfHolyBeing');
const r = successCastingRate({ magic: 'ascendant', currentSpellLevel: 40 } as any, 'descentOfHolyBeing');
console.log('success rate', r);
