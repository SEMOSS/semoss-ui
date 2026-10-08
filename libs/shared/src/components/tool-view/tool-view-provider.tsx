import type { ReactNode } from "react";
import { ToolViewContext } from "./tool-view.context";
import type { ToolViewLibraries } from "./tool-view.types";

/** Props for {@link ToolViewProvider}. */
export interface ToolViewProviderProps {
	/**
	 * The libraries the host renders, by name, such as
	 * `{ mail: MAIL_TOOL_VIEWS }`. Keep it at module scope: a new object
	 * renders every tool view again.
	 */
	libraries: ToolViewLibraries;
	/** What can show tool views. */
	children: ReactNode;
}

/**
 * Hands the host's tool view libraries to every tool view below it. Each
 * host picks the libraries it supports, so a library is only loaded where
 * one is.
 */
export const ToolViewProvider = ({
	libraries,
	children,
}: ToolViewProviderProps) => (
	<ToolViewContext.Provider value={libraries}>
		{children}
	</ToolViewContext.Provider>
);
