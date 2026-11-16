import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { DirectionProvider } from "@semoss/ui/next";

/**
 * Give the UI the active language's direction (ltr or rtl), so portaled
 * controls and keyboard navigation follow the locale.
 */
export function LanguageDirection({ children }: { children: ReactNode }) {
	const { i18n } = useTranslation();
	return <DirectionProvider dir={i18n.dir()}>{children}</DirectionProvider>;
}
