const path = require("path");
const fs = require("fs");

const SHORT_WINDOWS_ROOT = "W:\\client";
const LONG_PATH_MARKER = path.normalize(
  "Desktop\\workplace\\personal\\citations-widget-app\\client",
);

function resolveProjectRoot() {
  const apkBuild = process.env.CITATIONS_APK_BUILD === "1";
  const onLongDesktopPath = path.normalize(__dirname).includes(LONG_PATH_MARKER);

  // Match metro.config.js: only use W: for day-to-day Metro on the Desktop path.
  // APK builds and short copies (e.g. C:\cw) must keep their own root.
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

module.exports = function (api) {
  api.cache(() => `${process.env.CITATIONS_APK_BUILD === "1"}:${resolveProjectRoot()}`);
  const projectRoot = resolveProjectRoot();

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: [path.join(projectRoot, "src")],
          alias: {
            "@": path.join(projectRoot, "src"),
            "@/assets": path.join(projectRoot, "assets"),
          },
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        },
      ],
    ],
  };
};
