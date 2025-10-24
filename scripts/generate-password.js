#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 Password Hash Generator\n');
console.log('This will generate a bcrypt hash for your password.');
console.log('Use this hash as AUTH_PASSWORD_HASH in your .env.local file.\n');

rl.question('Enter your desired password: ', (password) => {
  if (!password || password.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters long.\n');
    rl.close();
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);

  console.log('\n✅ Password hash generated successfully!\n');
  console.log('Copy this hash to your .env.local file:\n');
  console.log(`AUTH_PASSWORD_HASH=${hash}\n`);

  rl.close();
});
