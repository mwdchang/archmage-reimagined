## Guide
Welcome to Terra, here are some tips and rules to help you get started. Your goal is to become one of the strongest mages in Terra, you do this by acquiring lands through exploration and conquest, build and manage a menacing army, and learn evermore powerful spells.

### Resources
There are three main resources you need to manage: geld, mana, and population. All your buildings and units require some combinations of geld/mana/population to function properly. Be careful not to let these resources fall below zero, or there will be catastrophic consequences.

To earn these resources you manage your kingdom’s buildings:

Your population pay taxes in geld, but they require food and living spaces:
- Farms: Provides food for your population
- Towns: Provides living spaces for your population and units

Other important buildings are:
- Workshops: More workshops allows you to build faster
- Barracks: Allows you to recruit units
- Nodes: Generates and stores mana
- Guilds: Allows you to conduct research and generate magical items
- Barriers: Magical constructs that protect you from enemy spells

Last and the most important:
- Forts: Forts provide defensive bonuses but they are expensive to maintain. They are also the lifeline of your kingdom. If you lose all your forts you are defeated - and must create another mage in order to reenter Terra.

### Magic
Spells are learned passively through your guilds, you can spend turns to do active research, effectively doubling the speed. Spells are ranked into tiers:
- Basic, Average: These are available to all mages in Terra
- Complex: These are only available to your specific school of magic, and that of its adjacent schools. An exception here is for Phantasm mages who can learn all complexes.
- Ultimate: These are the most powerful spells and are exclusive to your school

Each school of magic has two adjacent schools and two opposite schools. You can cast spells from adjacent schools, albeit at a higher cost and are typically less effective. Similarly opposite schools are even harder to cast and even less effective.

Spells broadly fall into three categories
- Summoning spells: casting these will summon powerful creatures into your army.
- Enchantment spells: these spells have passive effects that benefit your kingdom, or to the detriment of other mages.
- Instant spells: these are mostly spells you can cast in a battle to buff/debuff armies or to cause direct damage.

All spells cost mana to cast, your magic will become more powerful as you research and add more spells into your spellbook.


### Battle
Duking it out on the battlefield is the easiest way to get ahead. Battle has three types:
- Pillage: You send a small contingent of your army to pillage gelds off an enemy mage. Be careful, if you get detected it will be a rout.
- Regular: You select up to ten unit stacks to take over your opponents’ land
- Siege: Same as regular but you get twice the amount of land, however the defending mage receives higher defensive bonuses.


You can engage enemy mages within 80 to 125 percent of your net power. If a mage has received too much damage within a 24 hour window they fall into a damaged state and cannot be engaged in normal circumstances with the exception of counters.

All attacks incur “counter” tokens that the defender can exercise within a 24 hour window since the battle. If you have a counter against a mage, you can engage regardless of the mage’s status. It should be noted, “all attacks” incur counter tokens, including the counter attack itself.


#### Combat
In combat, unit stacks on opposing sides are paired up by by several rules:
- Stacks will tend to match up against opposing stacks of similar power
- Stack will pair up based on whether they are flying, or have ranged attack
- Based on availability, a stack may be targetd multiple times

The general form of damage calculation is as follows:

```
damage = 
    attackPower * 
    unitModifiers * 
    accuracy * 
    efficiency * 
    (100 - attackResistances)
```

Explaining the components:
- attackPower: The unit's attack power, attack power is sampled on a bell-curve. The exceptions are attack types wth `magic` or `psychic` components, which will be sampled at a fixed point.
- unitModifiers: Affected by units' abilities, the spells/items used within the battle, as well as enchantments on each mage's kingdom
- accuracy: All units starts with the same accuracy, but can be altered similar to unitModifiers
- efficiency: Every unit starts with the same efficiency, efficiency decreaases when a unit stack attacks, or gets attacked.
- attackResistances: How strong the defending unit is against the attacking units' attack type.


### Units
There are over 100 different units in Terra that you can encounter, each with their own strengths and weaknesses. Some units are defensive tanks, and some are glass canons. Matching appropriate units against each other is both an art and a science. Each unit has:
- One or more attack types, each type has an associated attack power and attack speed (initiative). High initiative units strikes first in combat, while low initiative units go last.
- Hitpoints
- Magic resistances, how likely a spell cast in battle by an opponent is to affect this unit.
- Attack resistances, how resistant this unit is to a specific attack type
- Upkeep cost
- Abilities, special attributes that buff or debuff a unit during battle

In addition to summoning, every faction shares a set of common units that they can recruit from their barracks. Every faction also has their own special barrack units that are exclusive to their school of magic.


### Onward!
That is for now, there are a lot of nuances in Terra that takes some time to learn, have a look at [The Encyclopedia](/encyclopedia) for more detailed information.
