const fs = require('fs');

console.log('🔄 Restoring working build configuration...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Restore the EXACT working build script from backup
packageJson.scripts.build = "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist";

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Restored working build script');
console.log('Build now runs: vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');