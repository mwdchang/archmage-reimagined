import { getSpellById, initializeResearchTree, getReserchTree, summonUnit } from '../src/magic';
import { loadUnitsAndSpells } from './loader';

loadUnitsAndSpells();

const spell = getSpellById('bless');
console.log(spell.id);

initializeResearchTree()

const tree = getReserchTree();

console.log(tree);

console.log(summonUnit({ magic: 'ascendant' } as any, 'summonPegasus'));
