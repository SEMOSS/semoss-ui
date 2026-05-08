import { useEffect } from "react";
import { useTranslation } from "@semoss/i18n";

export function useHtmlLang() {
	const { i18n } = useTranslation();

	useEffect(() => {
		if (i18n.language) {
			document.documentElement.lang = i18n.language;
		}
	}, [i18n.language]);
}
