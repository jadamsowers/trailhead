import React from 'react';
import { OUTING_ICONS } from './OutingIconPicker';

export function OutingIconDisplay({ icon }: { icon?: string }) {
  if (!icon) return null;
  const found = OUTING_ICONS.find(i => i.name === icon);
  return found ? (
    <span style={{ fontSize: 28, marginRight: 8, verticalAlign: 'middle' }}>{found.icon}</span>
  ) : null;
}
