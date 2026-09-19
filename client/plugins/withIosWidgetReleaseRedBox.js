/**
 * Six fixes to `expo-widgets`' iOS widget host, none of which are configurable:
 *
 * - The App Group directory it hands out is created with iOS's default data
 *   protection, so everything written there — the snapshot, the copied Armenian
 *   faces — is unreadable while the device is locked, which is exactly when a
 *   widget renders. Protection is dropped on that directory and its contents.
 *
 * - Writes into the App Group are never flushed, so they sit in the app's memory
 *   until iOS chooses to persist them and a force-quit drops them entirely. The
 *   extension is a separate process reading the same container, which is how it
 *   saw no timeline while the layout — written at launch, long since flushed —
 *   arrived fine.
 *
 * - Release (TestFlight) builds render layout errors as `EmptyView` — a blank
 *   widget — so RedBox and SwiftUI prop-decode failures stay diagnosable.
 * - An empty timeline leaves WidgetKit's own placeholder (a gray "-") on screen
 *   forever, so at least one entry is always handed back.
 * - WidgetKit redacts the entry view into gray skeleton bars, and the app has to
 *   run once before the layout exists in the App Group; the widget body is
 *   unredacted and the missing-layout branch explains that in Armenian.
 * - The extension has no access to the app's `expo-font` registrations, so the
 *   Armenian quote faces and icon glyphs it copies into the App Group are
 *   registered with Core Text before the layout names them.
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "citations-widget-release-redbox";

const DEBUG_BLOCK = `#if DEBUG
    case "RedBoxView":
      render(RedBoxView.self, RedBoxViewProps.self) { redBoxProps in
        redBoxProps.source = name
        redBoxProps.kind = kind
      }
    default:
      ZStack {
        Color.red.opacity(0.5)
        Text("Unable to get the view for: \\(node["type"] as? String ?? "undefined")")
      }
#else
    default:
      EmptyView()
#endif`;

const RELEASE_BLOCK = `    // ${MARKER}
    case "RedBoxView":
      render(RedBoxView.self, RedBoxViewProps.self) { redBoxProps in
        redBoxProps.source = name
        redBoxProps.kind = kind
      }
    default:
      ZStack {
        Color.red.opacity(0.5)
        Text("Unable to get the view for: \\(node["type"] as? String ?? "undefined")")
          .foregroundStyle(.white)
      }`;

const CATCH_EMPTY = `        return AnyView(EmptyView())
      } catch {
        return AnyView(EmptyView())
      }`;

const CATCH_VISIBLE = `        return AnyView(
          ZStack {
            Color.orange
            Text("missing props")
              .foregroundStyle(.white)
          }
        )
      } catch {
        return AnyView(
          ZStack {
            Color.red
            Text(String(describing: error))
              .foregroundStyle(.white)
              .font(.system(size: 11))
              .padding(8)
          }
        )
      }`;

const EMPTY_TIMELINE = `    let entries = parseTimeline(identifier: groupIdentifier, name: name, family: context.family)

    let timeline = Timeline<WidgetsTimelineEntry>(entries: entries, policy: .atEnd)
    completion(timeline)`;

const NONEMPTY_TIMELINE = `    let entries = parseTimeline(identifier: groupIdentifier, name: name, family: context.family)
    // ${MARKER}: an empty timeline never leaves WidgetKit's placeholder ("-")
    let resolved = entries.isEmpty
      ? [WidgetsTimelineEntry(date: Date(), name: name, props: nil, entryIndex: nil)]
      : entries
    let timeline = Timeline<WidgetsTimelineEntry>(entries: resolved, policy: .atEnd)
    completion(timeline)`;

const STORAGE_SET = `    defaults.set(value, forKey: key)
  }`;

const STORAGE_SET_SYNCED = `    defaults.set(value, forKey: key)
    // ${MARKER}: force the group container to disk. Without this the value only
    // lives in this process's memory until iOS decides to persist it, so the
    // widget extension — a separate process reading the same App Group — sees
    // nothing, and a force-quit loses the write outright. Deprecated since
    // iOS 12, and still the only way to flush on demand.
    defaults.synchronize()
  }`;

const WIDGETS_DIRECTORY = `      do {
        try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
        return directoryUrl.absoluteString
      } catch {
        return nil
      }`;

const WIDGETS_DIRECTORY_UNPROTECTED = `      do {
        try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
        // ${MARKER}: drop data protection on this directory and everything in it.
        //
        // A widget renders while the device is locked, and iOS makes files
        // written with the default protection class unreadable in exactly that
        // state — the extension reported this container's snapshot as absent
        // minutes after the app had written 1365 bytes to it, and the Armenian
        // faces beside it never loaded either. New files inherit the
        // directory's class; the ones already written keep whatever they were
        // created with, so they are relaxed individually. Nothing here is
        // secret: it is a quote already on the home screen.
        try? FileManager.default.setAttributes(
          [.protectionKey: FileProtectionType.none],
          ofItemAtPath: directoryUrl.path
        )
        if let existing = try? FileManager.default.contentsOfDirectory(atPath: directoryUrl.path) {
          for name in existing {
            try? FileManager.default.setAttributes(
              [.protectionKey: FileProtectionType.none],
              ofItemAtPath: directoryUrl.appendingPathComponent(name).path
            )
          }
        }
        return directoryUrl.absoluteString
      } catch {
        return nil
      }`;

const RELOAD_ALL = `    Function("reloadAllWidgets") {
      WidgetCenter.shared.reloadAllTimelines()
    }`;

const RELOAD_ALL_PLUS_RELAX = `    Function("reloadAllWidgets") {
      WidgetCenter.shared.reloadAllTimelines()
    }

    // ${MARKER}: strip data protection from everything the extension has to read.
    //
    // Relaxing the directory is not enough — a file does not reliably inherit
    // its directory's class, so the snapshot and the copied faces are written
    // with the default one and become unreadable while the device is locked,
    // which is exactly when a widget renders. The extension reported the
    // snapshot as absent on a fresh install for that reason, and as present on
    // the next launch, when the directory pass had had a chance to catch the
    // previous launch's file. Call this after writing, not before.
    Function("relaxWidgetFileProtection") { () -> Int in
      guard let identifier = WidgetsStorage.appGroupIdentifier,
            let container = FileManager.default.containerURL(
              forSecurityApplicationGroupIdentifier: identifier
            ) else {
        return -1
      }
      let directoryUrl = container.appendingPathComponent("ExpoWidgets", isDirectory: true)
      let unprotected: [FileAttributeKey: Any] = [.protectionKey: FileProtectionType.none]
      try? FileManager.default.setAttributes(unprotected, ofItemAtPath: directoryUrl.path)

      guard let names = try? FileManager.default.contentsOfDirectory(atPath: directoryUrl.path) else {
        return 0
      }
      var relaxed = 0
      for name in names {
        let path = directoryUrl.appendingPathComponent(name).path
        if (try? FileManager.default.setAttributes(unprotected, ofItemAtPath: path)) != nil {
          relaxed += 1
        }
      }
      return relaxed
    }`;

function patchWidgetsModule(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(WIDGETS_DIRECTORY)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: WidgetsModule.swift widgetsDirectory body not found",
    );
  }
  if (!contents.includes(RELOAD_ALL)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: WidgetsModule.swift reloadAllWidgets not found",
    );
  }
  return contents
    .replace(WIDGETS_DIRECTORY, WIDGETS_DIRECTORY_UNPROTECTED)
    .replace(RELOAD_ALL, RELOAD_ALL_PLUS_RELAX);
}

function patchWidgetsStorage(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(STORAGE_SET)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: WidgetsStorage.swift setter body not found",
    );
  }
  return contents.split(STORAGE_SET).join(STORAGE_SET_SYNCED);
}

const TIMELINE_WRITE = `    WidgetsStorage.set(entries.map { $0.toDictionary() }, forKey: "__expo_widgets_\\(name)_timeline")

    self.reload()
  }`;

const TIMELINE_WRITE_MIRRORED = `    WidgetsStorage.set(entries.map { $0.toDictionary() }, forKey: "__expo_widgets_\\(name)_timeline")
    // ${MARKER}: mirror the timeline as text. The dictionary above survives in
    // this process — the app reads its own write straight back — but does not
    // reach the widget extension, which finds the key empty. A plain string
    // crosses reliably, which is how the layout has always arrived.
    WidgetsStorage.set(Self.encodeForAppGroup(entries), forKey: "__expo_widgets_\\(name)_timeline_json")

    self.reload()
  }

  // ${MARKER}: JSON text built only from primitives, so nothing bridge-backed
  // can make the value unserializable on the way to the App Group container.
  private static func encodeForAppGroup(_ entries: [WidgetsJSTimelineEntry]) -> String {
    let payload: [[String: Any]] = entries.map { entry in
      var props: [String: String] = [:]
      for (key, value) in entry.props {
        props[key] = value as? String ?? String(describing: value)
      }
      return ["timestamp": entry.timestamp, "props": props]
    }
    guard let data = try? JSONSerialization.data(withJSONObject: payload),
          let json = String(data: data, encoding: .utf8) else {
      return ""
    }
    return json
  }`;

function patchWidgetObject(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(TIMELINE_WRITE)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: WidgetObject.swift updateTimeline body not found",
    );
  }
  let next = contents.replace(TIMELINE_WRITE, TIMELINE_WRITE_MIRRORED);
  if (!/^import Foundation$/m.test(next)) {
    next = next.replace("import WidgetKit", "import WidgetKit\nimport Foundation");
  }
  return next;
}

const TIMELINE_READ = `  let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_\\(name)_timeline") ?? []`;

const TIMELINE_READ_MIRRORED = `  // ${MARKER}: the container file wins — see readSnapshotFromAppGroup. The two
  // UserDefaults paths stay behind it so nothing regresses if it is absent.
  if let props = readSnapshotFromAppGroup(name: name) {
    return [WidgetsTimelineEntry(date: Date(), name: name, props: props, entryIndex: 0)]
  }

  let timeline = decodeTimelineFromAppGroup(name: name)
    ?? WidgetsStorage.getArray(forKey: "__expo_widgets_\\(name)_timeline")
    ?? []`;

const DECODE_HELPER = `// ${MARKER}: the App Group's container is the channel that actually crosses
// into this process. UserDefaults did not: a dictionary of the snapshot's ~40
// values reached the writing process's own read with 3 keys left and this one
// with no entry at all, and mirroring it as a single string did not arrive
// either. Files do — the Armenian faces are copied into this same directory by
// the app and loaded from it here — so the app writes the snapshot as JSON text
// beside them and this reads it back.
func readSnapshotFromAppGroup(name: String) -> [String: Any]? {
  guard let identifier = WidgetsStorage.appGroupIdentifier,
        let container = FileManager.default.containerURL(
          forSecurityApplicationGroupIdentifier: identifier
        ) else {
    return nil
  }
  let url = container
    .appendingPathComponent("ExpoWidgets", isDirectory: true)
    .appendingPathComponent("\\(name)-snapshot.json")
  // The app replaces this file in place rather than atomically, so a read can
  // land mid-write, and the layout throws while parsing a partial string — a
  // one-character read is what put the widget back on its empty state. Checking
  // the first and last brace rejects a truncated write without being able to
  // reject a complete object: a full \`JSONSerialization\` parse was tried here
  // first and threw out a perfectly good 1655-byte file, which cost a build.
  guard let data = try? Data(contentsOf: url),
        let json = String(data: data, encoding: .utf8),
        json.hasPrefix("{"),
        json.hasSuffix("}") else {
    return nil
  }
  return ["json": json]
}

// ${MARKER}: counterpart to WidgetObject.encodeForAppGroup.
func decodeTimelineFromAppGroup(name: String) -> [Any]? {
  guard let json = WidgetsStorage.getString(forKey: "__expo_widgets_\\(name)_timeline_json"),
        !json.isEmpty,
        let data = json.data(using: .utf8),
        let array = try? JSONSerialization.jsonObject(with: data) as? [Any] else {
    return nil
  }
  return array
}

func parseTimeline(`;

function patchTimelineUtils(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(TIMELINE_READ)) {
    throw new Error("withIosWidgetReleaseRedBox: Utils.swift timeline read not found");
  }
  return contents
    .replace(TIMELINE_READ, TIMELINE_READ_MIRRORED)
    .replace("func parseTimeline(", DECODE_HELPER);
}

function patchDynamicView(contents) {
  if (contents.includes(MARKER) && contents.includes("RedBoxView")) return contents;
  let next = contents;
  if (!next.includes(DEBUG_BLOCK)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: DynamicView.swift DEBUG/EmptyView block not found",
    );
  }
  next = next.replace(DEBUG_BLOCK, RELEASE_BLOCK);
  if (!next.includes(CATCH_EMPTY)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: DynamicView.swift EmptyView catch not found",
    );
  }
  return next.replace(CATCH_EMPTY, CATCH_VISIBLE);
}

function patchTimelineProvider(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(EMPTY_TIMELINE)) {
    throw new Error(
      "withIosWidgetReleaseRedBox: TimelineProvider.swift empty timeline block not found",
    );
  }
  return contents.replace(EMPTY_TIMELINE, NONEMPTY_TIMELINE);
}

const ENTRY_BODY = `  public var body: some View {
    if let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\\(entry.name)_layout"),
       !layout.isEmpty {
      let node = evaluateLayout(layout: layout, props: entry.props ?? [:], environment: widgetEnvironment)
      WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
    } else {
      WidgetsDynamicView(name: entry.name, kind: .widget, node: createRedBox(message: "No layout found for \\(WidgetsStorage.appGroupIdentifier ?? "")::\\(entry.name)"), entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
    }
  }`;

const ENTRY_UNREDACTED = `  // ${MARKER}-diagnostic: temporary — distinguishes "the app never stored props"
  // from "props stored but unreadable here". Remove once the sync is confirmed.
  private var timelineDebug: String {
    // Reports which container this process resolves and what is in it, byte for
    // byte. The app logs the same path to Sentry: when the app writes 1355 bytes
    // and this reads 1, the two are not addressing the same container, and no
    // amount of changing how the file is written can bridge that.
    let identifier = WidgetsStorage.appGroupIdentifier ?? "nil"
    let container = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: identifier
    )
    let url = container?
      .appendingPathComponent("ExpoWidgets", isDirectory: true)
      .appendingPathComponent("\\(entry.name)-snapshot.json")
    let bytes = url.flatMap { try? Data(contentsOf: $0) }?.count ?? -1
    let group = String(identifier.suffix(12))
    let box = String((container?.lastPathComponent ?? "nil").prefix(8))
    let raw = WidgetsStorage.getArray(forKey: "__expo_widgets_\\(entry.name)_timeline") ?? []
    // Whether the read the timeline actually depends on succeeded. Byte counts
    // alone hid a readable file being rejected by this function's own guard.
    let ok = readSnapshotFromAppGroup(name: entry.name) == nil ? 0 : 1
    return "g=\\(group) box=\\(box) b=\\(bytes) ok=\\(ok) tl=\\(raw.count)"
  }

  public var body: some View {
    Group {
      if let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\\(entry.name)_layout"),
         !layout.isEmpty {
        let node = evaluateLayout(layout: layout, props: entry.props ?? [:], environment: widgetEnvironment)
        ZStack(alignment: .bottom) {
          WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
          if entry.props?.isEmpty ?? true {
            Text(timelineDebug)
              .font(.system(size: 8, design: .monospaced))
              .foregroundStyle(.white.opacity(0.6))
              .padding(4)
          }
        }
      } else {
        // ${MARKER}: only the running app writes the layout into the App Group,
        // so a widget added before the first launch gets onboarding copy instead
        // of upstream's "No layout found" red box.
        ZStack {
          Color(red: 0.07, green: 0.055, blue: 0.047)
          VStack(spacing: 6) {
            Text("Բացեք հավելվածը՝ մեջբերումները ցուցադրելու համար")
              .font(.system(size: 15, weight: .semibold))
              .foregroundStyle(.white)
              .multilineTextAlignment(.center)
              .minimumScaleFactor(0.7)
            // ${MARKER}-diagnostic: temporary, remove once the App Group
            // sharing bug is confirmed and fixed.
            Text("group=\\(WidgetsStorage.appGroupIdentifier ?? "nil") bundle=\\(Bundle.main.bundleIdentifier ?? "nil")")
              .font(.system(size: 8, design: .monospaced))
              .foregroundStyle(.white.opacity(0.55))
              .multilineTextAlignment(.center)
              .minimumScaleFactor(0.5)
          }
          .padding(12)
        }
      }
    }
    .unredacted() // ${MARKER}
  }`;

const FONT_SENTINEL = "registerAppGroupFonts";

const ENTRY_INIT = `  public init(entry: WidgetsTimelineProvider.Entry) {
    self.entry = entry
  }`;

/**
 * `WidgetsStorage`'s container plus the `ExpoWidgets` subdirectory is the same
 * path the app writes through `widgetsDirectory` (see `WidgetsModule.swift`).
 */
