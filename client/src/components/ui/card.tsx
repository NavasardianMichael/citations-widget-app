import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { shadowLevel1 } from "@/constants/colors";

type CardProps = ViewProps & {
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ children, elevated = true, className = "", style, ...props }: CardProps) {
  return (
    <View
      className={`rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 ${className}`}
      style={elevated ? [shadowLevel1, style] : style}
      {...props}
    >
      {children}
    </View>
  );
}
