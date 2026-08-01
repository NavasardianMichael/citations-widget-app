/**
 * Ensure every AppWidget provider stays freely resizable after
 * react-native-android-widget regenerates XML on prebuild.
 *
 * Keep minWidth/minHeight as the picker/placement size (from app.json).
 * Shrink-to-resize uses minResize* (110dp ≈ 2×2), not min* — otherwise the
 * launcher lists and places every variant as 2×2.
 *
 * - Forces resizeMode=horizontal|vertical
 * - Sets minResize* below the default cell size
 * - Drops maxResize* (tight caps disable resize when the grid exceeds them)
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MIN_RESIZE = "110dp";

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

function withAndroidWidgetResize(config) {
  return withDangerousMod(config, [
    "android",
    async (dangerousConfig) => {
      const xmlDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      if (!fs.existsSync(xmlDir)) {
        return dangerousConfig;
      }

      for (const name of fs.readdirSync(xmlDir)) {
        if (!/^widgetprovider_.*\.xml$/i.test(name)) continue;
        const filePath = path.join(xmlDir, name);
        const before = fs.readFileSync(filePath, "utf8");
        const after = patchWidgetProviderXml(before);
        if (after !== before) {
          fs.writeFileSync(filePath, after);
        }
      }

      return dangerousConfig;
    },
  ]);
}

module.exports = withAndroidWidgetResize;
module.exports.patchWidgetProviderXml = patchWidgetProviderXml;
