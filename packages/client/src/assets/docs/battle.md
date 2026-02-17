## Battle
Battle is the keypart of Archmage Reimagined. There are over 100 different units, each with their own unique attributes and abilities. In summary:
- Ascendants have balanced units and defend well
- Verdants have strong units at the cost of fewer options
- Eradication units are strong attackers but mediocre defenders
- Nether units are strong but more difficult to manage
- Phantasm has a wide range of units from other schools, their own units are glass canons


### Battle phases
- Apply dfender bonus
- Apply prebattle effects, such as temporary units and fixed attribute buffs
- Apply battle effects, unit buffs/debuffs, direct damages
- Calculate unit pairings in battle
- Calculate battle attack orderings
- Engagement
- Compute battle losses
- Calculate battle winner and loser
- Calculate enchantments post-battle effects
- Resolve land gain/loss
- Calculate damage dealt for counters


### Battle mechanics
There are 5 main areas that impacts effectiveness of an attack:

1. The unit's raw `attack power`. The higher the number the more potential damage the units deals.
2. The `attack types` of the unit. Exploits units' strengths and weaknesses (eg: ice is strong against fire-based units)
3. The unit's `attack initiative` determines if a unit can strike first
4. The unit's `accuracy`. By default this is a fixed value across all units, but it can be modified by abilities and spells.
5. The unit's `efficiency`. Units are assigned a fixed number (100) at the start of the battle, as a unit engages other units it will get fatigued and its efficiency will lower over the course of the battle


For more information, see the  [unit encyclopedia](/encyclopedia/unit)
