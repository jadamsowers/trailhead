// List of outing-themed icons using emojis organized by likelihood for scout outings
export const OUTING_ICONS = [
  // Most common scout activities
  { name: 'Camping', icon: '⛺' },
  { name: 'Hiking', icon: '🥾' },
  { name: 'Campfire', icon: '🔥' },
  { name: 'Backpacking', icon: '🎒' },
  { name: 'Service Project', icon: '🔨' },

  // Outdoor adventures
  { name: 'Mountain Climbing', icon: '🏔️' },
  { name: 'Fishing', icon: '🎣' },
  { name: 'Canoeing', icon: '🛶' },
  { name: 'Swimming', icon: '🏊' },
  { name: 'Sailing', icon: '⛵' },
  { name: 'Biking', icon: '🚴' },
  { name: 'Rock Climbing', icon: '🧗' },

  // Skills and education
  { name: 'Navigation', icon: '🧭' },
  { name: 'Science', icon: '🔬' },
  { name: 'Award Ceremony', icon: '🏆' },
  { name: 'Nature Study', icon: '🌲' },
  { name: 'Wildlife Watching', icon: '🔭' },
  { name: 'Cooking', icon: '🍳' },

  // Sports and recreation
  { name: 'Sports', icon: '⚽' },
  { name: 'Bowling', icon: '🎳' },
  { name: 'Skating', icon: '⛸️' },
  { name: 'Golf', icon: '⛳' },
  { name: 'Archery', icon: '🏹' },

  // Indoor activities
  { name: 'Movie Night', icon: '🎬' },
  { name: 'Museum', icon: '🏛️' },
  { name: 'Meeting', icon: '📅' },
  { name: 'Arts & Crafts', icon: '🎨' },
  { name: 'Reading', icon: '📚' },
  { name: 'Games', icon: '🎲' },

  // Special events
  { name: 'Birthday', icon: '🎂' },
  { name: 'Holiday Event', icon: '🎉' },
  { name: 'Field Trip', icon: '🚌' },
  { name: 'Community Service', icon: '🤝' },
  { name: 'General', icon: '⭐' },
];

// Keyword mapping for smart icon suggestions
const ICON_KEYWORDS: { [key: string]: string[] } = {
  'Camping': ['camp', 'camping', 'campout', 'overnight', 'sleepover', 'tent'],
  'Hiking': ['hike', 'hiking', 'trail', 'trek', 'trekking', 'walk', 'nature walk'],
  'Campfire': ['campfire', 'fire', 'bonfire', 'flames'],
  'Backpacking': ['backpack', 'backpacking', 'pack'],
  'Service Project': ['service', 'volunteer', 'cleanup', 'clean-up', 'project', 'work day', 'workday'],
  'Mountain Climbing': ['summit', 'peak', 'alpine', 'mountaineering'],
  'Fishing': ['fish', 'fishing', 'angling', 'catch'],
  'Canoeing': ['canoe', 'canoeing', 'paddle', 'paddling', 'kayak', 'kayaking'],
  'Swimming': ['swim', 'swimming', 'pool', 'beach', 'water park', 'waterpark'],
  'Sailing': ['sail', 'sailing', 'boat', 'boating', 'yacht'],
  'Biking': ['bike', 'biking', 'cycling', 'bicycle', 'mountain bike', 'mtb'],
  'Rock Climbing': ['climb', 'climbing', 'boulder', 'bouldering', 'rock', 'rappel', 'rappelling'],
  'Navigation': ['navigation', 'orienteering', 'compass', 'map', 'gps'],
  'Science': ['science', 'stem', 'experiment', 'lab', 'laboratory'],
  'Award Ceremony': ['award', 'ceremony', 'recognition', 'eagle', 'court of honor', 'coh'],
  'Nature Study': ['nature', 'ecology', 'environment', 'conservation', 'wildlife'],
  'Wildlife Watching': ['wildlife', 'bird', 'birding', 'birdwatching', 'animal', 'safari'],
  'Cooking': ['cook', 'cooking', 'chef', 'bake', 'baking', 'food', 'meal'],
  'Sports': ['sport', 'sports', 'game', 'tournament', 'competition', 'soccer', 'football', 'basketball'],
  'Bowling': ['bowl', 'bowling'],
  'Skating': ['skate', 'skating', 'ice', 'roller'],
  'Golf': ['golf', 'mini golf', 'minigolf', 'putt'],
  'Archery': ['archery', 'bow', 'arrow', 'target'],
  'Movie Night': ['movie', 'film', 'cinema', 'theater'],
  'Museum': ['museum', 'exhibit', 'gallery', 'history'],
  'Meeting': ['meeting', 'troop meeting', 'patrol meeting', 'planning'],
  'Arts & Crafts': ['art', 'arts', 'craft', 'crafts', 'painting', 'drawing'],
  'Reading': ['read', 'reading', 'book', 'library'],
  'Games': ['game night', 'board game', 'card game', 'gaming'],
  'Birthday': ['birthday', 'bday', 'b-day'],
  'Holiday Event': ['holiday', 'christmas', 'halloween', 'thanksgiving', 'party', 'celebration'],
  'Field Trip': ['field trip', 'trip', 'tour', 'visit', 'excursion'],
  'Community Service': ['community', 'outreach', 'charity', 'donation', 'fundraiser'],
  'General': ['general', 'event', 'activity', 'outing'],
};

/**
 * Suggests an icon based on keywords found in the outing name
 * @param outingName - The name of the outing to analyze
 * @returns The suggested icon name, or empty string if no match found
 */
export function suggestIconFromName(outingName: string): string {
  if (!outingName || outingName.trim().length === 0) {
    return '';
  }

  const lowerName = outingName.toLowerCase();

  // Find the first matching icon based on keywords
  for (const [iconName, keywords] of Object.entries(ICON_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return iconName;
      }
    }
  }

  return '';
}


export function OutingIconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const selectedIcon = OUTING_ICONS.find(icon => icon.name === value);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      borderRadius: '4px',
      overflow: 'hidden',
      border: '1px solid var(--card-border)',
      backgroundColor: 'var(--input-bg)',
      maxWidth: '300px'
    }}>
      {/* Icon preview - Bootstrap input group prepend style */}
      <div style={{
        width: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-tertiary)',
        borderRight: '1px solid var(--card-border)',
        fontSize: '20px',
        color: 'var(--text-primary)',
        flexShrink: 0
      }}>
        {selectedIcon ? selectedIcon.icon : '❓'}
      </div>

      {/* Dropdown selector - Bootstrap input group main input style */}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: '1',
          padding: '8px 12px',
          fontSize: '14px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="" style={{ color: 'var(--text-secondary)' }}>Select an icon...</option>
        {OUTING_ICONS.map((item) => (
          <option key={item.name} value={item.name} style={{ color: 'var(--text-primary)' }}>
            {item.icon} {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
