// Runs after `npm install`. `prisma generate` must succeed (it only needs the schema
// file, not a live database) — a failure here is a real problem and should fail the
// install. `prisma migrate deploy` only works when DATABASE_URL is set AND reachable,
// which isn't true in CI or during the Docker image build — those environments still
// need `npm ci` to succeed, so a failed migrate attempt there is expected and swallowed.
//
// This is a plain Node script (not `&&`/`||` shell chaining) because `|| true` isn't
// portable: cmd.exe on Windows has no `true` command, only POSIX shells do.
const { execSync } = require("node:child_process");

execSync("npx prisma generate", { stdio: "inherit" });

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch {
  console.warn(
    "\n[postinstall] `prisma migrate deploy` did not complete — continuing anyway. " +
      "This is expected when DATABASE_URL isn't set or reachable (e.g. CI, Docker image build). " +
      "If you're running this locally with your dev database up, re-run `npm run db:migrate:deploy` " +
      "in server/ to see the real error.\n",
  );
}
