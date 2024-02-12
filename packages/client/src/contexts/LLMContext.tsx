import { createContext } from 'react';

export type LLMContextType = {
    /** id to use for code generation */
    modelId: string;
    /** model options for code generation */
    modelOptions: { app_id: string; app_name: string }[];
    /** set model to use */
    setModel?: (id: string) => void;
};

/**
 * Context
 */
export const LLMContext = createContext<LLMContextType>(undefined);
