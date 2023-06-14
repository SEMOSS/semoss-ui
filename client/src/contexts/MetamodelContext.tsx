import { createContext } from 'react';

/**
 * Value
 */
export type MetamodelContextType = {
    /** ID of the selected node */
    selectedNodeId: string;
    /** Selected a new node by Id */
    onSelectNodeId: (id: string) => void;
};

/**
 * Context
 */
export const MetamodelContext = createContext<MetamodelContextType>(undefined);
