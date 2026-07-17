import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Text } from "react-native";

type TextLinkVariant = "underline" | "plain";
type TextLinkAlign = "left" | "center" | "right";

type TextLinkProps = {
  href: Href;
  children: ReactNode;
  replace?: boolean;
  /** underline = classic text link (e.g. forgot password); plain = no decoration */
  variant?: TextLinkVariant;
  align?: TextLinkAlign;
  className?: string;
  textClassName?: string;
};

const alignClass: Record<TextLinkAlign, string> = {
  left: "self-start text-left",
  center: "self-center text-center",
  right: "self-end text-right",
};

/**
 * Declarative in-app navigation via expo-router Link, styled as text.
 * Prefer this over Pressable + router.push for static destinations.
 */
export function TextLink({
  href,
  children,
  replace = false,
  variant = "underline",
  align = "left",
  className = "",
  textClassName = "",
}: TextLinkProps) {
  const decoration = variant === "underline" ? "underline" : "";

  return (
    <Link href={href} replace={replace} className={`${alignClass[align]} ${className}`}>
      <Text className={`font-body-md text-body-md text-primary ${decoration} ${textClassName}`}>{children}</Text>
    </Link>
  );
}
