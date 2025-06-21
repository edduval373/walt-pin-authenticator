const fs = require('fs');
const path = require('path');

console.log('Starting simple build process...');

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy client directory to dist
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy client files to dist
if (fs.existsSync('client')) {
  console.log('Copying client files...');
  copyDir('client', 'dist');
} else {
  console.log('No client directory found, creating minimal index.html...');
  fs.writeFileSync('dist/index.html', `
<!DOCTYPE html>
<html>
<head>
  <title>Disney Pin Authenticator</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">
    <h1>Disney Pin Authenticator</h1>
    <p>Loading...</p>
  </div>
</body>
</html>
  `);
}

console.log('Build completed successfully!');