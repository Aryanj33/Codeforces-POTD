document.getElementById('saveHandle').addEventListener('click', () => {
     const handle = document.getElementById('handleInput').value;
     chrome.storage.sync.set({ userHandle: handle }, () => {
       alert('Handle saved!');
       chrome.runtime.sendMessage({ action: 'fetchDailyProblem' });
     });
   });

   // Load streak
   chrome.storage.sync.get(['streak'], (data) => {
     document.getElementById('streak').textContent = data.streak || 0;
   });