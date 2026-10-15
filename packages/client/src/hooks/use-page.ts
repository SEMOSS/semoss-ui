import { useContext, useEffect } from "react";
import { useStore } from "zustand";
import { PageContext } from "@/contexts";
import type { PageState } from "@/stores";

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

export function usePage<T = PageState>(
	optionsOrSelector: usePageOptions | ((state: PageState) => T) = {},
): T {
	const selector =
		typeof optionsOrSelector === "function"
			? optionsOrSelector
			: (state: PageState) => state as T;
	const options =
		typeof optionsOrSelector === "function" ? {} : optionsOrSelector;
	const context = useContext(PageContext);
	if (context === undefined) {
		throw new Error("usePage must be used within PageContext.Provider");
	}
	const { store } = context;
	const { showNavbarLogo, showNavbarSearch } = options;
	const hasShowNavbarLogo = Object.hasOwn(options, "showNavbarLogo");
	const hasShowNavbarSearch = Object.hasOwn(options, "showNavbarSearch");

	// show the logo if set
	useEffect(() => {
		if (!hasShowNavbarLogo) {
			return;
		}

		store.getState().updateNavbarLogo(showNavbarLogo);
		return () => {
			// reset when navigating away
			store.getState().updateNavbarLogo(true);
		};
	}, [hasShowNavbarLogo, showNavbarLogo, store]);

	// show the search if set
	useEffect(() => {
		if (!hasShowNavbarSearch) {
			return;
		}

		store.getState().updateNavbarSearch(showNavbarSearch);
		return () => {
			// reset when navigating away
			store.getState().updateNavbarSearch(true);
		};
	}, [hasShowNavbarSearch, showNavbarSearch, store]);

	return useStore(store, selector);
}
