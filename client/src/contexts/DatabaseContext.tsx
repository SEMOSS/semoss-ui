import { createContext } from 'react';

import { Role } from '@/types';

/**
 * Value
 */
export type DatabaseContextType = {
    /** ID of the database to load */
    id: string;

    /** User's role associated with the database */
    role: Role;
};

/**
 * Context
 */
export const DatabaseContext = createContext<DatabaseContextType>(undefined);
