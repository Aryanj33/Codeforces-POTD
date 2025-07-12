import React, { useState } from 'react';
import Nav from './components/Nav.jsx';
import Home from './components/Home.jsx';
import Friends from './components/Friends.jsx';
import Leaderboard from './components/Leaderboard.jsx';

export default function App() {
  const [tab, setTab] = useState('home');
  return (
    <div className="popup-container">
      <Nav tab={tab} setTab={setTab} />
      {tab === 'home' && <Home />}
      {tab === 'friends' && <Friends />}
      {tab === 'leaderboard' && <Leaderboard />}
    </div>
  );
} 