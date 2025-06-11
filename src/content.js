document.addEventListener('DOMContentLoaded', () => {
     // Find the navigation bar
     const nav = document.querySelector('.second-level-menu-list');
     if (!nav) return;

     // Create POTD tab
     const potdTab = document.createElement('li');
     potdTab.innerHTML = '<a href="#" id="potdLink">Problem of the Day</a>';
     nav.appendChild(potdTab);

     // Load daily problem from storage
     chrome.storage.sync.get(['dailyProblem', 'userHandle'], (data) => {
       if (data.dailyProblem) {
         const { contestId, index } = data.dailyProblem;
         potdTab.querySelector('#potdLink').href = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
       } else {
         potdTab.querySelector('#potdLink').textContent = 'Loading POTD...';
       }
     });

     // Request background script to fetch new problem
     chrome.runtime.sendMessage({ action: 'fetchDailyProblem' });
   });