#!/usr/bin/env node

// Simple script to start Expo without interactive prompts
const { spawn } = require('child_process');

const expo = spawn('npx', ['expo', 'start', '--non-interactive'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

expo.on('close', (code) => {
  console.log(`Expo process exited with code ${code}`);
});