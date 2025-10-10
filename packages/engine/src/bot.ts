import { AllowedMagic } from "shared/types/common";
import { createMage } from "./base/mage";
import { getMaxSpellLevels } from "./base/references";
import { v4 as uuidv4 } from 'uuid';
import { Mage } from "shared/types/mage";
import { betweenInt } from "./random";

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

  switch(magic) {
    case 'ascendant':
      botMage.army = [
        { id: 'archangel', size: 2300 },
        { id: 'nagaQueen', size: 1200 },
        { id: 'unicorn', size: 4500 },
        { id: 'knightTemplar', size: 19000 },
        { id: 'highPriest', size: 22000 },
        { id: 'titan', size: 50 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'loveAndPeace'),
        makeEnchantment(botMage, 'theHolyLight'),
        makeEnchantment(botMage, 'protectionFromEvil'),
        makeEnchantment(botMage, 'mindBar'),
        makeEnchantment(botMage, 'sunray')
      ]
      break;
    case 'verdant':
      botMage.army = [
        { id: 'treant', size: 7800 },
        { id: 'mandrake', size: 12500 },
        { id: 'earthElemental', size: 110 },
        { id: 'highElf', size: 1480 },
        { id: 'elvenMagician', size: 25000 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'plantGrowth'),
        makeEnchantment(botMage, 'enlargeAnimal'),
        makeEnchantment(botMage, 'sunray'),
        makeEnchantment(botMage, 'naturesLore')
      ]
      break;
    case 'eradication':
      botMage.army = [
        { id: 'fireElemental', size: 220 },
        { id: 'dwarvenShaman', size: 2000 },
        { id: 'efreeti', size: 2000 },
        { id: 'bulwarkHorror', size: 600 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'battleChant'),
        makeEnchantment(botMage, 'sunray'),
      ]
      break;
    case 'nether':
      botMage.army = [
        { id: 'bulwarkHorror', size: 1100 },
        { id: 'demonKnight', size: 1400 },
        { id: 'hornedDemon', size: 7600 },
        { id: 'unholyReaver', size: 120 },
        { id: 'vampire', size: 260 },
        { id: 'lich', size: 260 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'shroudOfDarkness'),
        makeEnchantment(botMage, 'mindBar'),
        makeEnchantment(botMage, 'blackSabbath')
      ]
      break;
    case 'phantasm':
      botMage.army = [
        { id: 'waterElemental', size: 80 },
        { id: 'iceElemental', size: 80 },
        { id: 'archangel', size: 2300 },
        { id: 'medusa', size: 2600 },
        { id: 'empyreanInquisitor', size: 960 },
        { id: 'bulwarkHorror', size: 960 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'shroudOfDarkness'),
        makeEnchantment(botMage, 'protectionFromEvil'),
        makeEnchantment(botMage, 'mindBar')
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
      { spellId: 'miracle', itemId: 'bubbleWine' }
    ],
    verdant: [
      { spellId: 'rustArmor', itemId: 'candleOfSleeping' },
      { spellId: 'flameBlade', itemId: 'candleOfSleeping' },
      { spellId: 'rustArmor', itemId: 'carpetOfFlyig' },
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
