chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
         if (request.action === 'fetchDailyProblem') {
           chrome.storage.sync.get(['userHandle', 'dailyProblem', 'lastFetchDate'], async (data) => {
             const today = new Date().toISOString().split('T')[0];
             if (data.lastFetchDate !== today || !data.dailyProblem) {
               try {
                 // Fetch user rating
                 const userRating = await fetchUserRating(data.userHandle || 'default');
                 // Fetch problem set
                 const problems = await fetchProblems();
                 // Filter problems by rating (±200 of user’s rating)
                 const filteredProblems = problems.filter(p => 
                   Math.abs(p.rating - userRating) <= 200 && p.rating !== undefined
                 );
                 // Select a random problem
                 const dailyProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
                 // Store problem and date
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
         if (!handle) return 1500; // Default rating for unrated users
         const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
         const data = await response.json();
         return data.result[0].rating || 1500;
       }

       async function fetchProblems() {
         const response = await fetch('https://codeforces.com/api/problemset.problems');
         const data = await response.json();
         return data.result.problems;
       }