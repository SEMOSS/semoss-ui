import { createContext } from 'react';

/**
 * Value
 */
export type MetamodelContextType = {
    /** Index of the selected node */
    nodeIndex: number;
    /** ID of the selected node */
    selectedNodeId: string;
    /** Selected a new node by Id */
    onSelectNodeId: (id: string) => void;
    /** Boolean to determine if metamodel is interactive aka editable */
    isInteractive: boolean;
    /** update metamodel state */
    updateData: (nodeData: any, action: string, nodeIdx?: any) => void;
};

/**
 * Context
 */
export const MetamodelContext = createContext<MetamodelContextType>(undefined);
