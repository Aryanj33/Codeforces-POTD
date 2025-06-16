console.log('✅ content script loaded');

function injectPOTD() {
  console.log('📦 injectPOTD running');

  const header = document.querySelector('#header');
  if (!header) {
    console.log('❌ Header not found');
    return;
  }

  if (document.getElementById('potdLink')) {
    console.log('⚠️ POTD already injected');
    return;
  }

  console.log('✅ Header found, injecting link...');

  const potdTab = document.createElement('a');
  potdTab.href = '#';
  potdTab.textContent = '🔥 POTD';
  potdTab.id = 'potdLink';

  potdTab.style.marginLeft = '10px';
  potdTab.style.backgroundColor = 'yellow';
  potdTab.style.color = 'black';
  potdTab.style.fontWeight = 'bold';
  potdTab.style.padding = '5px';
  potdTab.style.border = '2px solid red';
  potdTab.style.borderRadius = '4px';
  potdTab.style.display = 'inline-block';

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

// Instead of waiting for DOMContentLoaded, call immediately
injectPOTD();
