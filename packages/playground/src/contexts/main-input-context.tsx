import { createContext, useContext } from "react";

export type MainInputAPI = {
	/** Append text to the main chat input editor as a new paragraph. */
	appendToMainInput: (text: string) => void;
};

export const MainInputContext = createContext<MainInputAPI | null>(null);

export function useMainInput(): MainInputAPI {
	const ctx = useContext(MainInputContext);
	if (!ctx) {
		throw new Error(
			"useMainInput must be used inside MainInputContext.Provider",
		);
	}
	return ctx;
}
