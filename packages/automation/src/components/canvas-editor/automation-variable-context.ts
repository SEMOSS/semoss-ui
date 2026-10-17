import { createContext } from "react";
import type { AutomationInputTablePreview } from "../../api/automation-history";
import type { AutomationScopeEntry } from "../../domain/automation-inspector";

export interface AutomationVariableContextValue {
	entries: AutomationScopeEntry[];
	devMode: boolean;
	/** Opens an authorized upstream result in the host's read-only table tab. */
	onOpenInputTable?: (
		nodeId: string,
		label: string,
		preview: AutomationInputTablePreview,
	) => void;
}

/** Friendly authoring metadata for the variables available to the selected node. */
export const AutomationVariableContext =
	createContext<AutomationVariableContextValue>({
		entries: [],
		devMode: false,
	});
