#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generatePasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

console.log('🔐 Admin Password Hash Generator');
console.log('================================\n');

rl.question('Do you want to (1) use an existing password or (2) generate a new secure password? [1/2]: ', (choice) => {
  if (choice === '2') {
    const newPassword = generateSecurePassword();
    const hash = generatePasswordHash(newPassword);
    
    console.log('\n✅ Generated secure password and hash:');
    console.log('=====================================');
    console.log(`Password: ${newPassword}`);
    console.log(`Hash: ${hash}`);
    console.log('\n📝 Add this to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('\n⚠️  IMPORTANT: Save the password securely and never commit it to version control!');
    
    rl.close();
  } else {
    rl.question('Enter your admin password: ', (password) => {
      if (!password || password.length < 8) {
        console.log('\n❌ Password must be at least 8 characters long.');
        rl.close();
        return;
      }
      
      const hash = generatePasswordHash(password);
      
      console.log('\n✅ Password hash generated:');
      console.log('===========================');
      console.log(`Hash: ${hash}`);
      console.log('\n📝 Add this to your .env file:');
      console.log(`ADMIN_PASSWORD_HASH=${hash}`);
      console.log('\n⚠️  IMPORTANT: Keep your password secure and never commit it to version control!');
      
      rl.close();
    });
  }
});

rl.on('close', () => {
  console.log('\n🔒 Password hash generation complete.');
  process.exit(0);
});
