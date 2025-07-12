document.addEventListener('DOMContentLoaded', () => {
    // Set up tab switching
    document.getElementById('home-btn').addEventListener('click', () => showSection('home-section'));
    document.getElementById('friends-btn').addEventListener('click', () => checkRestriction('friends-section'));
    document.getElementById('leaderboard-btn').addEventListener('click', () => checkRestriction('leaderboard-section'));

    // Show home by default
    document.getElementById('friends-section').classList.add('hidden');
    document.getElementById('leaderboard-section').classList.add('hidden');
    showSection('home-section');

    // Load user handle and data if set
    chrome.storage.local.get('userHandle', (result) => {
        const userHandle = result.userHandle;
        if (userHandle) {
            loadUserData(userHandle);
        } else {
            document.getElementById('user-card').style.display = 'none';
            document.getElementById('handle-input').style.display = 'block';
        }
    });

    // Load POTD restriction state
    chrome.storage.local.get('potdRestrictionEnabled', (result) => {
        const restrictionEnabled = result.potdRestrictionEnabled || false;
        document.getElementById('potd-restriction').checked = restrictionEnabled;
    });

    // Load upcoming contests
    loadUpcomingContests();

    // Event listener for saving handle
    document.getElementById('save-handle').addEventListener('click', () => {
        const handle = document.getElementById('user-handle').value.trim();
        if (handle) {
            chrome.storage.local.set({ userHandle: handle }, () => {
                loadUserData(handle);
            });
        }
    });

    // Event listener for deleting handle
    document.getElementById('delete-handle').addEventListener('click', () => {
        chrome.storage.local.remove('userHandle', () => {
            document.getElementById('user-card').style.display = 'none';
            document.getElementById('handle-input').style.display = 'block';
            document.getElementById('display-handle').textContent = '';
            document.getElementById('display-rating').textContent = '';
            document.getElementById('user-max-rating').textContent = '';
            document.getElementById('user-rank').textContent = '';
            document.getElementById('user-rating-change').textContent = '';
        });
    });

    // Event listener for adding friend
    document.getElementById('add-friend').addEventListener('click', () => {
        const handle = document.getElementById('friend-handle').value.trim();
        if (handle) {
            chrome.storage.local.get('friends', (result) => {
                let friends = result.friends || [];
                if (!friends.includes(handle)) {
                    friends.push(handle);
                    chrome.storage.local.set({ friends: friends }, () => {
                        loadFriends();
                        document.getElementById('friend-handle').value = '';
                    });
                } else {
                    alert('Friend already added');
                }
            });
        }
    });

    // Event listener for POTD restriction checkbox
    document.getElementById('potd-restriction').addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        chrome.storage.local.set({ potdRestrictionEnabled: isChecked }, () => {
            if (isChecked) checkRestriction(document.getElementById('home-section').classList.contains('hidden') ? 'home-section' : null);
        });
    });

    // Event listener for marking POTD as solved
    document.getElementById('mark-solved').addEventListener('click', () => {
        const today = new Date().toDateString();
        chrome.storage.local.set({ potdSolvedToday: true, potdSolvedDate: today }, () => {
            checkRestriction(document.getElementById('home-section').classList.contains('hidden') ? 'home-section' : null);
        });
    });
});

// Function to check POTD restriction
function checkRestriction(sectionId) {
    chrome.storage.local.get(['potdRestrictionEnabled', 'potdSolvedToday', 'potdSolvedDate'], (result) => {
        const restrictionEnabled = result.potdRestrictionEnabled || false;
        const potdSolvedToday = result.potdSolvedToday || false;
        const lastSolvedDate = result.potdSolvedDate || '';
        const today = new Date().toDateString();

        // Reset potdSolvedToday if the date has changed
        if (lastSolvedDate !== today && potdSolvedToday) {
            chrome.storage.local.set({ potdSolvedToday: false, potdSolvedDate: today });
            return;
        }

        if (restrictionEnabled && !potdSolvedToday && sectionId) {
            alert('Please solve today\'s POTD first.');
            showSection('home-section');
        } else if (sectionId) {
            showSection(sectionId);
        }
    });
}

