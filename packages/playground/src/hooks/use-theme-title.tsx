import { useEffect } from "react";

let activePageTitle: string | undefined;

export function useThemeTitle(theme, pageTitle?: string) {
	useEffect(() => {
		const appName = theme?.name;

		if (pageTitle) {
			activePageTitle = pageTitle;
			document.title = appName ? `${pageTitle} - ${appName}` : pageTitle;

			return () => {
				if (activePageTitle === pageTitle) {
					activePageTitle = undefined;
					if (appName) document.title = appName;
				}
			};
		}

		if (!activePageTitle && appName) {
			document.title = appName;
		}
	}, [theme?.name, pageTitle]);
}
