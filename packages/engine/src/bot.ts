import { AllowedMagic } from "shared/types/common";
import { createMage } from "./base/mage";
import { getMaxSpellLevels } from "./base/references";
import { v4 as uuidv4 } from 'uuid';
import { Mage } from "shared/types/mage";

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
        { id: 'archangel', size: 1800 },
        { id: 'nagaQueen', size: 900 },
        { id: 'unicorn', size: 2500 },
        { id: 'knightTemplar', size: 15000 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'loveAndPeace'),
        makeEnchantment(botMage, 'theHolyLight'),
        makeEnchantment(botMage, 'protectionFromEvil'),
      ]
      break;
    case 'verdant':
      botMage.army = [
        { id: 'treant', size: 4800 },
        { id: 'mandrake', size: 7500 },
        { id: 'earthElemental', size: 80 },
        { id: 'highElf', size: 480 }
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
        { id: 'fireElemental', size: 150 },
        { id: 'dwarvenShaman', size: 2000 },
        { id: 'bulwarkHorror', size: 600 }
      ];
      botMage.enchantments = [
        makeEnchantment(botMage, 'battleChant'),
        makeEnchantment(botMage, 'sunray'),
      ]
      break;
    case 'nether':
      botMage.army = [
        { id: 'bulwarkHorror', size: 800 },
        { id: 'demonKnight', size: 800 },
        { id: 'hornedDemon', size: 3600 },
        { id: 'unholyReaver', size: 60 },
        { id: 'vampire', size: 560 },
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
        { id: 'archangel', size: 1300 },
        { id: 'medusa', size: 600 },
        { id: 'empyreanInquisitor', size: 560 },
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
