const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create dist directory structure
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(distDir, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Create basic index.html for immediate mobile fix
const basicHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disney Pin Authenticator</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; text-align: center; }
    .btn { background: #4f46e5; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Disney Pin Authenticator</h1>
    <p>Loading application...</p>
    <script>
      // Redirect to proper React app once built
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    </script>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), basicHTML);

console.log('Basic HTML created for mobile fix');
console.log('Starting background build...');

// Start build in background
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('Build error:', error);
    return;
  }
  console.log('Build completed successfully');
});