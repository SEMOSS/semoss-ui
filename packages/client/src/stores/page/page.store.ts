import { createStore, type StoreApi } from "zustand";
import type { PageCache } from "./page.types";

const CACHE_KEY = "PAGE_STORE_CACHE--1";

export interface PageState {
	navbar: {
		element: HTMLElement | null;
		logo: boolean;
		search: boolean;
	};
	sidebar: {
		open: boolean;
		pinned: boolean;
	};
	setNavbarElement: (element: HTMLElement | null) => void;
	updateNavbarLogo: (logo?: boolean) => void;
	updateNavbarSearch: (search?: boolean) => void;
	setSidebar: (content?: PageState["sidebar"]) => void;
	openSidebar: () => void;
	closeSidebar: () => void;
	pinSidebar: () => void;
	unpinSidebar: () => void;
}

const getCachedPinnedState = (): boolean => {
	try {
		const cached = JSON.parse(
			localStorage.getItem(CACHE_KEY) || "null",
		) as PageCache | null;
		return cached?.sidebar.pinned ?? false;
	} catch (error) {
		console.error(error);
		return false;
	}
};

/** Create an isolated page store for one route layout. */
export const createPageStore = (): StoreApi<PageState> => {
	const store = createStore<PageState>()((set) => ({
		navbar: { element: null, logo: true, search: true },
		sidebar: { open: false, pinned: getCachedPinnedState() },
		setNavbarElement: (element) =>
			set((state) =>
				state.navbar.element === element
					? state
					: { navbar: { ...state.navbar, element } },
			),
		updateNavbarLogo: (logo = true) =>
			set((state) => ({ navbar: { ...state.navbar, logo } })),
		updateNavbarSearch: (search = true) =>
			set((state) => ({ navbar: { ...state.navbar, search } })),
		setSidebar: (sidebar = { open: false, pinned: false }) =>
			set({ sidebar }),
		openSidebar: () =>
			set((state) => ({ sidebar: { ...state.sidebar, open: true } })),
		closeSidebar: () => set({ sidebar: { open: false, pinned: false } }),
		pinSidebar: () =>
			set((state) => ({ sidebar: { ...state.sidebar, pinned: true } })),
		unpinSidebar: () =>
			set((state) => ({ sidebar: { ...state.sidebar, pinned: false } })),
	}));

	store.subscribe((state) => {
		try {
			const item: PageCache = {
				sidebar: { pinned: state.sidebar.pinned },
			};
			localStorage.setItem(CACHE_KEY, JSON.stringify(item));
		} catch (error) {
			console.error(error);
		}
	});

	return store;
};

export type PageStore = StoreApi<PageState>;
