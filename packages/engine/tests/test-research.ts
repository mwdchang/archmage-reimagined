import { loadUnitsAndSpells } from './loader';
import { createMage } from '../src/base/mage';
import { researchPoints } from '../src/magic';

loadUnitsAndSpells();


const mageA = createMage('mageA', 'phantasm');
const mageB = createMage('mageA', 'phantasm');

mageA.guilds = 200;
mageA.currentSpellLevel = 600;

mageB.guilds = 200;
mageB.currentSpellLevel = 600;

mageB.enchantments.push({
  casterId: mageA.id,
  casterMagic: mageA.magic,
  targetId: mageA.id,

  spellId: 'concentration',
  spellMagic: 'phantasm',
  spellLevel: 400,

  isPermanent: true,
  life: 0
});

console.log('mageA', researchPoints(mageA));
console.log('mageB', researchPoints(mageB));
