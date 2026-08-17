/**
 * expo-widgets hides layout errors in Release (TestFlight) as EmptyView —
 * a blank system widget with a gray placeholder bar. Surface RedBox and
 * SwiftUI prop-decode failures so the next TestFlight build is diagnosable.
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
        WidgetsDynamicView(name: entry.name, kind: .widget, node: createRedBox(message: "No layout found for \\(WidgetsStorage.appGroupIdentifier ?? "")::\\(entry.name)"), entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
      }
    }
    .unredacted() // ${MARKER}
  }`;

function patchEntryView(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(ENTRY_BODY)) {
    throw new Error("withIosWidgetReleaseRedBox: EntryView.swift body not found");
  }
  return contents.replace(ENTRY_BODY, ENTRY_UNREDACTED);
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
