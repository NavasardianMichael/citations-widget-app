const path = require("path");

const SHORT_WINDOWS_ROOT = "W:\\client";

function resolveProjectRoot() {
  const fs = require("fs");
  if (process.platform === "win32" && fs.existsSync(path.join(SHORT_WINDOWS_ROOT, "package.json"))) {
    return SHORT_WINDOWS_ROOT;
  }
  return path.join(__dirname);
}

module.exports = function (api) {
  api.cache(true);
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
