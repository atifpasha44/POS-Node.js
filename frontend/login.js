document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const tin = document.getElementById('tin').value;
  const remember = document.getElementById('remember').checked;

  // Use relative path so frontend dev server proxy is applied and include credentials (cookies/session)
  const res = await fetch('/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tin, remember })
  });

  const data = await res.json();
  if (data.success) {
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';
  } else {
    alert(data.message || 'Login failed');
  }
});
