import React from 'react';

const COLOR_BY_USER = {
  thong: '#294E74',
  jinny: '#39824C',
  nadia: '#FFC95E',
};
const PRIORITY = ['thong', 'jinny', 'nadia'];

function validColor(color) {
  return typeof color === 'string' && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color) ? color : null;
}

function getMemberColors(members) {
  const ordered = [...members].slice(0, 4).sort((a, b) => {
    const aPriority = PRIORITY.indexOf(a.id);
    const bPriority = PRIORITY.indexOf(b.id);
    return (aPriority < 0 ? PRIORITY.length : aPriority) - (bPriority < 0 ? PRIORITY.length : bPriority);
  });
  return ordered.map(member => validColor(member.color || member.avatarColor) || COLOR_BY_USER[member.id] || '#C0C0C0');
}

function getBackground(colors) {
  if (colors.length === 0) return '#D9D9D9';
  if (colors.length === 1) return colors[0];
  if (colors.length === 2) return `conic-gradient(${colors[1]} 0deg 180deg, ${colors[0]} 180deg 360deg)`;
  if (colors.length === 3) return `conic-gradient(${colors[1]} 0deg 90deg, ${colors[2]} 90deg 180deg, ${colors[0]} 180deg 360deg)`;

  const step = 360 / colors.length;
  const stops = colors.map((color, index) => `${color} ${index * step}deg ${(index + 1) * step}deg`);
  return `conic-gradient(${stops.join(', ')})`;
}

export default function GroupAvatar({ members = [], size = 64, className = '' }) {
  const colors = getMemberColors(members);
  return <span
    aria-hidden="true"
    className={`block shrink-0 rounded-full ${className}`}
    style={{ width: size, height: size, background: getBackground(colors) }}
  />;
}