const ENTRY_INIT_WITH_FONTS = `  public init(entry: WidgetsTimelineProvider.Entry) {
    self.entry = entry
    Self.${FONT_SENTINEL}()
  }

  // ${MARKER}:
  // the app copies the chosen Armenian face and the icon-glyph subset into the
  // shared container, but its \`expo-font\` registrations don't reach this
  // process — Core Text loads them here so the layout can name them.
  //
  // Called on every init rather than once per process: WidgetKit can keep this
  // extension warm across a font change, and re-registering an already-loaded
  // URL just fails harmlessly. The single-URL call is synchronous, so the face
  // is resolvable by the time \`body\` runs (the CFArray variant is not).
  private static func ${FONT_SENTINEL}() {
    guard let identifier = WidgetsStorage.appGroupIdentifier,
          let container = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: identifier
          ) else {
      return
    }
    let directory = container.appendingPathComponent("ExpoWidgets", isDirectory: true)
    let files = (try? FileManager.default.contentsOfDirectory(
      at: directory,
      includingPropertiesForKeys: nil
    )) ?? []
    for font in files where ["otf", "ttf"].contains(font.pathExtension.lowercased()) {
      _ = CTFontManagerRegisterFontsForURL(font as CFURL, .process, nil)
    }
  }`;

function patchEntryView(contents) {
  let next = contents;

  if (!next.includes(FONT_SENTINEL)) {
    if (!next.includes(ENTRY_INIT)) {
      throw new Error("withIosWidgetReleaseRedBox: EntryView.swift init not found");
    }
    next = next.replace(ENTRY_INIT, ENTRY_INIT_WITH_FONTS);
    if (!/^import CoreText$/m.test(next)) {
      next = next.replace("import SwiftUI", "import SwiftUI\nimport CoreText");
    }
  }

  if (!next.includes(".unredacted()")) {
    if (!next.includes(ENTRY_BODY)) {
      throw new Error("withIosWidgetReleaseRedBox: EntryView.swift body not found");
    }
    next = next.replace(ENTRY_BODY, ENTRY_UNREDACTED);
  }

  return next;
}

