import { useWindowDimensions } from "react-native";

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isMd: width >= 768,
    isLg: width >= 1024,
  };
}
