import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { DirectionProvider } from "@semoss/ui/next";

/**
 * Keep portaled controls and keyboard navigation aligned with the active
 * locale's direction, such as right to left for Arabic. A chat host wraps its
 * app in it.
 *
 * @component
 */
export function LanguageDirection({ children }: { children: ReactNode }) {
	const { i18n } = useTranslation();
	return <DirectionProvider dir={i18n.dir()}>{children}</DirectionProvider>;
}
