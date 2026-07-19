import { Image } from "expo-image";
import { View } from "react-native";

import { t } from "@/i18n";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

/** Brand mark for in-app chrome. Uses PNG for reliable cross-platform rendering. */
export function BrandLogo({ size = 28, className = "" }: BrandLogoProps) {
  return (
    <View className={className} accessibilityRole="image" accessibilityLabel={t("common.brand")}>
      <Image
        source={require("../../../assets/logo/logo.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}
