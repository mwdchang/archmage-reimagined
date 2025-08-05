import type { Combatant } from "shared/types/mage";
import { battle, resolveBattle } from '../src/war';
import { loadUnitsAndSpells } from './loader';
import { createMage } from '../src/base/mage';
import { prettyPrintBR } from '../src/battle/pretty-print';

loadUnitsAndSpells();

const attackerMage = createMage('attacker', 'ascendant');
const defenderMage = createMage('defender', 'eradication');

const attacker: Combatant = {
  mage:  attackerMage,
  army: [
    { id: 'militia', size: 500000 },
    { id: 'calvary', size: 200000 },
    { id: 'phalanx', size: 200000 },
  ],
  spellId: 'bless',
  itemId: ''
};
attacker.mage.army = attacker.army;
attackerMage.currentSpellLevel = 200;

// const defender: Combatant = {
//   mage: defenderMage,
//   army: [
//     { id: 'militia', size: 500000 }
//   ],
//   spellId: 'chainLightning',
//   itemId: 'carpetOfFlying'
// };
// defender.mage.army = defender.army;
// defenderMage.currentSpellLevel = 200;

// const report = battle('siege', attacker, defender);
// resolveBattle(attacker.mage, defender.mage, report);
// 
// console.log('');
// console.log('');
// prettyPrintBR(report);