// Function to switch sections
function showSection(sectionId) {
    const sections = ['home-section', 'friends-section', 'leaderboard-section'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (id === sectionId) {
            section.classList.remove('hidden');
            section.classList.add('fade-in');
            setTimeout(() => section.classList.remove('fade-in'), 300);
        } else {
            section.classList.add('hidden');
        }
    });
    // Remove active class from all buttons
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    // Add active class to the current button
    let activeBtn;
    if (sectionId === 'home-section') activeBtn = 'home-btn';
    else if (sectionId === 'friends-section') activeBtn = 'friends-btn';
    else if (sectionId === 'leaderboard-section') activeBtn = 'leaderboard-btn';
    if (activeBtn) document.getElementById(activeBtn).classList.add('active');
    if (sectionId === 'friends-section') {
        loadFriends();
    } else if (sectionId === 'leaderboard-section') {
        loadLeaderboard();
    }
}

// Function to load user data
async function loadUserData(handle) {
    try {
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
        const data = await response.json();
        if (data.status === 'OK') {
            const user = data.result[0];
            // Avatar
            const avatarUrl = user.titlePhoto && user.titlePhoto !== 'https://userpic.codeforces.org/no-avatar.jpg'
                ? user.titlePhoto
                : `https://codeforces.org/s/20807/images/avatars/${handle}.png`;
            document.getElementById('user-avatar').src = avatarUrl;
            // Handle, rank, rating, max rating
            document.getElementById('display-handle').textContent = user.handle;
            document.getElementById('user-rank').textContent = user.rank ? user.rank : '';
            document.getElementById('display-rating').textContent = user.rating || 'N/A';
            document.getElementById('user-max-rating').textContent = user.maxRating || 'N/A';
            // Show user card
            document.getElementById('user-card').style.display = 'block';
            document.getElementById('handle-input').style.display = 'none';
            // Last contest rating change
            const ratingChangeSpan = document.getElementById('user-rating-change');
            ratingChangeSpan.textContent = '';
            ratingChangeSpan.className = '';
            const ratingResp = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`);
            const ratingData = await ratingResp.json();
            if (ratingData.status === 'OK' && ratingData.result.length > 1) {
                const last = ratingData.result[ratingData.result.length - 1];
                const prev = ratingData.result[ratingData.result.length - 2];
                const diff = last.newRating - prev.newRating;
                if (diff > 0) {
                    ratingChangeSpan.textContent = `▲ +${diff} (Last: ${last.contestName})`;
                    ratingChangeSpan.className = 'up';
                } else if (diff < 0) {
                    ratingChangeSpan.textContent = `▼ ${diff} (Last: ${last.contestName})`;
                    ratingChangeSpan.className = 'down';
                } else {
                    ratingChangeSpan.textContent = `No change (Last: ${last.contestName})`;
                }
            }
        } else {
            document.getElementById('user-card').style.display = 'none';
            document.getElementById('handle-input').style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        document.getElementById('user-card').style.display = 'none';
        document.getElementById('handle-input').style.display = 'block';
    }
}

// Render badges in a modern way
function renderBadges(badges = []) {
    const badgesList = document.getElementById('badges-list');
    badgesList.innerHTML = '';
    if (!badges.length) {
        badgesList.innerHTML = '<span style="color:#b0b0b0;">None</span>';
        return;
    }
    badges.forEach(badge => {
        const span = document.createElement('span');
        span.className = 'badge earned';
        span.textContent = badge;
        badgesList.appendChild(span);
    });
}

// Function to load friends
async function loadFriends() {
    chrome.storage.local.get('friends', (result) => {
        const friends = result.friends || [];
        const friendsUl = document.getElementById('friends-ul');
        friendsUl.innerHTML = '';
        if (friends.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No friends added yet.';
            friendsUl.appendChild(emptyMsg);
            return;
        }
        friends.forEach(async (handle) => {
            // Fetch user info from Codeforces API
            try {
                const resp = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
                const data = await resp.json();
                let user = null;
                if (data.status === 'OK' && data.result.length > 0) {
                    user = data.result[0];
                }
                const avatarUrl = user && user.titlePhoto && user.titlePhoto !== 'https://userpic.codeforces.org/no-avatar.jpg'
                    ? user.titlePhoto
                    : `https://codeforces.org/s/20807/images/avatars/${handle}.png`;
                const li = document.createElement('li');
                li.className = 'friend-item';
                const img = document.createElement('img');
                img.className = 'friend-avatar';
                img.src = avatarUrl;
                img.alt = handle;
                img.onerror = function() { this.style.display = 'none'; };
                const infoDiv = document.createElement('div');
                infoDiv.style.display = 'flex';
                infoDiv.style.flexDirection = 'column';
                infoDiv.style.gap = '2px';
                const handleSpan = document.createElement('span');
                handleSpan.textContent = user ? user.handle : handle;
                handleSpan.style.fontWeight = 'bold';
                const ratingSpan = document.createElement('span');
                ratingSpan.textContent = user && user.rating ? `Rating: ${user.rating}` : 'Rating: N/A';
                ratingSpan.style.fontSize = '0.95em';
                const rankSpan = document.createElement('span');
                rankSpan.textContent = user && user.rank ? `Rank: ${user.rank}` : '';
                rankSpan.style.fontSize = '0.95em';
                infoDiv.appendChild(handleSpan);
                infoDiv.appendChild(ratingSpan);
                if (rankSpan.textContent) infoDiv.appendChild(rankSpan);
                li.appendChild(img);
                li.appendChild(infoDiv);
                friendsUl.appendChild(li);
            } catch (e) {
                const li = document.createElement('li');
                li.className = 'friend-item';
                li.textContent = `${handle} (Error fetching details)`;
                friendsUl.appendChild(li);
            }
        });
    });
}

