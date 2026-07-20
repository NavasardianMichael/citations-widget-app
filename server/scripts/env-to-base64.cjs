const fs = require('fs');
const path = require('path');

const env = process.argv[2];

// Determine which env file to use
let envFile;
let envPath;

if (env) {
  // e.g. .env.production or .env.development
  envFile = `.env.${env}`;
  envPath = path.join(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    console.warn(`File not found: ${envFile}, falling back to .env`);
    envFile = '.env';
    envPath = path.join(__dirname, '..', envFile);
  }
} else {
  // No environment specified, use default .env
  envFile = '.env';
  envPath = path.join(__dirname, '..', envFile);
}

if (!fs.existsSync(envPath)) {
  console.error(`File not found: ${envPath}`);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf-8').replace(/\r\n/g, '\n');
const base64 = Buffer.from(content).toString('base64');

console.log(`\nEncoded ${envFile} to base64 (paste into GitHub secret ENV_FILE_BASE64):\n`);
console.log(base64);
console.log('\n');
