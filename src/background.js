chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchDailyProblem') {
    chrome.storage.sync.get(['userHandle', 'dailyProblem', 'lastFetchDate'], async (data) => {
      const today = new Date().toISOString().split('T')[0];
      if (data.lastFetchDate !== today || !data.dailyProblem) {
        try {
          const userRating = await fetchUserRating(data.userHandle || 'default');
          const problems = await fetchProblems();
          const filteredProblems = problems.filter(p => Math.abs(p.rating - userRating) <= 200 && p.rating !== undefined);
          const dailyProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
          chrome.storage.sync.set({
            dailyProblem: { contestId: dailyProblem.contestId, index: dailyProblem.index },
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
  if (!handle) return 1500;
  const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
  const data = await response.json();
  return data.result[0].rating || 1500;
}

async function fetchProblems() {
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  const data = await response.json();
  return data.result.problems;
}