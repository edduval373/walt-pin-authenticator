const { spawn } = require('child_process');
const fs = require('fs');

console.log('📱 Disney Pin Authenticator Mobile Test');
console.log('=====================================\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
    console.log('❌ Run this from the mobile-app directory');
    process.exit(1);
}

console.log('Instructions for testing on your phone:');
console.log('1. Download "Expo Go" app from App Store or Google Play');
console.log('2. Make sure phone and computer are on same WiFi');
console.log('3. Scan QR code with Expo Go app when it appears\n');

console.log('Starting development server...\n');

// Start expo with tunnel for better connectivity
const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
    stdio: 'inherit',
    shell: true
});

expo.on('error', (error) => {
    console.log('\n❌ Error starting Expo. Installing Expo CLI...');
    const install = spawn('npm', ['install', '-g', '@expo/cli'], {
        stdio: 'inherit',
        shell: true
    });
    
    install.on('close', () => {
        console.log('✅ Expo CLI installed. Run this script again.');
    });
});

expo.on('close', (code) => {
    console.log(`\nExpo server stopped with code ${code}`);
});