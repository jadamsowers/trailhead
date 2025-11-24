import React from 'react';

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
