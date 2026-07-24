import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Must run before the router mounts so OAuth deep links complete the auth session
// instead of getting stuck on an Unmatched Route screen.
WebBrowser.maybeCompleteAuthSession();

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { citationWidgetTaskHandler } = require("./src/widgets/android/task-handler");
  registerWidgetTaskHandler(citationWidgetTaskHandler);
}

require("expo-router/entry");
