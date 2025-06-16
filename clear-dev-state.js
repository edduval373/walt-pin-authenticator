// Clear development state that may be causing INVALID_STATE error
console.log('Clearing development state...');

// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Clear any cached data
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

console.log('Development state cleared');