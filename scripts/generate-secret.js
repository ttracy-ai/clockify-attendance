#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n🔑 Auth Secret Generator\n');
console.log('This will generate a random secret key for session management.');
console.log('Use this as AUTH_SECRET in your .env.local file.\n');

const secret = crypto.randomBytes(32).toString('hex');

console.log('✅ Secret generated successfully!\n');
console.log('Copy this to your .env.local file:\n');
console.log(`AUTH_SECRET=${secret}\n`);
