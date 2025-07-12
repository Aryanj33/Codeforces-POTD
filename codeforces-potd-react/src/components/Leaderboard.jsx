import React from 'react';

const sectionStyle = {
  width: '100%',
  minHeight: 'calc(100vh - 60px)',
  background: '#23243a',
  borderRadius: '0 0 18px 18px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 0 18px 0',
};
const cardStyle = {
  background: 'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(249,115,22,0.2) 100%)',
  borderRadius: 18,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  border: '1px solid rgba(254,240,138,0.3)',
  marginTop: 0,
};
const trophyStyle = {
  fontSize: 40,
  animation: 'bounce 1s infinite alternate',
};
const titleStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: '#fde68a',
  textShadow: '0 2px 8px #0002',
};
const descStyle = {
  color: '#e4e4e7',
  marginTop: 8,
};

export default function Leaderboard() {
  return (
    <div style={sectionStyle}>
      <div style={cardStyle}>
        <span style={trophyStyle}>🏆</span>
        <h3 style={titleStyle}>Leaderboard</h3>
        <p style={descStyle}>Leaderboard coming soon!</p>
      </div>
    </div>
  );
} 