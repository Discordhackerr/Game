// This will automatically start the loading screen when the page loads
window.onload = function() {
  // Show the loading screen
  document.getElementById('loading-screen').style.display = 'block';

  // Redirect to the backend login route to start OAuth2 flow
  window.location.href = '/login';
};