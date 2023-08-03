import { createContext } from 'react';

/**
 * Value
 */
export type ImportStorageContextType = {
    /** The Storage selected on Step 1 */
    storageType: string;

    /** Swicthes the storage type in context */
    setStorageType: (type: string) => void;
};

/**
 * Context
 */
export const ImportStorageContext =
    createContext<ImportStorageContextType>(undefined);
