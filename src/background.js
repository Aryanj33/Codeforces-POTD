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
  const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
  const data = await response.json();
  return data.result[0].rating || 1500;
}

async function fetchProblems() {
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  const data = await response.json();
  return data.result.problems;
}

function selectPersonalPOTD(problems, handle) {
  const today = new Date().toISOString().split('T')[0];
  const seed = today + handle;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1e9;
  }
  const index = hash % problems.length;
  return problems[index];
}
