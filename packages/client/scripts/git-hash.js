const fs = require('fs');
const { execSync } = require('child_process');

try {
  const hash = execSync('git rev-parse --short HEAD').toString().trim();
  const envContent = `VITE_GIT_COMMIT_HASH=${hash}\n`;
  fs.writeFileSync('.env.local', envContent, { flag: 'w' });
  console.log('Git commit hash saved:', hash);
} catch (err) {
  console.error('Failed to get git commit hash', err);
}

