import { createContext } from 'react';

// TODO: Import types needed for app
import {} from '@/types';

/**
 * TODO: Define information app info to store
 * Possibly transfer info from app-details.utility.ts
 * / configStore here ?
 *
 * Value
 */
export type AppContextType = {};

/**
 * Context
 */
export const AppContext = createContext<AppContextType>(undefined);
