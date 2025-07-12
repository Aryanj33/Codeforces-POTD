import React from 'react';

const navBarStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 18,
};
const tabStyle = isActive => ({
  background: isActive
    ? 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)'
    : '#23243a',
  color: isActive ? '#fff' : '#e5e7eb',
  border: 'none',
  borderRadius: '18px 18px 0 0',
  padding: '8px 24px',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s, transform 0.2s',
  outline: 'none',
  position: 'relative',
  boxShadow: isActive ? '0 4px 16px rgba(99,102,241,0.18)' : undefined,
  transform: isActive ? 'scale(1.05)' : undefined,
});
const dotStyle = {
  position: 'absolute',
  left: '50%',
  bottom: -10,
  transform: 'translateX(-50%)',
  width: 8,
  height: 8,
  background: '#6366f1',
  borderRadius: '50%',
  animation: 'bounce 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
};

export default function Nav({ tab, setTab }) {
  const tabs = [
    { key: 'home', label: 'Home' },
    { key: 'friends', label: 'Friends' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];
  return (
    <nav style={navBarStyle}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          style={tabStyle(tab === key)}
          onClick={() => setTab(key)}
        >
          {label}
          {tab === key && <span style={dotStyle} />}
        </button>
      ))}
    </nav>
  );
} 