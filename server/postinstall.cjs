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
  const output = execSync("npx prisma migrate deploy", {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
  });
  process.stdout.write(output);
} catch (error) {
  const combined = `${error.stdout ?? ""}${error.stderr ?? ""}`;

  // DATABASE_URL simply isn't defined at all — the expected, unavoidable case in CI and
  // the Docker image build (no .env is present there). Don't print Prisma's validation
  // error for this; it looks alarming but there's nothing to fix.
  if (combined.includes("P1012") && combined.includes("DATABASE_URL")) {
    console.log("[postinstall] Skipping `prisma migrate deploy` — DATABASE_URL isn't set (expected in CI/Docker builds).");
    process.exit(0);
  }

  // Anything else (unreachable database, a genuinely failed migration, ...) is worth
  // seeing, so show Prisma's real output instead of swallowing it silently.
  process.stdout.write(combined);
  console.warn(
    "\n[postinstall] `prisma migrate deploy` did not complete — continuing anyway. " +
      "If your dev database should be reachable, check it's running and DATABASE_URL is correct " +
      "(see the error above), then re-run `npm run db:migrate:deploy` in server/.\n",
  );
}
