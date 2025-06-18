#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building Disney Pin Checker for production...');

// Build the client
console.log('Building client...');
execSync('vite build', { stdio: 'inherit' });

// Build the production server
console.log('Building production server...');
execSync('esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

console.log('Production build complete!');