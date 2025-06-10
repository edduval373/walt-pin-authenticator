// Automatic version management for W.A.L.T. Mobile App
// Semantic versioning: MAJOR.MINOR.PATCH

const VERSION_CONFIG = {
  current: {
    major: 1,
    minor: 2,
    patch: 0
  },
  
  // Change types and their version impact
  changeTypes: {
    // PATCH (1.2.0 → 1.2.1): Bug fixes, small improvements
    patch: [
      'bug fix',
      'modal fix',
      'display fix',
      'spacing adjustment',
      'minor ui improvement',
      'text correction',
      'styling fix'
    ],
    
    // MINOR (1.2.0 → 1.3.0): New features, enhancements
    minor: [
      'new feature',
      'feedback system',
      'modal enhancement',
      'rating system',
      'insights feature',
      'user interface improvement',
      'workflow enhancement'
    ],
    
    // MAJOR (1.2.0 → 2.0.0): Breaking changes, major overhauls
    major: [
      'breaking change',
      'major redesign',
      'api change',
      'architecture change',
      'complete rewrite'
    ]
  },
  
  // Recent changes log for version tracking
  recentChanges: [
    {
      date: '2025-06-04',
      type: 'patch',
      description: 'Fixed demo mode interference with back image confirmation'
    },
    {
      date: '2025-06-04',
      type: 'patch',
      description: 'Added memory cleanup on camera page to prevent performance degradation'
    },
    {
      date: '2025-06-04',
      type: 'patch',
      description: 'Connected progress bars to show actual image transmission status'
    },
    {
      date: '2025-06-04',
      type: 'patch',
      description: 'Removed characters tab from results screen'
    }
  ]
};

// Function to increment version based on change type
function incrementVersion(changeType) {
  const current = VERSION_CONFIG.current;
  
  switch(changeType) {
    case 'major':
      return {
        major: current.major + 1,
        minor: 0,
        patch: 0
      };
    case 'minor':
      return {
        major: current.major,
        minor: current.minor + 1,
        patch: 0
      };
    case 'patch':
    default:
      return {
        major: current.major,
        minor: current.minor,
        patch: current.patch + 1
      };
  }
}

// Function to determine change type from description
function determineChangeType(description) {
  const desc = description.toLowerCase();
  
  // Check for major changes first
  for (const majorKeyword of VERSION_CONFIG.changeTypes.major) {
    if (desc.includes(majorKeyword)) return 'major';
  }
  
  // Check for minor changes
  for (const minorKeyword of VERSION_CONFIG.changeTypes.minor) {
    if (desc.includes(minorKeyword)) return 'minor';
  }
  
  // Default to patch
  return 'patch';
}

// Suggested next version based on recent changes
function getNextVersion() {
  // Analyze recent changes to determine highest impact
  let highestImpact = 'patch';
  
  for (const change of VERSION_CONFIG.recentChanges) {
    if (change.type === 'major') {
      highestImpact = 'major';
      break;
    } else if (change.type === 'minor' && highestImpact !== 'major') {
      highestImpact = 'minor';
    }
  }
  
  return incrementVersion(highestImpact);
}

// Export for use in components
const NEXT_VERSION = getNextVersion();
const VERSION_STRING = `${NEXT_VERSION.major}.${NEXT_VERSION.minor}.${NEXT_VERSION.patch}`;

module.exports = {
  VERSION_CONFIG,
  incrementVersion,
  determineChangeType,
  getNextVersion,
  NEXT_VERSION,
  VERSION_STRING,
  CURRENT_VERSION: `${VERSION_CONFIG.current.major}.${VERSION_CONFIG.current.minor}.${VERSION_CONFIG.current.patch}`
};