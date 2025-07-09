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
            document.getElementById('user-details').style.display = 'block';
            document.getElementById('handle-input').style.display = 'none';
        } else {
            document.getElementById('user-details').style.display = 'none';
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
                document.getElementById('handle-input').style.display = 'none';
                document.getElementById('user-details').style.display = 'block';
            });
        }
    });

    // Event listener for deleting handle
    document.getElementById('delete-handle').addEventListener('click', () => {
        chrome.storage.local.remove('userHandle', () => {
            document.getElementById('user-details').style.display = 'none';
            document.getElementById('handle-input').style.display = 'block';
            document.getElementById('display-handle').textContent = '';
            document.getElementById('display-rating').textContent = '';
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
            document.getElementById('display-handle').textContent = user.handle;
            document.getElementById('display-rating').textContent = user.rating || 'N/A';
        } else {
            alert('Handle not found');
            chrome.storage.local.remove('userHandle', () => {
                document.getElementById('user-details').style.display = 'none';
                document.getElementById('handle-input').style.display = 'block';
            });
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Error fetching user data');
    }
}

// Function to load upcoming contests
async function loadUpcomingContests() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const response = await fetch('https://codeforces.com/api/contest.list');
        const data = await response.json();
        if (data.status === 'OK') {
            const upcoming = data.result.filter(contest => contest.phase === 'BEFORE' && contest.startTimeSeconds > now);
            const contestsList = document.getElementById('contests-list');
            contestsList.innerHTML = '';
            if (upcoming.length > 0) {
                upcoming.forEach(contest => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `https://codeforces.com/contest/${contest.id}`;
                    a.target = '_blank';
                    a.textContent = `${contest.name} - ${new Date(contest.startTimeSeconds * 1000).toLocaleString()}`;
                    a.className = 'contest-link';
                    li.appendChild(a);
                    contestsList.appendChild(li);
                });
            } else {
                contestsList.innerHTML = '<p>No upcoming contests found.</p>';
            }
        } else {
            document.getElementById('contests-list').innerHTML = '<p>Error fetching contests.</p>';
        }
    } catch (error) {
        console.error('Error fetching contests:', error);
        document.getElementById('contests-list').innerHTML = '<p>Error fetching contests.</p>';
    }
}

// Function to load friends
async function loadFriends() {
    chrome.storage.local.get('friends', (result) => {
        const friends = result.friends || [];
        const friendsUl = document.getElementById('friends-ul');
        friendsUl.innerHTML = '';
        friends.forEach(async (handle) => {
            try {
                const response = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
                const data = await response.json();
                if (data.status === 'OK' && data.result.length > 0) {
                    const user = data.result[0];
                    const ratingResponse = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`);
                    const ratingData = await ratingResponse.json();
                    if (ratingData.status === 'OK') {
                        const ratingHistory = ratingData.result;
                        let change = 0;
                        if (ratingHistory.length > 1) {
                            const lastRating = ratingHistory[ratingHistory.length - 1].newRating;
                            const secondLastRating = ratingHistory[ratingHistory.length - 2].newRating;
                            change = lastRating - secondLastRating;
                        }
                        const li = document.createElement('li');
                        li.textContent = `${handle}: Rating ${user.rating || 'N/A'} (${change > 0 ? '+' : ''}${change})`;
                        li.style.color = change > 0 ? 'green' : change < 0 ? 'red' : 'inherit';
                        friendsUl.appendChild(li);
                    }
                } else {
                    const li = document.createElement('li');
                    li.textContent = `${handle}: Not found`;
                    li.style.color = 'red';
                    friendsUl.appendChild(li);
                }
            } catch (error) {
                console.error('Error fetching friend data:', error);
                const li = document.createElement('li');
                li.textContent = `${handle}: Error fetching data`;
                li.style.color = 'red';
                friendsUl.appendChild(li);
            }
        });
    });
}

// Function to load leaderboard
async function loadLeaderboard() {
    try {
        const contestsResponse = await fetch('https://codeforces.com/api/contest.list');
        const contestsData = await contestsResponse.json();
        if (contestsData.status === 'OK') {
            const now = Math.floor(Date.now() / 1000);
            const recentContests = contestsData.result.filter(contest => contest.phase === 'FINISHED' && contest.startTimeSeconds < now);
            if (recentContests.length > 0) {
                const latestContest = recentContests.sort((a, b) => b.startTimeSeconds - a.startTimeSeconds)[0];
                const ratingChangesResponse = await fetch(`https://codeforces.com/api/contest.ratingChanges?contestId=${latestContest.id}`);
                const ratingChangesData = await ratingChangesResponse.json();
                if (ratingChangesData.status === 'OK') {
                    const changes = ratingChangesData.result;
                    changes.sort((a, b) => (b.newRating - b.oldRating) - (a.newRating - a.oldRating));
                    const topGainers = changes.slice(0, 10);
                    const topLosers = changes.slice(-10).reverse();
                    const leaderboardDiv = document.getElementById('leaderboard-data');
                    leaderboardDiv.innerHTML = `<h4>Top Gainers in ${latestContest.name}</h4>`;
                    const gainersList = document.createElement('ul');
                    topGainers.forEach(change => {
                        const li = document.createElement('li');
                        const changeAmount = change.newRating - change.oldRating;
                        li.textContent = `${change.handle}: +${changeAmount} (to ${change.newRating})`;
                        li.style.color = 'green';
                        gainersList.appendChild(li);
                    });
                    leaderboardDiv.appendChild(gainersList);
                    leaderboardDiv.innerHTML += `<h4>Top Losers in ${latestContest.name}</h4>`;
                    const losersList = document.createElement('ul');
                    topLosers.forEach(change => {
                        const li = document.createElement('li');
                        const changeAmount = change.newRating - change.oldRating;
                        li.textContent = `${change.handle}: ${changeAmount} (to ${change.newRating})`;
                        li.style.color = 'red';
                        losersList.appendChild(li);
                    });
                    leaderboardDiv.appendChild(losersList);
                } else {
                    document.getElementById('leaderboard-data').textContent = 'No rating changes available';
                }
            } else {
                document.getElementById('leaderboard-data').textContent = 'No recent contests found';
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboard-data').textContent = 'Error loading leaderboard';
    }
}