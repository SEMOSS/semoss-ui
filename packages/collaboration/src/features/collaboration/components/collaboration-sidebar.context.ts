import { createContext } from "react";

export interface CollaborationSidebar {
	title: string;
	open: (trigger: HTMLElement | null) => void;
}

export interface CollaborationSidebarContextValue {
	sidebar: CollaborationSidebar | null;
	registerSidebar: (sidebar: CollaborationSidebar) => () => void;
}

/** The shell exposes only the current page's sidebar to menus and navigation. */
export const CollaborationSidebarContext =
	createContext<CollaborationSidebarContextValue | null>(null);
