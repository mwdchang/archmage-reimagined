import { battle, resolveBattleAftermath, Combatant } from '../src/war';
import { loadUnitsAndSpells } from './loader';
import { createMage } from '../src/base/mage';
import { prettyPrintBR } from '../src/battle/pretty-print';

loadUnitsAndSpells();

const attackerMage = createMage('attacker', 'ascendant');
const defenderMage = createMage('defender', 'verdant');

const attacker: Combatant = {
  mage:  attackerMage,
  army: [
    { id: 'archangel', size: 5000 }
  ],
  spellId: '',
  itemId: ''
};
attacker.mage.army = attacker.army;
attackerMage.currentSpellLevel = 200;

const defender: Combatant = {
  mage: defenderMage,
  army: [
    { id: 'mandrake', size: 8000 }
  ],
  spellId: '',
  itemId: 'carpetOfFlying'
};
defender.mage.army = defender.army;
defenderMage.currentSpellLevel = 200;

const report = battle('siege', attacker, defender);
resolveBattleAftermath('siege', attacker.mage, defender.mage, report);

console.log('');
console.log('');
prettyPrintBR(report);
