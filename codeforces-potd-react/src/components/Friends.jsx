import React, { useEffect, useState } from 'react';

const sectionStyle = {
  width: '100%',
  minHeight: 'calc(100vh - 60px)', // fill popup below nav
  background: '#23243a',
  borderRadius: '0 0 18px 18px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  alignItems: 'center',
  padding: '24px 0 18px 0',
};
const cardStyle = {
  width: '90%',
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
  padding: 20,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
  border: '1px solid rgba(255,255,255,0.10)',
  margin: '0 auto',
};
const inputStyle = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #36384a',
  fontSize: 16,
  background: '#23243a',
  color: '#e5e7eb',
};
const addBtnStyle = {
  background: 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: 16,
  marginLeft: 8,
};
const friendCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: 'rgba(39,39,42,0.60)',
  borderRadius: 16,
  padding: '12px 18px',
  boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
  border: '1px solid rgba(129,140,248,0.20)',
  marginBottom: 8,
};
const avatarStyle = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: '2px solid #818cf8',
  objectFit: 'cover',
  background: '#23243a',
};
const nameStyle = {
  fontWeight: 700,
  color: '#a5b4fc',
};
const ratingStyle = {
  fontSize: 14,
  color: '#e4e4e7',
};
const rankStyle = {
  fontSize: 12,
  color: '#a1a1aa',
};

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [input, setInput] = useState('');
  const [friendDetails, setFriendDetails] = useState({});

  useEffect(() => {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get('friends', (result) => {
        setFriends(result.friends || []);
      });
    }
  }, []);

  useEffect(() => {
    friends.forEach(handle => {
      if (!friendDetails[handle]) {
        fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'OK') {
              setFriendDetails(prev => ({
                ...prev,
                [handle]: data.result[0]
              }));
            }
          });
      }
    });
  }, [friends]);

  const addFriend = () => {
    if (!input.trim() || friends.includes(input.trim())) return;
    const newFriends = [...friends, input.trim()];
    setFriends(newFriends);
    if (window.chrome?.storage?.local) {
      chrome.storage.local.set({ friends: newFriends });
    }
    setInput('');
  };

  return (
    <div style={sectionStyle}>
      <div style={cardStyle}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter friend's handle"
          style={inputStyle}
        />
        <button style={addBtnStyle} onClick={addFriend}>Add Friend</button>
      </div>
      <div style={{ width: '90%', margin: '0 auto' }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#e5e7eb', marginBottom: 16 }}>Friends</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
          {friends.length === 0 && <div style={{ color: '#9ca3af' }}>No friends added yet.</div>}
          {friends.map(handle => {
            const user = friendDetails[handle];
            return (
              <li style={friendCardStyle} key={handle}>
                <img
                  style={avatarStyle}
                  src={
                    user && user.titlePhoto && user.titlePhoto !== 'https://userpic.codeforces.org/no-avatar.jpg'
                      ? user.titlePhoto
                      : 'https://userpic.codeforces.org/no-avatar.jpg'
                  }
                  alt={handle}
                  onError={e => (e.target.style.display = 'none')}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={nameStyle}>{user ? user.handle : handle}</span>
                  <span style={ratingStyle}>Rating: {user && user.rating ? user.rating : 'N/A'}</span>
                  {user && user.rank && <span style={rankStyle}>Rank: {user.rank}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 