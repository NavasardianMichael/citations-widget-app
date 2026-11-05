const fs = require('fs');
const path = require('path');

// Environment name, from any of:
//   npm run envtobase64 -- production
//   npm run envtobase64 -- --production
//   npm run envtobase64 --production   (npm eats the flag but sets NODE_ENV=production)
const arg = process.argv.slice(2).find((a) => a.replace(/^-+/, ''));
const env = arg ? arg.replace(/^-+/, '') : process.env.NODE_ENV;

const serverDir = path.join(__dirname, '..');

// Most specific first: .env.production.local → .env.production → .env
const candidates = env ? [`.env.${env}.local`, `.env.${env}`, '.env'] : ['.env'];
const envFile = candidates.find((f) => fs.existsSync(path.join(serverDir, f)));

if (!envFile) {
  console.error(`None of these exist in ${serverDir}: ${candidates.join(', ')}`);
  process.exit(1);
}
if (env && envFile === '.env') {
  console.warn(`No .env.${env}.local or .env.${env} found, falling back to .env`);
}

const envPath = path.join(serverDir, envFile);

const content = fs.readFileSync(envPath, 'utf-8').replace(/\r\n/g, '\n');
const base64 = Buffer.from(content).toString('base64');

console.log(`\nEncoded ${envFile} to base64 (paste into GitHub secret ENV_FILE_BASE64):\n`);
console.log(base64);
console.log('\n');
