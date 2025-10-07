import { useContext, useEffect } from "react";
import { PageContext, type PageContextType } from "@/contexts";

interface usePageOptions {
	/**
	 * Show the navbar logo
	 */
	showNavbarLogo?: boolean;

	/**
	 * Show the navbar logo
	 */
	showNavbarSearch?: boolean;
}

/**
 * Access the Page Context
 * @returns the Page Context
 */
export function usePage(options: usePageOptions = {}): PageContextType {
	const context = useContext(PageContext);
	if (context === undefined) {
		throw new Error("usePage must be used within PageContext.Provider");
	}

	// show the logo if set
	useEffect(() => {
		if (!options || !Object.hasOwn(options, "showNavbarLogo")) {
			return;
		}

		context.page.updateNavbarLogo(options.showNavbarLogo);
		return () => {
			// reset when navigating away
			context.page.updateNavbarLogo(true);
		};
	}, [options ? options.showNavbarLogo : null]);

	// show the search if set
	useEffect(() => {
		if (!options || !Object.hasOwn(options, "showNavbarSearch")) {
			return;
		}

		context.page.updateNavbarSearch(options.showNavbarSearch);
		return () => {
			// reset when navigating away
			context.page.updateNavbarSearch(true);
		};
	}, [options ? options.showNavbarSearch : null]);

	return context;
}
