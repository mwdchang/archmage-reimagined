import { 
  getSpellById, 
  getResearchTree 
} from '../src/base/references';

import { 
  summonUnit
} from '../src/magic';

import { loadUnitsAndSpells } from './loader';

loadUnitsAndSpells();

const spell = getSpellById('bless');
console.log(spell.id);

const tree = getResearchTree();
console.log(tree);

console.log(summonUnit({ magic: 'ascendant' } as any, 'summonPegasus'));
