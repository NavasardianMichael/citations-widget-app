const path = require("path");
const fs = require("fs");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// subst W: -> repo root (see ensure-windows-path.ps1).
// Junctions (C:\cwa) fail because Node still resolves to the long Desktop path.
const SHORT_WINDOWS_ROOT = "W:\\client";

// Metro uses forward slashes; path.relative on Windows uses backslashes.
// That breaks react-native-css-interop's injectData path check on Windows.
const originalRelative = path.relative.bind(path);
path.relative = (...args) => originalRelative(...args).split(path.sep).join("/");

function resolveProjectRoot() {
  if (process.platform === "win32" && fs.existsSync(path.join(SHORT_WINDOWS_ROOT, "package.json"))) {
    return SHORT_WINDOWS_ROOT;
  }
  return __dirname;
}

const projectRoot = resolveProjectRoot();

if (process.platform === "win32" && projectRoot === SHORT_WINDOWS_ROOT) {
  process.chdir(projectRoot);
}

const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];
config.resolver.unstable_enablePackageExports = false;
config.resolver.alias = {
  ...(config.resolver.alias ?? {}),
  // More specific than "@" — assets live at projectRoot/assets, not src/assets.
  "@/assets": path.join(projectRoot, "assets"),
  "@": path.join(projectRoot, "src"),
};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "react-native": path.join(projectRoot, "node_modules", "react-native"),
};

const nativeWindConfig = withNativeWind(config, {
  input: path.join(projectRoot, "src", "global.css"),
});

const innerTransformerPath = nativeWindConfig.transformer.cssInterop_transformerPath;

nativeWindConfig.transformerPath = require.resolve("./metro-css-interop-transformer");
nativeWindConfig.transformer = {
  ...nativeWindConfig.transformer,
  cssInterop_transformerPath: innerTransformerPath,
};

module.exports = nativeWindConfig;
