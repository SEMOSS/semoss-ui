import { createContext } from 'react';

import { Role } from '@/types';

/**
 * Value
 */
export type ImportedDatabaseContextType = {
    /** ID of the database to load */
    id: string;

    databaseName: string;

    /** User's role associated with the database */
    // role: Role;
};

/**
 * Context
 */
export const ImportedDatabaseContext =
    createContext<ImportedDatabaseContextType>(undefined);