// Function to load leaderboard
async function loadLeaderboard() {
    // Do nothing, just show the placeholder
}

// Function to load upcoming contests as cards
async function loadUpcomingContests() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const response = await fetch('https://codeforces.com/api/contest.list');
        const data = await response.json();
        const contestsList = document.getElementById('contests-list');
        contestsList.innerHTML = '';
        if (data.status === 'OK') {
            const upcoming = data.result.filter(contest => contest.phase === 'BEFORE' && contest.startTimeSeconds > now);
            if (upcoming.length > 0) {
                upcoming.forEach(contest => {
                    const card = document.createElement('div');
                    card.className = 'contest-card';
                    const title = document.createElement('div');
                    title.className = 'contest-title';
                    title.textContent = contest.name;
                    const date = document.createElement('div');
                    date.className = 'contest-date';
                    date.textContent = new Date(contest.startTimeSeconds * 1000).toLocaleString();
                    const link = document.createElement('a');
                    link.href = `https://codeforces.com/contest/${contest.id}`;
                    link.target = '_blank';
                    link.className = 'contest-link-btn';
                    link.textContent = 'Go';
                    card.appendChild(title);
                    card.appendChild(date);
                    card.appendChild(link);
                    contestsList.appendChild(card);
                });
            } else {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-message';
                emptyMsg.textContent = 'No upcoming contests found.';
                contestsList.appendChild(emptyMsg);
            }
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'Error fetching contests.';
            contestsList.appendChild(emptyMsg);
        }
    } catch (error) {
        console.error('Error fetching contests:', error);
        const contestsList = document.getElementById('contests-list');
        contestsList.innerHTML = '';
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'Error fetching contests.';
        contestsList.appendChild(emptyMsg);
    }
}