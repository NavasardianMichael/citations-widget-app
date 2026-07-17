import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { pressableNoRipple } from "@/constants/pressable";

type SelectFieldProps<T extends string> = {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      {label ? (
        <Text className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</Text>
      ) : null}
      <Pressable
        {...pressableNoRipple}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? "Select option"}
        className="flex-row items-center justify-between border-b border-outline-variant py-2"
      >
        <Text className="font-headline-md text-headline-md text-on-surface">{selected?.label ?? "Select…"}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color="#44474d" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable {...pressableNoRipple} className="flex-1 justify-end bg-black/30" onPress={() => setOpen(false)}>
          <Pressable {...pressableNoRipple} className="max-h-[50%] rounded-t-xl bg-surface-container-lowest" onPress={(e) => e.stopPropagation()}>
            <View className="border-b border-outline-variant px-4 py-3">
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                {label ?? "Select"}
              </Text>
            </View>
            <ScrollView>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    {...pressableNoRipple}
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`border-b border-outline-variant/30 px-4 py-4 ${isSelected ? "bg-primary-fixed" : ""}`}
                  >
                    <Text
                      className={`font-body-md text-body-md ${isSelected ? "text-on-primary-fixed" : "text-on-surface"}`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
