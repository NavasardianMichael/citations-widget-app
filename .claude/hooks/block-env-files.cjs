// PreToolUse hook: keep Claude away from real env files (.env, .env.production.local, …).
// *.env.example stays readable — it documents the variables and holds no secrets.
let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const ti = input.tool_input || {};

  // ".env" as its own path segment / word, with optional ".suffix" parts.
  // Not preceded by a word char, so `process.env.X` and `import.meta.env` don't match.
  const ENV_REF = /(?<![\w$])\.env(?:\.[\w-]+)*(?![\w-])/g;
  const isAllowed = (name) => /\.example$/i.test(name);

  const refs = [];
  const scan = (value) => {
    if (typeof value !== 'string') return;
    for (const m of value.matchAll(ENV_REF)) if (!isAllowed(m[0])) refs.push(m[0]);
  };

  // File tools: path fields. Shell tools: the command text. Grep: path/glob.
  [ti.file_path, ti.notebook_path, ti.path, ti.glob, ti.command].forEach(scan);

  if (refs.length === 0) process.exit(0);

  const found = [...new Set(refs)].join(', ');
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Blocked: ${found} may hold secrets. Reading or writing .env* files is not allowed ` +
          `(except *.env.example). Use the matching .env.example for variable names, ` +
          `or ask the user to make the change.`,
      },
    }),
  );
  process.exit(0);
});
