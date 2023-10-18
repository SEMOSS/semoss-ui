import { createContext } from 'react';

/**
 * Value
 */
export type MetamodelContextType = {
    /** ID of the selected node */
    selectedNodeId: string;
    /** Selected a new node by Id */
    onSelectNodeId: (id: string) => void;
    /** Boolean to determine if metamodel is interactive aka editable */
    isInteractive: boolean;
    /** update metamodel state */
    updateData: (nodeData: any, action: string) => void;
    /** number to track width of metamodel nav component to update width of react-flow component */
    navWidth: any;
};

/**
 * Context
 */
export const MetamodelContext = createContext<MetamodelContextType>(undefined);
