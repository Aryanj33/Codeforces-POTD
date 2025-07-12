console.log('✅ content script loaded');

function injectPOTDToSubnav() {
  const navbarList = document.querySelector('.second-level-menu-list');
  if (!navbarList) return;
  if (document.getElementById('potdNavItem')) return;

  const potdLi = document.createElement('li');
  potdLi.id = 'potdNavItem';

  const potdLink = document.createElement('a');
  potdLink.textContent = '🔥 POTD';
  potdLink.style.fontWeight = 'bold';
  potdLink.style.color = '#ff6b6b';

  chrome.storage.sync.get(['dailyProblem'], (data) => {
    if (data.dailyProblem) {
      const { contestId, index } = data.dailyProblem;
      potdLink.href = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    } else {
      potdLink.textContent = 'Loading POTD...';
      potdLink.href = '#';
    }
  });

  potdLi.appendChild(potdLink);
  navbarList.appendChild(potdLi);

  chrome.runtime.sendMessage({ action: 'fetchDailyProblem' });
}

document.addEventListener('DOMContentLoaded', injectPOTDToSubnav);

// Observe for dynamic navbars
const observer = new MutationObserver(() => {
  injectPOTDToSubnav();
});
observer.observe(document.body, { childList: true, subtree: true }); 