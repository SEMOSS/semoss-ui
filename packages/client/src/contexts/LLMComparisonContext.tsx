import { createContext } from 'react';
import { Control } from 'react-hook-form';

export type LLMComparisonContextType = {
    /** React Hook Form methods stored for nested components' access */
    control: Control<any, any> | null;
    getValues: null | ((str?: string) => any);
    setValue: null | ((str: string, val: any) => void);
    watch: any;
    handleSubmit: any;

    /** All Models available for configuring variants */
    allModels: any;
};

export const LLMComparisonContext =
    createContext<LLMComparisonContextType>(undefined);
