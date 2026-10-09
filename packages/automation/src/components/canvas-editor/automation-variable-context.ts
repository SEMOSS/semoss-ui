import { createContext } from "react";
import type { AutomationScopeEntry } from "../../domain/automation-inspector";

export interface AutomationVariableContextValue {
	entries: AutomationScopeEntry[];
	devMode: boolean;
}

/** Friendly authoring metadata for the variables available to the selected node. */
export const AutomationVariableContext =
	createContext<AutomationVariableContextValue>({
		entries: [],
		devMode: false,
	});
