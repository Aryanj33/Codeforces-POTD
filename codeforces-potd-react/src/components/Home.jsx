import React, { useEffect, useState } from 'react';

const sectionStyle = {
  maxWidth: 370,
  margin: '0 auto',
  padding: '24px 18px 18px 18px',
  background: '#23243a',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  alignItems: 'center',
};
const cardStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.10)',
  borderRadius: 16,
  boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
  padding: 20,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
  border: '1px solid rgba(255,255,255,0.20)',
};
const avatarStyle = {
  width: 80,
  height: 80,
  borderRadius: '50%',
  objectFit: 'cover',
  border: '4px solid #6366f1',
  background: '#23243a',
  boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
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
const saveBtnStyle = {
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
const statCardStyle = {
  flex: 1,
  background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  boxShadow: '0 1px 4px rgba(99,102,241,0.04)',
  color: '#fff',
};
const dividerStyle = {
  width: '100%',
  height: 1,
  background: 'linear-gradient(90deg, transparent, #6366f1 40%, transparent 100%)',
  margin: '18px 0 8px 0',
};
const contestCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(39,39,42,0.60)',
  borderRadius: 8,
  padding: '10px 14px',
  boxShadow: '0 1px 4px rgba(99,102,241,0.04)',
  border: '1px solid rgba(129,140,248,0.20)',
  marginBottom: 8,
};
const contestBtnStyle = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  padding: '6px 16px',
  fontWeight: 500,
  fontSize: 15,
  cursor: 'pointer',
  textDecoration: 'none',
};

