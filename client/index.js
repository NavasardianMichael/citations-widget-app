import { Platform } from "react-native";

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { citationWidgetTaskHandler } = require("./src/widgets/android/task-handler");
  registerWidgetTaskHandler(citationWidgetTaskHandler);
}

require("expo-router/entry");
