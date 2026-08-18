/**
 * Preflight for `src/widgets/CitationWidget.ios.tsx`.
 *
 * The iOS widget extension does not run the app bundle: `babel-preset-expo`'s
 * widgets plugin serializes the `'widget'` function to a string, and
 * `WidgetsJSRuntime` evaluates it in a bare JavaScriptCore context whose only
 * globals are `@expo/ui/swift-ui` components + modifiers and a JSX shim. A
 * reference to anything else — a shared constant, a helper component, a
 * `require()`d asset — is `undefined` at render time, and Release builds swallow
 * the failure into a blank widget, so the mistake only shows up in TestFlight.
 *
 * This checks the same code the extension will run: that the layout references
 * nothing outside that sandbox, and that every family renders a tree of node
 * types `expo-widgets`' DynamicView.swift can actually build.
 *
 *   node ./scripts/verify-ios-widget-layout.js
 */
const path = require("path");
const babel = require("@babel/core");

const WIDGET_FILE = path.join("src", "widgets", "CitationWidget.ios.tsx");
const EXPO_UI_MODULES = ["@expo/ui/swift-ui", "@expo/ui/swift-ui/modifiers"];

/** Installed by `expo-widgets/bundle/index.ts` on top of the @expo/ui exports. */
const RUNTIME_GLOBALS = [
  "_jsx",
  "_jsxs",
  "_jsxDEV",
  "_Fragment",
  "_jsxFileName",
  "Fragment",
  "React",
  "jsx",
  "jsxs",
];

const ECMASCRIPT_GLOBALS = [
  "Array",
  "Boolean",
  "Date",
  "Error",
  "Infinity",
  "JSON",
  "Math",
  "NaN",
  "Number",
  "Object",
  "RegExp",
  "String",
  "decodeURIComponent",
  "encodeURIComponent",
  "globalThis",
  "isNaN",
  "parseFloat",
  "parseInt",
  "undefined",
];

/** Node types DynamicView.swift can render (`expo-widgets/ios/Widgets`). */
const NATIVE_NODE_TYPES = [
  "AccessoryWidgetBackgroundView",
  "Button",
  "CapsuleView",
  "ChartView",
  "CircleView",
  "DividerView",
  "EllipseView",
  "GaugeView",
  "HStackView",
  "ImageView",
  "LabelView",
  "LinkView",
  "ProgressView",
  "RectangleView",
  "RedBoxView",
  "RoundedRectangleView",
  "SpacerView",
  "TextView",
  "UnevenRoundedRectangleView",
  "VStackView",
  "ZStackView",
  "react.fragment",
];

const FAMILIES = [
  "systemSmall",
  "systemMedium",
  "systemLarge",
  "systemExtraLarge",
  "accessoryRectangular",
  "accessoryInline",
];

/** A snapshot with every optional field populated (sanctuary design). */
const FULL_SNAPSHOT = {
  quoteText: "«Տէրն է իմ հովիւը»",
  sourceText: "Սաղմոս 23:1",
  attributionText: "Ավելացրեց Անի-ը",
  attributionBefore: "Ավելացրեց ",
  attributionName: "Անի",
  attributionAfter: "-ը",
  attributionUrl: "https://example.com/ani",
  showActions: true,
  citationId: "citation-1",
  citationText: "Տէրն է իմ հովիւը",
  citationSource: "Սաղմոս 23:1",
  citationCategory: "bible",
  isSaved: true,
  designId: "sanctuary",
  backgroundImageIndex: 3,
  backgroundImageUri: "file:///group/sanctuary-3.jpg",
  fontFamily: "Vrdznagir",
  androidFontFile: "Vrdznagir",
  iosFontFamily: "Vrdznagir",
  iosGlyphFontFamily: "MaterialIcons-Regular",
  fontSize: 24,
  panelBg: "rgba(18, 14, 12, 0.92)",
  panelBorderColor: "rgba(255, 255, 255, 0.22)",
  accentBorderColor: "rgba(254, 214, 91, 0.65)",
  accentBorderWidth: 2,
  quoteColor: "#fbf9f8",
  metaColor: "#fed65b",
  attributionColor: "rgba(251, 249, 248, 0.82)",
  actionBg: "rgba(15, 18, 24, 0.55)",
  actionIconColor: "#fbf9f8",
  ornamentColor: "#fed65b",
  ornamentOpacity: 0.35,
  showOrnament: true,
  showLargeQuotes: true,
  overlayColor: "rgba(12, 10, 8, 0.72)",
  hasBackgroundImage: true,
  emptyMessage: "Մեջբերում չկա",
  loadingMessage: "Մեջբերումը բեռնվում է…",
  isRefreshing: false,
  isSaving: false,
  quotePageIndex: 0,
  fetchedAt: Date.now(),
};

function compileWidget() {
  const result = babel.transformFileSync(WIDGET_FILE, {
    filename: WIDGET_FILE,
    envName: "production",
    caller: {
      name: "metro",
      platform: "ios",
      isDev: false,
      isServer: false,
      supportsStaticESM: true,
    },
  });
  if (!result?.code) throw new Error(`Babel produced no output for ${WIDGET_FILE}`);
  return result.code;
}

