const path = require("path");
const fs = require("fs");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// subst W: -> repo root (see ensure-windows-path.ps1).
// Junctions (C:\cwa) fail because Node still resolves to the long Desktop path.
const SHORT_WINDOWS_ROOT = "W:\\client";
const LONG_PATH_MARKER = path.normalize("Desktop\\workplace\\personal\\citations-widget-app\\client");

// Metro uses forward slashes; path.relative on Windows uses backslashes.
// That breaks react-native-css-interop's injectData path check on Windows.
const originalRelative = path.relative.bind(path);
path.relative = (...args) => originalRelative(...args).split(path.sep).join("/");

// Release/APK gradle bundling must stay on one drive letter. The APK script sets this
// and temporarily unmaps W: so Node/Gradle do not mix W:\ and C:\ roots.
const apkBuild = process.env.CITATIONS_APK_BUILD === "1";
const onLongDesktopPath = path.normalize(__dirname).includes(LONG_PATH_MARKER);

function resolveProjectRoot() {
  // Only redirect Desktop → W: for day-to-day Metro. Short copies (e.g. C:\cw)
  // and APK builds must keep their own root or aliases resolve across drives.
  if (
    !apkBuild &&
    onLongDesktopPath &&
    process.platform === "win32" &&
    fs.existsSync(path.join(SHORT_WINDOWS_ROOT, "package.json"))
  ) {
    return SHORT_WINDOWS_ROOT;
  }
  return __dirname;
}

const projectRoot = resolveProjectRoot();

// Starting Expo from the long Desktop path while W: is mapped loads react-native
// twice (Desktop + W:) → Hermes "TypeError: property is not writable".
if (
  !apkBuild &&
  process.platform === "win32" &&
  projectRoot === SHORT_WINDOWS_ROOT &&
  onLongDesktopPath
) {
  console.error(`
╔════════════════════════════════════════════════════════════════╗
║  Start Metro via npm start (uses W:\\client).                   ║
║  Do not run npx expo start from the Desktop path.              ║
║                                                                ║
║  Ctrl+C, then:                                                 ║
║    cd ...\\citations-widget-app\\client                          ║
║    npm start                                                   ║
╚════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

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
