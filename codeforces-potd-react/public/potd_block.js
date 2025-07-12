const params = new URLSearchParams(window.location.search);
const potdUrl = params.get('potdUrl');
document.getElementById('goto-potd').onclick = function() {
  window.location.href = potdUrl || 'https://codeforces.com/';
}; 