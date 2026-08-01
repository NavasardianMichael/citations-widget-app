/**
 * Android prebuild/APK fixes:
 * 1. Align androidx.work so work-runtime:2.8.x and work-runtime-ktx:2.7.x don't clash
 *    (expo-widgets/Glance vs react-native-android-widget).
 * 2. Ensure MainActivity/MainApplication Kotlin `package` matches android.package
 *    (Expo can leave `package com.app` in files under the real package path).
 * 3. Enable BuildConfig generation (AGP 8+ defaults it off).
 */
const {
  withAppBuildGradle,
  withDangerousMod,
  withProjectBuildGradle,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const WORK_MARKER_START = "// begin withAndroidWorkManagerAlign";
const WORK_MARKER_END = "// end withAndroidWorkManagerAlign";

const WORK_BLOCK = `${WORK_MARKER_START}
subprojects { subproject ->
  subproject.configurations.configureEach { configuration ->
    configuration.resolutionStrategy.eachDependency { details ->
      if (details.requested.group == "androidx.work") {
        details.useVersion("2.8.1")
        details.because("Align WorkManager (expo-widgets Glance ktx 2.7.1 vs android-widget 2.8.1)")
      }
    }
  }
}
${WORK_MARKER_END}
`;

function upsertProjectGradleBlock(contents) {
  const start = contents.indexOf(WORK_MARKER_START);
  const end = contents.indexOf(WORK_MARKER_END);
  if (start !== -1 && end !== -1) {
    return (
      contents.slice(0, start) +
      WORK_BLOCK.trimEnd() +
      "\n" +
      contents.slice(end + WORK_MARKER_END.length).replace(/^\r?\n/, "")
    );
  }
  return `${contents.trimEnd()}\n\n${WORK_BLOCK}`;
}

function ensureBuildConfigFeature(contents) {
  if (/buildFeatures\s*\{[^}]*buildConfig/s.test(contents)) {
    return contents;
  }
  if (/android\s*\{/.test(contents)) {
    return contents.replace(
      /android\s*\{/,
      `android {
    buildFeatures {
        buildConfig true
    }`,
    );
  }
  return contents;
}

function fixKotlinPackageDeclarations(projectRoot, packageName) {
  if (!packageName) return;
  const javaRoot = path.join(projectRoot, "android", "app", "src", "main", "java");
  for (const fileName of ["MainActivity.kt", "MainApplication.kt"]) {
    const matches = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === fileName) matches.push(full);
      }
    };
    walk(javaRoot);
    for (const filePath of matches) {
      const original = fs.readFileSync(filePath, "utf8");
      const updated = original.replace(
        /^package\s+[^\r\n]+/m,
        `package ${packageName}`,
      );
      if (updated !== original) {
        fs.writeFileSync(filePath, updated, "utf8");
      }
    }
  }
}

function withAndroidWorkManagerAlign(config) {
  config = withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        "withAndroidWorkManagerAlign: expected groovy android/build.gradle",
      );
    }
    cfg.modResults.contents = upsertProjectGradleBlock(cfg.modResults.contents);
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        "withAndroidWorkManagerAlign: expected groovy android/app/build.gradle",
      );
    }
    cfg.modResults.contents = ensureBuildConfigFeature(cfg.modResults.contents);
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      fixKotlinPackageDeclarations(
        cfg.modRequest.projectRoot,
        cfg.android?.package ?? null,
      );
      return cfg;
    },
  ]);

  return config;
}

module.exports = withAndroidWorkManagerAlign;