function patchFile(projectRoot, relativePath, patchFn) {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`withIosWidgetReleaseRedBox: missing ${filePath}`);
  }
  const original = fs.readFileSync(filePath, "utf8");
  const patched = patchFn(original);
  if (patched !== original) {
    fs.writeFileSync(filePath, patched);
  }
}

function withIosWidgetReleaseRedBox(config) {
  return withDangerousMod(config, [
    "ios",
    async (mod) => {
      const root = mod.modRequest.projectRoot;
      patchFile(
        root,
        path.join("node_modules", "expo-widgets", "ios", "WidgetsModule.swift"),
        patchWidgetsModule,
      );
      patchFile(
        root,
        path.join("node_modules", "expo-widgets", "ios", "WidgetsStorage.swift"),
        patchWidgetsStorage,
      );
      patchFile(
        root,
        path.join("node_modules", "expo-widgets", "ios", "WidgetObject.swift"),
        patchWidgetObject,
      );
      patchFile(
        root,
        path.join("node_modules", "expo-widgets", "ios", "Widgets", "Utils.swift"),
        patchTimelineUtils,
      );
      patchFile(
        root,
        path.join("node_modules", "expo-widgets", "ios", "Widgets", "DynamicView.swift"),
        patchDynamicView,
      );
      patchFile(
        root,
        path.join(
          "node_modules",
          "expo-widgets",
          "ios",
          "Widgets",
          "TimelineProvider.swift",
        ),
        patchTimelineProvider,
      );
      patchFile(
        root,
        path.join("node_modules", "expo-widgets", "ios", "Widgets", "EntryView.swift"),
        patchEntryView,
      );
      return mod;
    },
  ]);
}

module.exports = withIosWidgetReleaseRedBox;
module.exports.patchWidgetsModule = patchWidgetsModule;
module.exports.patchWidgetsStorage = patchWidgetsStorage;
module.exports.patchWidgetObject = patchWidgetObject;
module.exports.patchTimelineUtils = patchTimelineUtils;
module.exports.patchDynamicView = patchDynamicView;
module.exports.patchTimelineProvider = patchTimelineProvider;
module.exports.patchEntryView = patchEntryView;
