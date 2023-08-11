import { createContext } from 'react';

import { RootStore } from '@/stores';

/**
 * Value
 */
export type RootStoreContextType = RootStore;

/**
 * Context
 */
export const RootStoreContext = createContext<RootStoreContextType>(undefined);