export default function Home() {
  const [userHandle, setUserHandle] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [userRatingChange, setUserRatingChange] = useState('');
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [potdRestriction, setPotdRestriction] = useState(false);
  const [contests, setContests] = useState([]);
  const [input, setInput] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [potd, setPotd] = useState(null);
  const [potdSolvedToday, setPotdSolvedToday] = useState(false);
  const [checkingSolved, setCheckingSolved] = useState(false);

  useEffect(() => {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get(['userHandle', 'streak', 'points', 'badges', 'potdRestrictionEnabled'], (result) => {
        setUserHandle(result.userHandle || '');
        setStreak(result.streak || 0);
        setPoints(result.points || 0);
        setBadges(result.badges || []);
        setPotdRestriction(result.potdRestrictionEnabled || false);
      });
    }
  }, []);

  useEffect(() => {
    if (!userHandle) return;
    fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(userHandle)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') setUserInfo(data.result[0]);
      });
    fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(userHandle)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK' && data.result.length > 1) {
          const last = data.result[data.result.length - 1];
          const prev = data.result[data.result.length - 2];
          const diff = last.newRating - prev.newRating;
          setUserRatingChange(
            diff > 0
              ? `▲ +${diff} (${last.contestName})`
              : diff < 0
              ? `▼ ${diff} (${last.contestName})`
              : `No change (${last.contestName})`
          );
        }
      });
  }, [userHandle]);

  useEffect(() => {
    fetch('https://codeforces.com/api/contest.list')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') {
          const now = Math.floor(Date.now() / 1000);
          setContests(
            data.result.filter(
              c => c.phase === 'BEFORE' && c.startTimeSeconds > now
            )
          );
        }
      });
  }, []);

  useEffect(() => {
    // Fetch POTD info (assume you have a function or API for this)
    if (window.chrome?.storage?.sync) {
      chrome.storage.sync.get(['dailyProblem', 'lastFetchDate'], (data) => {
        const today = new Date().toISOString().split('T')[0];
        if (data.lastFetchDate === today && data.dailyProblem) {
          setPotd(data.dailyProblem);
        }
      });
    }
  }, []);

  // Real-time solved check
  useEffect(() => {
    if (!userHandle || !potd) return;
    setCheckingSolved(true);
    fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(userHandle)}&from=1&count=100`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') {
          const solved = data.result.some(sub =>
            sub.problem.contestId == potd.contestId &&
            sub.problem.index == potd.index &&
            sub.verdict === 'OK'
          );
          setPotdSolvedToday(solved);
          if (window.chrome?.storage?.local) {
            const today = new Date().toISOString().slice(0, 10);
            if (solved) {
              chrome.storage.local.set({ potdSolvedDate: today });
            } else {
              chrome.storage.local.remove('potdSolvedDate');
            }
          }
        }
        setCheckingSolved(false);
      });
  }, [userHandle, potd]);

  // Helper: get today as YYYY-MM-DD
  const getToday = () => new Date().toISOString().slice(0, 10);

  // Track solved dates for streak/points
  useEffect(() => {
    if (!userHandle) return;
    if (!potdSolvedToday) return;
    const today = getToday();
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get(['potdSolvedDates', 'points'], (result) => {
        let solvedDates = result.potdSolvedDates || [];
        let pts = result.points || 0;
        if (!solvedDates.includes(today)) {
          solvedDates.push(today);
          pts += 10;
        }
        // Calculate streak
        solvedDates = solvedDates.sort();
        let streakCount = 0;
        let prev = new Date(today);
        for (let i = solvedDates.length - 1; i >= 0; i--) {
          const d = new Date(solvedDates[i]);
          if ((prev - d) / (1000 * 60 * 60 * 24) === 0) {
            streakCount++;
            prev.setDate(prev.getDate() - 1);
          } else if ((prev - d) / (1000 * 60 * 60 * 24) === 1) {
            streakCount++;
            prev.setDate(prev.getDate() - 1);
          } else {
            break;
          }
        }
        // Badges
        const badgeList = [];
        if (streakCount >= 7) badgeList.push('🔥 7 Day Streak');
        if (streakCount >= 30) badgeList.push('🏅 30 Day Streak');
        if (streakCount >= 100) badgeList.push('🏆 100 Day Streak');
        if (pts >= 100) badgeList.push('💯 100 Points');
        if (pts >= 500) badgeList.push('🌟 500 Points');
        setStreak(streakCount);
        setPoints(pts);
        setBadges(badgeList);
        chrome.storage.local.set({ potdSolvedDates: solvedDates, points: pts, badges: badgeList });
      });
    }
  }, [potdSolvedToday, userHandle]);

  // On load, fetch streak/points/badges
  useEffect(() => {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get(['points', 'badges', 'potdSolvedDates'], (result) => {
        setPoints(result.points || 0);
        setBadges(result.badges || []);
        // Calculate streak from dates
        const today = getToday();
        let solvedDates = result.potdSolvedDates || [];
        solvedDates = solvedDates.sort();
        let streakCount = 0;
        let prev = new Date(today);
        for (let i = solvedDates.length - 1; i >= 0; i--) {
          const d = new Date(solvedDates[i]);
          if ((prev - d) / (1000 * 60 * 60 * 24) === 0) {
            streakCount++;
            prev.setDate(prev.getDate() - 1);
          } else if ((prev - d) / (1000 * 60 * 60 * 24) === 1) {
            streakCount++;
            prev.setDate(prev.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(streakCount);
      });
    }
  }, [userHandle]);

  const saveHandle = () => {
    if (!input.trim()) return;
    setUserHandle(input.trim());
    if (window.chrome?.storage?.local) {
      chrome.storage.local.set({ userHandle: input.trim() });
    }
    setInput('');
  };

  const deleteHandle = () => {
    setUserHandle('');
    setUserInfo(null);
    setUserRatingChange('');
    if (window.chrome?.storage?.local) {
      chrome.storage.local.remove('userHandle');
    }
  };

  const toggleRestriction = () => {
    setPotdRestriction(!potdRestriction);
    if (window.chrome?.storage?.local) {
      chrome.storage.local.set({ potdRestrictionEnabled: !potdRestriction });
    }
  };

  const potdBtnStyle = {
    background: potdSolvedToday
      ? 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)'
      : 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 28px',
    fontWeight: 600,
    fontSize: 16,
    cursor: potdSolvedToday ? 'default' : 'pointer',
    boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
    transition: 'background 0.2s, transform 0.2s',
    outline: 'none',
    marginTop: 8,
    opacity: potdSolvedToday ? 0.7 : 1,
    position: 'relative',
  };
  const tooltipStyle = {
    position: 'absolute',
    top: 48,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#23243a',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    zIndex: 10,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };
  const takeMeBtnStyle = {
    background: 'linear-gradient(90deg, #6366f1 0%, #a78bfa 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 24px',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 8,
    marginLeft: 8,
    boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
    transition: 'background 0.2s, transform 0.2s',
  };
  const openPotd = () => {
    if (potd) {
      window.open(`https://codeforces.com/contest/${potd.contestId}/problem/${potd.index}`, '_blank');
    }
  };

  return (
    <div style={sectionStyle}>
      {userHandle && userInfo ? (
        <div style={cardStyle}>
          <img
            src={
              userInfo.titlePhoto && userInfo.titlePhoto !== 'https://userpic.codeforces.org/no-avatar.jpg'
                ? userInfo.titlePhoto
                : 'https://userpic.codeforces.org/no-avatar.jpg'
            }
            alt="User Avatar"
            style={avatarStyle}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 20, fontWeight: 600 }}>{userInfo.handle}</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#a78bfa' }}>{userInfo.rank}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 16 }}>Rating: <span style={{ fontWeight: 600 }}>{userInfo.rating || 'N/A'}</span></span>
              <span style={{ fontSize: 16 }}>Max: <span style={{ fontWeight: 600 }}>{userInfo.maxRating || 'N/A'}</span></span>
              <span style={{ fontSize: 16, fontWeight: 500, color: userRatingChange.startsWith('▲') ? '#4ade80' : userRatingChange.startsWith('▼') ? '#ef4444' : '#e5e7eb' }}>
                {userRatingChange}
              </span>
            </div>
          </div>
          <button style={{ background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, cursor: 'pointer', fontSize: 16, marginLeft: 8 }} onClick={deleteHandle}>Delete</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your Codeforces handle"
            style={inputStyle}
          />
          <button style={saveBtnStyle} onClick={saveHandle}>Save</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={statCardStyle}>
          <span style={{ fontSize: 24 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Streak</span>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{streak}</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Points</span>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{points}</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: 24 }}>🏅</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Badges</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {badges.length === 0 ? <span style={{ color: '#9ca3af' }}>None</span> : badges.map(b => <span key={b} style={{ color: '#a78bfa', marginRight: 4 }}>{b}</span>)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={potdRestriction} onChange={toggleRestriction} style={{ width: 20, height: 20, accentColor: '#6366f1' }} />
        <span style={{ fontSize: 16 }}>Enable POTD Restriction</span>
      </div>

      <div style={{ position: 'relative', marginTop: 16, display: 'flex', alignItems: 'center' }}>
        <button
          style={potdBtnStyle}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          disabled
        >
          {checkingSolved
            ? 'Checking...'
            : potdSolvedToday
              ? 'POTD Solved!'
              : 'Not solved yet'}
        </button>
        <button
          style={takeMeBtnStyle}
          onClick={openPotd}
          title="Go to today's POTD on Codeforces"
        >
          Take me to POTD
        </button>
        {!potdSolvedToday && showTooltip && (
          <div style={tooltipStyle}>
            You must solve today’s POTD to browse other sites!
          </div>
        )}
      </div>

      <div style={dividerStyle}></div>
      <div style={{ width: '100%' }}>
        <h3 style={{ textAlign: 'center', fontSize: 20, fontWeight: 600, color: '#e5e7eb', marginBottom: 16 }}>Upcoming Contests</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contests.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 16 }}>No upcoming contests found.</div>}
          {contests.map(contest => (
            <div key={contest.id} style={contestCardStyle}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>{contest.name}</div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>{new Date(contest.startTimeSeconds * 1000).toLocaleString()}</div>
              </div>
              <a
                href={`https://codeforces.com/contest/${contest.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={contestBtnStyle}
              >
                Go
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 