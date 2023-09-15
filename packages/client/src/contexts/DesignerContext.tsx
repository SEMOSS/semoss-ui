import { createContext } from 'react';
import { DesignerStore } from '@/stores';

/**
 * Value
 */
export type DesignerContextType = {
    /** Store holding designer information */
    designer: DesignerStore;
};

/**
 * Context
 */
export const DesignerContext = createContext<DesignerContextType>(undefined);
