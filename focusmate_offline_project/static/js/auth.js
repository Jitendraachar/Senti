// static/js/auth.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',          // important: send/receive session cookie
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) {
      msg.textContent = json.error || 'Login failed';
      return;
    }
    // success -> redirect to dashboard served by backend
    window.location.href = '/static/dashboard.html';
  } catch (err) {
    msg.textContent = 'Network error';
    console.error(err);
  }
});
