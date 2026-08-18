/**
 * Four fixes to `expo-widgets`' iOS widget host, none of which are configurable:
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

const ENTRY_UNREDACTED = `  public var body: some View {
    Group {
      if let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\\(entry.name)_layout"),
         !layout.isEmpty {
        let node = evaluateLayout(layout: layout, props: entry.props ?? [:], environment: widgetEnvironment)
        WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
      } else {
        // ${MARKER}: only the running app writes the layout into the App Group,
        // so a widget added before the first launch gets onboarding copy instead
        // of upstream's "No layout found" red box.
        ZStack {
          Color(red: 0.07, green: 0.055, blue: 0.047)
          Text("Բացեք հավելվածը՝ մեջբերումները ցուցադրելու համար")
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.7)
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
module.exports.patchDynamicView = patchDynamicView;
module.exports.patchTimelineProvider = patchTimelineProvider;
module.exports.patchEntryView = patchEntryView;
