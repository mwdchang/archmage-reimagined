import _ from "lodash";
import { AllowedMagic } from "shared/types/common";
import { createMage } from "./base/mage";
import { getMaxSpellLevels, getUnitById } from "./base/references";
import { v4 as uuidv4 } from 'uuid';
import { ArmyUnit, Mage } from "shared/types/mage";
import { betweenInt, randomBM } from "./random";

export const createBot = (id: number, name: string, magic: AllowedMagic) => {
  const botMage = createMage(id, name, magic, {
    type: 'bot',
    testingSpellLevel: getMaxSpellLevels()[magic],
    farms: 1500,
    towns: 800,
    nodes: 800,
    barracks: 100,
    guilds: 100,
    forts: 40,
    barriers: 200
  });

  const makeEnchantment = (botMage: Mage, spellId: string) => {
    return {
      id: uuidv4(),
      casterId: botMage.id,
      casterMagic: magic,
      targetId: botMage.id,
      spellId: spellId,
      spellLevel: botMage.testingSpellLevel,
      isActive: true,
      isEpidemic: false,
      isPermanent: true,
      life: 0
    }
  };

  const minimumNP = 3000000;
  const variableNP = 14000000;
  botMage.army = getBotArmy(magic, minimumNP + variableNP * randomBM());

  switch(magic) {
    case 'ascendant':
      botMage.enchantments = [
        makeEnchantment(botMage, 'loveAndPeace'),
        makeEnchantment(botMage, 'theHolyLight'),
        makeEnchantment(botMage, 'protectionFromEvil'),
        makeEnchantment(botMage, 'mindBar'),
        makeEnchantment(botMage, 'sunray')
      ]
      break;
    case 'verdant':
      botMage.enchantments = [
        makeEnchantment(botMage, 'plantGrowth'),
        makeEnchantment(botMage, 'enlargeAnimal'),
        makeEnchantment(botMage, 'sunray'),
        makeEnchantment(botMage, 'naturesLore')
      ]
      break;
    case 'eradication':
      botMage.enchantments = [
        makeEnchantment(botMage, 'battleChant'),
        makeEnchantment(botMage, 'sunray'),
      ]
      break;
    case 'nether':
      botMage.enchantments = [
        makeEnchantment(botMage, 'shroudOfDarkness'),
        makeEnchantment(botMage, 'mindBar'),
        makeEnchantment(botMage, 'blackSabbath')
      ]
      break;
    case 'phantasm':
      botMage.enchantments = [
        makeEnchantment(botMage, 'shroudOfDarkness'),
        makeEnchantment(botMage, 'protectionFromEvil'),
        makeEnchantment(botMage, 'mindBar'),
        makeEnchantment(botMage, 'hallucination')
      ]
      break;
    default:
      break;
  }
  return botMage;
}

interface BotAssignment {
  spellId: string;
  itemId: string;
}

export const getBotAssignment = (magic: AllowedMagic): BotAssignment => {
  const botTable: Record<string, BotAssignment[]> = {
    ascendant: [
      { spellId: 'swordOfLight', itemId: 'candleOfSleeping' },
      { spellId: 'miracle', itemId: 'bubbleWine' },
      { spellId: 'swordOfLight', itemId: 'ashOfInvisibility' },
      { spellId: 'blindingFlash', itemId: 'satchelOfMist' },
    ],
    verdant: [
      { spellId: 'rustArmor', itemId: 'candleOfSleeping' },
      { spellId: 'flameBlade', itemId: 'candleOfSleeping' },
      { spellId: 'rustArmor', itemId: 'carpetOfFlying' },
      { spellId: 'flameBlade', itemId: 'ashOfInvisibility' }
    ],
    eradication: [
      { spellId: 'stun', itemId: 'candleOfSleeping' },
      { spellId: 'flameBlade', itemId: 'oilFlasks' },
      { spellId: 'flameShield', itemId: 'oilFlasks' }
    ],
    nether: [
      { spellId: 'stun', itemId: 'candleOfSleeping' },
      { spellId: 'foulWater', itemId: 'candleOfSleeping' },
      { spellId: 'foulWater', itemId: 'monkeyBrains' }
    ],
    phantasm: [
      { spellId: 'paralyze', itemId: 'candleOfSleeping' },
      { spellId: 'slow', itemId: 'theSpidersWeb' }
    ]
  };

  const target = botTable[magic];
  const idx = betweenInt(0, target.length - 1);

  return target[idx];
}


export const getBotArmy = (magic: AllowedMagic, armyNetPower: number): ArmyUnit[] => {
  const botTable: Record<string, ArmyUnit[][]>  = {
    ascendant: [
      [
        { id: 'archangel', size: 11 },
        { id: 'empyreanInquisitor', size: 15.5 },
        { id: 'nagaQueen', size: 15 },
        { id: 'unicorn', size: 14 },
        { id: 'knightTemplar', size: 13 },
        { id: 'titan', size: 10 },
        { id: 'highElf', size: 10 },
        { id: 'highPriest', size: 9 },
      ]
    ],
    verdant: [
      [
        { id: 'treant', size: 35 },
        { id: 'mandrake', size: 25 },
        { id: 'earthElemental', size: 20 },
        { id: 'highElf', size: 20 },
        { id: 'elvenMagician', size: 10 }
      ]
    ],
    eradication: [
      [
        { id: 'fireElemental', size: 50 },
        { id: 'dwarvenShaman', size: 30 },
        { id: 'efreeti', size: 25 },
        { id: 'bulwarkHorror', size: 15 }
      ]
    ],
    nether: [
      [
        { id: 'wolfRaider', size: 30 },
        { id: 'bulwarkHorror', size: 28 },
        { id: 'demonKnight', size: 25 },
        { id: 'lich', size: 25 },
        { id: 'hornedDemon', size: 15 },
        { id: 'unholyReaver', size: 13 },
        { id: 'vampire', size: 7 },
      ]
    ],
    phantasm: [
      [
        { id: 'archangel', size: 9 },
        { id: 'empyreanInquisitor', size: 12 },
        { id: 'bulwarkHorror', size: 11 },
        { id: 'waterElemental', size: 15 },
        { id: 'darkElfMagician', size: 14 },
        { id: 'efreeti', size: 13 },
        { id: 'iceElemental', size: 11 },
        { id: 'highElf', size: 10 },
        { id: 'leviathan', size: 8.5 },
        { id: 'hornedDemon', size: 6 },
      ]
    ]
  };

  const baseStacks = _.shuffle(botTable[magic])[0];
  const total = baseStacks.reduce((acc, u) => acc + u.size, 0);

  const results: ArmyUnit[] = [];
  baseStacks.forEach(stack => {
    const np = (stack.size / total) * armyNetPower

    results.push({
      id: stack.id,
      size: Math.ceil(np / getUnitById(stack.id).powerRank)
    });
  });

  return results;
}
