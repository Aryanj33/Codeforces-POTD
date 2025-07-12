chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchDailyProblem') {
    chrome.storage.sync.get(['userHandle', 'dailyProblem', 'lastFetchDate'], async (data) => {
      const today = new Date().toISOString().split('T')[0];
      if (data.lastFetchDate !== today || !data.dailyProblem) {
        try {
          const userRating = await fetchUserRating(data.userHandle || 'default');
          const problems = await fetchProblems();
          const filteredProblems = problems.filter(p =>
            p.rating && Math.abs(p.rating - userRating) <= 200
          );

          if (filteredProblems.length === 0) {
            console.error("No problems found in rating range");
            return;
          }

          const potd = selectPersonalPOTD(filteredProblems, data.userHandle || 'default');

          chrome.storage.sync.set({
            dailyProblem: { contestId: potd.contestId, index: potd.index, name: potd.name },
            lastFetchDate: today
          });
        } catch (error) {
          console.error('Error fetching daily problem:', error);
        }
      }
    });
  }
});

async function fetchUserRating(handle) {
  try {
    const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (!response.ok) throw new Error('Failed to fetch user rating');
    const data = await response.json();
    return data.result[0]?.rating || 1500;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return 1500;
  }
}

async function fetchProblems() {
  try {
    const response = await fetch('https://codeforces.com/api/problemset.problems');
    if (!response.ok) throw new Error('Failed to fetch problems');
    const data = await response.json();
    return data.result.problems || [];
  } catch (error) {
    console.error('Error fetching problems:', error);
    return [];
  }
}

function selectPersonalPOTD(problems, handle) {
  if (problems.length === 0) return { contestId: '1', index: 'A', name: 'Default Problem' };
  const today = new Date().toISOString().split('T')[0];
  const seed = today + handle;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1e9;
  }
  const index = hash % problems.length;
  return problems[index] || problems[0];
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    // Allow Codeforces and extension pages
    if (/^https:\/\/(codeforces\.com|www\.codeforces\.com|userpic\.codeforces\.org)/.test(tab.url) || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    // Check if today's POTD is solved
    chrome.storage.local.get(['potdSolvedDate'], (result) => {
      const today = new Date().toISOString().slice(0, 10);
      if (result.potdSolvedDate !== today) {
        // Block navigation by redirecting to a warning page
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL('potd_block.html') });
      }
    });
  }
}); 