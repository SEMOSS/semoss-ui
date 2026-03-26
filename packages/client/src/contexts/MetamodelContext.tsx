import { createContext } from "react";

/**
 * Value
 */
export type MetamodelContextType = {
	/** ID of the selected node */
	selectedNodeId: string | null;
	/** Selected a new node by Id */
	onSelectNodeId: (id: string) => void;
	/** Search text used for metadata highlighting */
	searchTerm?: string;
	/** Boolean to determine if metamodel is interactive aka editable */
	isInteractive: boolean;
	/** update metamodel state */
	updateData: (nodeData: unknown, action: string) => void;
};

/**
 * Context
 */
export const MetamodelContext = createContext<MetamodelContextType>(undefined);