/** The widgets plugin replaces the function with a template literal of its source. */
function extractLayout(code) {
  const marker = /=`function\s*\(/g;
  const start = marker.exec(code);
  if (!start) {
    throw new Error(
      "No serialized widget layout found — is the `'widget'` directive still the first statement?",
    );
  }
  const openingBacktick = start.index + 1;
  for (let i = openingBacktick + 1; i < code.length; i += 1) {
    if (code[i] === "`" && code[i - 1] !== "\\") {
      return code.slice(openingBacktick + 1, i);
    }
  }
  throw new Error("Unterminated widget layout literal");
}

function collectExpoUiImports(code) {
  const names = new Set();
  const ast = babel.parseSync(code, { filename: WIDGET_FILE, sourceType: "module" });
  for (const node of ast.program.body) {
    if (node.type !== "ImportDeclaration") continue;
    if (!EXPO_UI_MODULES.includes(node.source.value)) continue;
    for (const specifier of node.specifiers) {
      names.add(specifier.local.name);
    }
  }
  return names;
}

function collectFreeIdentifiers(layout) {
  const ast = babel.parseSync(`(${layout})`, { filename: "widget-layout.js" });
  const traverse = require("@babel/traverse").default;
  let globals = [];
  traverse(ast, {
    Program(programPath) {
      globals = Object.keys(programPath.scope.globals);
      programPath.stop();
    },
  });
  return globals;
}

function assertSandboxed(layout, allowed) {
  const offenders = collectFreeIdentifiers(layout).filter((name) => !allowed.has(name));
  if (offenders.length) {
    throw new Error(
      `The widget layout references values the extension cannot see: ${offenders.join(", ")}.\n` +
        "Move them inside the `'widget'` function — module scope does not exist there.",
    );
  }
}

function buildSandbox(expoUiNames) {
  const sandbox = {};
  for (const name of expoUiNames) {
    // Components resolve to their native node type; modifiers to a tagged config.
    sandbox[name] = /^[A-Z]/.test(name)
      ? `${name}View`
      : (...args) => ({ $type: name, args });
  }
  sandbox.shapes = new Proxy(
    {},
    { get: (_target, shape) => () => ({ shape: String(shape) }) },
  );
  const jsx = (type, config) => {
    const { children, ...props } = config ?? {};
    return { type, props: { ...props, children } };
  };
  sandbox._jsx = jsx;
  sandbox._jsxs = jsx;
  sandbox._jsxDEV = jsx;
  return sandbox;
}

function collectNodeTypes(node, found = new Set()) {
  if (!node || typeof node !== "object") return found;
  if (typeof node.type === "string") found.add(node.type);
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    collectNodeTypes(child, found);
  }
  return found;
}

function assertRenders(render, label, props, widgetFamily) {
  let tree;
  try {
    tree = render(props, { widgetFamily, colorScheme: "dark", showsContainerBackground: true });
  } catch (error) {
    throw new Error(`${label}: layout threw ${error?.message ?? error}`);
  }
  const types = collectNodeTypes(tree);
  if (!types.size) throw new Error(`${label}: layout rendered nothing`);
  const unsupported = [...types].filter((type) => !NATIVE_NODE_TYPES.includes(type));
  if (unsupported.length) {
    throw new Error(`${label}: DynamicView.swift cannot render ${unsupported.join(", ")}`);
  }
}

function main() {
  const source = require("fs").readFileSync(WIDGET_FILE, "utf8");
  const expoUiNames = collectExpoUiImports(source);
  const layout = extractLayout(compileWidget());

  assertSandboxed(
    layout,
    new Set([...expoUiNames, ...RUNTIME_GLOBALS, ...ECMASCRIPT_GLOBALS]),
  );

  const sandbox = buildSandbox(expoUiNames);
  const render = new Function(...Object.keys(sandbox), `return (${layout});`)(
    ...Object.values(sandbox),
  );

  for (const family of FAMILIES) {
    // Timeline entries can reach the extension without props at all (a widget
    // added before the app ever synced), so the empty case has to render too.
    assertRenders(render, `${family} / no props`, {}, family);
    assertRenders(render, `${family} / full snapshot`, FULL_SNAPSHOT, family);
    assertRenders(
      render,
      `${family} / refreshing`,
      { ...FULL_SNAPSHOT, isRefreshing: true },
      family,
    );
    // The App Group fonts are copied by the app, so the layout has to survive
    // rendering before (or without) a successful copy.
    assertRenders(
      render,
      `${family} / no app group fonts`,
      { ...FULL_SNAPSHOT, iosFontFamily: null, iosGlyphFontFamily: null },
      family,
    );
  }

  console.log(
    `iOS widget layout OK — sandboxed and renders on ${FAMILIES.length} widget families.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`iOS widget layout check failed:\n${error.message}`);
  process.exit(1);
}
