document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('saveHandle').addEventListener('click', () => {
    const handle = document.getElementById('handleInput').value;
    chrome.storage.sync.set({ userHandle: handle }, () => {
      alert('Handle saved!');
      chrome.runtime.sendMessage({ action: 'fetchDailyProblem' });
    });
  });

  document.getElementById('addFriend').addEventListener('click', () => {
    const friendHandle = document.getElementById('friendInput').value.trim();
    if (friendHandle) {
      chrome.storage.sync.get(['friends'], (data) => {
        const friends = data.friends || [];
        if (!friends.includes(friendHandle)) {
          friends.push(friendHandle);
          chrome.storage.sync.set({ friends }, loadFriends);
        }
        document.getElementById('friendInput').value = ''; // Clear input after adding
      });
    }
  });

  document.getElementById('markSolved').addEventListener('click', markPOTDSolved);

  loadStats();
  loadFriends();
  checkPOTDSolvedStatus();
});

function loadStats() {
  chrome.storage.sync.get(['streak', 'points', 'badgesEarned'], (data) => {
    document.getElementById('streak').textContent = data.streak || 0;
    document.getElementById('points').textContent = data.points || 0;

    const badgeContainer = document.getElementById('badgeContainer');
    badgeContainer.innerHTML = '';
    const earned = data.badgesEarned || [];

    const allBadges = {
      3: '🥉 3-Day Streak',
      7: '🥈 7-Day Streak',
      30: '🥇 30-Day Streak'
    };

    for (const [key, label] of Object.entries(allBadges)) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = label;
      if (earned.includes(parseInt(key))) badge.classList.add('earned');
      badgeContainer.appendChild(badge);
    }
  });
}

async function loadFriends() {
  const friendsList = document.getElementById('friendsList');
  if (!friendsList) return;

  const { friends } = await new Promise(resolve => {
    chrome.storage.sync.get(['friends'], resolve);
  });

  friendsList.innerHTML = '<p>Loading friends...</p>';
  if (friends && friends.length > 0) {
    friendsList.innerHTML = '';
    for (const handle of friends) {
      const friendItem = document.createElement('div');
      friendItem.className = 'friend-item';
      friendItem.dataset.handle = handle;
      friendItem.innerHTML = `<span>${handle}</span><span class="rating">Loading...</span>`;
      friendsList.appendChild(friendItem);

      try {
        const rating = await fetchRatingWithRetry(handle);
        const ratingSpan = friendItem.querySelector('.rating');
        if (ratingSpan) {
          ratingSpan.textContent = rating !== null ? rating : 'N/A';
          if (rating === 'N/A') {
            console.warn(`No rating found for ${handle}. Check if handle exists.`);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch rating for ${handle}:`, error);
        const ratingSpan = friendItem.querySelector('.rating');
        if (ratingSpan) ratingSpan.textContent = 'N/A';
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Respect rate limit
    }
  } else {
    friendsList.innerHTML = '<p>No friends added yet.</p>';
  }
}

async function fetchRatingWithRetry(handle, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      const response = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === 'FAILED') {
        console.log(`API failed for ${handle}: ${data.comment}`);
        throw new Error(data.comment);
      }
      return data.result[0]?.rating || null; // Return null if no rating
    } catch (error) {
      console.warn(`Attempt ${attempt} failed for ${handle}:`, error.message);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
    }
  }
}

async function checkPOTDSolvedStatus() {
  const markSolvedBtn = document.getElementById('markSolved');
  if (!markSolvedBtn) return;

  const today = new Date().toISOString().split('T')[0];
  const { userHandle, dailyProblem, lastSolvedDate } = await new Promise(resolve => {
    chrome.storage.sync.get(['userHandle', 'dailyProblem', 'lastSolvedDate'], resolve);
  });

  if (!userHandle || !dailyProblem) return;

  try {
    const submissions = await fetchSubmissions(userHandle);
    const isSolved = submissions.some(sub => {
      return sub.contestId === dailyProblem.contestId &&
             sub.index === dailyProblem.index &&
             new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0] === today &&
             sub.verdict === 'OK';
    });

    if (isSolved || lastSolvedDate === today) {
      markSolvedBtn.disabled = true;
      markSolvedBtn.textContent = '✅ POTD Already Solved';
    } else {
      markSolvedBtn.disabled = false;
      markSolvedBtn.textContent = "✅ Mark Today's POTD as Solved";
    }
  } catch (error) {
    console.error('Error checking POTD status:', error);
    markSolvedBtn.disabled = false;
  }
}

function markPOTDSolved() {
  chrome.storage.sync.get(['streak', 'points', 'lastSolvedDate', 'badgesEarned'], (data) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak = data.streak || 0;
    let points = data.points || 0;
    let lastSolved = data.lastSolvedDate || null;
    let badges = data.badgesEarned || [];

    if (lastSolved === yesterday) {
      streak += 1;
    } else if (lastSolved !== today) {
      streak = 1;
    }

    points += 10;
    lastSolved = today;

    if ([3, 7, 30].includes(streak) && !badges.includes(streak)) {
      badges.push(streak);
    }

    chrome.storage.sync.set({
      streak,
      points,
      lastSolvedDate: lastSolved,
      badgesEarned: badges
    }, () => {
      loadStats();
      checkPOTDSolvedStatus();
    });
  });
}

async function fetchSubmissions(handle) {
  const response = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);
  const data = await response.json();
  if (data.status === 'OK') {
    return data.result;
  } else {
    throw new Error('Failed to fetch submissions');
  }
}