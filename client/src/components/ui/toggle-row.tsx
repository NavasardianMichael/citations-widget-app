import { Switch, Text, View } from "react-native";

type ToggleRowProps = {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ToggleRow({ title, description, value, onValueChange, disabled = false }: ToggleRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1 gap-1 pr-4">
        <Text className="font-body-md text-body-md text-on-surface">{title}</Text>
        {description ? <Text className="text-sm text-on-surface-variant">{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#e4e2e2", true: "#021a35" }}
        thumbColor="#ffffff"
        accessibilityLabel={title}
        style={{ transform: [{ scaleX: 1.25 }, { scaleY: 1.15 }] }}
      />
    </View>
  );
}
