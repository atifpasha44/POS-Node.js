window.onload = async function() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  document.querySelector('.profile-name').textContent = user.name;
  document.querySelector('.profile-img').src = user.profile_img || 'profile.png';
};
