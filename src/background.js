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
             // Check if user solved the problem
             if (data.userHandle) {
               await checkSubmission(data.userHandle, dailyProblem.contestId, dailyProblem.index);
             }
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

   async function checkSubmission(handle, contestId, index) {
     try {
       const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10`);
       const data = await response.json();
       const today = new Date().toISOString().split('T')[0];
       const solved = data.result.some(sub => 
         sub.contestId === contestId && 
         sub.problem.index === index && 
         sub.verdict === 'OK' && 
         new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0] === today
       );
       if (solved) {
         chrome.storage.sync.get(['streak'], (data) => {
           chrome.storage.sync.set({ streak: (data.streak || 0) + 1 });
         });
       } else {
         chrome.storage.sync.set({ streak: 0 }); // Reset streak if not solved
       }
     } catch (error) {
       console.error('Error checking submission:', error);
     }
   }