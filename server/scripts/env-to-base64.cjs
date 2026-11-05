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

// The deploy only requires DATABASE_URL — it derives POSTGRES_USER/PASSWORD/DB
// from it when absent ("Prepare server env file" in deploy.yml). Catch a missing
// or incomplete URL here instead of in a failed production deploy.
const urlLine = content.match(/^DATABASE_URL=(.*)$/m);
const databaseUrl = urlLine ? urlLine[1].trim().replace(/^["']|["']$/g, '') : '';
let urlOk = false;
try {
  const u = new URL(databaseUrl);
  urlOk = Boolean(u.username && u.password && u.pathname.replace(/^\//, ''));
} catch {
  urlOk = false;
}
if (!urlOk) {
  console.error(
    `${envFile}: DATABASE_URL is missing or lacks user, password or database name ` +
      '(expected postgresql://user:password@host:port/db).',
  );
  console.error('The deploy would fail. Fix it in that file and run this again.');
  process.exit(1);
}

const base64 = Buffer.from(content).toString('base64');

console.log(`\nEncoded ${envFile} to base64 (paste into GitHub secret ENV_FILE_BASE64):\n`);
console.log(base64);
console.log('\n');
