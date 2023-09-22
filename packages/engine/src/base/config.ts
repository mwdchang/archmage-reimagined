/* Various configuration and rules */

export const explorationLimit = 6000;


////////////////////////////////////////////////////////////////////////////////
// Kingdom
////////////////////////////////////////////////////////////////////////////////
export const mageStartTable = {
  army: [
    { id: 'militia', size: 1000 },
    { id: 'phalanx', size: 300 },
    { id: 'pikeman', size: 300 }, 
    { id: 'archer', size: 300 }, 
    { id: 'calvary', size: 100 } 
  ]
}

////////////////////////////////////////////////////////////////////////////////
// Interiors
////////////////////////////////////////////////////////////////////////////////
export const productionTable = {
  food: {
    farms: 500
  },
  space: {
    farms: 100,
    towns: 1000,
    workshops: 30,
    barracks: 20,
    fortresses: 500,
    wilderness: 10
  },
  research: 10,
  manaStorage: 1000
}

////////////////////////////////////////////////////////////////////////////////
// Magic section
////////////////////////////////////////////////////////////////////////////////
export const magicAlignmentTable = {
  ascendant: {
    innate: ['ascendant'],
    adjacent: ['verdant', 'phantasm'],
    opposite: ['eradication', 'nether'],
    research: {
      ascendant: ['simple', 'average', 'complex', 'ultimate'],
      verdant: ['simple', 'average', 'complex'],
      eradication: ['simple', 'average'],
      nether: ['simple', 'average'],
      phantasm: ['simple', 'average', 'complex']
    },
    costModifier: {
      ascendant: 1.0,
      verdant: 2.0,
      eradication: 4.0,
      nether: 4.0,
      phantasm: 2.0
    }
  },
  verdant: {
    innate: ['verdant'],
    adjacent: ['ascendant', 'eradication'],
    opposite: ['nether', 'phantasm'],
    research: {
      ascendant: ['simple', 'average', 'complex'],
      verdant: ['simple', 'average', 'complex', 'ultimate'],
      eradication: ['simple', 'average', 'complex'],
      nether: ['simple', 'average'],
      phantasm: ['simple', 'average']
    },
    costModifier: {
      ascendant: 2.0,
      verdant: 1.0,
      eradication: 2.0,
      nether: 4.0,
      phantasm: 4.0
    }
  },
  eradication: {
    innate: ['eradication'],
    adjacent: ['nether', 'verdant'],
    opposite: ['ascendant', 'phantasm'],
    research: {
      ascendant: ['simple', 'average'],
      verdant: ['simple', 'average', 'complex'],
      eradication: ['simple', 'average', 'complex', 'ultimate'],
      nether: ['simple', 'average', 'complex'],
      phantasm: ['simple', 'average']
    },
    costModifier: {
      ascendant: 4.0,
      verdant: 2.0,
      eradication: 1.0,
      nether: 2.0,
      phantasm: 4.0
    }
  },
  nether: {
    innate: ['nether'],
    adjacent: ['eradication', 'phantasm'],
    opposite: ['ascendant', 'verdant'],
    research: {
      ascendant: ['simple', 'average'],
      verdant: ['simple', 'average'],
      eradication: ['simple', 'average', 'complex'],
      nether: ['simple', 'average', 'complex', 'ultimate'],
      phantasm: ['simple', 'average', 'complex']
    },
    costModifier: {
      ascendant: 4.0,
      verdant: 4.0,
      eradication: 2.0,
      nether: 1.0,
      phantasm: 2.0
    }
  },
  phantasm: {
    innate: ['phantasm'],
    adjacent: ['ascendant', 'nether'],
    opposite: ['verdant', 'eradication'],
    research: {
      ascendant: ['simple', 'average', 'complex'],
      verdant: ['simple', 'average', 'complex'],
      eradication: ['simple', 'average', 'complex'],
      nether: ['simple', 'average', 'complex'],
      phantasm: ['simple', 'average', 'complex', 'ultimate']
    },
    costModifier: {
      ascendant: 2.0,
      verdant: 4.0,
      eradication: 4.0,
      nether: 2.0,
      phantasm: 2.0
    }
  }
}

export const spellRankTable = {
  simple: 3,
  average: 5,
  complex: 7,
  ultimate: 20
}
