/**
 * Keep Android home-widget providers in sync with app.json after
 * react-native-android-widget regenerates files on prebuild.
 *
 * The upstream plugin mostly *adds* providers and does not remove retired
 * ones (e.g. old 2×2 / 4×2 / Fullscreen). Orphans stay in the APK, show up in
 * the picker, and render blank because JS only handles ANDROID_WIDGET_NAMES.
 *
 * Also:
 * - Forces resizeMode=horizontal|vertical
 * - Sets minResize* (110dp) so widgets can shrink without changing picker size
 * - Drops maxResize* caps
 */
const {
  withDangerousMod,
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MIN_RESIZE = "110dp";

function configuredWidgetNames(config) {
  const plugins = config.plugins ?? [];
  for (const entry of plugins) {
    if (!Array.isArray(entry)) continue;
    const [name, options] = entry;
    if (name !== "react-native-android-widget") continue;
    const widgets = options?.widgets;
    if (!Array.isArray(widgets)) return [];
    return widgets
      .map((w) => (typeof w?.name === "string" ? w.name : null))
      .filter(Boolean);
  }
  return [];
}

function patchWidgetProviderXml(contents) {
  let next = contents;

  if (/android:resizeMode=/.test(next)) {
    next = next.replace(
      /android:resizeMode="[^"]*"/,
      'android:resizeMode="horizontal|vertical"',
    );
  } else {
    next = next.replace(
      /(<appwidget-provider\b[^>]*)(>)/,
      `$1\n    android:resizeMode="horizontal|vertical"$2`,
    );
  }

  next = next.replace(/\s*android:maxResizeWidth="[^"]*"/g, "");
  next = next.replace(/\s*android:maxResizeHeight="[^"]*"/g, "");

  if (/android:minResizeWidth=/.test(next)) {
    next = next.replace(
      /android:minResizeWidth="[^"]*"/,
      `android:minResizeWidth="${MIN_RESIZE}"`,
    );
  } else {
    next = next.replace(
      /(android:minHeight="[^"]*")/,
      `$1\n    android:minResizeWidth="${MIN_RESIZE}"`,
    );
  }

  if (/android:minResizeHeight=/.test(next)) {
    next = next.replace(
      /android:minResizeHeight="[^"]*"/,
      `android:minResizeHeight="${MIN_RESIZE}"`,
    );
  } else {
    next = next.replace(
      /(android:minResizeWidth="[^"]*")/,
      `$1\n    android:minResizeHeight="${MIN_RESIZE}"`,
    );
  }

  return next;
}

function removeOrphanProviderFiles(projectRoot, allowedNames) {
  const allowedLower = new Set(allowedNames.map((n) => n.toLowerCase()));
  const xmlDir = path.join(projectRoot, "app/src/main/res/xml");
  if (fs.existsSync(xmlDir)) {
    for (const name of fs.readdirSync(xmlDir)) {
      const match = /^widgetprovider_(.+)\.xml$/i.exec(name);
      if (!match) continue;
      if (allowedLower.has(match[1].toLowerCase())) continue;
      fs.unlinkSync(path.join(xmlDir, name));
    }
  }

  const javaRoot = path.join(projectRoot, "app/src/main/java");
  if (!fs.existsSync(javaRoot)) return;

  const stack = [javaRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/^CitationWidget.*\.java$/i.test(entry.name)) continue;
      const className = entry.name.replace(/\.java$/i, "");
      if (allowedNames.includes(className)) continue;
      // Keep only configured CitationWidget* providers; delete retired ones.
      if (
        className === "CitationWidget" ||
        className.startsWith("CitationWidget")
      ) {
        fs.unlinkSync(full);
      }
    }
  }
}

function stripOrphanStrings(projectRoot, allowedNames) {
  const stringsPath = path.join(
    projectRoot,
    "app/src/main/res/values/strings.xml",
  );
  if (!fs.existsSync(stringsPath)) return;
  const allowedKeys = new Set(
    allowedNames.map((n) => `widget_${n.toLowerCase()}_description`),
  );
  let xml = fs.readFileSync(stringsPath, "utf8");
  xml = xml.replace(
    /\s*<string name="(widget_citationwidget[^"]*_description)"[^>]*>[\s\S]*?<\/string>/gi,
    (full, key) => (allowedKeys.has(key.toLowerCase()) ? full : ""),
  );
  fs.writeFileSync(stringsPath, xml);
}

function withAndroidWidgetResize(config) {
  const allowedNames = configuredWidgetNames(config);

  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    if (!app.receiver) return mod;

    app.receiver = app.receiver.filter((receiver) => {
      const name = receiver.$?.["android:name"] ?? "";
      const short = name.split(".").pop();
      if (!short || !short.startsWith("CitationWidget")) return true;
      return allowedNames.includes(short);
    });

    return mod;
  });

  config = withDangerousMod(config, [
    "android",
    async (dangerousConfig) => {
      const projectRoot = dangerousConfig.modRequest.platformProjectRoot;
      if (allowedNames.length > 0) {
        removeOrphanProviderFiles(projectRoot, allowedNames);
        stripOrphanStrings(projectRoot, allowedNames);
      }

      const xmlDir = path.join(projectRoot, "app/src/main/res/xml");
      if (fs.existsSync(xmlDir)) {
        for (const name of fs.readdirSync(xmlDir)) {
          if (!/^widgetprovider_.*\.xml$/i.test(name)) continue;
          const filePath = path.join(xmlDir, name);
          const before = fs.readFileSync(filePath, "utf8");
          const after = patchWidgetProviderXml(before);
          if (after !== before) fs.writeFileSync(filePath, after);
        }
      }

      return dangerousConfig;
    },
  ]);

  return config;
}

module.exports = withAndroidWidgetResize;
module.exports.patchWidgetProviderXml = patchWidgetProviderXml;
