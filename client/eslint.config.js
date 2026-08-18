// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

/**
 * Metro resolves `import '@/widgets/CitationWidget'` to `CitationWidget.ios.tsx`.
 * `eslint-config-expo` only teaches those platform suffixes to the *node*
 * resolver, while the `@/*` paths are resolved by the TypeScript resolver — so
 * platform-only modules read as unresolved. Feed both resolvers the same list.
 * `tsconfig.json`'s `moduleSuffixes` does the equivalent for `tsc`.
 */
const resolverExtensions = ['.android', '.ios', '.web', '.native', ''].flatMap((platform) =>
  ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx', '.d.ts'].map(
    (extension) => `${platform}${extension}`,
  ),
);

module.exports = defineConfig([
  expoConfig,
  {
    settings: {
      'import/resolver': {
        typescript: { extensions: resolverExtensions },
        node: { extensions: resolverExtensions },
      },
    },
  },
  {
    ignores: ["dist/*"],
  }
]);
