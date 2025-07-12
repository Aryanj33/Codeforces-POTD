// Extension Verification Script
// Run this in the browser console on codeforces.com to test the extension

console.log('🔍 Testing Codeforces POTD Extension...');

// Test 1: Check if content script is loaded
function testContentScript() {
  console.log('✅ Content script test:');
  const potdLink = document.getElementById('potdLink');
  if (potdLink) {
    console.log('✅ POTD link found:', potdLink.textContent);
    console.log('✅ POTD link href:', potdLink.href);
    console.log('✅ POTD link styling:', potdLink.style.cssText);
  } else {
    console.log('❌ POTD link not found');
  }
}

// Test 2: Check chrome storage
function testChromeStorage() {
  console.log('✅ Chrome storage test:');
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['dailyProblem', 'userHandle'], (data) => {
      console.log('✅ Storage data:', data);
    });
  } else {
    console.log('❌ Chrome storage not available');
  }
}

// Test 3: Check if we're on the right page
function testPageContext() {
  console.log('✅ Page context test:');
  console.log('✅ Current URL:', window.location.href);
  console.log('✅ Pathname:', window.location.pathname);
  console.log('✅ Header element:', document.querySelector('#header'));
}

// Test 4: Simulate extension functionality
function testExtensionFeatures() {
  console.log('✅ Extension features test:');
  
  // Test API calls
  fetch('https://codeforces.com/api/user.info?handles=tourist')
    .then(res => res.json())
    .then(data => {
      console.log('✅ API call successful:', data.status);
    })
    .catch(err => {
      console.log('❌ API call failed:', err);
    });
}

// Run all tests
setTimeout(() => {
  testContentScript();
  testChromeStorage();
  testPageContext();
  testExtensionFeatures();
}, 2000);

console.log('🔍 Tests will run in 2 seconds...'); 