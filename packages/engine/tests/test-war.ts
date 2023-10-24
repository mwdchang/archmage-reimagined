import { Mage } from 'shared/types/mage';
import { battle, resolveBattleAftermath, Combatant } from '../src/war';

import { loadUnitsAndSpells } from './loader';
import { createMage } from '../src/base/mage';

loadUnitsAndSpells();


const attackerMage = createMage('attacker', 'ascendant');
const defenderMage = createMage('defender', 'verdant');

attackerMage.currentSpellLevel = 200;
defenderMage.currentSpellLevel = 200;

defenderMage.enchantments.push({
  casterId: defenderMage.id,
  casterMagic: defenderMage.magic,
  targetId: defenderMage.id,

  spellId: 'plantGrowth',
  spellMagic: 'verdant',
  spellLevel: 200,

  isPermanent: true,
  life: 0
});

const attacker: Combatant = {
  mage:  attackerMage,
  army: [
    { id: 'archangel', size: 5000 }
  ],
  spellId: '',
  itemId: ''
};
attacker.mage.army = attacker.army;

const defender: Combatant = {
  mage: defenderMage,
  army: [
    { id: 'mandrake', size: 2000 }
  ],
  spellId: '',
  itemId: 'carpetOfFlying'
};
defender.mage.army = defender.army;

const report = battle('siege', attacker, defender);
resolveBattleAftermath('siege', attacker.mage, defender.mage, report);

console.log('');
