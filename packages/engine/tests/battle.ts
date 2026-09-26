import { Engine } from 'engine/src/engine';
import { SimpleDataAdapter } from 'data-adapter/src/simple-data-adapter';
import { getMaxSpellLevels } from '../src/base/references';
import { armyUpkeep, geldIncome, populationIncome, maxFood, explorationRate } from '../src/interior';
import { prettyPrintBR } from '../src/battle/pretty-print';
import { calcPillageProbability } from '../src/battle/calc-pillage-probability';


const dataAdapter = new SimpleDataAdapter();
const engine = new Engine(dataAdapter, true);

async function run() {
  await dataAdapter.initialize(null);
  await engine.initialize(true);

  const attackerArmy = [
    { id: 'militia', size: 5000 }
  ];
  const attacker = (await engine.register('attacker', 'attacker', 'eradication', {
    currentMana: 800000,
    currentGeld: 100000000,
    nodes: 3000,
    army: attackerArmy,
    testingSpellLevel: 999,
    spellbook:{
      ascendant: ['heavenlyProtection', 'pacifism'],
      verdant: [],
      eradication: ['battleChant'],
      nether: [],
      phantasm: ['hallucination', 'confuse', 'laziness', 'paralyze']
    },

    items: {
      'strangeMetalicCan': 99,
      'excalibur': 1
    }
  })).mage;

  const defender = (await engine.register('defender', 'defender', 'phantasm', {
    currentMana: 800000,
    currentGeld: 100000000,
    nodes: 3000,
    testingSpellLevel: 999,
    spellbook:{
      ascendant: ['heavenlyProtection', 'pacifism'],
      verdant: [],
      eradication: [],
      nether: [],
      phantasm: ['fogCloud', 'hallucination', 'confuse', 'laziness', 'paralyze']
    },
    army: [
      { id: 'spiritWarrior', size: 30 }
    ],
    items: {
      satchelOfMist: 99
    },
    assignment: {
      spellId: 'fogCloud',
      spellCondition: 0,
      itemId: 'satchelOfMist',
      itemCondition: 0,
    }
  })).mage;

  // await engine.castSpell(defender, 'confuse', 1, attacker.id);
  // await engine.castSpell(defender, 'laziness', 1, attacker.id);
  // await engine.castSpell(defender, 'pacifism', 1, attacker.id);
  // await engine.castSpell(defender, 'hallucination', 1, null);
  // await engine.castSpell(defender, 'heavenlyProtection', 1, null);
  // await engine.castSpell(attacker, 'battleChant', 1, null);

  const result = await engine.doBattle(
    attacker, 
    defender.id, 
    'regular', 
    attackerArmy.map(d => d.id),
    '', 
    '');

  if (result.errors.length) {
    console.log(result.errors);
  } else {
    console.log(prettyPrintBR(result.battleReport));
  }

  const postbattleAttacker = await engine.getMage(attacker.id);
  const postbattleDefender = await engine.getMage(defender.id);

  console.log('attacker', postbattleAttacker.currentGeld);
  console.log('defender', postbattleDefender.currentGeld);

  // console.log('>>>>>>>>>>>', attacker.enchantments.map(d => [d.spellId, d.isActive]));
  // await engine.doBattle(
  //   attacker, 
  //   defender.id, 
  //   'regular', 
  //   attackerArmy.map(d => d.id),
  //   'bless', 
  //   'strangeMetalicCan');
  // console.log('>>>>>>>>>>>', attacker.enchantments.map(d => [d.spellId, d.isActive]));

}


run();
