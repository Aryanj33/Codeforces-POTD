console.log('✅ content script loaded');

function injectPOTD() {
  console.log('📦 injectPOTD running');

  const header = document.querySelector('#header');
  if (!header || document.getElementById('potdLink') || !window.location.pathname.startsWith('/problemset')) return;

  console.log('✅ Header found, injecting link...');

  const potdTab = document.createElement('a');
  potdTab.id = 'potdLink';
  potdTab.textContent = '🔥 POTD';

  header.appendChild(potdTab);

  chrome.storage.sync.get(['dailyProblem'], (data) => {
    console.log('📬 Got from storage:', data);
    if (data.dailyProblem) {
      const { contestId, index } = data.dailyProblem;
      potdTab.href = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    } else {
      potdTab.textContent = 'Loading POTD...';
    }
  });

  chrome.runtime.sendMessage({ action: 'fetchDailyProblem' });
}

// Run on page load and DOM changes
document.addEventListener('DOMContentLoaded', injectPOTD);
new MutationObserver(injectPOTD).observe(document.body, { childList: true, subtree: true });